export default function PreviewPanel() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-cream">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between min-h-[44px]">
        <h2 className="text-[13px] font-semibold">Preview</h2>
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-text text-sm">
        Preview area
      </div>
    </div>
  )
}
