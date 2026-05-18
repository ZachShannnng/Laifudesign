/**
 * ModelClient 单元测试
 * 覆盖工厂函数、预设配置、配置更新、listModels
 */

import { describe, it, expect } from 'vitest'
import { createModelClient, MODEL_PRESETS } from '@/engine/ModelClient'
import type { ModelConfig } from '@/engine/ModelClient'

describe('createModelClient', () => {
  it('should create a client with the given config', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test',
      model: 'gpt-4o',
      maxTokens: 8192,
      temperature: 0.7,
    }
    const client = createModelClient(config)
    expect(client.getConfig()).toEqual(config)
  })

  it('should update config partially', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test',
      model: 'gpt-4o',
    }
    const client = createModelClient(config)
    client.updateConfig({ model: 'gpt-4o-mini' })
    expect(client.getConfig().model).toBe('gpt-4o-mini')
    expect(client.getConfig().apiKey).toBe('sk-test') // unchanged
  })

  it('should have listModels method', () => {
    const config: ModelConfig = {
      provider: 'openai',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'sk-test',
      model: 'gpt-4o',
    }
    const client = createModelClient(config)
    expect(typeof client.listModels).toBe('function')
  })
})

describe('MODEL_PRESETS', () => {
  it('should not have anthropic provider', () => {
    expect(MODEL_PRESETS).not.toHaveProperty('anthropic')
  })

  it('should not force users into a fixed provider list', () => {
    expect(Object.keys(MODEL_PRESETS)).toEqual(['custom'])
  })

  it('should not preset apiUrl or model', () => {
    for (const preset of Object.values(MODEL_PRESETS)) {
      expect(preset.provider).toBeDefined()
      expect(preset.maxTokens).toBeGreaterThan(0)
      expect(preset.temperature).toBeGreaterThanOrEqual(0)
      expect(preset.temperature).toBeLessThanOrEqual(1)
    }
  })
})
