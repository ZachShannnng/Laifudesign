import { describe, it, expect, vi } from 'vitest'
import { GenerateUITool } from './GenerateUITool'
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

// Mock createModelClient to avoid real API calls
vi.mock('@/engine/ModelClient', () => ({
  createModelClient: () => ({
    stream: async function* () {
      yield { type: 'text', content: '<!DOCTYPE html><html><head><title>Test</title></head><body>Hello</body></html>' }
      yield { type: 'done' }
    },
    getConfig: () => ({ provider: 'openai', apiUrl: '', apiKey: '', model: 'gpt-4' }),
    updateConfig: vi.fn(),
  }),
}))

describe('GenerateUITool', () => {
  const tool = new GenerateUITool()

  it('should have correct name and description', () => {
    expect(tool.name).toBe('generate_ui')
    expect(tool.description).toContain('Generate')
  })

  it('should return userFacingName for create mode', () => {
    expect(tool.userFacingName!({ mode: 'create' })).toBe('生成 UI')
  })

  it('should return userFacingName for modify mode', () => {
    expect(tool.userFacingName!({ mode: 'modify', component: 'Button' })).toBe('修改 Button')
  })

  it('should not require confirmation', () => {
    expect(tool.requiresConfirmation!()).toBe(false)
  })

  it('should generate HTML from description', async () => {
    const ctx = mockContext()
    const result = await tool.execute({ description: 'A login page' }, ctx)

    expect(result.success).toBe(true)
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('</html>')
  })

  it('should call onUpdate after generation', async () => {
    const onUpdate = vi.fn()
    const ctx = mockContext({ onUpdate })
    await tool.execute({ description: 'A card component' }, ctx)

    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0].content).toContain('GenerateUITool')
  })

  it('should validate input schema — description required', () => {
    const result = tool.inputSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should validate input schema — valid input', () => {
    const result = tool.inputSchema.safeParse({
      description: 'A login page',
      mode: 'create',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid mode', () => {
    const result = tool.inputSchema.safeParse({
      description: 'A login page',
      mode: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})
