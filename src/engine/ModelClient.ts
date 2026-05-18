/**
 * 可配置模型客户端
 * 基于 Claude Code client.ts，支持多提供商
 * 所有 provider 统一走 OpenAI 兼容 SSE 格式
 */

import { openAICompatibleStream, testConnection, fetchModels } from './openai-compatible'
import type { OpenAIChatMessage, OpenAIToolDefinition } from './openai-compatible'

export type ProviderType = string

export interface ModelConfig {
  /** OpenAI-compatible endpoint or base URL */
  apiUrl: string
  apiKey: string
  model: string
  provider: ProviderType
  /** 最大输出 token 数 */
  maxTokens?: number
  /** 温度（0-1） */
  temperature?: number
}

/**
 * 预设模型配置模板
 * Legacy defaults. Provider is now a user-facing label, not routing logic.
 */
export const MODEL_PRESETS: Record<ProviderType, Omit<ModelConfig, 'apiKey' | 'apiUrl' | 'model'>> = {
  custom: {
    provider: 'custom',
    maxTokens: 8192,
    temperature: 0.7,
  },
}

/** 模型流式输出的 chunk */
export interface StreamChunk {
  type: 'text' | 'tool_use' | 'done' | 'error'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  error?: string
}

/** 模型客户端接口 */
export interface ModelClient {
  /** 流式调用模型 */
  stream(
    messages: Array<{ role: string; content: string }>,
    options?: {
      systemPrompt?: string
      tools?: Array<{ name: string; description: string; parameters: unknown }>
      abortSignal?: AbortSignal
    }
  ): AsyncIterable<StreamChunk>

  /** 获取当前配置 */
  getConfig(): ModelConfig

  /** 更新配置 */
  updateConfig(config: Partial<ModelConfig>): void

  /** 测试连接 */
  testConnection(): Promise<{ ok: boolean; error?: string }>

  /** 获取可用模型列表 */
  listModels(): Promise<string[]>
}

/** 创建模型客户端（工厂函数） */
export function createModelClient(config: ModelConfig): ModelClient {
  return new DefaultModelClient(config)
}

/** 默认模型客户端实现 — 统一 OpenAI 兼容 SSE */
class DefaultModelClient implements ModelClient {
  private config: ModelConfig

  constructor(config: ModelConfig) {
    this.config = config
  }

  async *stream(
    messages: Array<{ role: string; content: string }>,
    options?: {
      systemPrompt?: string
      tools?: Array<{ name: string; description: string; parameters: unknown }>
      abortSignal?: AbortSignal
    }
  ): AsyncIterable<StreamChunk> {
    // 转换为 OpenAI 兼容消息格式
    const openaiMessages: OpenAIChatMessage[] = []

    if (options?.systemPrompt) {
      openaiMessages.push({ role: 'system', content: options.systemPrompt })
    }

    for (const msg of messages) {
      openaiMessages.push({
        role: msg.role as OpenAIChatMessage['role'],
        content: msg.content,
      })
    }

    // 转换工具定义为 OpenAI 格式
    const openaiTools: OpenAIToolDefinition[] | undefined = options?.tools?.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))

    yield* openAICompatibleStream({
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
      model: this.config.model,
      messages: openaiMessages,
      tools: openaiTools,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      abortSignal: options?.abortSignal,
    })
  }

  getConfig(): ModelConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config }
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    return testConnection({
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
      model: this.config.model,
    })
  }

  async listModels(): Promise<string[]> {
    return fetchModels({
      apiUrl: this.config.apiUrl,
      apiKey: this.config.apiKey,
    })
  }
}
