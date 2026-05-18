/**
 * 统一 OpenAI 兼容 SSE 客户端（Node.js 版本）
 * 1 个客户端覆盖所有 provider（OpenAI、智谱、自定义中转站）
 * 所有 provider 均走 OpenAI /v1/chat/completions 兼容格式
 */

/** OpenAI 兼容的聊天消息格式 */
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  /** tool_calls 仅 assistant 消息使用 */
  tool_calls?: OpenAIToolCall[]
  /** tool_call_id 仅 tool 消息使用 */
  tool_call_id?: string
}

/** OpenAI tool_calls 中的单个调用 */
export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/** OpenAI 兼容的工具定义 */
export interface OpenAIToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: unknown
  }
}

/** 流式事件类型 */
export interface StreamChunk {
  type: 'text' | 'tool_use' | 'done' | 'error'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  error?: string
}

/** 流式请求参数 */
export interface OpenAIStreamParams {
  /** OpenAI-compatible endpoint or base URL */
  apiUrl: string
  apiKey: string
  model: string
  messages: OpenAIChatMessage[]
  tools?: OpenAIToolDefinition[]
  /** 最大输出 token */
  maxTokens?: number
  /** 温度 0-1 */
  temperature?: number
  abortSignal?: AbortSignal
}

export function normalizeChatCompletionsUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/+$/, '')
  if (!trimmed) return trimmed
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
}

export function normalizeModelsUrl(apiUrl: string): string {
  const trimmed = apiUrl.trim().replace(/\/+$/, '')
  if (!trimmed) return trimmed
  if (/\/chat\/completions$/i.test(trimmed)) {
    return trimmed.replace(/\/chat\/completions$/i, '/models')
  }
  if (/\/models$/i.test(trimmed)) return trimmed
  return `${trimmed}/models`
}

/**
 * 解析 SSE 行，提取 delta 内容
 * SSE 格式: "data: {json}" 或 "data: [DONE]"
 * 异常行（空行、注释行、格式错误行）安全跳过
 */
function parseSSELine(line: string): { type: 'content' | 'tool_call' | 'done' | 'skip'; data?: unknown } {
  // 跳过空行和注释行
  if (!line.startsWith('data: ')) {
    return { type: 'skip' }
  }

  const raw = line.slice(6).trim()

  // 流结束标记
  if (raw === '[DONE]') {
    return { type: 'done' }
  }

  try {
    const parsed = JSON.parse(raw)
    return { type: 'content', data: parsed }
  } catch {
    // SSE 格式异常行 — try-catch 是 critical gap 防护
    // 非致命：跳过此行，继续处理后续行
    console.warn('[SSE] Failed to parse line, skipping:', line)
    return { type: 'skip' }
  }
}

/**
 * 累积 tool_call 的 arguments 片段
 * OpenAI 流式格式中，tool_call 的 arguments 是分多个 delta 片段传输的
 */
interface ToolCallAccumulator {
  id: string
  name: string
  arguments: string
}

/**
 * 统一 OpenAI 兼容 SSE 流式调用
 * 适用于所有 OpenAI 兼容端点（OpenAI、智谱、自定义）
 */
export async function* openAICompatibleStream(params: OpenAIStreamParams): AsyncGenerator<StreamChunk> {
  const { apiUrl, apiKey, model, messages, tools, maxTokens, temperature, abortSignal } = params

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
  }
  if (maxTokens !== undefined) {
    body.max_tokens = maxTokens
  }
  if (temperature !== undefined) {
    body.temperature = temperature
  }

  let response: Response
  try {
    response = await fetch(normalizeChatCompletionsUrl(apiUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: abortSignal,
    })
  } catch (err) {
    if (abortSignal?.aborted) {
      return
    }
    yield { type: 'error', error: `Network error: ${err instanceof Error ? err.message : String(err)}` }
    return
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    yield {
      type: 'error',
      error: `API error ${response.status}: ${errorBody || response.statusText}`,
    }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { type: 'error', error: 'No response body' }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''
  const toolCallAccumulators = new Map<number, ToolCallAccumulator>()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按行拆分 SSE 数据
      const lines = buffer.split('\n')
      // 最后一行可能不完整，保留在 buffer 中
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const parsed = parseSSELine(line)

        if (parsed.type === 'done') {
          // 处理剩余的累积 tool_calls
          for (const acc of toolCallAccumulators.values()) {
            let toolInput: Record<string, unknown>
            try {
              toolInput = JSON.parse(acc.arguments)
            } catch {
              toolInput = { _raw: acc.arguments }
            }
            yield {
              type: 'tool_use',
              toolName: acc.name,
              toolInput,
            }
          }
          toolCallAccumulators.clear()
          yield { type: 'done' }
          return
        }

        if (parsed.type === 'skip') continue

        const data = parsed.data as {
          choices?: Array<{
            delta?: {
              content?: string | null
              tool_calls?: Array<{
                index: number
                id?: string
                type?: string
                function?: {
                  name?: string
                  arguments?: string
                }
              }>
            }
            finish_reason?: string | null
          }>
        }

        const choice = data.choices?.[0]
        if (!choice) continue

        const delta = choice.delta

        // 文本内容
        if (delta?.content) {
          yield { type: 'text', content: delta.content }
        }

        // tool_calls 增量
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index

            if (tc.id) {
              // 新 tool_call 开始
              toolCallAccumulators.set(idx, {
                id: tc.id,
                name: tc.function?.name ?? '',
                arguments: '',
              })
            }

            const acc = toolCallAccumulators.get(idx)
            if (acc && tc.function?.arguments) {
              acc.arguments += tc.function.arguments
            }
          }
        }

        // finish_reason 为 stop 时，输出所有累积的 tool_calls
        if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
          if (toolCallAccumulators.size > 0) {
            for (const acc of toolCallAccumulators.values()) {
              let toolInput: Record<string, unknown>
              try {
                toolInput = JSON.parse(acc.arguments)
              } catch {
                toolInput = { _raw: acc.arguments }
              }
              yield {
                type: 'tool_use',
                toolName: acc.name,
                toolInput,
              }
            }
            toolCallAccumulators.clear()
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { type: 'done' }
}

/**
 * 测试 API 连接是否可用
 * 发送一个极简请求，检查是否返回有效响应
 */
export async function testConnection(params: {
  apiUrl: string
  apiKey: string
  model: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(normalizeChatCompletionsUrl(params.apiUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
    })

    if (response.ok) {
      return { ok: true }
    }

    const errorBody = await response.text().catch(() => '')
    return { ok: false, error: `API error ${response.status}: ${errorBody || response.statusText}` }
  } catch (err) {
    return { ok: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/**
 * 从 API 端点获取可用模型列表
 * 调用 GET {baseURL}/v1/models，baseURL 从 apiUrl 推导
 * 返回模型 ID 列表，失败时返回空数组
 */
export async function fetchModels(params: {
  apiUrl: string
  apiKey: string
}): Promise<string[]> {
  try {
    const modelsUrl = normalizeModelsUrl(params.apiUrl)

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${params.apiKey}`,
      },
    })

    if (!response.ok) return []

    const data = await response.json() as {
      data?: Array<{ id: string }>
    }

    if (!Array.isArray(data.data)) return []

    return data.data
      .map((m) => m.id)
      .filter(Boolean)
      .sort()
  } catch {
    return []
  }
}
