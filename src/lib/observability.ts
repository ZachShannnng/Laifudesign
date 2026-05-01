/**
 * 观测性配置
 * 日志级别、指标定义、追踪配置
 * 基于 CEO Review Section 8 发现的缺失（完全缺失）
 */

// ========== 日志配置 ==========

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
} as const

export const LogFormat = {
  json: 'json',
  text: 'text'
} as const

/**
 * 日志目标定义
 * 每个日志可以指定一个或多个目标
 */
export const LogTarget = {
  modelCall: 'model_call',           // 模型 API 调用
  toolExecution: 'tool_execution',    // 工具执行
  uiInteraction: 'ui_interaction',    // 用户交互
  error: 'error',                  // 错误
  performance: 'performance'         // 性能指标
}

// ========== 指标配置 ==========

/**
 * 生成延迟 (ms) - 生成 UI 所需时间
 */
export const GENERATION_LATENCY = 'ui_generation_latency_ms'

/**
 * 工具执行时间 (ms) - 单个工具运行耗时
 */
export const TOOL_EXECUTION_TIME = 'tool_execution_ms'

/**
 * 错误率 - 每分钟错误数
 */
export const ERROR_RATE = 'error_rate_per_minute'

/**
 * 用户满意度 (通过反馈收集）
 */
export const USER_SATISFACTION = 'user_satisfaction_score'

// ========== 追踪配置 ==========

/**
 * 是否启用追踪（默认关闭，MVP 阶段不启用以简化）
 */
export const TRACE_CONFIG = {
  enabled: false,           // MVP 阶段关闭
  sampleRate: 0.01,        // 1% 的请求包含 trace ID
  maxTraceEntries: 100,      // 最大保留条目数
} as const

/**
 * 日志工具函数
 */
export class Logger {
  private static logTarget: LogTarget[] = []

  /**
   * 写入日志
   */
  static log(target: LogTarget | LogTarget[], level: LogLevel, data: any, context?: Record<string, any>) {
    // MVP 阶段：仅写入到 console
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      target,
      data,
      context
    }))

    // 如果追踪启用且目标是模型调用，生成 trace ID
    if (TRACE_CONFIG.enabled && (target === LogTarget.modelCall || target === LogTarget.toolExecution)) {
      // 简化 trace ID: timestamp + 随机数
      const traceId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`
      this.logTarget.push(traceId)

      // 在数据中包含 trace ID
      const finalData = { ...data, _traceId: traceId }
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        target,
        data: finalData,
        context
      }))

      // 清理过期的 trace 目标
      if (this.logTarget.length > TRACE_CONFIG.maxTraceEntries) {
        this.logTarget = this.logTarget.slice(-TRACE_CONFIG.maxTraceEntries)
      }
    }
  }

  /**
   * 性能测量包装器
   */
  static measureTime<T>(name: string, fn: () => Promise<T>): Promise<{ value: T; duration: number }> {
    const start = performance.now()
    return fn().then(value => {
      const end = performance.now()
      const duration = end - start

      // 记录到性能指标
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: LogLevel.debug,
        target: LogTarget.performance,
        data: {
          metric: name,
          value,
          duration
        }
      }))

      return { value, duration }
    })
  }

  /**
   * 获取当前统计（仅用于开发阶段，生产环境需专业监控系统）
   */
  static getStats() {
    return {
      logTargets: this.logTarget,
      traceConfig: TRACE_CONFIG
    }
  }
}
