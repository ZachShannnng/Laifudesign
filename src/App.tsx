import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import PreviewPanel from './components/PreviewPanel'
import type { DesignMessage } from '@/types/message'

type OverlayPanel = 'none' | 'settings' | 'design'

interface Session {
  id: string
  title: string
  messages: DesignMessage[]
  htmlContent: string
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [overlay, setOverlay] = useState<OverlayPanel>('none')
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      title: '登录页设计',
      messages: [
        { role: 'user', content: '做一个登录页面，包含邮箱输入和密码字段', timestamp: new Date() },
        { role: 'assistant', type: 'tool_use', toolName: 'GenerateUITool', toolInput: { component: 'login', description: '生成登录页面' }, timestamp: new Date() },
        { role: 'tool', toolName: 'GenerateUITool', result: { output: 'login.html generated', metadata: { isError: false } }, isError: false, timestamp: new Date() },
        { role: 'assistant', content: '已生成登录页面，包含邮箱输入框、密码字段和登录按钮，采用 Lovable 暖色风格。', timestamp: new Date() },
        { role: 'user', content: '把登录按钮改成圆角胶囊样式，颜色用深色', timestamp: new Date() },
        { role: 'assistant', type: 'tool_use', toolName: 'GenerateUITool', toolInput: { component: 'login', modification: 'button-style', description: '修改按钮样式' }, timestamp: new Date() },
        { role: 'tool', toolName: 'GenerateUITool', result: { output: 'button modified', metadata: { isError: false } }, isError: false, timestamp: new Date() },
        { role: 'assistant', content: '已将登录按钮修改为胶囊圆角样式，背景色改为 #1c1c1c。', timestamp: new Date() },
      ],
      htmlContent: '',
    },
    { id: '2', title: '仪表盘页面', messages: [], htmlContent: '' },
    { id: '3', title: '落地页 v2', messages: [], htmlContent: '' },
    { id: '4', title: '注册表单', messages: [], htmlContent: '' },
    { id: '5', title: '数据卡片组件', messages: [], htmlContent: '' },
  ])
  const [activeSessionId, setActiveSessionId] = useState<string>('1')
  const [isStreaming, setIsStreaming] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const modelLabel = 'Sonnet 4'

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => !v)
  }, [])

  const handleNewChat = useCallback(() => {
    const id = crypto.randomUUID()
    const newSession: Session = { id, title: '新对话', messages: [], htmlContent: '' }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(id)
    setOverlay('none')
  }, [])

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id)
    setOverlay('none')
  }, [])

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((prev) => (prev === id ? null : prev))
  }, [])

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return

      const userMessage: DesignMessage = {
        role: 'user',
        content: text,
        timestamp: new Date(),
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                title: s.messages.length === 0 ? text.slice(0, 20) : s.title,
                messages: [...s.messages, userMessage],
              }
            : s
        )
      )
      setIsStreaming(true)

      // TODO: 接入 DesignEngine 流式调用
      // 当前为模拟：2 秒后返回占位响应
      setTimeout(() => {
        const assistantMessage: DesignMessage = {
          role: 'assistant',
          content: `收到你的需求："${text}"。DesignEngine 尚未接入，完成 TODO 3 后可实现真正的流式生成。`,
          timestamp: new Date(),
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, assistantMessage] }
              : s
          )
        )
        setIsStreaming(false)
      }, 1500)
    },
    [activeSessionId, isStreaming]
  )

  const handleAbort = useCallback(() => {
    setIsStreaming(false)
  }, [])

  const showMainContent = overlay === 'none'

  return (
    <div className="flex h-screen min-w-[1024px]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        sessions={sessions.map((s) => ({ id: s.id, title: s.title }))}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onOpenSettings={() => setOverlay(overlay === 'settings' ? 'none' : 'settings')}
        onOpenDesignSystem={() => setOverlay(overlay === 'design' ? 'none' : 'design')}
        onDeleteSession={handleDeleteSession}
      />

      {showMainContent ? (
        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={activeSession?.messages ?? []}
            isStreaming={isStreaming}
            onSend={handleSend}
            onAbort={handleAbort}
            sessionTitle={activeSession?.title ?? ''}
            modelLabel={modelLabel}
          />
          <PreviewPanel
            htmlContent={activeSession?.htmlContent ?? ''}
            isLoading={isStreaming}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-cream overflow-y-auto">
          {/* Overlay header */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {overlay === 'settings' ? '设置' : '设计系统'}
            </h2>
            <button
              onClick={() => setOverlay('none')}
              className="w-7 h-7 border-none rounded-[4px] bg-transparent text-muted-text cursor-pointer flex items-center justify-center hover:bg-charcoal-04 hover:text-charcoal"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </button>
          </div>

          {/* Overlay content */}
          <div className="p-5 max-w-[440px] flex flex-col gap-4">
            {overlay === 'settings' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-charcoal-83 uppercase tracking-wide">API 地址</label>
                  <input
                    type="url"
                    placeholder="https://api.anthropic.com"
                    className="px-2.5 py-2 border border-border rounded-[8px] bg-off-white text-[13px] text-charcoal outline-none transition-colors focus:border-charcoal-12 placeholder:text-muted-text"
                  />
                  <span className="text-[11px] text-muted-text">兼容 OpenAI 格式的 API 端点</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-charcoal-83 uppercase tracking-wide">API Key</label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    className="px-2.5 py-2 border border-border rounded-[8px] bg-off-white text-[13px] text-charcoal outline-none transition-colors focus:border-charcoal-12 placeholder:text-muted-text"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-charcoal-83 uppercase tracking-wide">模型</label>
                  <select className="px-2.5 py-2 border border-border rounded-[8px] bg-off-white text-[13px] text-charcoal outline-none transition-colors focus:border-charcoal-12">
                    <option>Claude Sonnet 4</option>
                    <option>GPT-4o</option>
                    <option>智谱 GLM-4</option>
                    <option>自定义</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-1">
                  <button className="px-5 py-2 bg-charcoal text-off-white border-none rounded-full text-[13px] font-semibold cursor-pointer shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0] hover:opacity-88">
                    保存配置
                  </button>
                  <button className="px-5 py-2 bg-transparent text-charcoal border border-border rounded-full text-[13px] font-medium cursor-pointer hover:bg-charcoal-04 hover:border-charcoal-12">
                    测试连接
                  </button>
                </div>
              </>
            )}

            {overlay === 'design' && (
              <div className="text-muted-text text-[13px]">
                设计系统配置面板（TODO 5 实现）
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
