# TODOS

## MVP 任务（基于 mvp-plan-20260429.md，集成 Claude Code 智能体框架 + Lovable 设计系统）

### W1: 项目初始化 + 智能体框架基础

**TODO 1: 项目初始化**
- **What:** 创建 React + Vite 项目，配置 TailwindCSS 和 shadcn/ui
- **Why:** MVP 开发的基础框架
- **Pros:** 标准化技术栈，shadcn/ui 提供现成组件
- **Cons:** 初始设置时间 ~1 小时
- **Context:** 技术栈已在 MVP 方案中确定
- **Effort:** S (~2 小时)
- **Priority:** P1
- **Depends on:** 无

**TODO 1.2: Lovable 设计系统配置** ⭐ 新增
- **What:** 配置 Lovable 设计系统到项目
  - TailwindCSS 配置（颜色、间距、圆角、阴影）
  - 字体配置（Camera Plain Variable + Inter fallback）
  - 基础组件（Button、Card、Input）
  - 设计系统类型定义（DesignSystemConfig）
- **Why:** Laifu Design 采用 Lovable 作为 UI 框架
- **Pros:** 温暖、克制、人性化的设计风格，符合产品定位
- **Cons:** 需要自定义 Tailwind 配置和 shadcn/ui 组件
- **Context:** 参考 `lovable-integration.md` 和 `DESIGN.md`
- **Effort:** S (~1 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 1.5: 设计智能体框架核心** ⭐ 新增
- **What:** 基于 Claude Code 架构，实现 DesignEngine 和 ModelClient
  - `src/engine/DesignEngine.ts` - 设计会话管理
  - `src/engine/ModelClient.ts` - 可配置模型客户端
  - `src/types/message.ts` - 设计消息类型定义
  - `src/types/tool.ts` - 设计工具类型定义
- **Why:** 核心智能体能力，不是简单的 API 调用包装
- **Pros:** 模型无关，可扩展，基于验证过的架构
- **Cons:** 抽象层增加初始复杂度
- **Context:** 从 Claude Code 提取的核心架构
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 1

**TODO 2: 基础 UI 布局**
- **What:** 实现 Chat UI（输入框 + 发送按钮）+ Preview 区域（iframe）
- **Why:** 用户交互的基础界面
- **Pros:** 完成后可见的 UI 框架
- **Cons:** 需要 1-2 天开发
- **Context:** MVP 范围的核心界面，使用 Lovable 风格组件
- **Effort:** M (~1-2 天)
- **Priority:** P1
- **Depends on:** TODO 1, TODO 1.2

### W1-W2: 模型客户端 + 工具系统

**TODO 3: 可配置 ModelClient** ⭐ 重构
- **What:** 实现通用模型客户端，支持用户配置 API 地址/Key/模型
  - 配置界面：设置 → 模型配置
  - 预设模板：Anthropic、OpenAI、智谱、自定义
  - 统一的流式接口
- **Why:** 不依赖单一模型，真正的智能体框架
- **Pros:** 用户可自由选择模型，产品不受单一供应商限制
- **Cons:** 需要处理不同 API 格式的差异
- **Context:** 基于 Claude Code 的 providers.ts + client.ts
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

---

## 核心架构文件

### 智能体框架
| 文件 | 说明 | 来源 |
|------|------|------|
| `src/engine/DesignEngine.ts` | 设计会话管理引擎 | 基于 Claude Code QueryEngine |
| `src/engine/ModelClient.ts` | 可配置模型客户端 | 基于 Claude Code client.ts |
| `src/types/message.ts` | 设计消息类型定义 | 基于 Claude Code message.ts |
| `src/types/tool.ts` | 设计工具类型定义 | 基于 Claude Code Tool.ts |
| `src/types/design-system.ts` | 设计系统类型定义 | 基于 Lovable |
| `src/types/context.ts` | 设计上下文类型定义 | 基于 Claude Code ToolUseContext |

### 工具系统
| 文件 | 说明 | 来源 |
|------|------|------|
| `src/tools/GenerateUITool.ts` | UI 生成工具 | - |
| `src/tools/ExportHTMLTool.ts` | HTML 导出工具 | - |
| `src/tools/ApplyThemeTool.ts` | 主题应用工具 | - |

### UI 组件（Lovable 风格）
| 文件 | 说明 | 来源 |
|------|------|------|
| `src/ui/components/Button.tsx` | 按钮组件 | 基于 Lovable |
| `src/ui/components/Card.tsx` | 卡片组件 | 基于 Lovable |
| `src/ui/components/Input.tsx` | 输入框组件 | 基于 Lovable |
| `src/ui/ChatPanel.tsx` | 聊天面板 | - |
| `src/ui/PreviewPanel.tsx` | 预览面板 | - |
| `src/ui/SettingsPanel.tsx` | 设置面板（模型配置） | - |
| `src/ui/DesignSystemPanel.tsx` | 设计系统配置面板 | - |

### 存储与配置
| 文件 | 说明 | 来源 |
|------|------|------|
| `src/lib/design-system.ts` | 设计系统默认配置 | 基于 Lovable DEFAULT_DESIGN_SYSTEM |
| `src/store/designStore.ts` | 设计状态管理 | - |
| `src/store/modelConfigStore.ts` | 模型配置管理 | - |
| `src/store/designSystemStore.ts` | 设计系统配置管理 | - |

---

## 设计系统文档

| 文件 | 说明 | 来源 |
|------|------|------|
| `DESIGN.md` | Lovable 完整设计系统规范 | `npx getdesign@latest add lovable` |
| `lovable-integration.md` | Lovable 集成文档 | 手动创建 |
| `architecture-design.md` | Laifu Design 架构设计 | 基于 Claude Code |
| `mvp-plan-20260429.md` | MVP 开发计划 | 已更新 |
