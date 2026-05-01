/**
 * 边缘情况定义和处理策略
 * 基于 CEO Review Section 4 发现的 7 个未处理的边缘情况
 */

// ========== ChatPanel 边缘情况 ==========

/**
 * 用户快速连续点击发送
 * 防抖：500ms 防止重复提交
 */
export const CHAT_DEBOUNCE = {
  waitMs: 500,
  handled: true,
  description: '发送消息时快速连续点击',
  solution: '禁用发送按钮，显示"处理中..."'
}

/**
 * 用户发送空字符串
 */
export const CHAT_EMPTY_STRING = {
  handled: true,
  description: '发送空字符串',
  solution: '禁用发送或显示提示"请输入内容"'
}

/**
 * 用户提交超长输入（>5000 字符）
 */
export const CHAT_INPUT_TOO_LONG = {
  handled: true,
  description: '输入超过最大长度',
  solution: '截断或显示提示"内容过长"',
  maxLength: 5000
}

// ========== AI 生成中边缘情况 ==========

/**
 * 用户导航离开页面（AI 生成中点击其他标签/链接）
 * 中止：在 onUnmount 中中止流式调用
 */
export const NAVIGATE_AWAY_MID_GENERATION = {
  handled: true,
  description: 'AI 生成中用户导航离开页面',
  solution: '在 onUnmount 中中止流式调用，显示会话已结束'
}

/**
 * 用户修改模型配置（AI 生成中切换模型）
 * 中止：取消当前请求，提示重新开始
 */
export const MODEL_CONFIG_CHANGE_MID_GENERATION = {
  handled: true,
  description: 'AI 生成中用户修改模型配置',
  solution: '取消当前请求，提示重新开始'
}

// ========== 预览区边缘情况 ==========

/**
 * iframe 内容为空（未生成任何内容）
 */
export const PREVIEW_EMPTY_CONTENT = {
  handled: false, // MVP 不强制处理
  description: '预览区内容为空',
  solution: '显示空状态提示文字'
}

/**
 * iframe 加载失败
 */
export const PREVIEW_IFRAME_LOAD_FAILURE = {
  handled: true,
  description: 'iframe 内容加载失败',
  solution: '显示加载失败占位符和重试按钮'
}

/**
 * iframe 跨域报错（如尝试加载外部资源）
 */
export const PREVIEW_CROSS_DOMAIN_ERROR = {
  handled: true,
  description: 'iframe 跨域报错',
  solution: '显示错误提示，建议用户刷新页面'
}

// ========== 设置面板边缘情况 ==========

/**
 * 用户未保存 API Key
 * MVP：使用 localStorage 默认配置，引导用户设置
 */
export const SETTINGS_NO_API_KEY = {
  handled: false, // MVP 不强制处理
  description: '用户未保存 API Key',
  solution: '显示默认配置，引导用户设置 API Key'
}

/**
 * 用户提交无效的 API Key 格式
 */
export const SETTINGS_INVALID_API_KEY = {
  handled: true,
  description: '用户提交无效的 API Key 格式',
  solution: '实时验证格式，提供错误提示'
}

/**
 * 设置面板被关闭（用户点击关闭）
 * 不处理
 */
export const SETTINGS_PANEL_CLOSED = {
  handled: true,
  description: '设置面板被关闭',
  solution: 'N/A'
}