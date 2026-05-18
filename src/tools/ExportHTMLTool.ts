/**
 * ExportHTMLTool — HTML 导出工具
 * 将当前会话中的 HTML 内容打包为完整可运行 HTML 文件
 * 触发浏览器下载
 */

import { z } from 'zod'
import type { DesignTool } from '@/types/tool'
import type { DesignContext } from '@/types/context'

const ExportHTMLInputSchema = z.object({
  /** 要导出的 HTML 内容（如果为空则从会话历史中提取） */
  html: z.string().optional().describe('要导出的 HTML 内容，为空则从会话历史提取'),
  /** 文件名（不含扩展名） */
  filename: z.string().optional().describe('导出文件名，不含 .html 扩展名'),
})

const ExportHTMLOutputSchema = z.object({
  /** 导出是否成功 */
  success: z.boolean(),
  /** 文件名 */
  filename: z.string().optional(),
  /** 错误信息 */
  error: z.string().optional(),
})

type ExportHTMLInput = z.infer<typeof ExportHTMLInputSchema>
type ExportHTMLOutput = z.infer<typeof ExportHTMLOutputSchema>

/**
 * 从会话消息中提取最近的 HTML 内容
 * 查找最后一次 GenerateUITool 的输出
 */
function extractHtmlFromMessages(messages: DesignContext['messages']): string | null {
  // 反向遍历，找最后一条包含 HTML 的 assistant 消息
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'assistant' && 'content' in msg && !('type' in msg)) {
      const content = msg.content
      // 简单启发式：包含 <html 或 <!DOCTYPE 或 <body 的内容视为 HTML
      if (/<html|<!DOCTYPE|<body/i.test(content)) {
        return content
      }
    }
  }
  return null
}

/**
 * 触发浏览器下载 HTML 文件
 */
function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export class ExportHTMLTool implements DesignTool<ExportHTMLInput, ExportHTMLOutput> {
  name = 'export_html'
  description = 'Export the current UI as a standalone HTML file. Triggers a browser download.'
  inputSchema = ExportHTMLInputSchema
  outputSchema = ExportHTMLOutputSchema

  userFacingName(): string {
    return '导出 HTML'
  }

  requiresConfirmation(): boolean {
    return false
  }

  async execute(input: ExportHTMLInput, context: DesignContext): Promise<ExportHTMLOutput> {
    // 获取 HTML 内容：优先使用输入，否则从会话提取
    let html = input.html
    if (!html) {
      html = extractHtmlFromMessages(context.messages) ?? undefined
    }

    if (!html) {
      return { success: false, error: '没有可导出的 HTML 内容' }
    }

    const filename = input.filename
      ? input.filename.endsWith('.html') ? input.filename : `${input.filename}.html`
      : `design-${Date.now()}.html`

    try {
      downloadHtml(html, filename)
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }

    return { success: true, filename }
  }
}
