import { describe, it, expect } from 'vitest'
import { DefaultToolRegistry } from './ToolRegistry'
import { GenerateUITool, ApplyThemeTool, ExportHTMLTool } from '.'

describe('DefaultToolRegistry', () => {
  it('should register and retrieve tools', () => {
    const registry = new DefaultToolRegistry()
    const genTool = new GenerateUITool()
    registry.register(genTool)

    expect(registry.get('generate_ui')).toBe(genTool)
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('should list all registered tools', () => {
    const registry = new DefaultToolRegistry()
    registry.register(new GenerateUITool())
    registry.register(new ApplyThemeTool())
    registry.register(new ExportHTMLTool())

    const tools = registry.list()
    expect(tools).toHaveLength(3)
    expect(tools.map((t) => t.name).sort()).toEqual([
      'apply_theme',
      'export_html',
      'generate_ui',
    ])
  })

  it('should overwrite when registering duplicate name', () => {
    const registry = new DefaultToolRegistry()
    const tool1 = new GenerateUITool()
    const tool2 = new GenerateUITool()
    registry.register(tool1)
    registry.register(tool2)

    expect(registry.get('generate_ui')).toBe(tool2)
    expect(registry.list()).toHaveLength(1)
  })
})
