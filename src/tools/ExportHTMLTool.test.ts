import { beforeEach, describe, it, expect, vi } from 'vitest'
import { ExportHTMLTool } from './ExportHTMLTool'
import { DEFAULT_DESIGN_SYSTEM } from '@/types/design-system'
import type { DesignContext } from '@/types/context'

function mockContext(partial?: Partial<DesignContext>): DesignContext {
  return {
    messages: [],
    designSystem: { ...DEFAULT_DESIGN_SYSTEM },
    modelConfig: {
      provider: 'openai',
      apiUrl: 'https://api.example.com/v1/chat/completions',
      apiKey: 'sk-test',
      model: 'gpt-4',
    },
    abortSignal: new AbortController().signal,
    onUpdate: vi.fn(),
    ...partial,
  }
}

describe('ExportHTMLTool', () => {
  const tool = new ExportHTMLTool()

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:laifu-test'),
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    })
  })

  it('should have correct name and description', () => {
    expect(tool.name).toBe('export_html')
    expect(tool.description).toContain('Export')
  })

  it('should return userFacingName', () => {
    expect(tool.userFacingName!()).toBe('导出 HTML')
  })

  it('should not require confirmation', () => {
    expect(tool.requiresConfirmation!()).toBe(false)
  })

  it('should export provided HTML content', async () => {
    const ctx = mockContext()
    const html = '<!DOCTYPE html><html><body>Test</body></html>'
    const result = await tool.execute({ html, filename: 'test' }, ctx)

    expect(result.success).toBe(true)
    expect(result.filename).toBe('test.html')
  })

  it('should auto-add .html extension', async () => {
    const ctx = mockContext()
    const result = await tool.execute(
      { html: '<html><body>X</body></html>', filename: 'page' },
      ctx
    )
    expect(result.filename).toBe('page.html')
  })

  it('should not double-add .html extension', async () => {
    const ctx = mockContext()
    const result = await tool.execute(
      { html: '<html><body>X</body></html>', filename: 'page.html' },
      ctx
    )
    expect(result.filename).toBe('page.html')
  })

  it('should extract HTML from message history when html input is empty', async () => {
    const ctx = mockContext({
      messages: [
        { role: 'user', content: 'make a page', timestamp: new Date() },
        { role: 'assistant', content: '<!DOCTYPE html><html><body>From History</body></html>', timestamp: new Date() },
      ] as any,
    })
    const result = await tool.execute({ filename: 'from-history' }, ctx)

    expect(result.success).toBe(true)
  })

  it('should fail when no HTML content available', async () => {
    const ctx = mockContext()
    const result = await tool.execute({}, ctx)

    expect(result.success).toBe(false)
    expect(result.error).toContain('没有可导出')
  })

  it('should validate input schema', () => {
    const result = tool.inputSchema.safeParse({ html: '<html></html>', filename: 'test' })
    expect(result.success).toBe(true)
  })

  it('should accept empty input (all optional)', () => {
    const result = tool.inputSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
