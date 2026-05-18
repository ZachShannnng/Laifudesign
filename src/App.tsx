import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import PreviewPanel from './components/PreviewPanel'
import SettingsPanel from './components/SettingsPanel'
import NewProjectPanel from './components/NewProjectPanel'
import FileWorkspace from './components/FileWorkspace'
import type { DesignMessage } from '@/types/message'
import { useModelConfig } from '@/store/modelConfigStore'
import { createModelClient } from '@/engine/ModelClient'
import type { QuestionForm, QuestionFormAnswers } from './artifacts/question-form'
import { parseQuestionForm } from './artifacts/artifact-parser'

type OverlayPanel = 'none' | 'settings' | 'design' | 'new-project'

/** 项目接口 */
interface Project {
  id: string
  name: string
  skillId?: string
  designSystemId?: string
  metadata?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

/** 对话接口 */
interface Conversation {
  id: string
  projectId: string
  title?: string
  createdAt: number
  updatedAt: number
}

/** 消息接口（API 返回） */
interface ApiMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolName?: string
  toolInput?: string
  toolResult?: string
  createdAt: number
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [overlay, setOverlay] = useState<OverlayPanel>('none')

  // 项目和对话状态
  const [projects, setProjects] = useState<Project[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [htmlContent, setHtmlContent] = useState<string>('')

  // UI 状态
  const [isStreaming, setIsStreaming] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showFileWorkspace, setShowFileWorkspace] = useState(false)
  const [questionForm, setQuestionForm] = useState<QuestionForm | null>(null)

  // 设计系统预览状态
  const [designSystemPreview, setDesignSystemPreview] = useState<string>('')
  const [designSystemContent, setDesignSystemContent] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  // 模型配置
  const { config: modelConfig, updateConfig } = useModelConfig()
  const abortControllerRef = useRef<AbortController | null>(null)

  // API 基础 URL
  const API_URL = 'http://127.0.0.1:7456'

  // 加载项目列表
  useEffect(() => {
    fetchProjects()
  }, [])

  // 加载对话列表
  useEffect(() => {
    if (activeProjectId) {
      setActiveConversationId(null)
      setMessages([])
      setHtmlContent('')
      setQuestionForm(null)
      fetchConversations(activeProjectId)
    } else {
      setConversations([])
      setActiveConversationId(null)
    }
  }, [activeProjectId])

  // 加载消息
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`)
      const data = await res.json()
      if (data.ok) {
        setProjects(data.projects)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const fetchConversations = async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/conversations`)
      const data = await res.json()
      if (data.ok) {
        const nextConversations = data.conversations
        setConversations(nextConversations)
        setActiveConversationId((current) => {
          if (current && nextConversations.some((c: Conversation) => c.id === current)) {
            return current
          }
          return nextConversations[0]?.id ?? null
        })
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`)
      const data = await res.json()
      if (data.ok) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  // 加载设计系统预览
  useEffect(() => {
    if (overlay === 'design') {
      loadDesignSystemPreview('artistic')
    }
  }, [overlay])

  const loadDesignSystemPreview = async (designSystemId: string) => {
    setLoadingPreview(true)
    try {
      // 并行加载预览和内容
      const [previewRes, contentRes] = await Promise.all([
        fetch(`${API_URL}/api/design-systems/${designSystemId}/preview`),
        fetch(`${API_URL}/api/design-systems/${designSystemId}/content`),
      ])

      if (previewRes.ok) {
        const previewHtml = await previewRes.text()
        setDesignSystemPreview(previewHtml)
      }

      if (contentRes.ok) {
        const data = await contentRes.json()
        if (data.ok) {
          setDesignSystemContent(data.content)
        }
      }
    } catch (err) {
      console.error('Failed to load design system preview:', err)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => !v)
  }, [])

  const handleNewProject = useCallback(() => {
    setShowNewProject(true)
    setOverlay('none')
  }, [])

  const handleCreateProject = async (data: {
    name: string
    skillId: string
    designSystemId: string
    platform: string
  }) => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          skillId: data.skillId,
          designSystemId: data.designSystemId,
          metadata: { platform: data.platform },
        }),
      })
      const result = await res.json()
      if (result.ok) {
        setActiveProjectId(result.project.id)
        setActiveConversationId(null)
        setMessages([])
        setHtmlContent('')
        setQuestionForm(null)
        setShowNewProject(false)
        fetchProjects()
        // 自动创建第一个对话
        handleNewConversation(result.project.id)
      } else {
        alert('创建项目失败: ' + result.error)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      alert('创建项目失败')
    }
  }

  const handleNewConversation = async (projectId?: string) => {
    const pid = projectId || activeProjectId
    if (!pid) return

    try {
      const res = await fetch(`${API_URL}/api/projects/${pid}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.ok) {
        setActiveConversationId(data.conversation.id)
        fetchConversations(pid)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleSelectProject = useCallback((id: string) => {
    if (id === activeProjectId) return
    setActiveProjectId(id)
    setOverlay('none')
  }, [activeProjectId])

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!confirm('确定要删除这个项目吗？项目内的会话和文件也会被删除。')) return

    try {
      const res = await fetch(`${API_URL}/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (activeProjectId === id) {
        setActiveProjectId(null)
        setActiveConversationId(null)
        setConversations([])
        setMessages([])
        setHtmlContent('')
        setQuestionForm(null)
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('删除项目失败')
    }
  }, [activeProjectId])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
    setOverlay('none')
  }, [])

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!confirm('确定要删除这个对话吗？')) return

    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (activeConversationId === id) {
          setActiveConversationId(null)
        }
        if (activeProjectId) {
          fetchConversations(activeProjectId)
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }, [activeConversationId, activeProjectId])

  const handleSend = useCallback(
    async (text: string, formAnswers?: QuestionFormAnswers) => {
      if (!text.trim() && !formAnswers) return
      if (!activeProjectId) {
        setShowNewProject(true)
        return
      }
      if (!activeConversationId) {
        // 如果没有对话，创建一个
        await handleNewConversation()
        return
      }

      // 检查模型配置
      if (!modelConfig.apiUrl || !modelConfig.apiKey || !modelConfig.model) {
        alert('请先在设置中配置 API')
        return
      }

      setIsStreaming(true)
      abortControllerRef.current = new AbortController()

      // 格式化消息内容
      let content = text
      if (formAnswers) {
        const answersText = Object.entries(formAnswers)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n')
        content = text + '\n\n' + answersText
      }

      // 添加用户消息到 UI
      const userMsg: ApiMessage = {
        id: crypto.randomUUID(),
        conversationId: activeConversationId,
        role: 'user',
        content,
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        // 发送 SSE 请求
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConversationId,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })).concat([{ role: 'user', content }]),
            model: {
              apiUrl: modelConfig.apiUrl,
              apiKey: modelConfig.apiKey,
              model: modelConfig.model,
            },
            projectId: activeProjectId,
            saveToDb: true,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // 读取 SSE 流
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let assistantContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const data = line.slice(6)
            if (data === '[DONE]') break

            let parsed: any
            try {
              parsed = JSON.parse(data)
            } catch {
              continue
            }

            if (parsed.type === 'text') {
              assistantContent += parsed.content
              setMessages((prev) => {
                const msgs = [...prev]
                const last = msgs[msgs.length - 1]
                if (last?.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...last, content: assistantContent }
                } else {
                  msgs.push({
                    id: crypto.randomUUID(),
                    conversationId: activeConversationId!,
                    role: 'assistant',
                    content: assistantContent,
                    createdAt: Date.now(),
                  })
                }
                return msgs
              })
            } else if (parsed.type === 'done') {
              break
            } else if (parsed.type === 'artifact' && parsed.artifact?.html) {
              setHtmlContent(parsed.artifact.html)
            } else if (parsed.type === 'question_form' && parsed.raw) {
              const form = parseQuestionForm(parsed.raw)
              if (form) {
                setQuestionForm(form)
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error)
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Chat error:', err)
          alert('发送失败: ' + (err as Error).message)
        }
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
        // 重新加载消息
        if (activeConversationId) {
          fetchMessages(activeConversationId)
        }
      }
    },
    [activeConversationId, messages, modelConfig, activeProjectId]
  )

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const showMainContent = overlay === 'none'

  // 转换消息格式给 ChatPanel
  const designMessages: DesignMessage[] = messages.map((m): DesignMessage => {
    const role = m.role === 'system' ? 'assistant' : m.role as 'user' | 'assistant'
    if (role === 'user') {
      return {
        role: 'user',
        content: m.content,
        timestamp: new Date(m.createdAt),
      }
    } else {
      return {
        role: 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
      }
    }
  })

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const projectMeta = activeProject
    ? [
        activeProject.skillId,
        activeProject.designSystemId,
        typeof activeProject.metadata?.platform === 'string' ? activeProject.metadata.platform : null,
      ].filter(Boolean).join(' · ')
    : ''
  const hasActiveWorkspace = Boolean(activeProjectId && activeConversationId)

  return (
    <div className="flex h-screen min-w-[1024px]">
      <Sidebar
        collapsed={sidebarCollapsed}
        overlay={overlay}
        onToggle={handleToggleSidebar}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name || '未命名项目',
          meta: [
            p.skillId,
            p.designSystemId,
            typeof p.metadata?.platform === 'string' ? p.metadata.platform : null,
          ].filter(Boolean).join(' · '),
        }))}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onOpenSettings={() => setOverlay(overlay === 'settings' ? 'none' : 'settings')}
        onOpenDesignSystem={() => setOverlay(overlay === 'design' ? 'none' : 'design')}
        onDeleteProject={handleDeleteProject}
        onOpenFileWorkspace={() => setShowFileWorkspace(true)}
      />

      {showMainContent ? (
        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={designMessages}
            isStreaming={isStreaming}
            onSend={handleSend}
            onAbort={handleAbort}
            sessionTitle={activeProject ? activeProject.name : ''}
            projectMeta={projectMeta}
            conversations={conversations.map((c) => ({
              id: c.id,
              title: c.title || '初始会话',
            }))}
            activeConversationId={activeConversationId}
            onNewConversation={() => handleNewConversation()}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            modelLabel={modelConfig.model}
            disabled={!hasActiveWorkspace}
            emptyState={activeProject ? 'conversation' : 'project'}
            onCreateProject={handleNewProject}
            questionForm={questionForm}
            onQuestionFormSubmit={(answers: QuestionFormAnswers) => {
              setQuestionForm(null)
              handleSend('', answers)
            }}
          />
          <PreviewPanel
            htmlContent={htmlContent}
            isLoading={isStreaming}
            onExport={() => {
              const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'index.html'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          />
        </div>
      ) : overlay === 'settings' ? (
        <SettingsPanel
          config={modelConfig}
          onUpdate={updateConfig}
          onTestConnection={(config) => createModelClient(config).testConnection()}
          onListModels={(config) => createModelClient(config).listModels()}
          onClose={() => setOverlay('none')}
        />
      ) : overlay === 'design' ? (
        <div className="flex-1 flex bg-cream overflow-hidden">
          {/* 左侧：Token 预览 */}
          <div className="flex-1 border-r border-border overflow-auto bg-white">
            {loadingPreview ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                加载中...
              </div>
            ) : designSystemPreview ? (
              <iframe
                srcDoc={designSystemPreview}
                className="w-full h-full border-0"
                title="设计系统预览"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                无法加载预览
              </div>
            )}
          </div>

          {/* 右侧：DESIGN.md */}
          <div className="flex-1 overflow-auto bg-cream">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Artistic 设计系统</h2>
                <button
                  onClick={() => setOverlay('none')}
                  aria-label="关闭"
                  className="w-7 h-7 border-none rounded bg-transparent text-muted-foreground cursor-pointer flex items-center justify-center hover:bg-muted"
                >
                  ✕
                </button>
              </div>
              <div className="prose max-w-none bg-white rounded-lg border border-border p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {designSystemContent || '加载中...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* New Project Modal */}
      <NewProjectPanel
        open={showNewProject}
        onCancel={() => setShowNewProject(false)}
        onCreateProject={handleCreateProject}
      />

      {/* File Workspace Modal */}
      {activeProjectId && (
        <FileWorkspace
          projectId={activeProjectId}
          open={showFileWorkspace}
          onClose={() => setShowFileWorkspace(false)}
        />
      )}
    </div>
  )
}

export default App
