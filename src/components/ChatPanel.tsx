import { useState, useRef, useEffect } from 'react'
import type { DesignMessage } from '@/types/message'

interface ChatPanelProps {
  messages: DesignMessage[]
  isStreaming: boolean
  onSend: (text: string) => void
  onAbort: () => void
  sessionTitle: string
  modelLabel: string
}

export default function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onAbort,
  sessionTitle,
  modelLabel,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const msgsEndRef = useRef<HTMLDivElement>(null)

  // Auto-grow textarea (v4: starts 20px, max 97px ~5 lines)
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '20px'
    const scrollH = ta.scrollHeight
    const maxH = 97
    ta.style.height = Math.min(scrollH, maxH) + 'px'
    ta.style.overflowY = scrollH > maxH ? 'auto' : 'hidden'
  }, [input])

  // Auto-scroll
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col border-r border-border"
      style={{
        width: 'var(--chat-width)',
        minWidth: 'var(--chat-width)',
        background: 'var(--color-cream)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          minHeight: '44px',
        }}
      >
        <h2 style={{ fontSize: '13px', fontWeight: 600 }}>{sessionTitle || '新对话'}</h2>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-muted-text)',
            background: 'var(--color-charcoal-04)',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: 500,
          }}
        >
          {modelLabel}
        </span>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: '16px', gap: '14px' }}
      >
        {messages.length === 0 && (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: 'var(--color-muted-text)', fontSize: '13px' }}
          >
            描述你想要的页面...
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div
                key={i}
                className="self-end"
                style={{
                  maxWidth: '85%',
                  background: 'var(--color-off-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '9px 13px',
                  fontSize: '13px',
                  lineHeight: 1.55,
                }}
              >
                {msg.content}
              </div>
            )
          }
          if (msg.role === 'assistant' && 'type' in msg && msg.type === 'tool_use') {
            const desc = msg.toolInput?.description || msg.toolInput?.component || '执行中'
            return (
              <div
                key={i}
                className="self-start"
                style={{
                  borderLeft: '2px solid var(--color-border)',
                  padding: '3px 0 3px 10px',
                  fontSize: '12px',
                  color: 'var(--color-muted-text)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-charcoal-83)' }}>
                  {msg.toolName}
                </span>{' '}
                → {String(desc)}
              </div>
            )
          }
          if (msg.role === 'tool') {
            return (
              <div
                key={i}
                className="self-start"
                style={{
                  borderLeft: '2px solid var(--color-border)',
                  padding: '3px 0 3px 10px',
                  fontSize: '12px',
                  color: 'var(--color-muted-text)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-charcoal-83)' }}>
                  {msg.toolName}
                </span>
                {msg.isError ? ' ✗' : ' ✓'}
              </div>
            )
          }
          if (msg.role === 'assistant' && 'content' in msg) {
            return (
              <div
                key={i}
                className="self-start"
                style={{
                  maxWidth: '90%',
                  color: 'var(--color-muted-text)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                {msg.content}
              </div>
            )
          }
          return null
        })}
        <div ref={msgsEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--color-border)' }}>
        <div
          className="flex items-end"
          style={{
            position: 'relative',
            gap: '4px',
            background: 'var(--color-off-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '6px',
            transition: 'border-color 0.12s',
          }}
        >
          {/* Attach button */}
          <button
            onClick={() => setShowAttach(!showAttach)}
            className="border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              color: 'var(--color-muted-text)',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-charcoal-04)'
              e.currentTarget.style.color = 'var(--color-charcoal)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted-text)'
            }}
            title="添加附件"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 3v12M3 9h12" />
            </svg>
          </button>

          {/* Attach popup */}
          {showAttach && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                background: 'var(--color-off-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                padding: '4px',
                minWidth: '140px',
                zIndex: 20,
              }}
            >
              <div
                className="flex items-center cursor-pointer"
                style={{
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--color-charcoal-83)',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-charcoal-04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setShowAttach(false)}
              >
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="14" height="12" rx="1.5" /><circle cx="6" cy="6.5" r="1.5" /><path d="M2 13l4-4 2.5 2.5L12 7l4 6" />
                </svg>
                图像
              </div>
              <div
                className="flex items-center cursor-pointer"
                style={{
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: 'var(--color-charcoal-83)',
                  transition: 'background 0.08s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-charcoal-04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setShowAttach(false)}
              >
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 1h6l5 5v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" /><path d="M10 1v5h5" /><path d="M6 10h6M6 12.5h5" />
                </svg>
                文件
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? '生成中...' : '描述你想要的页面...'}
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontFamily: "var(--font-sans)",
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--color-charcoal)',
              resize: 'none',
              outline: 'none',
              height: '20px',
              maxHeight: '97px',
            }}
          />

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onAbort}
              className="border-none cursor-pointer flex items-center justify-center shrink-0"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                background: 'var(--color-destructive)',
                color: 'var(--color-off-white)',
                transition: 'opacity 0.12s',
              }}
              title="停止"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="border-none cursor-pointer flex items-center justify-center shrink-0"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                background: 'var(--color-charcoal)',
                color: 'var(--color-off-white)',
                boxShadow:
                  'rgba(255,255,255,0.2) 0 0.5px 0 0 inset, rgba(0,0,0,0.2) 0 0 0 0.5px inset, rgba(0,0,0,0.05) 0 1px 2px',
                transition: 'opacity 0.12s, background 0.12s',
                opacity: input.trim() ? 1 : 0.4,
              }}
              title="发送"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9h12M10 4l5 5-5 5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
