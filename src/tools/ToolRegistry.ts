/**
 * 工具注册表实现
 * 管理设计工具的注册、查找和列举
 */

import type { DesignTool, ToolRegistry as IToolRegistry } from '@/types/tool'

export class DefaultToolRegistry implements IToolRegistry {
  private tools: Map<string, DesignTool> = new Map()

  register(tool: DesignTool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Tool "${tool.name}" already registered, overwriting`)
    }
    this.tools.set(tool.name, tool)
  }

  get(name: string): DesignTool | undefined {
    return this.tools.get(name)
  }

  list(): DesignTool[] {
    return Array.from(this.tools.values())
  }
}
