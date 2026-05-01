/**
 * 错误处理与救援机制
 * 基于 CEO Review Section 2 发现的 CRITICAL GAPS
 * 为每个错误类型定义救援动作和用户可见的消息
 */

// ========== 错误类型定义 ==========

/**
 * API 调用超时
 */
export class TimeoutError extends Error {
  constructor(public message?: string) {
    super(message || 'API 调用超时，请检查网络连接')
    this.name = 'TimeoutError'
  }
}

/**
 * API 频率限制
 */
export class RateLimitError extends Error {
  constructor(public message?: string) {
    super(message || '请求过于频繁，请稍后再试')
    this.name = 'RateLimitError'
  }
}

/**
 * API Key 无效
 */
export class AuthError extends Error {
  constructor(public message?: string) {
    super(message || 'API Key 无效，请检查配置')
    this.name = 'AuthError'
  }
}

/**
 * 网络错误
 */
export class NetworkError extends Error {
  constructor(public message?: string) {
    super(message || '网络连接失败，请检查网络')
    this.name = 'NetworkError'
  }
}

/**
 * JSON 解析失败 - CRITICAL GAP（CEO Review 发现无救援动作）
 */
export class JSONParseError extends Error {
  constructor(public message?: string) {
    super(message || '生成内容格式异常，系统错误')
    this.name = 'JSONParseError'
  }
}

/**
 * 空响应
 */
export class EmptyResponseError extends Error {
  constructor(public message?: string) {
    super(message || 'API 返回空响应')
    this.name = 'EmptyResponseError'
  }
}

/**
 * 工具执行错误
 */
export class ToolError extends Error {
  constructor(public message?: string) {
    super(message || '工具执行失败')
    this.name = 'ToolError'
  }
}

/**
 * 工具执行超时
 */
export class ToolTimeoutError extends Error {
  constructor(public message?: string) {
    super(message || '工具执行超时，请重试')
    this.name = 'ToolTimeoutError'
  }
}

/**
 * 主题应用失败
 */
export class ThemeError extends Error {
  constructor(public message?: string) {
    super(message || '应用主题失败，使用默认样式')
    this.name = 'ThemeError'
  }
}

/**
 * 导出失败
 */
export class ExportError extends Error {
  constructor(public message?: string) {
    super(message || '导出失败，请手动复制')
    this.name = 'ExportError'
  }
}

/**
 * 存储空间不足 - CRITICAL GAP（CEO Review 发现无救援动作）
 */
export class StorageQuotaError extends Error {
  constructor(public message?: string) {
    super(message || '存储空间不足，请清理后重试')
    this.name = 'StorageQuotaError'
  }
}

/**
 * 存储被禁用 - CRITICAL GAP（CEO Review 发现无救援动作）
 */
export class StorageDisabledError extends Error {
  constructor(public message?: string) {
    super(message || '存储功能被禁用，无法保存配置')
    this.name = 'StorageDisabledError'
  }
}

// ========== 救援动作配置 ==========

/**
 * 错误救援配置
 * 每个错误类型的救援动作配置
 */
export const ERROR_RESCUE_MAP: Record<string, {
  retries: number
  userMessage: string
  rescueAction: () => void | Promise<void>
}> = {
  // API 错误
  [TimeoutError.name]: {
    retries: 2,
    userMessage: '服务暂时不可用',
    rescueAction: async (error: Error) => {
      // 等待 1 秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000))
      throw error // 重试
    }
  },

  [RateLimitError.name]: {
    retries: 3,
    userMessage: '请求过于频繁，请稍后再试',
    backoff: true,
    rescueAction: async (error: Error) => {
      // 指数退避：1s → 2s → 4s → 8s → 16s → 32s
      const backoffMs = Math.min(32000, (error as any).backoffMs || 1000) * Math.pow(2, (error as any).retryCount || 0)
      await new Promise(resolve => setTimeout(resolve, backoffMs))
      throw error
    }
  },

  [NetworkError.name]: {
    retries: 2,
    userMessage: '网络连接失败，请检查网络',
    rescueAction: async (error: Error) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      throw error
    }
  },

  [AuthError.name]: {
    retries: 0, // 不重试，提示用户检查配置
    userMessage: 'API Key 无效，请检查配置',
    rescueAction: () => {
      // 不重试，仅记录错误
    }
  },

  // JSON/响应错误
  [JSONParseError.name]: {
    retries: 0,
    userMessage: '生成内容格式异常，系统错误',
    rescueAction: () => {
      // 不重试，仅记录错误
    }
  },

  [EmptyResponseError.name]: {
    retries: 0,
    userMessage: 'API 返回空响应',
    rescueAction: () => {
      // 不重试，仅记录错误
    }
  },

  // 工具错误
  [ToolError.name]: {
    retries: 1, // 工具失败可重试一次
    userMessage: '工具执行失败，请重试',
    rescueAction: async (error: Error) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      throw error
    }
  },

  [ToolTimeoutError.name]: {
    retries: 0,
    userMessage: '工具执行超时，请重试',
    rescueAction: () => {
      // 不重试，仅记录错误
    }
  },

  // 主题/导出错误
  [ThemeError.name]: {
    retries: 0,
    userMessage: '应用主题失败，使用默认样式',
    rescueAction: () => {
      // 回退到默认样式
    }
  },

  [ExportError.name]: {
    retries: 0,
    userMessage: '导出失败，请手动复制',
    rescueAction: () => {
      // 提示手动复制
    }
  },

  // 存储错误
  [StorageQuotaError.name]: {
    retries: 0,
    userMessage: '存储空间不足，请清理后重试',
    rescueAction: () => {
      // 提示清理存储
    }
  },

  [StorageDisabledError.name]: {
    retries: 0,
    userMessage: '存储功能被禁用，无法保存配置',
    rescueAction: () => {
      // 记录错误，但不显示给用户（系统错误）
    }
  },
} as const
