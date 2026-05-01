# Laifu Design — 项目指南

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


## 沟通方式

- 默认简体中文，代码、命令、变量名用英文
- 结论先行，再给理由，不要先铺垫背景
- 遇到模糊需求，先给最合理的方案，再问要不要调整
- 不要问「你确定要这样吗」，除非命中下方红线

## 自主边界（红线，必须先问我）

以下操作即使在 auto-accept 模式下也必须停下来问我：

- 删除文件、目录或 git 历史
- 修改 .env、密钥、token、CI/CD 配置
- 数据库 schema 变更或数据迁移
- git push、git rebase、git reset --hard、强制推送
- 安装新的全局依赖或修改系统配置
- 公开发布（npm publish、部署到生产、发文章等）

## 通用工程纪律

- 改完主动跑验证（具体命令见各项目 CLAUDE.md），不要只改不验
- 不要为了让代码跑起来注释掉报错或加绕过标记，找根本原因
- 密钥、token、密码不进代码、不进 commit、不进日志
- 大改动前先在 Plan Mode 出方案，我确认后再动手

---

## 项目概述

Laifu Design 是一个 UI 设计智能体，用户通过自然语言对话生成符合设计规范的页面。基于 Claude Code 架构提取的智能体框架，使用 Lovable 设计系统作为默认 UI 风格。

**当前进度**：TODO 1 ✅ TODO 1.2 ✅ TODO 1.5 ✅ TODO 2 ✅（项目初始化 + Lovable 设计系统 + 智能体框架核心 + 基础 UI 布局完成），下一步 TODO 3（可配置 ModelClient）。

**仓库**：https://github.com/ZachShannnng/Laifudesign

## 技术栈

- React + Vite + TypeScript
- TailwindCSS v4（CSS-first `@theme` 配置，无 `tailwind.config.js`）
- shadcn/ui（new-york 风格，手动集成，路径别名 `@/` → `./src/`）
- Lovable 设计系统（暖色调奶油背景 #f7f4ed）
- 可配置 ModelClient（Anthropic / OpenAI / 智谱 / 自定义）

### 设计系统配色要点

- `--color-cream` / `--color-charcoal` / `--color-border` / `--color-off-white` / `--color-muted-text`
- shadcn/ui 语义变量已映射：`--color-muted`（背景色=border色），`--color-muted-foreground`（文字色=#5f5f5d）
- 组件中文字色用 `text-muted-foreground` 或 `text-muted-text`，**不用** `text-muted`

## 关键文件

| 文件 | 说明 |
|------|------|
| `DESIGN.md` | Lovable 完整设计系统规范 |
| `docs/architecture-design.md` | 架构设计文档 |
| `docs/mvp-plan-20260429.md` | MVP 开发计划 |
| `TODOS.md` | 任务列表 |
| `docs/lovable-integration.md` | Lovable 集成文档 |
| `src/index.css` | TailwindCSS `@theme` + Lovable 配色变量 |
| `src/types/design-system.ts` | `DesignSystemConfig` 类型 + `DEFAULT_DESIGN_SYSTEM` 常量 |
| `src/types/message.ts` | `DesignMessage` 消息类型 + `StreamEvent` |
| `src/types/tool.ts` | `DesignTool` 工具接口 + `ToolRegistry` |
| `src/types/context.ts` | `DesignContext` 上下文 + `DesignSession` |
| `src/engine/DesignEngine.ts` | 设计会话管理引擎（骨架） |
| `src/engine/ModelClient.ts` | 可配置模型客户端（占位，TODO 3 完善） |
| `src/components/ui/` | shadcn/ui 基础组件（Button/Card/Input，Lovable 风格） |
| `src/components/Sidebar.tsx` | 侧边栏（Lucide 图标、折叠/hover、会话列表、删除确认弹窗） |
| `src/components/ChatPanel.tsx` | 聊天面板（消息列表、自动增长输入框、发送/停止） |
| `src/components/PreviewPanel.tsx` | 预览面板（iframe、代码切换、工具栏） |
| `.windsurf/workflows/neat-freak.md` | 洁癖级知识库同步 workflow |

## 设计原型

HTML 原型位于 `docs/prototypes/`：
- `finalized-v3.html` — 基础三栏布局（侧边栏顺序调整、字号图标统一）
- `finalized-v4.html` — ChatGPT 风格侧边栏重构（logo+折叠、hover 切换、统一菜单样式）

**2026-04-30 决策**：停止在 HTML 原型上迭代，转向按 TODOS.md 执行 React 项目初始化（TODO 1 → 1.2 → 2）。v4.html 作为视觉参考，不再直接修改。

---

## GStack 全局技能

GStack 已全局安装到 `~/.claude/skills/gstack`，所有项目可用。

### 可用技能

**产品与规划：**
- `/office-hours` — YC 导师拷问模式，写代码前重新定义产品问题
- `/plan-ceo-review` — CEO 视角战略审查
- `/plan-eng-review` — 工程架构审查
- `/plan-design-review` — 设计审查
- `/autoplan` — 自动运行完整审查流程

**开发与审查：**
- `/review` — 代码审查（自动修复明显问题）
- `/investigate` — 系统化根因调试
- `/cso` — 安全审计（OWASP + STRIDE）

**设计与浏览器：**
- `/design-consultation` — 设计咨询
- `/design-shotgun` — 生成多个设计变体
- `/design-html` — 将设计转换为生产级 HTML
- `/browse` — 真实浏览器 QA 测试
- `/open-gstack-browser` — 启动 GStack 浏览器

**测试与发布：**
- `/qa` — 完整 QA 测试（自动发现和修复 bug）
- `/qa-only` — 仅报告 bug，不修改代码
- `/ship` — 发布 PR（同步 main、运行测试、审计覆盖率）
- `/land-and-deploy` — 合并 PR 并验证生产环境
- `/canary` — 部署后监控

**其他工具：**
- `/retro` — 每周工程回顾
- `/document-release` — 自动更新项目文档
- `/benchmark` — 性能基准测试
- `/careful` — 安全模式（警告破坏性命令）
- `/freeze` — 锁定编辑范围
- `/learn` — 管理 gstack 学习记忆
- `/gstack-upgrade` — 升级 gstack

### 技能路由

- 所有 Web 浏览操作使用 `/browse`，不使用 `mcp__claude-in-chrome__*` 工具
- 产品设计相关先使用 `/office-hours` 或 `/design-consultation`
- 代码审查使用 `/review`
- 测试使用 `/qa`
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Sync docs/memory → invoke /neat-freak (Windsurf workflow)
