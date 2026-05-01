export default function Sidebar() {
  return (
    <aside className="flex flex-col bg-off-white border-r border-border transition-all duration-[250ms] overflow-hidden"
      style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}>
      <div className="flex items-center justify-between px-3 min-h-[52px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[8px] bg-charcoal text-off-white flex items-center justify-center text-[13px] font-bold tracking-tight">
            L
          </div>
          <span className="text-sm font-semibold text-charcoal">Laifu</span>
        </div>
      </div>
    </aside>
  )
}
