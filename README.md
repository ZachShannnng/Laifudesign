# Laifu Design

UI 设计智能体 — 通过自然语言对话生成符合设计规范的页面。

## 技术栈

- React + Vite + TypeScript
- TailwindCSS v4（CSS-first `@theme` 配置）
- shadcn/ui（new-york 风格，手动集成）
- Lovable 设计系统（暖色调奶油背景 #f7f4ed）
- 可配置 ModelClient（Anthropic / OpenAI / 智谱 / 自定义）

## 开发

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 项目结构

```
src/
├── components/
│   ├── ui/              # shadcn/ui 基础组件（Button, Card, Input）
│   ├── Sidebar.tsx      # 侧边栏（Lucide 图标、折叠/hover、会话列表、删除确认）
│   ├── ChatPanel.tsx    # 聊天面板（消息列表、自动增长输入框、发送/停止）
│   └── PreviewPanel.tsx # 预览面板（iframe、代码切换、工具栏）
├── engine/
│   ├── DesignEngine.ts  # 设计会话管理引擎（骨架）
│   └── ModelClient.ts   # 可配置模型客户端（占位，TODO 3 完善）
├── types/
│   ├── design-system.ts # Lovable 设计系统类型 + DEFAULT_DESIGN_SYSTEM
│   ├── message.ts       # DesignMessage 消息类型 + StreamEvent
│   ├── tool.ts          # DesignTool 工具接口 + ToolRegistry
│   ├── context.ts       # DesignContext 上下文 + DesignSession
│   ├── iframe-security.ts
│   └── message-iframe.ts
├── lib/
│   ├── utils.ts         # cn() 工具函数
│   └── observability.ts
├── App.tsx              # 三栏布局 + 状态管理
├── main.tsx             # 入口
└── index.css            # TailwindCSS @theme + Lovable 配色
```

## 文档

- `CLAUDE.md` — AI 协作指南
- `DESIGN.md` — Lovable 完整设计系统规范
- `TODOS.md` — 任务列表与进度
- `docs/` — 架构设计、MVP 计划、Lovable 集成文档

## 仓库

https://github.com/ZachShannnng/Laifudesign
