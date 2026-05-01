/**
 * 可配置模型客户端
 * 基于 Claude Code client.ts，支持多提供商
 */

export type ProviderType = 'anthropic' | 'openai' | 'zhipu' | 'custom'

export interface ModelConfig {
  apiUrl: string
  apiKey: string
  model: string
  provider: ProviderType
  /** 最大输出 token 数 */
  maxTokens?: number
  /** 温度（0-1） */
  temperature?: number
}

/** 预设模型配置模板 */
export const MODEL_PRESETS: Record<ProviderType, Omit<ModelConfig, 'apiKey'>> = {
  anthropic: {
    provider: 'anthropic',
    apiUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.7,
  },
  openai: {
    provider: 'openai',
    apiUrl: 'https://api.openai.com',
    model: 'gpt-4o',
    maxTokens: 8192,
    temperature: 0.7,
  },
  zhipu: {
    provider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas',
    model: 'glm-4',
    maxTokens: 8192,
    temperature: 0.7,
  },
  custom: {
    provider: 'custom',
    apiUrl: '',
    model: '',
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
      tools?: Array<{ name: string; description: string; input_schema: unknown }>
      abortSignal?: AbortSignal
    }
  ): AsyncIterable<StreamChunk>

  /** 获取当前配置 */
  getConfig(): ModelConfig

  /** 更新配置 */
  updateConfig(config: Partial<ModelConfig>): void
}

/** 创建模型客户端（工厂函数） */
export function createModelClient(config: ModelConfig): ModelClient {
  return new DefaultModelClient(config)
}

/** 默认模型客户端实现（TODO 3 中完善各提供商适配） */
class DefaultModelClient implements ModelClient {
  private config: ModelConfig

  constructor(config: ModelConfig) {
    this.config = config
  }

  async *stream(
    _messages: Array<{ role: string; content: string }>,
    _options?: {
      systemPrompt?: string
      tools?: Array<{ name: string; description: string; input_schema: unknown }>
      abortSignal?: AbortSignal
    }
  ): AsyncIterable<StreamChunk> {
    // TODO: 按 provider 类型调用不同 API
    // 当前为占位实现，TODO 3 中完善
    yield { type: 'error', error: `Provider "${this.config.provider}" not yet implemented. Complete TODO 3.` }
  }

  getConfig(): ModelConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
