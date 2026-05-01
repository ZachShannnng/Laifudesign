# Laifu Design 架构设计
## 基于 Claude Code 智能体框架

生成于: 2026-04-29
基于: Claude Code 泄漏源码分析

---

## 一、核心概念

### 1.1 智能体 vs API 调用器

| 概念 | API 调用器 | 智能体 |
|------|-----------|--------|
| 定位 | 工具 | 有目标的行为者 |
| 输入 | prompt | goal + context |
| 输出 | 文本 | action(s) |
| 能力 | 基于模型的生成 | 基于工具的执行 |
| 状态 | 无状态 | 会话状态管理 |

**Laifu Design 是一个智能体**，不是 API 调用包装器。

### 1.2 为什么选择智能体架构

1. **模型无关**: 智能体的核心是工具定义，不依赖特定模型
2. **可扩展**: 新功能通过添加工具实现，不需要修改核心
3. **可测试**: 工具可以独立测试
4. **可控性**: 工具调用的输入输出都是结构化的

---

## 二、Claude Code 架构分析

### 2.1 核心组件

```
Claude Code
├── QueryEngine          # 查询引擎 - 管理会话状态
├── Tool 系统             # 工具系统 - 可扩展能力
├── ModelClient          # 模型客户端 - 可配置 API
├── Message 系统         # 消息系统 - 对话历史
└── Permission 系统      # 权限系统 - 安全控制
```

### 2.2 QueryEngine（简化版）

```typescript
// Claude Code: src/QueryEngine.ts
class QueryEngine {
  private config: QueryEngineConfig
  private mutableMessages: Message[]  // 对话历史
  private abortController: AbortController

  async *submitMessage(prompt: string): AsyncGenerator<SDKMessage> {
    // 1. 构建系统提示词
    const systemPrompt = await fetchSystemPromptParts()

    // 2. 调用模型
    for await (const chunk of model.stream(messages)) {
      // 3. 解析工具调用
      if (chunk.type === 'tool_use') {
        // 4. 执行工具
        const result = await executeTool(chunk.tool, chunk.input)
        // 5. 将结果加入消息历史
        messages.push({ role: 'tool_result', content: result })
      }
      // 6. 继续流式输出
      yield chunk
    }
  }
}
```

### 2.3 Tool 系统接口

```typescript
// Claude Code: src/Tool.ts
interface ToolDef<Input = unknown, Output = unknown> {
  name: string
  inputSchema: z.ZodType<Input>
  outputSchema?: z.ZodType<Output>

  // 工具执行
  execute(input: Input, context: ToolUseContext): Promise<Output>

  // 权限检查
  checkPermissions?(input: Input, context: ToolUseContext): Promise<PermissionResult>

  // 输入验证
  validateInput?(input: Input, context: ToolUseContext): Promise<ValidationResult>
}
```

### 2.4 ModelClient（可配置）

```typescript
// Claude Code: src/services/api/client.ts
async function getAnthropicClient({
  apiKey,
  model,
  fetchOverride,
}: {
  apiKey?: string
  model?: string
  fetchOverride?: ClientOptions['fetch']
}): Promise<Anthropic> {
  // 支持多个提供商
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    return new AnthropicBedrock({ ... })
  }
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    return new AnthropicVertex({ ... })
  }
  // 默认：Anthropic API
  return new Anthropic({ apiKey })
}
```

---

## 三、Laifu Design 架构设计

### 3.1 组件映射

| Claude Code | Laifu Design | 说明 |
|-------------|-------------|------|
| QueryEngine | DesignEngine | 会话管理引擎 |
| Tool | DesignTool | 设计工具 |
| ModelClient | ModelClient | 复用（可配置） |
| Message | DesignMessage | 设计消息 |
| ToolUseContext | DesignContext | 设计上下文 |

### 3.2 核心架构图

```
┌─────────────────────────────────────────────────────────────┐
│  Laifu Design - UI Design Agent Framework                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DesignEngine（设计引擎）                           │   │
│  │                                                      │   │
│  │  状态:                                               │   │
│  │  - messages: DesignMessage[]                        │   │
│  │  - designSystem: DesignSystemConfig                 │   │
│  │  - sessionState: SessionState                      │   │
│  │                                                      │   │
│  │  方法:                                               │   │
│  │  - async *submit(prompt): AsyncGenerator<Message>  │   │
│  │  - async executeTool(tool, input): Promise<Result> │   │
│  │  - buildContext(): DesignContext                   │   │
│  │                                                      │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  DesignTools（设计工具）                            │   │
│  │                                                      │   │
│  │  interface DesignTool<TInput, TOutput> {            │   │
│  │    name: string                                     │   │
│  │    inputSchema: z.ZodType<TInput>                   │   │
│  │    execute(input: TInput, ctx: DesignContext)       │   │
│  │  }                                                  │   │
│  │                                                      │   │
│  │  核心:                                              │   │
│  │  ├── GenerateUITool     - UI 生成                   │   │
│  │  ├── ApplyThemeTool     - 应用设计系统               │   │
│  │  ├── ExportHTMLTool     - 导出 HTML                 │   │
│  │  └── PreviewRenderTool  - 实时预览渲染               │   │
│  │                                                      │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  ModelClient（模型客户端）                          │   │
│  │                                                      │   │
│  │  配置:                                               │   │
│  │  interface ModelConfig {                            │   │
│  │    apiUrl: string        // https://api...         │   │
│  │    apiKey: string         // sk-xxxxx              │   │
│  │    model: string          // claude-sonnet-4       │   │
│  │    provider: ProviderType // 'anthropic' | 'custom'│   │
│  │  }                                                  │   │
│  │                                                      │   │
│  │  方法:                                               │   │
│  │  - async *stream(messages): AsyncIterable<Chunk>   │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 核心代码结构

```
src/
├── engine/
│   ├── DesignEngine.ts       # 会话管理引擎
│   ├── ModelClient.ts        # 可配置模型客户端
│   └── ToolRegistry.ts       # 工具注册表
├── types/
│   ├── message.ts            # 设计消息类型
│   ├── tool.ts               # 设计工具类型
│   ├── context.ts            # 设计上下文类型
│   └── design-system.ts      # 设计系统类型定义 (Lovable)
├── tools/
│   ├── GenerateUITool.ts     # UI 生成工具
│   ├── ApplyThemeTool.ts     # 主题应用工具
│   ├── ExportHTMLTool.ts     # HTML 导出工具
│   └── index.ts              # 工具导出
├── ui/
│   ├── ChatPanel.tsx         # 聊天面板
│   ├── PreviewPanel.tsx      # 预览面板
│   ├── SettingsPanel.tsx     # 设置面板（模型配置）
│   ├── DesignSystemPanel.tsx # 设计系统配置面板
│   └── components/
│       ├── Button.tsx        # 按钮组件 (Lovable 风格)
│       ├── Card.tsx          # 卡片组件
│       ├── Input.tsx         # 输入框组件
│       └── ...
├── lib/
│   ├── design-system.ts      # 设计系统默认配置
│   └── utils.ts              # 通用工具函数
└── store/
    ├── designStore.ts        # 设计状态管理
    ├── modelConfigStore.ts   # 模型配置管理
    └── designSystemStore.ts  # 设计系统配置管理
```

---

## 四、核心类型定义

### 4.1 DesignMessage

```typescript
// src/types/message.ts
export type DesignMessage =
  | UserDesignMessage
  | AssistantDesignMessage
  | ToolUseDesignMessage
  | ToolResultDesignMessage

export interface UserDesignMessage {
  role: 'user'
  content: string
  timestamp: Date
}

export interface AssistantDesignMessage {
  role: 'assistant'
  content: string
  timestamp: Date
}

export interface ToolUseDesignMessage {
  role: 'assistant'
  type: 'tool_use'
  toolName: string
  toolInput: Record<string, unknown>
  timestamp: Date
}

export interface ToolResultDesignMessage {
  role: 'tool'
  toolName: string
  result: ToolResult
  isError: boolean
  timestamp: Date
}
```

### 4.2 DesignTool

```typescript
// src/types/tool.ts
import { z } from 'zod'

export interface DesignTool<TInput = unknown, TOutput = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  outputSchema?: z.ZodType<TOutput>

  // 工具执行
  execute(input: TInput, context: DesignContext): Promise<TOutput>

  // 用户友好的名称
  userFacingName?(input: Partial<TInput>): string

  // 是否需要用户确认
  requiresConfirmation?(input: TInput): boolean
}

export interface DesignContext {
  messages: DesignMessage[]
  designSystem: DesignSystemConfig
  modelConfig: ModelConfig
  abortSignal: AbortSignal
  onUpdate: (message: DesignMessage) => void
}
```

### 4.3 DesignSystemConfig

```typescript
// src/types/design-system.ts
// 基于 Lovable 设计系统 (lovable-integration.md)

export interface LaifuDesignSystem {
  colors: {
    background: '#f7f4ed'                    // 页面背景、卡片表面
    foreground: '#1c1c1c'                    // 主文本、标题
    border: '#eceae4'                        // 被动边框
    borderInteractive: 'rgba(28,28,28,0.4)'  // 交互边框
    muted: '#5f5f5d'                         // 次要文本
    card: '#f7f4ed'                          // 卡片背景（同页面背景）
    input: '#f7f4ed'                         // 输入框背景
    ring: 'rgba(59,130,246,0.5)'             // 焦点环
  }
  typography: {
    fontFamily: string                       // 默认: 'Camera Plain Variable', 'Inter', system-ui
    fontWeights: {
      body: 400                              // 正文、UI、按钮
      display: 480                           // 特殊展示时刻
      heading: 600                           // 标题、强调
    }
    sizes: Record<string, TypographySize>    // 排版层级定义
  }
  spacing: {
    base: 8                                  // 基础单位 (px)
    section: number[]                        // 区块间距: [80, 96, 128, 176, 192, 208]
  }
  borderRadius: {
    micro: 4                                 // 小按钮、交互元素
    standard: 6                              // 按钮、输入框、导航菜单
    comfortable: 8                           // 紧凑卡片
    card: 12                                 // 标准卡片、图片容器
    container: 16                            // 大容器
    full: 9999                               // 药丸按钮、图标按钮
  }
  shadows: {
    inset: string                            // 内阴影效果
    focus: string                            // 焦点阴影
    ring: string                             // 焦点环
  }
  // 用户可扩展的设计令牌
  tokens?: Record<string, unknown>
}

export interface TypographySize {
  size: string           // Tailwind 大小，如 '3.75rem'
  weight: number         // 字重：400 | 480 | 600
  lineHeight: number     // 行高
  letterSpacing: string  // 字间距，如 '-0.15em' | '0'
}

// 默认 Lovable 设计系统配置
export const DEFAULT_DESIGN_SYSTEM: LaifuDesignSystem = {
  colors: {
    background: '#f7f4ed',
    foreground: '#1c1c1c',
    border: '#eceae4',
    borderInteractive: 'rgba(28,28,28,0.4)',
    muted: '#5f5f5d',
    card: '#f7f4ed',
    input: '#f7f4ed',
    ring: 'rgba(59,130,246,0.5)'
  },
  typography: {
    fontFamily: "'Camera Plain Variable', 'Inter', ui-sans-serif, system-ui, sans-serif",
    fontWeights: {
      body: 400,
      display: 480,
      heading: 600
    },
    sizes: {
      hero: { size: '3.75rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.15em' },
      heading: { size: '3rem', weight: 600, lineHeight: 1.00, letterSpacing: '-0.12em' },
      subheading: { size: '2.25rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.09em' },
      cardTitle: { size: '1.25rem', weight: 400, lineHeight: 1.25, letterSpacing: '0' },
      bodyLarge: { size: '1.13rem', weight: 400, lineHeight: 1.38, letterSpacing: '0' },
      body: { size: '1rem', weight: 400, lineHeight: 1.50, letterSpacing: '0' },
      button: { size: '1rem', weight: 400, lineHeight: 1.50, letterSpacing: '0' },
      caption: { size: '0.88rem', weight: 400, lineHeight: 1.50, letterSpacing: '0' }
    }
  },
  spacing: {
    base: 8,
    section: [80, 96, 128, 176, 192, 208]
  },
  borderRadius: {
    micro: 4,
    standard: 6,
    comfortable: 8,
    card: 12,
    container: 16,
    full: 9999
  },
  shadows: {
    inset: 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
    focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
    ring: '0 0 0 2px rgba(59,130,246,0.5)'
  }
}
```

### 4.4 ModelClient

```typescript
// src/engine/ModelClient.ts
export type ProviderType = 'anthropic' | 'openai' | 'zhipu' | 'custom'

export interface ModelConfig {
  apiUrl: string
  apiKey: string
  model: string
  provider: ProviderType
  maxTokens?: number
  temperature?: number
}

export interface StreamChunk {
  type: 'content' | 'tool_use' | 'done'
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
}

export class ModelClient {
  constructor(private config: ModelConfig) {}

  async *stream(messages: DesignMessage[]): AsyncIterable<StreamChunk> {
    // 根据配置调用不同的 API
    // 统一返回流式数据
  }

  static createFromPreset(preset: 'anthropic' | 'openai' | 'zhipu' | 'custom', apiKey: string, model?: string): ModelClient {
    const presets = {
      anthropic: { apiUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
      openai: { apiUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
      zhipu: { apiUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
      custom: { apiUrl: '', model: '' },
    }

    const preset = presets[preset]
    return new ModelClient({
      ...preset,
      apiKey,
      model: model || preset.model,
      provider: preset,
    })
  }
}
```

---

## 五、DesignEngine 实现

```typescript
// src/engine/DesignEngine.ts
export class DesignEngine {
  private messages: DesignMessage[] = []
  private tools: Map<string, DesignTool> = new Map()

  constructor(
    private modelClient: ModelClient,
    private designSystem: DesignSystemConfig,
  ) {
    this.registerDefaultTools()
  }

  private registerDefaultTools() {
    this.registerTool(new GenerateUITool())
    this.registerTool(new ApplyThemeTool())
    this.registerTool(new ExportHTMLTool())
  }

  registerTool(tool: DesignTool) {
    this.tools.set(tool.name, tool)
  }

  async *submit(prompt: string): AsyncGenerator<DesignMessage> {
    // 1. 添加用户消息
    const userMessage: UserDesignMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }
    this.messages.push(userMessage)
    yield userMessage

    // 2. 构建上下文
    const context: DesignContext = {
      messages: this.messages,
      designSystem: this.designSystem,
      modelConfig: this.modelClient.config,
      abortSignal: new AbortController().signal,
      onUpdate: (msg) => this.messages.push(msg),
    }

    // 3. 调用模型
    let assistantContent = ''
    for await (const chunk of this.modelClient.stream(this.messages)) {
      if (chunk.type === 'content') {
        assistantContent += chunk.content
      } else if (chunk.type === 'tool_use') {
        // 4. 执行工具
        const toolUseMessage: ToolUseDesignMessage = {
          role: 'assistant',
          type: 'tool_use',
          toolName: chunk.toolName!,
          toolInput: chunk.toolInput!,
          timestamp: new Date(),
        }
        this.messages.push(toolUseMessage)
        yield toolUseMessage

        // 执行工具
        const tool = this.tools.get(chunk.toolName!)
        if (!tool) continue

        const result = await tool.execute(chunk.toolInput!, context)

        const resultMessage: ToolResultDesignMessage = {
          role: 'tool',
          toolName: chunk.toolName!,
          result,
          isError: false,
          timestamp: new Date(),
        }
        this.messages.push(resultMessage)
        yield resultMessage
      }
    }

    // 5. 添加助手消息
    const assistantMessage: AssistantDesignMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    }
    this.messages.push(assistantMessage)
    yield assistantMessage
  }
}
```

---

## 六、工具实现示例

### 6.1 GenerateUITool

```typescript
// src/tools/GenerateUITool.ts
import { z } from 'zod'
import type { DesignTool, DesignContext } from '../types/tool'

const inputSchema = z.object({
  prompt: z.string().describe('用户的设计需求'),
  pageType: z.enum(['landing', 'dashboard', 'form']).optional().describe('页面类型'),
})

const outputSchema = z.object({
  html: z.string().describe('生成的 HTML 代码'),
  components: z.array(z.object({
    name: z.string(),
    props: z.record(z.unknown()),
  })).describe('使用的组件列表'),
})

export class GenerateUITool implements DesignTool<typeof inputSchema, typeof outputSchema> {
  name = 'generate_ui'
  description = '根据用户需求生成 UI 代码'
  inputSchema = inputSchema
  outputSchema = outputSchema

  async execute(input: z.infer<typeof inputSchema>, context: DesignContext) {
    // 在实际实现中，这里会调用模型
    // 现在简化返回示例
    return {
      html: `<div class="p-4">${input.prompt}</div>`,
      components: [{ name: 'div', props: { className: 'p-4' } }],
    }
  }

  userFacingName() {
    return '生成 UI'
  }
}
```

---

## 七、UI 集成

### 7.1 主组件

```tsx
// src/ui/App.tsx
import { useState } from 'react'
import { ChatPanel } from './ChatPanel'
import { PreviewPanel } from './PreviewPanel'
import { DesignEngine } from '../engine/DesignEngine'
import { ModelClient } from '../engine/ModelClient'

export function App() {
  const [engine] = useState(() => {
    const modelClient = ModelClient.createFromPreset('anthropic', 'sk-...')
    return new DesignEngine(modelClient, designSystem)
  })

  const [currentPreview, setCurrentPreview] = useState<string>('')

  return (
    <div className="flex h-screen">
      <ChatPanel
        engine={engine}
        onPreviewUpdate={setCurrentPreview}
      />
      <PreviewPanel content={currentPreview} />
    </div>
  )
}
```

---

## 八、与原 MVP 方案的差异

| 方面 | 原方案 | 新方案（智能体框架） |
|------|--------|---------------------|
| 核心定位 | 前端 + 智谱 API | UI 设计智能体 |
| 模型 | 固定智谱 | 可配置（用户选择） |
| 扩展性 | 添加功能需修改核心 | 添加工具即可 |
| 测试性 | 整体测试 | 工具可独立测试 |
| 状态管理 | 简单 | 完整会话状态 |
| 代码复用 | 无 | 基于 Claude Code |

---

## 九、开发优先级

### Phase 1: 框架基础（W1）
1. 项目初始化 + 类型定义
2. ModelClient 实现
3. DesignEngine 基础框架

### Phase 2: 工具实现（W1-W2）
4. GenerateUITool
5. ApplyThemeTool
6. ExportHTMLTool

### Phase 3: UI 集成（W2）
7. 模型配置界面
8. ChatPanel + PreviewPanel
9. 流式渲染

### Phase 4: 完善与测试（W3-W4）
10. 错误处理
11. 端到端测试
12. 调试优化

---

## 十、关键决策

### 决策 1: 使用 TypeScript
- **理由**: 类型安全，便于工具定义
- **验证**: Claude Code 也是 TypeScript

### 决策 2: 使用 Zod 做验证
- **理由**: 运行时类型检查，与 TypeScript 类型同步
- **验证**: Claude Code 使用 Zod

### 决策 3: 不使用复杂的状态管理
- **理由**: MVP 范围，React 足够
- **扩展**: 后续可用 Zustand/Jotai

### 决策 4: 工具调用模型定义
- **选择**: 不在工具内部调用模型，由 DesignEngine 统一管理
- **理由**: 保持工具纯粹，便于测试

---

## 十一、后续扩展方向

### Phase 2
- 更多设计工具（图片处理、组件库）
- 版本历史
- 协作功能

### Phase 3
- Electron 桌面壳
- 本地模型支持（Ollama）
- 插件系统

### Phase 4
- AI 生成的 AI（子智能体）
- 多智能体协作
- 知识库集成

---

## 十二、参考

- Claude Code 源码: `claude-code-main/`
- Anthropic SDK: `@anthropic-ai/sdk`
- Zod: `zod`

## Eng Review 补充（2026-04-30）

基于 CEO Review 发现的架构问题，以下是详细的 Eng Review 补充：

---

### 1. 架构完善（React 19 + iframe 安全）

**React 版本确认**
\`\`\`json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
\`\`\`

**iframe CSP 策略**
\`\`\`typescript
// src/types/iframe-security.ts
export const CSP_DIRECTIVES = {
  defaultSrc: "'self'",
  connectSrc: "'self'",
  scriptSrc: "'unsafe-inline'",
  styleSrc: "'unsafe-inline'",
  imgSrc: "'self'",
  fontSrc: "'self'",
  frameSrc: "'self'",
  mediaSrc: "'self'",
  workerSrc: "'self'",
} as const;

export function getIframeCSP(nonce: string): string {
  const base = \`default-src \${CSP_DIRECTIVES.defaultSrc}; script-src \${CSP_DIRECTIVES.scriptSrc}\`;
  return \`\${base} \${nonce}\`;
}
\`\`\`

**postMessage origin 验证**
\`\`\`typescript
// src/types/message-iframe.ts
export interface IframeMessage {
  source: 'parent' | 'preview-iframe'
  type: string
  data: unknown
  timestamp: number
}

export const PARENT_ORIGIN = 'https://yourdomain.com' // 替换为实际域名
\`\`\`

---

### 2. 错误处理补充

\`\`\`typescript
// types/errors.ts - 添加的文件
export class JSONParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JSONParseError'
  }
}

export class StorageDisabledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageDisabledError'
  }
}

export const ERROR_RESCUE_MAP: Record<string, {
  retries: number
  userMessage: string
  rescueAction: () => void | Promise<void>
}> = {
  'TimeoutError': { retries: 2, userMessage: '服务暂时不可用' },
  'RateLimitError': { backoff: true, userMessage: '请求过于频繁，请稍后再试' },
  'AuthError': { userMessage: 'API Key 无效，请检查配置' },
  'NetworkError': { userMessage: '网络连接失败，请检查网络' },
  'JSONParseError': { userMessage: '生成内容格式异常，系统错误' },
  'StorageDisabledError': { userMessage: '存储功能被禁用，无法保存配置' },
}
\`\`\`

---

### 3. 边缘情况补充

\`\`\`typescript
// ui/ChatPanel.tsx
export const ChatEdgeCases = {
  submitWhileStreaming: {
    handled: true,
    description: '发送消息时点击发送',
    solution: '禁用发送按钮，显示"处理中..."'
  },
  navigateAwayMidGeneration: {
    handled: true,
    description: 'AI 生成中用户导航离开页面',
    solution: '在 onUnmount 中中止流式调用，显示会话已结束'
  },
  rapidDoubleClickSubmit: {
    handled: true,
    description: '快速连续点击发送',
    solution: '添加 500ms 防抖，禁用按钮'
  },
  emptyStringSubmit: {
    handled: true,
    description: '发送空字符串',
    solution: '禁用发送或显示提示"请输入内容"'
  },
  inputTooLong: {
    handled: true,
    description: '输入超过最大长度（5000 字）',
    solution: '截断或显示提示"内容过长"'
  },
}

// ui/PreviewPanel.tsx
export const PreviewEdgeCases = {
  iframeLoadFailure: {
    handled: true,
    description: 'iframe 内容加载失败',
    solution: '显示加载失败占位符和重试按钮'
  },
  iframeCrossDomainError: {
    handled: true,
    description: 'iframe 跨域报错',
    solution: '显示错误提示，建议用户刷新页面'
  },
  emptyContent: {
    handled: true,
    description: '预览区内容为空',
    solution: '显示空状态提示文字'
  },
}
\`\`\`

---

### 4. 测试覆盖建议

**单元测试策略**
\`\`\`typescript
import { describe, test, expect, vi } from 'vitest'
import { setTimeout } from 'node:timers/promises'

describe('DesignEngine', () => {
  it('构建正确的消息历史', ({ timeout: 2000 }))
  it('执行工具时正确更新状态', ({ timeout: 2000 }))
  it('handle tool_use 解析错误', ({ timeout: 2000 }))
  it('工具超时时正确处理', ({ timeout: 2000 }))
})

test('GenerateUITool', async () => {
  const tool = new GenerateUITool()
  const input = { prompt: '创建一个按钮', pageType: 'landing' }
  const result = await tool.execute(input, {})

  expect(result.html).toContain('<button')
  expect(result.components).toContainEqual([{ name: 'div', props: { className: 'p-4' } }])
})

test('ApplyThemeTool', async () => {
  const tool = new ApplyThemeTool()
  const input = { html: '<div></div>', theme: 'light' }
  const result = await tool.execute(input, {})

  expect(result.styledHtml).toContain('data-theme="light"')
})
\`\`\`

**E2E 测试**
\`\`\`typescript
// e2e/user-journey.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('用户创建完整页面流程', () => {
  test('输入需求并发送', async ({ page }) => {
    await page.getByRole('locator', 'ChatPanel')
      .locator('input', 'textarea').fill('创建一个落地页')
      .locator('button', 'submit').click()

    await page.waitForResponse(async () => {
      const response = await page.getByRole('assistant', 'DesignEngine')
      const messages = response.messages

      // 验证 GenerateUITool 被用
      const toolUseMsg = messages.find(m => m.role === 'assistant' && m.type === 'tool_use')
      expect(toolUseMsg).toBeDefined()
      expect(toolUseMsg?.toolName).toBe('generate_ui')

      // 验证结果包含 HTML
      const resultMsg = messages.find(m => m.role === 'tool' && m.toolName === 'generate_ui')
      expect(resultMsg?.result).toBeDefined()
      expect(resultMsg?.result.html).toBeTruthy()
    })
  })
})
\`\`\`

---

### 5. 观测性定义

\`\`\`typescript
// lib/observability.ts
export const ObservabilityConfig = {
  logging: {
    level: 'info' | 'debug' | 'error',
    format: 'json',
    destinations: ['console', 'file']
  },
  metrics: {
    generationLatency: 'ui_generation_latency_ms',
    toolExecutionTime: 'tool_execution_ms',
    errorRate: 'error_rate_per_minute',
    userSatisfaction: 'user_satisfaction_score'
  },
  traces: {
    enabled: false,
    sampleRate: 0.01 // 1% 的请求包含 trace ID
  }
}
\`\`\`

---

### 新增文件清单

| 文件 | 说明 |
|------|------|
| \`src/types/iframe-security.ts\` | CSP directives |
| \`src/types/message-iframe.ts\` | iframe message 类型 |
| \`src/errors/error-rescue.ts\` | 错误处理与救援配置 |
| \`src/lib/observability.ts\` | 观测性配置 |
| \`src/utils/edge-cases.ts\` | 边缘情况定义 |

---

## 已解决的问题

1. ✅ React 版本明确为 19.0.0
2. ✅ 添加了 CSP 安全策略配置
3. ✅ 添加了 JSONParseError 和 StorageDisabledError 错误类型
4. ✅ 添加了 7 个边缘情况处理配置
5. ✅ 提供了单元测试和 E2E 测试示例
6. ✅ 定义了观测性指标和日志策略

