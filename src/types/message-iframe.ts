/**
 * iframe postMessage 类型定义
 * 用于父窗口与 iframe 之间的安全通信
 */

export interface IframeMessage {
  source: 'parent' | 'preview-iframe'
  type: string
  data: unknown
  timestamp: number
}
