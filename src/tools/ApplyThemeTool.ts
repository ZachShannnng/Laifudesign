/**
 * ApplyThemeTool — 主题应用工具
 * 接收设计系统变更，更新 DesignContext 中的 designSystem
 * 返回变更摘要，供智能体决定是否重新生成 UI
 */

import { z } from 'zod'
import type { DesignTool } from '@/types/tool'
import type { DesignContext } from '@/types/context'
import type { DesignSystemConfig } from '@/types/design-system'

const ApplyThemeInputSchema = z.object({
  /** 要更新的颜色配置 */
  colors: z.object({
    background: z.string().optional(),
    foreground: z.string().optional(),
    border: z.string().optional(),
    borderInteractive: z.string().optional(),
    muted: z.string().optional(),
    card: z.string().optional(),
    input: z.string().optional(),
    ring: z.string().optional(),
  }).optional().describe('要更新的颜色令牌'),
  /** 要更新的字体 */
  fontFamily: z.string().optional().describe('主字体'),
  /** 要更新的圆角 */
  borderRadius: z.object({
    standard: z.number().optional(),
    comfortable: z.number().optional(),
    card: z.number().optional(),
    container: z.number().optional(),
  }).optional().describe('要更新的圆角令牌'),
})

const ApplyThemeOutputSchema = z.object({
  /** 变更摘要 */
  changes: z.array(z.string()).describe('已应用的变更列表'),
  /** 更新后的完整设计系统 */
  designSystem: z.custom<DesignSystemConfig>().describe('更新后的设计系统配置'),
  /** 是否需要重新生成 UI */
  needsRegeneration: z.boolean().describe('是否需要重新生成 UI 以应用变更'),
})

type ApplyThemeInput = z.infer<typeof ApplyThemeInputSchema>
type ApplyThemeOutput = z.infer<typeof ApplyThemeOutputSchema>

export class ApplyThemeTool implements DesignTool<ApplyThemeInput, ApplyThemeOutput> {
  name = 'apply_theme'
  description = 'Apply design system theme changes (colors, fonts, border-radius). Returns the updated design system and whether UI regeneration is needed.'
  inputSchema = ApplyThemeInputSchema
  outputSchema = ApplyThemeOutputSchema

  userFacingName(input: Partial<ApplyThemeInput>): string {
    const parts: string[] = []
    if (input.colors) parts.push('颜色')
    if (input.fontFamily) parts.push('字体')
    if (input.borderRadius) parts.push('圆角')
    return parts.length > 0 ? `更新${parts.join('、')}` : '应用主题'
  }

  requiresConfirmation(): boolean {
    return false
  }

  async execute(input: ApplyThemeInput, context: DesignContext): Promise<ApplyThemeOutput> {
    const changes: string[] = []
    const ds = { ...context.designSystem }
    let needsRegeneration = false

    // 应用颜色变更
    if (input.colors) {
      ds.colors = { ...ds.colors }
      for (const [key, value] of Object.entries(input.colors)) {
        if (value !== undefined) {
          (ds.colors as unknown as Record<string, string>)[key] = value
          changes.push(`colors.${key}: ${value}`)
          needsRegeneration = true
        }
      }
    }

    // 应用字体变更
    if (input.fontFamily) {
      ds.typography = { ...ds.typography, fontFamily: input.fontFamily }
      changes.push(`fontFamily: ${input.fontFamily}`)
      needsRegeneration = true
    }

    // 应用圆角变更
    if (input.borderRadius) {
      ds.borderRadius = { ...ds.borderRadius }
      for (const [key, value] of Object.entries(input.borderRadius)) {
        if (value !== undefined) {
          (ds.borderRadius as unknown as Record<string, number>)[key] = value
          changes.push(`borderRadius.${key}: ${value}`)
        }
      }
      needsRegeneration = true
    }

    // 通过 onUpdate 通知会话设计系统已更新
    context.onUpdate({
      role: 'assistant',
      content: `[ApplyThemeTool] 已应用主题变更: ${changes.join(', ')}`,
      timestamp: new Date(),
    })

    return { changes, designSystem: ds, needsRegeneration }
  }
}
