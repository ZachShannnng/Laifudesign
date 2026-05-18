/**
 * GenerateUITool — UI 生成工具
 * 接收用户描述，调用模型生成符合设计系统的 HTML 代码
 * 生成结果通过 onUpdate 回调写入会话，供 PreviewPanel 渲染
 */

import { z } from 'zod'
import type { DesignTool } from '@/types/tool'
import type { DesignContext } from '@/types/context'
import type { DesignMessage } from '@/types/message'
import { createModelClient } from '@/engine/ModelClient'

const GenerateUIInputSchema = z.object({
  /** 用户对 UI 的描述 */
  description: z.string().min(1).describe('用户对要生成的 UI 的描述'),
  /** 可选：要修改的现有组件名 */
  component: z.string().optional().describe('要修改的现有组件名称'),
  /** 可选：修改类型（新建 / 修改） */
  mode: z.enum(['create', 'modify']).optional().describe('操作模式：新建或修改'),
})

const GenerateUIOutputSchema = z.object({
  /** 生成的 HTML 代码 */
  html: z.string().describe('生成的 HTML 代码'),
  /** 是否成功 */
  success: z.boolean(),
  /** 错误信息（失败时） */
  error: z.string().optional(),
})

type GenerateUIInput = z.infer<typeof GenerateUIInputSchema>
type GenerateUIOutput = z.infer<typeof GenerateUIOutputSchema>

/**
 * 构建 UI 生成专用的系统提示词
 * 包含设计系统规范 + 生成规则
 */
function buildGenerateUISystemPrompt(context: DesignContext): string {
  const ds = context.designSystem
  return `You are a UI code generator. Generate a single complete HTML file based on the user's description.

Design system specification:
- Background: ${ds.colors.background}
- Foreground: ${ds.colors.foreground}
- Border: ${ds.colors.border}
- Muted text: ${ds.colors.muted}
- Card background: ${ds.colors.card}
- Font: ${ds.typography.fontFamily}
- Border radius: standard ${ds.borderRadius.standard}px, card ${ds.borderRadius.card}px, comfortable ${ds.borderRadius.comfortable}px

Rules:
1. Output ONLY the HTML code, no explanations or markdown fences
2. Use Tailwind CSS via CDN (include the script tag)
3. Follow the color, font, spacing, and border-radius specs above
4. Never use pure white (#ffffff) as background
5. Never use font weight > 600
6. Cards use borders, not shadows
7. The HTML must be a complete, standalone, runnable file
8. Use inline Tailwind classes that match the design system colors
9. For the background color, use style="background-color:${ds.colors.background}" on the body or main container`
}

export class GenerateUITool implements DesignTool<GenerateUIInput, GenerateUIOutput> {
  name = 'generate_ui'
  description = 'Generate or modify UI HTML code based on user description. Returns a complete standalone HTML file.'
  inputSchema = GenerateUIInputSchema
  outputSchema = GenerateUIOutputSchema

  userFacingName(input: Partial<GenerateUIInput>): string {
    if (input.mode === 'modify' && input.component) {
      return `修改 ${input.component}`
    }
    return '生成 UI'
  }

  requiresConfirmation(): boolean {
    return false
  }

  async execute(input: GenerateUIInput, context: DesignContext): Promise<GenerateUIOutput> {
    const { description, component, mode } = input

    // 构建用户提示词
    let userPrompt = description
    if (mode === 'modify' && component) {
      userPrompt = `Modify the existing "${component}" component: ${description}`
    } else {
      userPrompt = `Create a new UI: ${description}`
    }

    // 从上下文构建模型消息
    const messages: Array<{ role: string; content: string }> = []

    // 添加历史消息摘要（最近 6 条，避免 token 过长）
    const recentMessages = context.messages.slice(-6)
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant' && 'content' in msg && !('type' in msg)) {
        messages.push({ role: 'assistant', content: msg.content })
      }
    }

    // 添加当前生成请求
    messages.push({ role: 'user', content: userPrompt })

    // 创建模型客户端并调用
    const modelClient = createModelClient(context.modelConfig)

    let fullHtml = ''

    try {
      for await (const chunk of modelClient.stream(messages, {
        systemPrompt: buildGenerateUISystemPrompt(context),
        abortSignal: context.abortSignal,
      })) {
        if (chunk.type === 'text') {
          fullHtml += chunk.content
        } else if (chunk.type === 'error') {
          return { html: '', success: false, error: chunk.error }
        }
      }
    } catch (err) {
      return {
        html: '',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }

    // 清理可能的 markdown 代码围栏
    fullHtml = cleanCodeFences(fullHtml)

    if (!fullHtml.trim()) {
      return { html: '', success: false, error: '模型返回了空内容' }
    }

    // 通过 onUpdate 回调通知会话
    const updateMessage: DesignMessage = {
      role: 'assistant',
      content: `[GenerateUITool] ${mode === 'modify' ? '修改' : '生成'}了${component ? ` ${component}` : ''} UI`,
      timestamp: new Date(),
    }
    context.onUpdate(updateMessage)

    return { html: fullHtml, success: true }
  }
}

/**
 * 清理模型输出中可能包含的 markdown 代码围栏
 * 如 ```html ... ``` 或 ``` ... ```
 */
function cleanCodeFences(code: string): string {
  let cleaned = code.trim()
  // 移除开头的 ```html 或 ```
  cleaned = cleaned.replace(/^```(?:html|htm)?\s*\n?/i, '')
  // 移除结尾的 ```
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  return cleaned.trim()
}
