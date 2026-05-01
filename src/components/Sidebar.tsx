import { useState, useRef, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, Plus, Search, Palette, Settings, Ellipsis, Trash2 } from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  sessions: Array<{ id: string; title: string }>
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onOpenSettings: () => void
  onOpenDesignSystem: () => void
  onDeleteSession: (id: string) => void
}

export default function Sidebar({
  collapsed,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onOpenDesignSystem,
  onDeleteSession,
}: SidebarProps) {
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [hoveredLogo, setHoveredLogo] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close ellipsis menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  // Close confirm dialog on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmDeleteId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const hoverBg = 'rgba(0,0,0,0.04)'
  const activeBg = 'rgba(0,0,0,0.06)'

  // Menu item renderer
  const MenuItem = ({
    id,
    icon,
    label,
    onClick,
    active = false,
  }: {
    id: string
    icon: React.ReactNode
    label: string
    onClick: () => void
    active?: boolean
  }) => (
    <button
      onClick={onClick}
      className="flex items-center border-none bg-transparent cursor-pointer transition-colors w-full text-left"
      style={{
        gap: collapsed ? 0 : '10px',
        padding: collapsed ? '8px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : undefined,
        borderRadius: '8px',
        background: active ? activeBg : 'transparent',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--color-charcoal)' : 'var(--color-charcoal-83)',
      }}
      onMouseEnter={(e) => {
        setHoveredMenu(id)
        if (!active) e.currentTarget.style.background = hoverBg
      }}
      onMouseLeave={(e) => {
        setHoveredMenu(null)
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </span>
      {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
    </button>
  )

  return (
    <>
    <aside
      className="flex flex-col border-r border-border transition-all duration-[250ms] overflow-hidden"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : '260px',
        minWidth: collapsed ? 'var(--sidebar-collapsed)' : '260px',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#fff',
      }}
    >
      {/* Header: logo + independent toggle */}
      <div
        className="flex items-center shrink-0"
        style={{
          minHeight: '52px',
          padding: collapsed ? '0 12px' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {/* Logo — hover overlay when collapsed */}
        <div
          className="relative shrink-0"
          style={{ width: '28px', height: '28px' }}
          onMouseEnter={() => collapsed && setHoveredLogo(true)}
          onMouseLeave={() => setHoveredLogo(false)}
        >
          {/* Logo layer */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--color-charcoal)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              transition: 'opacity 0.12s',
              position: 'absolute',
              inset: 0,
              opacity: collapsed && hoveredLogo ? 0 : 1,
            }}
          >
            L
          </div>
          {/* PanelLeftOpen overlay on hover when collapsed */}
          {collapsed && hoveredLogo && (
            <button
              onClick={onToggle}
              className="border-none bg-transparent cursor-pointer flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: hoverBg,
                color: 'var(--color-charcoal)',
                transition: 'all 0.12s',
                position: 'absolute',
                inset: 0,
              }}
              title="展开侧栏"
            >
              <PanelLeftOpen size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Toggle button — only visible when expanded, ChatGPT ☰ style */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="border-none bg-transparent cursor-pointer flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              color: 'var(--color-muted-text)',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverBg
              e.currentTarget.style.color = 'var(--color-charcoal)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted-text)'
            }}
            title="收起侧栏"
          >
            <PanelLeftClose size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* New chat — pill button (light style like ChatGPT) */}
      <div style={{ padding: collapsed ? '4px 8px' : '4px 12px' }}>
        <button
          onClick={onNewChat}
          className="flex items-center border-none cursor-pointer transition-colors w-full"
          style={{
            gap: collapsed ? 0 : '8px',
            padding: collapsed ? '8px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : undefined,
            borderRadius: '9999px',
            background: '#fff',
            border: '1px solid var(--color-border)',
            color: 'var(--color-charcoal)',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 0.5px 1px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f8f8'
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >
          <Plus size={16} strokeWidth={2} />
          {!collapsed && <span>新对话</span>}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '6px 12px 2px' }}>
          <div
            className="flex items-center"
            style={{
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid transparent',
              background: 'rgba(0,0,0,0.03)',
              fontSize: '14px',
              color: 'var(--color-muted-text)',
              cursor: 'text',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.03)'
            }}
          >
            <Search size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>搜索对话</span>
          </div>
        </div>
      )}

      {/* Recents section */}
      {!collapsed && sessions.length > 0 && (
        <div className="flex flex-col" style={{ marginTop: '4px' }}>
          <div
            style={{
              padding: '6px 12px 4px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-muted-text)',
              letterSpacing: '0.3px',
              textTransform: 'uppercase' as const,
            }}
          >
            最近
          </div>
          <div className="flex flex-col" style={{ padding: '2px 12px', gap: '4px' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                onMouseEnter={() => setHoveredSession(s.id)}
                onMouseLeave={() => setHoveredSession(null)}
                className="flex items-center cursor-pointer transition-colors"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: s.id === activeSessionId ? activeBg : 'transparent',
                  fontSize: '13px',
                  fontWeight: s.id === activeSessionId ? 500 : 400,
                  color: s.id === activeSessionId ? 'var(--color-charcoal)' : 'var(--color-charcoal-83)',
                }}
                onMouseOver={(e) => {
                  if (s.id !== activeSessionId) e.currentTarget.style.background = hoverBg
                }}
                onMouseOut={(e) => {
                  if (s.id !== activeSessionId) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{s.title}</span>
                {/* Ellipsis menu on hover */}
                {hoveredSession === s.id && (
                  <div className="relative shrink-0" ref={openMenuId === s.id ? menuRef : undefined}>
                    <button
                      className="border-none bg-transparent cursor-pointer p-0 flex items-center justify-center"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        color: 'var(--color-muted-text)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === s.id ? null : s.id)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = hoverBg
                        e.currentTarget.style.color = 'var(--color-charcoal)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--color-muted-text)'
                      }}
                    >
                      <Ellipsis size={14} />
                    </button>
                    {/* Popover */}
                    {openMenuId === s.id && (
                      <div
                        className="absolute right-0 top-full z-50"
                        style={{
                          marginTop: '2px',
                          background: '#fff',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          padding: '4px',
                          minWidth: '100px',
                        }}
                      >
                        <button
                          className="flex items-center gap-2 w-full border-none bg-transparent cursor-pointer text-left"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: 'var(--color-destructive)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = hoverBg
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(null)
                            setConfirmDeleteId(s.id)
                          }}
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex-1 overflow-y-auto" style={{ padding: '4px 8px' }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                padding: '8px 0',
                borderRadius: '8px',
                background: s.id === activeSessionId ? activeBg : 'transparent',
                fontSize: '13px',
                color: s.id === activeSessionId ? 'var(--color-charcoal)' : 'var(--color-charcoal-83)',
                fontWeight: s.id === activeSessionId ? 500 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => {
                if (s.id !== activeSessionId) e.currentTarget.style.background = 'transparent'
              }}
              title={s.title}
            >
              <span style={{ opacity: 0.6 }}>{s.title.charAt(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spacer pushes bottom menu to footer */}
      <div className="flex-1 min-h-0" />

      {/* Footer: design system + settings group */}
      <div className="border-t border-border" style={{ padding: collapsed ? '4px 8px' : '6px 12px' }}>
        <MenuItem
          id="design-system"
          icon={<Palette size={16} strokeWidth={1.4} />}
          label="设计系统"
          onClick={onOpenDesignSystem}
          active={hoveredMenu === 'design-system'}
        />
        <MenuItem
          id="settings"
          icon={<Settings size={16} strokeWidth={1.4} />}
          label="设置"
          onClick={onOpenSettings}
          active={hoveredMenu === 'settings'}
        />
      </div>
    </aside>

    {/* Confirm delete dialog — outside aside to avoid overflow:hidden clipping */}
    {confirmDeleteId && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={() => setConfirmDeleteId(null)}
      >
        <div
          className="flex flex-col"
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '24px',
            minWidth: '320px',
            maxWidth: '400px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '8px' }}>
            删除对话
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-charcoal-83)', marginBottom: '20px' }}>
            确定要删除这个对话吗？此操作无法撤销。
          </div>
          <div className="flex justify-end" style={{ gap: '8px' }}>
            <button
              className="border-none cursor-pointer"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'transparent',
                color: 'var(--color-charcoal-83)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              onClick={() => setConfirmDeleteId(null)}
            >
              取消
            </button>
            <button
              className="border-none cursor-pointer"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'var(--color-destructive)',
                color: '#fff',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              onClick={() => {
                onDeleteSession(confirmDeleteId)
                setConfirmDeleteId(null)
              }}
            >
              删除
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
