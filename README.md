# Laifu Design

内置设计智能体桌面应用。Laifu 通过自然语言对话生成高保真 UI 设计，并管理项目、历史会话、artifact 和本地设计文件。

Laifu 不检测也不委托本机 Claude、Codex、Windsurf、Cursor 等外部 CLI 智能体。用户只需要配置 OpenAI-compatible 模型服务，设计流程、skill、设计系统、prompt 编排、artifact 保存都由 Laifu 内置 agent runtime 负责。

## 技术栈

- Electron + Express + sql.js 本地持久化
- React + Vite + TypeScript
- TailwindCSS v4
- shadcn/ui 基础组件
- OpenAI-compatible SSE 模型调用
- 内置 skills 与 design-systems 资源库

## 开发

安装依赖：

```bash
npm install
```

启动完整桌面应用：

```bash
npm run dev:app
```

只启动渲染进程：

```bash
npm run dev
```

构建：

```bash
npm run build
```

打包：

```bash
npm run pack
```

## 核心链路

1. 在设置中配置模型服务商、API 地址、API Key 和模型。
2. 新建项目，选择 skill、设计系统和目标平台。
3. 通过对话触发 discovery 表单、视觉方向选择和 artifact 生成。
4. 右侧实时预览 HTML artifact。
5. artifact 同步保存到 SQLite 和 `.laifu/projects/<projectId>/` 文件工作区。
6. 后续可从历史会话和文件工作区继续迭代。

## 目录

```text
main/                 Electron 主进程、Express API、agent runtime
src/                  React 渲染进程
skills/               Laifu 内置 skills
design-systems/       Laifu 内置设计系统
assets/frames/        设备预览边框
docs/                 架构与迁移文档
```

## 本地数据

开发环境运行时数据写入 `.laifu/`，生产环境写入 Electron `userData` 目录。`.laifu/` 和 `release/` 不应提交到仓库。
