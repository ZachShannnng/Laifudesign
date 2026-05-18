---
id: mobile-app
name: 移动应用
description: 创建高保真移动端 App 页面，覆盖 iOS/Android 常见产品界面和关键流程
category: mobile
platforms: mobile, ios, android
outputFormats: html, css
---

# Mobile App Skill

## 能力范围

- App 首页、详情页、表单页、设置页
- 登录注册、列表筛选、内容详情、支付/确认流程
- 移动端状态栏、安全区、底部导航、手势友好布局

## 设计原则

1. 以 390px 宽度为主要画布，保证单手操作和拇指热区。
2. 关键操作放在底部或主内容近端，避免难触达区域。
3. 使用真实移动 UI 密度，不做桌面网页缩小版。
4. 明确空状态、加载状态、错误状态和提交反馈。

## 输出要求

- 生成完整 HTML artifact。
- CSS 内联，避免依赖外部构建。
- 保持移动端 frame 内可读、可点、无横向溢出。
