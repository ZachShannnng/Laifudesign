# TODOS

## MVP 任务（基于 mvp-plan-20260429.md，集成 Claude Code 智能体框架 + Lovable 设计系统）

### W1: 项目初始化 + 智能体框架基础

**TODO 1: 项目初始化** ✅ 已完成 (2026-05-01)
- **What:** 创建 React + Vite 项目，配置 TailwindCSS v4 和 shadcn/ui
- **Delivered:** Vite 项目 + TailwindCSS v4 @theme 配置 + shadcn/ui 手动集成 + 三栏布局骨架 + Git 仓库初始化
- **Effort:** S (~2 小时)
- **Priority:** P1
- **Depends on:** 无

**TODO 1.2: Lovable 设计系统配置** ✅ 已完成 (2026-05-01)
- **What:** 配置 Lovable 设计系统到项目
  - TailwindCSS 配置（颜色、间距、圆角、阴影）
  - 字体配置（Inter CDN + Camera Plain Variable fallback）
  - 基础组件（Button、Card、Input）
  - 设计系统类型定义（DesignSystemConfig）
- **Delivered:** `src/index.css` @theme 配色 + `src/components/ui/` 三个组件 + `src/types/design-system.ts` 类型定义
- **Effort:** S (~1 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 1.5: 设计智能体框架核心** ✅ 已完成 (2026-05-01)
- **What:** 基于 Claude Code 架构，实现 DesignEngine 和 ModelClient
  - `src/engine/DesignEngine.ts` - 设计会话管理
  - `src/engine/ModelClient.ts` - 可配置模型客户端（占位，TODO 3 完善）
  - `src/types/message.ts` - 设计消息类型 + StreamEvent
  - `src/types/tool.ts` - 设计工具类型 + ToolRegistry
  - `src/types/context.ts` - 设计上下文 + DesignSession
- **Delivered:** 完整引擎骨架（会话管理、流式提交、工具执行、系统提示词构建、中断控制）
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 2: 基础 UI 布局** ✅ 已完成 (2026-05-01)
- **What:** 实现 Chat UI（输入框 + 发送按钮）+ Preview 区域（iframe）+ 侧边栏折叠
- **Delivered:** Sidebar（折叠/hover切换/会话列表/菜单）、ChatPanel（消息列表/自动增长输入框/发送停止按钮）、PreviewPanel（iframe/代码切换/加载状态/空状态）、App.tsx（三栏联动/设置面板/设计系统面板占位）
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 1, TODO 1.2

### W1-W2: 模型客户端 + 工具系统

**TODO 3: 可配置 ModelClient** ✅ 已完成 (2026-05-02)
- **What:** 实现通用模型客户端，支持用户配置 API 地址/Key/模型
  - 统一 OpenAI 兼容 SSE 客户端（1 个客户端覆盖所有 provider）
  - 提供商：OpenAI、智谱、自定义（无 Anthropic，不预设 URL）
  - apiUrl 含完整路径（如 /v1/chat/completions），支持中转站
  - 设置面板流程：选提供商 → 填 URL+Key → 测试连接 → 自动发现模型 → 选模型 → 保存
  - 温度/MaxToken 折叠在高级设置下
  - 连接成功后自动 GET /v1/models 发现可用模型
  - 交互状态：保存 toast 反馈、测试连接 spinner + 结果、API Key 格式验证
  - a11y：Tab 顺序、Enter 提交、ARIA labels
  - DesignEngine 消息构建重构（tool_use→tool_calls、tool_result→role:tool）
  - vitest 测试框架 + 核心单元测试（18 tests passing）
- **Delivered:** `src/engine/openai-compatible.ts`（SSE + fetchModels）、`src/engine/ModelClient.ts`（工厂+listModels）、`src/store/modelConfigStore.ts`（localStorage）、`src/components/SettingsPanel.tsx`（inline style + CSS 变量）、Sidebar overlay 互斥选中
- **Effort:** M (~2-3 天)
- **Priority:** P1
- **Depends on:** TODO 1.5, TODO 2

**TODO 3.5: 设计工具系统** ⭐ 新增
- **What:** 实现 DesignTool 基类和核心工具
  - `GenerateUITool` - UI 生成工具
  - `ApplyThemeTool` - 应用设计系统工具
  - `ExportHTMLTool` - 导出 HTML 工具
- **Why:** 智能体通过工具完成具体任务，不是直接输出
- **Pros:** 模块化，可扩展，权限可控
- **Cons:** 需要定义工具调用协议
- **Context:** 基于 Claude Code 的 Tool.ts
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 1.5

**TODO 4: 流式渲染到 iframe**
- **What:** 将 ModelClient 返回的内容逐块注入 iframe 实时渲染
- **Why:** 提供即时反馈的用户体验
- **Pros:** 用户能看到页面逐步构建
- **Cons:** iframe 安全性需验证
- **Context:** DesignEngine 管理流式输出
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 3

### W2: 设计系统 + 工具集成

**TODO 5: 设计系统配置页面** ⭐ 更新
- **What:** 设计系统配置界面（基于 Lovable）
  - 默认加载 Lovable 设计系统配置（`DEFAULT_DESIGN_SYSTEM`）
  - 允许用户修改颜色、字体、间距等设计令牌
  - 预览设计系统变化的效果
- **Why:** 用户需要能够自定义设计规范，同时 Lovable 作为默认模板
- **Pros:** 开箱即用的 Lovable 风格，同时支持自定义
- **Cons:** MVP 使用表单编辑 JSON，后续可升级为可视化编辑器
- **Context:** 参考 `lovable-integration.md`，设计系统作为 DesignTool 的输入
- **Effort:** S (~1 天)
- **Priority:** P1
- **Depends on:** TODO 1.2, TODO 2

**TODO 6: 设计系统注入到 DesignEngine** ⭐ 更新
- **What:** 在 DesignEngine 中将设计系统配置注入到工具调用上下文
  - 生成 UI 时将设计系统作为系统提示词的一部分
  - 工具调用时包含当前设计系统配置
- **Why:** AI 工具需要访问用户的设计规范以生成符合风格的 UI
- **Pros:** 核心差异化功能，与模型无关，生成的 UI 自动符合设计系统
- **Cons:** 需要设计上下文传递机制和提示词模板
- **Context:** 基于 Claude Code 的 ToolUseContext，参考 Lovable 智能体提示词模板
- **Effort:** S (~0.5 天)
- **Priority:** P1
- **Depends on:** TODO 3.5, TODO 5

### W2-W3: 工具实现 + 导出功能

**TODO 7: 实现核心 DesignTools** ⭐ 新增
- **What:** 实现具体的设计工具
  - `GenerateUITool` - 接收用户需求，调用模型生成 UI
  - `ExportHTMLTool` - 将生成结果打包为可运行 HTML
- **Why:** 智能体通过工具完成具体任务
- **Pros:** 可测试，可扩展，职责清晰
- **Cons:** 需要定义工具输入输出协议
- **Context:** 基于 Claude Code 的 FileWriteTool 等，使用 Lovable 设计系统生成 UI
- **Effort:** M (~2-3 天)
- **Priority:** P1
- **Depends on:** TODO 3.5, TODO 6

**TODO 7.5: Anthropic 原生 Messages API 支持**
- **What:** 当 OpenAI 兼容端点对 tool_use 流式支持不完整时，补 Anthropic 原生 Messages API 实现
  - content_block_delta 精细解析
  - 独立 Anthropic provider 文件（~150 行）
- **Why:** OpenAI 兼容端点对 tool_use 流式支持可能不完整
- **Pros:** Anthropic tool_use 流式解析更精确，保留原生 API 完整能力
- **Cons:** 多维护 ~150 行 Anthropic 原生实现
- **Context:** MVP 选了方案 A（统一 OpenAI 兼容），方案 B（双轨）作为后续升级路径。触发条件：Anthropic 兼容端点 tool_use 不完整时。注意：当前 provider 列表已移除 Anthropic，用户通过「自定义」或中转站使用 Anthropic 模型
- **Effort:** S (~0.5 天)
- **Priority:** P2
- **Depends on:** TODO 3 完成后验证 Anthropic 兼容端点能力

**TODO 8: 基础错误处理**
- **What:** 在 ModelClient 和 DesignEngine 中实现错误处理
  - 超时重试 2 次
  - 各类错误的用户提示
  - 错误状态 UI 反馈
- **Why:** 用户体验必须覆盖常见失败场景
- **Pros:** 用户知道发生了什么
- **Cons:** 增加 ~0.5 天开发
- **Context:** 基于 Claude Code 的 withRetry.ts
- **Effort:** S (~1 天)
- **Priority:** P1
- **Depends on:** TODO 3

### W2-W3: 测试与调试

**TODO 9: 端到端测试**
- **What:** 测试完整流程
  - 配置模型 → 输入需求 → 工具调用 → 流式预览 → 导出
- **Why:** 确保智能体框架完整可用
- **Pros:** 发现集成问题
- **Cons:** 手动测试，时间不确定
- **Context:** MVP 验证阶段
- **Effort:** M (~2-3 天)
- **Priority:** P1
- **Depends on:** TODO 7, TODO 8

**TODO 10: 调试与优化**
- **What:** 修复发现的问题，优化渲染性能
- **Why:** 确保用户体验可接受
- **Pros:** 提升质量
- **Cons:** 时间可能延长
- **Context:** 交付前的最后打磨
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 9

---

### W4: 安全改进 ⭐ 新增

**TODO 11: 实现 CSP 安全策略** ⭐ 新增
- **What:** 定义 Content-Security-Policy，限制 iframe 来源、阻止内联脚本
- **Why:** 防止 XSS 攻击和恶意内容注入
- **Pros:** 最安全的 iframe 防护方案
- **Cons:** CSP 策略可能限制某些合法功能，需要仔细调试
- **Context:** 参考 Section 3 审查发现的问题
- **Effort:** S (~0.5 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 12: 添加浏览器指纹检测** ⭐ 新增
- **What:** 检测用户浏览器指纹（userAgent、屏幕分辨率、时区等）
- **Why:** 防止 API Key 被恶意网站窃取
- **Pros:** 增加安全性
- **Cons:** 可能有误报
- **Context:** 保护 API Key 存储在 localStorage 中的安全性
- **Effort:** S (~0.5 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 13: 添加 iframe postMessage origin 验证** ⭐ 新增
- **What:** 在 iframe 中验证消息来源，只接受来自父窗口的消息
- **Why:** 防止未授权的 iframe 内容与主应用通信
- **Pros:** 简单有效的安全检查
- **Cons:** 可能限制某些合法的 iframe 交互
- **Context:** 参考 Section 3 审查发现的问题
- **Effort:** S (~0.5 天)
- **Priority:** P1
- **Depends on:** TODO 4

---

## 已完成

- ~~TODO 3: 更新设计文档M3章节——从Tauri改为Electron~~ ✅
- ~~TODO 4: 更新设计文档M5章节——导出HTML包含React CDN~~ ✅
- ~~TODO: 生成 Lovable 设计系统集成文档~~ ✅
- ~~TODO: 更新架构设计文档，添加 DesignSystemConfig 定义~~ ✅
- ~~TODO: 更新 TODOS.md，添加 Lovable 设计系统配置任务~~ ✅

---

## 延迟到 MVP 之外

| 功能 | 理由 | 优先级 |
|------|------|--------|
| Electron 桌面壳 | Web 版本先验证 | P2 |
| 元素批注 | 用文字对话替代 | P2 |
| 版本历史 | 对话历史已足够 | P2 |
| 更多 DesignTool | MVP 3个工具足够 | P2 |
| 设计系统可视化编辑器 | MVP 使用 JSON 编辑器 | P2 |
| 设计系统导入导出 | 手动编辑 JSON | P2 |
| 多页面项目管理 | 单页面足够 | P2 |
| 输入验证 | 最小版本跳过 | P3 |
| 设置面板首次使用引导 | 空白表单够用，后续加引导文案 | P3 |
| 设置面板响应式布局 | MVP 只做桌面（min-width 1024px） | P3 |

---

## 核心架构文件

### 智能体框架
| 文件 | 说明 | 来源 | 状态 |
|------|------|------|------|
| `src/engine/DesignEngine.ts` | 设计会话管理引擎 | 基于 Claude Code QueryEngine | ✅ 骨架 |
| `src/engine/ModelClient.ts` | 可配置模型客户端（统一 SSE + fetchModels） | 基于 Claude Code client.ts | ✅ 已交付 |
| `src/engine/openai-compatible.ts` | OpenAI 兼容 SSE 客户端 + fetchModels | 基于 Claude Code providers.ts | ✅ 已交付 |
| `src/types/message.ts` | 设计消息类型定义 | 基于 Claude Code message.ts | ✅ 已交付 |
| `src/types/tool.ts` | 设计工具类型定义 | 基于 Claude Code Tool.ts | ✅ 已交付 |
| `src/types/context.ts` | 设计上下文类型定义 | 基于 Claude Code ToolUseContext | ✅ 已交付 |
| `src/types/design-system.ts` | 设计系统类型定义 | 基于 Lovable | ✅ 已交付 |

### 工具系统
| 文件 | 说明 | 来源 | 状态 |
|------|------|------|------|
| `src/tools/GenerateUITool.ts` | UI 生成工具 | - | ❌ 未实现，TODO 3.5 |
| `src/tools/ExportHTMLTool.ts` | HTML 导出工具 | - | ❌ 未实现，TODO 7 |
| `src/tools/ApplyThemeTool.ts` | 主题应用工具 | - | ❌ 未实现，TODO 7 |

### UI 组件（Lovable 风格）
| 文件 | 说明 | 来源 | 状态 |
|------|------|------|------|
| `src/components/ui/button.tsx` | 按钮组件（primary/ghost/cream/pill） | 基于 Lovable | ✅ |
| `src/components/ui/card.tsx` | 卡片组件 | 基于 Lovable | ✅ |
| `src/components/ui/input.tsx` | 输入框组件 | 基于 Lovable | ✅ |
| `src/components/Sidebar.tsx` | 侧边栏（Lucide 图标、删除确认弹窗） | - | ✅ |
| `src/components/ChatPanel.tsx` | 聊天面板（消息列表、自动增长输入框） | - | ✅ |
| `src/components/PreviewPanel.tsx` | 预览面板（iframe、代码切换、工具栏） | - | ✅ |

### 存储与配置
| 文件 | 说明 | 来源 | 状态 |
|------|------|------|------|
| `src/types/design-system.ts` | 设计系统类型 + 默认配置 | 基于 Lovable DEFAULT_DESIGN_SYSTEM | ✅ |
| `src/store/designStore.ts` | 设计状态管理 | - | ❌ 未实现 |
| `src/store/modelConfigStore.ts` | 模型配置 localStorage 持久化 | - | ✅ 已交付 |
| `src/store/designSystemStore.ts` | 设计系统配置管理 | - | ❌ 未实现 |

---

## 设计系统文档

| 文件 | 说明 | 来源 |
|------|------|------|
| `DESIGN.md` | Lovable 完整设计系统规范 | `npx getdesign@latest add lovable` |
| `lovable-integration.md` | Lovable 集成文档 | 手动创建 |
| `architecture-design.md` | Laifu Design 架构设计 | 基于 Claude Code |
| `mvp-plan-20260429.md` | MVP 开发计划 | 已更新 |
