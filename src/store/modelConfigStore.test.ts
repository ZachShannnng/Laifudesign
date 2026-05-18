/**
 * modelConfigStore 单元测试
 * 覆盖 validateApiKey 校验逻辑
 */

import { describe, it, expect } from 'vitest'
import { validateApiKey } from '@/store/modelConfigStore'

describe('validateApiKey', () => {
  it('should reject empty key for all providers', () => {
    expect(validateApiKey('', 'openai')).toBe('API Key 不能为空')
    expect(validateApiKey('  ', 'zhipu')).toBe('API Key 不能为空')
  })

  it('should validate key minimum length without provider-specific prefixes', () => {
    expect(validateApiKey('zhipu-token-without-sk-prefix', 'zhipu')).toBeNull()
    expect(validateApiKey('deepseek-token', 'DeepSeek')).toBeNull()
    expect(validateApiKey('abcde', 'custom')).toBeNull()
    expect(validateApiKey('ab', 'custom')).toBe('Key 长度不足')
  })
})
