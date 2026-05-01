import { useState, useRef } from 'react'

interface PreviewPanelProps {
  htmlContent: string
  isLoading: boolean
}

export default function PreviewPanel({ htmlContent, isLoading }: PreviewPanelProps) {
  const [showCode, setShowCode] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleRefresh = () => {
    if (iframeRef.current && htmlContent) {
      iframeRef.current.srcdoc = htmlContent
    }
  }

  const tbBase: React.CSSProperties = {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '4px',
    background: 'transparent',
    color: 'var(--color-muted-text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.08s',
  }

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--color-off-white)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center"
        style={{
          gap: '1px',
          padding: '5px 10px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-cream)',
        }}
      >
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          style={tbBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-charcoal-04)'
            e.currentTarget.style.color = 'var(--color-charcoal)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted-text)'
          }}
          title="刷新"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4" /><path d="M13 1v3h-3M3 15v-3h3" />
          </svg>
        </button>

        {/* Fullscreen */}
        <button
          style={tbBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-charcoal-04)'
            e.currentTarget.style.color = 'var(--color-charcoal)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted-text)'
          }}
          title="全屏"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '14px', background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Export */}
        <button
          style={tbBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-charcoal-04)'
            e.currentTarget.style.color = 'var(--color-charcoal)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted-text)'
          }}
          title="导出 HTML"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 11v3h12v-3M8 2v8M5 7l3 3 3-3" />
          </svg>
        </button>

        {/* Code toggle */}
        <button
          onClick={() => setShowCode(!showCode)}
          style={{
            ...tbBase,
            background: showCode ? 'var(--color-charcoal)' : 'transparent',
            color: showCode ? 'var(--color-off-white)' : 'var(--color-muted-text)',
          }}
          onMouseEnter={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = 'var(--color-charcoal-04)'
              e.currentTarget.style.color = 'var(--color-charcoal)'
            }
          }}
          onMouseLeave={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted-text)'
            }
          }}
          title="查看代码"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4L1 8l4 4M11 4l4 4-4 4" />
          </svg>
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '14px', background: 'var(--color-border)', margin: '0 4px' }} />

        {/* Snapshot */}
        <button
          style={tbBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-charcoal-04)'
            e.currentTarget.style.color = 'var(--color-charcoal)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--color-muted-text)'
          }}
          title="历史快照"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
          </svg>
        </button>

        {/* Label */}
        <span style={{ fontSize: '11px', color: 'var(--color-muted-text)', marginLeft: 'auto', fontWeight: 500 }}>
          预览
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(247,244,237,0.65)', zIndex: 10 }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-charcoal)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          </div>
        )}

        {/* Empty state */}
        {!htmlContent && !isLoading && (
          <div
            className="flex flex-col items-center justify-center h-full"
            style={{ gap: '10px', color: 'var(--color-muted-text)' }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-1.5px', opacity: 0.08 }}>L</div>
            <p style={{ fontSize: '13px' }}>发送消息开始生成页面</p>
          </div>
        )}

        {/* iframe */}
        {htmlContent && !showCode && (
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title="预览区"
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
          />
        )}

        {/* Code view */}
        {htmlContent && showCode && (
          <textarea
            readOnly
            value={htmlContent}
            spellCheck={false}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              padding: '14px',
              font: "12px/1.6 'SF Mono', Menlo, monospace",
              color: 'var(--color-charcoal)',
              background: 'var(--color-off-white)',
              resize: 'none',
              outline: 'none',
            }}
          />
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
