/**
 * 设计消息类型定义
 * 基于 Claude Code message.ts，适配设计智能体场景
 */

export type DesignMessage =
  | UserDesignMessage
  | AssistantDesignMessage
  | ToolUseDesignMessage
  | ToolResultDesignMessage

export interface UserDesignMessage {
  role: 'user'
  content: string
  timestamp: Date
}

export interface AssistantDesignMessage {
  role: 'assistant'
  content: string
  timestamp: Date
}

export interface ToolUseDesignMessage {
  role: 'assistant'
  type: 'tool_use'
  toolName: string
  toolInput: Record<string, unknown>
  timestamp: Date
}

export interface ToolResultDesignMessage {
  role: 'tool'
  toolName: string
  result: ToolResult
  isError: boolean
  timestamp: Date
}

export interface ToolResult {
  output: string
  metadata?: Record<string, unknown>
}

/** 流式输出的事件类型 */
export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; toolName: string; toolInput: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; result: ToolResult; isError: boolean }
  | { type: 'done' }
  | { type: 'error'; error: string }
