/**
 * 设计会话管理引擎
 * 基于 Claude Code QueryEngine，管理设计对话的完整生命周期
 */

import type { DesignMessage, StreamEvent, ToolResult } from '@/types/message'
import type { DesignTool } from '@/types/tool'
import type { DesignContext, DesignSession } from '@/types/context'
import type { DesignSystemConfig } from '@/types/design-system'
import type { ModelClient, ModelConfig } from '@/engine/ModelClient'

export interface DesignEngineConfig {
  modelClient: ModelClient
  designSystem: DesignSystemConfig
  tools: DesignTool[]
}

export class DesignEngine {
  private modelClient: ModelClient
  private designSystem: DesignSystemConfig
  private toolMap: Map<string, DesignTool> = new Map()
  private sessions: Map<string, DesignSession> = new Map()
  private abortController: AbortController | null = null

  constructor(config: DesignEngineConfig) {
    this.modelClient = config.modelClient
    this.designSystem = config.designSystem
    for (const tool of config.tools) {
      this.toolMap.set(tool.name, tool)
    }
  }

  /** 创建新的设计会话 */
  createSession(): DesignSession {
    const id = crypto.randomUUID()
    const session: DesignSession = {
      id,
      messages: [],
      state: 'idle',
      designSystem: { ...this.designSystem },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.sessions.set(id, session)
    return session
  }

  /** 获取会话 */
  getSession(id: string): DesignSession | undefined {
    return this.sessions.get(id)
  }

  /** 提交用户消息，流式返回事件 */
  async *submitMessage(
    sessionId: string,
    prompt: string
  ): AsyncGenerator<StreamEvent> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      yield { type: 'error', error: `Session ${sessionId} not found` }
      return
    }

    // 添加用户消息
    const userMessage: DesignMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }
    session.messages.push(userMessage)
    session.state = 'streaming'
    session.updatedAt = new Date()

    // 创建中断控制器
    this.abortController = new AbortController()

    try {
      // 构建模型输入
      const modelMessages = session.messages.map((m) => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: this.extractContent(m),
      }))

      // 构建工具定义
      const toolDefs = Array.from(this.toolMap.values()).map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }))

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(session.designSystem)

      // 调用模型
      for await (const chunk of this.modelClient.stream(modelMessages, {
        systemPrompt,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        abortSignal: this.abortController.signal,
      })) {
        if (chunk.type === 'text') {
          yield { type: 'text', content: chunk.content! }
        } else if (chunk.type === 'tool_use') {
          // 记录工具调用消息
          const toolUseMessage: DesignMessage = {
            role: 'assistant',
            type: 'tool_use',
            toolName: chunk.toolName!,
            toolInput: chunk.toolInput!,
            timestamp: new Date(),
          }
          session.messages.push(toolUseMessage)
          yield { type: 'tool_use', toolName: chunk.toolName!, toolInput: chunk.toolInput! }

          // 执行工具
          session.state = 'tool_executing'
          const result = await this.executeTool(
            chunk.toolName!,
            chunk.toolInput!,
            session
          )

          // 记录工具结果
          const toolResultMessage: DesignMessage = {
            role: 'tool',
            toolName: chunk.toolName!,
            result,
            isError: result.metadata?.isError === true,
            timestamp: new Date(),
          }
          session.messages.push(toolResultMessage)
          yield {
            type: 'tool_result',
            toolName: chunk.toolName!,
            result,
            isError: toolResultMessage.isError,
          }

          session.state = 'streaming'
        } else if (chunk.type === 'error') {
          yield { type: 'error', error: chunk.error! }
        }
      }

      // 添加助手消息（汇总本次输出）
      const assistantMessage: DesignMessage = {
        role: 'assistant',
        content: this.summarizeAssistantContent(session),
        timestamp: new Date(),
      }
      session.messages.push(assistantMessage)
    } catch (err) {
      session.state = 'error'
      const errorMsg = err instanceof Error ? err.message : String(err)
      yield { type: 'error', error: errorMsg }
    } finally {
      session.state = 'idle'
      session.updatedAt = new Date()
      this.abortController = null
    }

    yield { type: 'done' }
  }

  /** 取消当前流式请求 */
  abort(): void {
    this.abortController?.abort()
  }

  /** 更新设计系统配置 */
  updateDesignSystem(sessionId: string, config: Partial<DesignSystemConfig>): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.designSystem = { ...session.designSystem, ...config }
      session.updatedAt = new Date()
    }
  }

  /** 更新模型配置 */
  updateModelConfig(config: Partial<ModelConfig>): void {
    this.modelClient.updateConfig(config)
  }

  /** 注册工具 */
  registerTool(tool: DesignTool): void {
    this.toolMap.set(tool.name, tool)
  }

  /** 获取已注册的工具列表 */
  getTools(): DesignTool[] {
    return Array.from(this.toolMap.values())
  }

  // --- 私有方法 ---

  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    session: DesignSession
  ): Promise<ToolResult> {
    const tool = this.toolMap.get(toolName)
    if (!tool) {
      return {
        output: `Unknown tool: ${toolName}`,
        metadata: { isError: true },
      }
    }

    const context: DesignContext = {
      messages: session.messages,
      designSystem: session.designSystem,
      modelConfig: this.modelClient.getConfig(),
      abortSignal: this.abortController?.signal ?? new AbortController().signal,
      onUpdate: (message: DesignMessage) => {
        session.messages.push(message)
        session.updatedAt = new Date()
      },
    }

    try {
      const output = await tool.execute(input, context)
      return {
        output: typeof output === 'string' ? output : JSON.stringify(output),
        metadata: { isError: false },
      }
    } catch (err) {
      return {
        output: err instanceof Error ? err.message : String(err),
        metadata: { isError: true },
      }
    }
  }

  private buildSystemPrompt(designSystem: DesignSystemConfig): string {
    return `You are a UI design agent following the Lovable design system.

Design specification:
- Background: ${designSystem.colors.background}
- Foreground: ${designSystem.colors.foreground}
- Border: ${designSystem.colors.border}
- Muted text: ${designSystem.colors.muted}
- Font: ${designSystem.typography.fontFamily}
- Border radius: standard ${designSystem.borderRadius.standard}px, card ${designSystem.borderRadius.card}px

Rules:
1. Use Tailwind CSS classes
2. Follow the color, font, spacing, and border-radius specs
3. Never use pure white (#ffffff) as background
4. Never use font weight > 600
5. Cards use borders, not shadows

Generate UI code based on the above specs.`
  }

  private extractContent(message: DesignMessage): string {
    if (message.role === 'user') return message.content
    if (message.role === 'assistant' && 'content' in message) return message.content
    if (message.role === 'assistant' && 'type' in message) {
      return `[Tool: ${message.toolName}] ${JSON.stringify(message.toolInput)}`
    }
    if (message.role === 'tool') return message.result.output
    return ''
  }

  private summarizeAssistantContent(session: DesignSession): string {
    const lastAssistant = [...session.messages]
      .reverse()
      .find((m): m is Extract<DesignMessage, { role: 'assistant'; content: string }> =>
        m.role === 'assistant' && 'content' in m && !('type' in m)
      )
    return lastAssistant?.content ?? ''
  }
}
