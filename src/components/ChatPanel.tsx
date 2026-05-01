export default function ChatPanel() {
  return (
    <div className="flex flex-col border-r border-border bg-cream"
      style={{ width: 'var(--chat-width)', minWidth: 'var(--chat-width)' }}>
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between min-h-[44px]">
        <h2 className="text-[13px] font-semibold">Chat</h2>
      </div>
    </div>
  )
}
