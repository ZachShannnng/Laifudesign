/**
 * openai-compatible.ts 单元测试
 * 覆盖 SSE 解析逻辑（parseSSELine 通过 openAICompatibleStream 间接测试）
 */

import { describe, it, expect, vi } from 'vitest'
import {
  normalizeChatCompletionsUrl,
  normalizeModelsUrl,
  openAICompatibleStream,
  testConnection,
} from '@/engine/openai-compatible'

/** 构造 SSE 格式的 ReadableStream */
function createSSEStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const chunks = lines.map((line) => encoder.encode(line + '\n'))
  let index = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++])
      } else {
        controller.close()
      }
    },
  })
}

describe('openAICompatibleStream', () => {
  const baseParams = {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'sk-test',
    model: 'gpt-4o',
    messages: [{ role: 'user' as const, content: 'hello' }],
  }

  it('should yield text chunks from SSE stream', async () => {
    const sseData = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      'data: {"choices":[{"delta":{"content":" world"}}]}',
      'data: [DONE]',
    ]

    const mockResponse = new Response(createSSEStream(sseData), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of openAICompatibleStream(baseParams)) {
      chunks.push(chunk)
    }

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks).toHaveLength(2)
    expect(textChunks[0].content).toBe('Hello')
    expect(textChunks[1].content).toBe(' world')
    expect(chunks.some((c) => c.type === 'done')).toBe(true)
  })

  it('should handle tool_calls in SSE stream', async () => {
    // Arguments are accumulated as string fragments across deltas
    // Each SSE line is valid JSON; the arguments field is a string containing partial JSON
    const sseData = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_abc123","type":"function","function":{"name":"GenerateUITool","arguments":""}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"component\\":\\"login\\"}"}}]}}]}',
      'data: {"choices":[{"finish_reason":"tool_calls"}]}',
      'data: [DONE]',
    ]

    const mockResponse = new Response(createSSEStream(sseData), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

    const chunks: Array<{ type: string; toolName?: string; toolInput?: Record<string, unknown> }> = []
    for await (const chunk of openAICompatibleStream(baseParams)) {
      chunks.push(chunk)
    }

    const toolChunks = chunks.filter((c) => c.type === 'tool_use')
    expect(toolChunks).toHaveLength(1)
    expect(toolChunks[0].toolName).toBe('GenerateUITool')
    expect(toolChunks[0].toolInput).toEqual({ component: 'login' })
  })

  it('should skip malformed SSE lines gracefully', async () => {
    const sseData = [
      '',  // empty line
      ': comment',  // SSE comment
      'data: not-json',  // malformed JSON
      'data: {"choices":[{"delta":{"content":"OK"}}]}',
      'data: [DONE]',
    ]

    const mockResponse = new Response(createSSEStream(sseData), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse)

    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of openAICompatibleStream(baseParams)) {
      chunks.push(chunk)
    }

    const textChunks = chunks.filter((c) => c.type === 'text')
    expect(textChunks).toHaveLength(1)
    expect(textChunks[0].content).toBe('OK')
  })

  it('should yield error on API error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('{"error":"invalid api key"}', { status: 401 })
    )

    const chunks: Array<{ type: string; error?: string }> = []
    for await (const chunk of openAICompatibleStream(baseParams)) {
      chunks.push(chunk)
    }

    const errorChunks = chunks.filter((c) => c.type === 'error')
    expect(errorChunks).toHaveLength(1)
    expect(errorChunks[0].error).toContain('401')
  })

  it('should yield error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const chunks: Array<{ type: string; error?: string }> = []
    for await (const chunk of openAICompatibleStream(baseParams)) {
      chunks.push(chunk)
    }

    const errorChunks = chunks.filter((c) => c.type === 'error')
    expect(errorChunks).toHaveLength(1)
    expect(errorChunks[0].error).toContain('Network error')
  })

  it('should return early on abort signal', async () => {
    const controller = new AbortController()
    controller.abort()

    const chunks: Array<{ type: string }> = []
    for await (const chunk of openAICompatibleStream({ ...baseParams, abortSignal: controller.signal })) {
      chunks.push(chunk)
    }

    expect(chunks).toHaveLength(0)
  })
})

describe('endpoint normalization', () => {
  it('should accept provider base URLs for chat completions', () => {
    expect(normalizeChatCompletionsUrl('https://api.deepseek.com')).toBe('https://api.deepseek.com/chat/completions')
    expect(normalizeChatCompletionsUrl('https://api.deepseek.com/')).toBe('https://api.deepseek.com/chat/completions')
    expect(normalizeChatCompletionsUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1/chat/completions')
    expect(normalizeChatCompletionsUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/v1/chat/completions')
  })

  it('should derive model list URLs from base or chat URLs', () => {
    expect(normalizeModelsUrl('https://api.deepseek.com')).toBe('https://api.deepseek.com/models')
    expect(normalizeModelsUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1/models')
    expect(normalizeModelsUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/v1/models')
    expect(normalizeModelsUrl('https://api.openai.com/v1/models')).toBe('https://api.openai.com/v1/models')
  })
})

describe('testConnection', () => {
  it('should return ok on successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('{}', { status: 200 })
    )

    const result = await testConnection({
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test',
      model: 'gpt-4o',
    })

    expect(result.ok).toBe(true)
  })

  it('should return error on failed response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('unauthorized', { status: 401 })
    )

    const result = await testConnection({
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-wrong',
      model: 'gpt-4o',
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('401')
  })
})
