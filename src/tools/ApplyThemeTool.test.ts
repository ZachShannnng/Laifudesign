import { describe, it, expect, vi } from 'vitest'
import { ApplyThemeTool } from './ApplyThemeTool'
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

describe('ApplyThemeTool', () => {
  const tool = new ApplyThemeTool()

  it('should have correct name and description', () => {
    expect(tool.name).toBe('apply_theme')
    expect(tool.description).toContain('design system')
  })

  it('should apply color changes', async () => {
    const ctx = mockContext()
    const result = await tool.execute(
      { colors: { background: '#000000', foreground: '#ffffff' } },
      ctx
    )

    expect(result.changes.length).toBeGreaterThan(0)
    expect(result.changes).toContain('colors.background: #000000')
    expect(result.changes).toContain('colors.foreground: #ffffff')
    expect(result.designSystem.colors.background).toBe('#000000')
    expect(result.designSystem.colors.foreground).toBe('#ffffff')
    expect(result.needsRegeneration).toBe(true)
  })

  it('should apply font change', async () => {
    const ctx = mockContext()
    const result = await tool.execute({ fontFamily: 'Arial, sans-serif' }, ctx)

    expect(result.changes).toContain('fontFamily: Arial, sans-serif')
    expect(result.designSystem.typography.fontFamily).toBe('Arial, sans-serif')
    expect(result.needsRegeneration).toBe(true)
  })

  it('should apply border radius changes', async () => {
    const ctx = mockContext()
    const result = await tool.execute({ borderRadius: { card: 20 } }, ctx)

    expect(result.changes).toContain('borderRadius.card: 20')
    expect(result.designSystem.borderRadius.card).toBe(20)
  })

  it('should call onUpdate', async () => {
    const onUpdate = vi.fn()
    const ctx = mockContext({ onUpdate })
    await tool.execute({ fontFamily: 'Georgia' }, ctx)

    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0].content).toContain('ApplyThemeTool')
  })

  it('should not set needsRegeneration when no changes', async () => {
    const ctx = mockContext()
    const result = await tool.execute({}, ctx)

    expect(result.changes).toHaveLength(0)
    expect(result.needsRegeneration).toBe(false)
  })

  it('should validate input schema', () => {
    const result = tool.inputSchema.safeParse({ colors: { background: '#fff' } })
    expect(result.success).toBe(true)
  })

  it('should reject invalid color values', () => {
    const result = tool.inputSchema.safeParse({ colors: { background: 123 } })
    expect(result.success).toBe(false)
  })
})
