/**
 * 模型配置 localStorage 持久化 hook
 * 保存/读取用户配置的 API 地址、Key、模型等
 */

import { useState, useCallback, useEffect } from 'react'
import type { ModelConfig, ProviderType } from '@/engine/ModelClient'

const STORAGE_KEY = 'laifudesign-model-config'

/** 从 localStorage 读取配置，无则返回默认 */
function loadConfig(): ModelConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ModelConfig
      // 基本校验
      if (parsed.provider && parsed.apiUrl && parsed.model) {
        return parsed
      }
    }
  } catch {
    // 解析失败，使用默认
  }

  return {
    provider: 'openai',
    apiUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 8192,
    temperature: 0.7,
  }
}

/** 保存配置到 localStorage */
function saveConfig(config: ModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage 满或不可用
    console.warn('[modelConfigStore] Failed to save config to localStorage')
  }
}

/** 验证 API Key 格式（基础校验） */
export function validateApiKey(key: string, provider: ProviderType): string | null {
  void provider
  if (!key.trim()) return 'API Key 不能为空'
  if (key.trim().length < 5) return 'Key 长度不足'

  return null
}

/** 模型配置 store hook */
export function useModelConfig() {
  const [config, setConfigState] = useState<ModelConfig>(loadConfig)

  // 初始化时同步 localStorage
  useEffect(() => {
    saveConfig(config)
  }, [config])

  /** 更新配置（部分更新） */
  const updateConfig = useCallback((partial: Partial<ModelConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial }
      saveConfig(next)
      return next
    })
  }, [])

  /** 切换 provider（保留 apiKey 和 apiUrl，重置 model） */
  const switchProvider = useCallback((provider: ProviderType) => {
    setConfigState((prev) => {
      const next: ModelConfig = {
        ...prev,
        provider,
        model: '',
      }
      saveConfig(next)
      return next
    })
  }, [])

  /** 重置为默认配置 */
  const resetConfig = useCallback(() => {
    const defaultConfig: ModelConfig = {
      provider: 'openai',
      apiUrl: '',
      apiKey: '',
      model: '',
      maxTokens: 8192,
      temperature: 0.7,
    }
    setConfigState(defaultConfig)
    saveConfig(defaultConfig)
  }, [])

  return {
    config,
    updateConfig,
    switchProvider,
    resetConfig,
  }
}
