# Laifu Design UI 框架 — Lovable 设计系统

生成于: 2026-04-29
来源: `npx getdesign@latest add lovable`

---

## 概述

Laifu Design 采用 Lovable 的设计系统，这是一个温暖、克制、人性化的 UI 系统。

**核心特点**：
- 暖色调奶油色背景 (#f7f4ed)，而非冰冷的纯白
- 通过透明度变化创建灰色调系，而非固定 hex 值
- Camera Plain Variable 字体，两个主要字重（400/600）
- 浅深度系统，靠边框而非阴影定义边界
- 内阴影按钮效果作为签名式细节

---

## 1. 颜色系统（Tailwind 配置）

### 基础颜色

```json
// tailwind.config.js
{
  "theme": {
    "extend": {
      "colors": {
        "background": "#f7f4ed",      // 页面背景、卡片表面
        "foreground": "#1c1c1c",      // 主文本、标题
        "border": "#eceae4",          // 被动边框
        "border-interactive": "rgba(28,28,28,0.4)",  // 交互边框
        "muted": "#5f5f5d",           // 次要文本
        "card": "#f7f4ed",            // 卡片背景（同页面背景）
        "input": "#f7f4ed",           // 输入框背景
        "ring": "rgba(59,130,246,0.5)" // 焦点环
      }
    }
  }
}
```

### 灰度色阶（基于透明度）

```typescript
// 而非使用固定 hex，所有灰色来自 #1c1c1c 的透明度变化
const grayScale = {
  100: '#1c1c1c',                   // 主文本、标题
  83: 'rgba(28,28,28,0.83)',        // 强次要文本
  82: 'rgba(28,28,28,0.82)',        // 正文
  60: '#5f5f5d',                    // 次要文本、描述
  40: 'rgba(28,28,28,0.4)',         // 交互边框
  4: 'rgba(28,28,28,0.04)',         // 微弱悬停背景
  3: 'rgba(28,28,28,0.03)'          // 几乎不可见的覆盖层
}
```

---

## 2. 字体系统

### 字体配置

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;480&display=swap');

:root {
  --font-sans: 'Camera Plain Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

### 排版层级

| 角色 | 大小 | 字重 | 行高 | 字间距 | Tailwind 类 |
|------|------|------|------|--------|-------------|
| Hero 标题 | 60px (3.75rem) | 600 | 1.10 | -1.5px | `text-6xl font-semibold tracking-tighter leading-tight` |
| 区块标题 | 48px (3.00rem) | 600 | 1.00 | -1.2px | `text-5xl font-semibold tracking-tight leading-none` |
| 副标题 | 36px (2.25rem) | 600 | 1.10 | -0.9px | `text-4xl font-semibold tracking-tight leading-tight` |
| 卡片标题 | 20px (1.25rem) | 400 | 1.25 | 0 | `text-xl font-normal leading-tight` |
| 正文大 | 18px (1.13rem) | 400 | 1.38 | 0 | `text-lg font-normal leading-relaxed` |
| 正文 | 16px (1.00rem) | 400 | 1.50 | 0 | `text-base font-normal leading-relaxed` |
| 按钮 | 16px (1.00rem) | 400 | 1.50 | 0 | `text-base font-normal leading-relaxed` |
| 说明文字 | 14px (0.88rem) | 400 | 1.50 | 0 | `text-sm font-normal leading-relaxed` |

---

## 3. 组件样式

### 3.1 按钮

#### Primary Dark（主按钮）

```tsx
<button className="
  bg-[#1c1c1c]
  text-[#fcfbf8]
  px-4 py-2
  rounded-md
  shadow-[0_0_0_0_rgba(0,0,0,0),0_0_0_0_rgba(0,0,0,0),rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]
  active:opacity-80
  focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
  focus-visible:outline-none
">
  按钮文本
</button>
```

#### Ghost / Outline（次要按钮）

```tsx
<button className="
  bg-transparent
  text-[#1c1c1c]
  px-4 py-2
  rounded-md
  border border-[rgba(28,28,28,0.4)]
  active:opacity-80
  focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
  focus-visible:outline-none
">
  按钮文本
</button>
```

#### Cream Surface（三级按钮）

```tsx
<button className="
  bg-[#f7f4ed]
  text-[#1c1c1c]
  px-4 py-2
  rounded-md
  active:opacity-80
  focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
  focus-visible:outline-none
">
  按钮文本
</button>
```

#### Pill / Icon（药丸/图标按钮）

```tsx
<button className="
  bg-[#f7f4ed]
  text-[#1c1c1c]
  px-3 py-3
  rounded-full
  opacity-50
  hover:opacity-80
  active:opacity-100
  shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]
">
  <Icon />
</button>
```

### 3.2 卡片

```tsx
<div className="
  bg-[#f7f4ed]
  border border-[#eceae4]
  rounded-xl
  p-4
  shadow-none
">
  <h3 className="text-xl font-normal text-[#1c1c1c] leading-tight">卡片标题</h3>
  <p className="text-sm font-normal text-[#5f5f5d] leading-relaxed mt-2">
    卡片内容
  </p>
</div>
```

### 3.3 输入框

```tsx
<input
  type="text"
  className="
    bg-[#f7f4ed]
    text-[#1c1c1c]
    placeholder:text-[#5f5f5d]
    border border-[#eceae4]
    rounded-md
    px-3 py-2
    focus-visible:ring-2
    focus-visible:ring-[rgba(59,130,246,0.5)]
    focus-visible:outline-none
  "
  placeholder="输入内容..."
/>
```

### 3.4 标签页（侧边导航）

```tsx
<TabGroup>
  <TabsList className="flex flex-col gap-2">
    <TabsTrigger 
      value="chat"
      className="data-[state=active]:bg-[#1c1c1c] data-[state=active]:text-[#fcfbf8] text-[#5f5f5d] px-4 py-2 rounded-md transition-colors"
    >
      💬 聊天
    </TabsTrigger>
    <TabsTrigger 
      value="settings"
      className="data-[state=active]:bg-[#1c1c1c] data-[state=active]:text-[#fcfbf8] text-[#5f5f5d] px-4 py-2 rounded-md transition-colors"
    >
      ⚙ 设置
    </TabsTrigger>
    <TabsTrigger 
      value="design"
      className="data-[state=active]:bg-[#1c1c1c] data-[state=active]:text-[#fcfbf8] text-[#5f5f5d] px-4 py-2 rounded-md transition-colors"
    >
      🎨 设计
    </TabsTrigger>
  </TabsList>
</TabGroup>
```

**样式说明**:
- 选中态: `#1c1c1c` 背景 + `#fcfbf8` 文字
- 未选中态: 透明背景 + `#5f5f5d` 灰色文字
- 圆角: 6px（与按钮一致）
- 过渡: `transition-colors` 平滑切换

### 3.5 导航栏

```tsx
<nav className="
  fixed top-0 left-0 right-0
  bg-[#f7f4ed]
  border-b border-[#eceae4] or border-0
  px-6 py-4
  z-50
">
  <div className="max-w-[1200px] mx-auto flex items-center justify-between">
    {/* Logo */}
    <div className="text-[#1c1c1c] text-lg font-normal">Laifu Design</div>

    {/* Links */}
    <div className="hidden md:flex items-center gap-8">
      <a href="#" className="text-[#1c1c1c] text-base font-normal hover:underline">
        链接
      </a>
      {/* 更多链接 */}
    </div>

    {/* CTA */}
    <button className="
      bg-[#1c1c1c]
      text-[#fcfbf8]
      px-4 py-2
      rounded-md
      shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]
    ">
      CTA
    </button>
  </div>
</nav>
```

---

## 4. 边框圆角系统

```json
{
  "borderRadius": {
    "micro": "4px",      // 小按钮、交互元素
    "standard": "6px",   // 按钮、输入框、导航菜单
    "comfortable": "8px", // 紧凑卡片
    "card": "12px",      // 标准卡片、图片容器
    "container": "16px", // 大容器
    "full": "9999px"     // 药丸按钮、图标按钮
  }
}
```

---

## 5. 间距系统

```json
{
  "spacing": {
    "scale": [
      8, 10, 12, 16, 24, 32, 40, 56, 80, 96, 128, 176, 192, 208
    ]
  }
}
```

- 基础单位：8px
- 区块间距：80px–208px（大尺寸的编辑式呼吸感）
- 卡片内间距：12–24px（紧凑）
- 页面内边距：64px–96px

---

## 6. 深度与阴影

```typescript
// 定义阴影变量
const shadows = {
  // 无阴影
  none: 'none',

  // 边框级别（主要边界方式）
  border: '1px solid #eceae4',

  // 内阴影（深色按钮签名效果）
  inset: 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',

  // 焦点阴影
  focus: 'rgba(0,0,0,0.1) 0px 4px 12px',

  // 焦点环（无障碍）
  ring: '0 0 0 2px rgba(59,130,246,0.5)'
}
```

---

## 7. DesignSystem 配置（用于智能体）

```typescript
// src/types/design-system.ts
export interface LaifuDesignSystem {
  colors: {
    background: '#f7f4ed'
    foreground: '#1c1c1c'
    border: '#eceae4'
    borderInteractive: 'rgba(28,28,28,0.4)'
    muted: '#5f5f5d'
    card: '#f7f4ed'
    input: '#f7f4ed'
    ring: 'rgba(59,130,246,0.5)'
  }
  typography: {
    fontFamily: "'Camera Plain Variable', 'Inter', ui-sans-serif, system-ui, sans-serif"
    fontWeights: {
      body: 400
      display: 480
      heading: 600
    }
    sizes: {
      hero: { size: '3.75rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.15em' }
      heading: { size: '3rem', weight: 600, lineHeight: 1.00, letterSpacing: '-0.12em' }
      subheading: { size: '2.25rem', weight: 600, lineHeight: 1.10, letterSpacing: '-0.09em' }
      body: { size: '1rem', weight: 400, lineHeight: 1.50, letterSpacing: '0' }
    }
  }
  spacing: {
    base: 8
    section: [80, 96, 128, 176, 192, 208]
  }
  borderRadius: {
    micro: 4
    standard: 6
    comfortable: 8
    card: 12
    container: 16
    full: 9999
  }
  shadows: {
    inset: 'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px'
    focus: 'rgba(0,0,0,0.1) 0px 4px 12px'
    ring: '0 0 0 2px rgba(59,130,246,0.5)'
  }
}
```

---

## 8. 智能体提示词模板

### UI 生成提示词

```
你是一个 UI 设计智能体，遵循 Lovable 设计系统规范。

设计规范：
- 背景：#f7f4ed（暖奶油色）
- 主文本：#1c1c1c（炭黑色）
- 次要文本：#5f5f5d
- 边框：#eceae4（被动）、rgba(28,28,28,0.4)（交互）
- 字体：Camera Plain Variable，字重 400（正文）和 600（标题）
- 标题字间距：60px 用 -1.5px，48px 用 -1.2px，36px 用 -0.9px
- 按钮圆角：6px（矩形）、9999px（药丸/图标）
- 深度系统：主要靠边框而非阴影，深色按钮使用内阴影效果
- 内阴影：rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px
- 焦点阴影：rgba(0,0,0,0.1) 0px 4px 12px

生成要求：
1. 使用 Tailwind CSS 类名
2. 严格遵循颜色、字体、间距、圆角规范
3. 不要使用纯白色 (#ffffff) 作为背景
4. 不要使用重量大于 600 的字重
5. 卡片使用边框而非阴影

请根据以上规范生成 UI 代码。
```

---

## 9. 响应式断点

| 名称 | 宽度 | 关键变化 |
|------|------|----------|
| Mobile | < 768px | 单列布局，导航收起为汉堡菜单 |
| Tablet | 768px–1024px | 双列网格 |
| Desktop | 1024px+ | 多列布局，完整导航 |

---

## 10. 与 shadcn/ui 集成

### Button 组件扩展

```tsx
// components/ui/button.tsx
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'cream' | 'pill'
  size?: 'default' | 'sm' | 'lg'
}

export function Button({ variant = 'primary', size = 'default', className, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[#1c1c1c] text-[#fcfbf8] shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]',
    ghost: 'bg-transparent text-[#1c1c1c] border border-[rgba(28,28,28,0.4)]',
    cream: 'bg-[#f7f4ed] text-[#1c1c1c]',
    pill: 'bg-[#f7f4ed] text-[#1c1c1c] rounded-full shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]'
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    default: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        'rounded-md active:opacity-80 focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)] focus-visible:outline-none transition-all',
        variants[variant],
        sizes[size],
        variant !== 'pill' && 'rounded-md',
        className
      )}
      {...props}
    />
  )
}
```

---

## 11. 遵守原则

### Do（应该）

- 使用暖奶油色 (#f7f4ed) 作为页面基础
- Camera Plain Variable 在大尺寸下使用负字间距
- 所有灰色从 #1c1c1c 的透明度变化衍生
- 深色按钮使用内阴影效果
- 使用 #eceae4 边框而非阴影做卡片容器
- 字重限制在 400 和 600
- 全圆角 (9999px) 仅用于药丸/图标按钮
- 激活状态使用 opacity 0.8

### Don't（不应该）

- 不要使用纯白色 (#ffffff) 作为背景
- 不要用重阴影做卡片容器
- 不要引入饱和的强调色
- 不要使用字重 700（bold）
- 不要在矩形按钮上用 9999px 圆角
- 不要用锐利的焦点轮廓
- 不要混用边框样式
- 不要增加标题字间距

---

## 12. 设计系统版本

- 来源：Lovable（通过 `npx getdesign@latest add lovable` 生成）
- 版本：2026-04-29
- 技术栈：React + Vite + TailwindCSS + shadcn/ui + Radix UI

---

## 相关文件

- `DESIGN.md` — 完整 Lovable 设计系统规范
- `lovable-integration.md` — 本集成文档
- `architecture-design.md` — Laifu Design 架构设计
- `mvp-plan-20260429.md` — MVP 开发计划
