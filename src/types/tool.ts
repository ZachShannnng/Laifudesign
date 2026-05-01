/**
 * 设计工具类型定义
 * 基于 Claude Code Tool.ts，使用 Zod 做输入输出验证
 */

import type { z } from 'zod'
import type { DesignContext } from './context'

export interface DesignTool<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  outputSchema?: z.ZodType<TOutput>

  /** 工具执行 */
  execute(input: TInput, context: DesignContext): Promise<TOutput>

  /** 用户友好的名称（用于 UI 展示） */
  userFacingName?(input: Partial<TInput>): string

  /** 是否需要用户确认后才执行 */
  requiresConfirmation?(input: TInput): boolean
}

/** 工具注册表 */
export interface ToolRegistry {
  register(tool: DesignTool): void
  get(name: string): DesignTool | undefined
  list(): DesignTool[]
}
