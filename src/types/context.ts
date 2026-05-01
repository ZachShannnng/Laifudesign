/**
 * 设计上下文类型定义
 * 基于 Claude Code ToolUseContext，工具执行时的上下文
 */

import type { DesignMessage } from './message'
import type { DesignSystemConfig } from './design-system'
import type { ModelConfig } from '@/engine/ModelClient'

export interface DesignContext {
  /** 当前会话的消息历史 */
  messages: DesignMessage[]
  /** 当前设计系统配置 */
  designSystem: DesignSystemConfig
  /** 当前模型配置 */
  modelConfig: ModelConfig
  /** 中断信号（用户取消时触发） */
  abortSignal: AbortSignal
  /** 消息更新回调（用于流式 UI 更新） */
  onUpdate: (message: DesignMessage) => void
}

/** 会话状态 */
export type SessionState = 'idle' | 'streaming' | 'tool_executing' | 'error'

/** 会话信息 */
export interface DesignSession {
  id: string
  messages: DesignMessage[]
  state: SessionState
  designSystem: DesignSystemConfig
  createdAt: Date
  updatedAt: Date
}
