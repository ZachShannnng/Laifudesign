import { useState, useRef, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, Plus, Search, Palette, Settings, Ellipsis, Trash2 } from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  overlay: 'none' | 'settings' | 'design' | 'new-project'
  onToggle: () => void
  projects: Array<{ id: string; name: string; meta?: string }>
  activeProjectId: string | null
  onSelectProject: (id: string) => void
  onNewProject: () => void
  onOpenSettings: () => void
  onOpenDesignSystem: () => void
  onDeleteProject?: (id: string) => void
  onOpenFileWorkspace?: () => void
}

export default function Sidebar({
  collapsed,
  overlay,
  onToggle,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onOpenSettings,
  onOpenDesignSystem,
  onDeleteProject,
  onOpenFileWorkspace: _onOpenFileWorkspace, // Reserved for future use
}: SidebarProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
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
    icon,
    label,
    onClick,
    active = false,
  }: {
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
        if (!active) e.currentTarget.style.background = hoverBg
      }}
      onMouseLeave={(e) => {
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

      {/* New project */}
      <div style={{ padding: collapsed ? '4px 8px' : '4px 12px' }}>
        <button
          onClick={onNewProject}
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
          {!collapsed && <span>新建项目</span>}
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
            <span style={{ flex: 1 }}>搜索项目</span>
          </div>
        </div>
      )}

      {/* Recents section */}
      {!collapsed && projects.length > 0 && (
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
            项目
          </div>
          <div className="flex flex-col" style={{ padding: '2px 12px', gap: '4px' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className="flex items-center cursor-pointer transition-colors"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: project.id === activeProjectId ? activeBg : 'transparent',
                  fontSize: '13px',
                  fontWeight: project.id === activeProjectId ? 500 : 400,
                  color: project.id === activeProjectId ? 'var(--color-charcoal)' : 'var(--color-charcoal-83)',
                }}
                onMouseOver={(e) => {
                  if (project.id !== activeProjectId) e.currentTarget.style.background = hoverBg
                }}
                onMouseOut={(e) => {
                  if (project.id !== activeProjectId) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span className="flex-1 min-w-0">
                  <span className="block whitespace-nowrap overflow-hidden text-ellipsis">{project.name}</span>
                  {project.meta && (
                    <span className="block whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: '11px', color: 'var(--color-muted-text)', marginTop: '1px' }}>
                      {project.meta}
                    </span>
                  )}
                </span>
                {/* Ellipsis menu on hover */}
                {hoveredProject === project.id && onDeleteProject && (
                  <div className="relative shrink-0" ref={openMenuId === project.id ? menuRef : undefined}>
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
                        setOpenMenuId(openMenuId === project.id ? null : project.id)
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
                    {openMenuId === project.id && (
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
                            setConfirmDeleteId(project.id)
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
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                padding: '8px 0',
                borderRadius: '8px',
                background: project.id === activeProjectId ? activeBg : 'transparent',
                fontSize: '13px',
                color: project.id === activeProjectId ? 'var(--color-charcoal)' : 'var(--color-charcoal-83)',
                fontWeight: project.id === activeProjectId ? 500 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={(e) => {
                if (project.id !== activeProjectId) e.currentTarget.style.background = 'transparent'
              }}
              title={project.name}
            >
              <span style={{ opacity: 0.6 }}>{project.name.charAt(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Spacer pushes bottom menu to footer */}
      <div className="flex-1 min-h-0" />

      {/* Footer: design system + settings group */}
      <div className="border-t border-border" style={{ padding: collapsed ? '4px 8px' : '6px 12px' }}>
        <MenuItem
          icon={<Palette size={16} strokeWidth={1.4} />}
          label="设计系统"
          onClick={onOpenDesignSystem}
          active={overlay === 'design'}
        />
        <MenuItem
          icon={<Settings size={16} strokeWidth={1.4} />}
          label="设置"
          onClick={onOpenSettings}
          active={overlay === 'settings'}
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
            删除项目
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-charcoal-83)', marginBottom: '20px' }}>
            确定要删除这个项目吗？项目内的会话和文件也会被删除。
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
                onDeleteProject?.(confirmDeleteId)
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
