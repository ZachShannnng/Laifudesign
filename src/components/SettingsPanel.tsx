/**
 * 设置面板组件
 * 流程：选提供商 → 填 URL + Key → 测试连接 → 自动发现模型 → 选模型 → 保存
 * - Provider pill 组（OpenAI / 智谱 / 自定义），无预设 URL
 * - 温度/MaxToken 折叠在"高级设置"下
 * - 连接成功后自动拉取模型列表
 * - API Key 眼睛按钮切换显示/隐藏
 * - Toast 胶囊形
 * - a11y：Tab 顺序、Enter 提交、ARIA labels
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Eye, EyeOff, X, Loader2, ChevronRight } from 'lucide-react'
import type { ModelConfig, ProviderType } from '@/engine/ModelClient'
import { validateApiKey } from '@/store/modelConfigStore'

interface SettingsPanelProps {
  config: {
    provider: ProviderType
    apiUrl: string
    apiKey: string
    model: string
    maxTokens?: number
    temperature?: number
  }
  onUpdate: (partial: Record<string, unknown>) => void
  onTestConnection: (config: ModelConfig) => Promise<{ ok: boolean; error?: string }>
  onListModels: (config: ModelConfig) => Promise<string[]>
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  background: 'var(--color-off-white)',
  fontSize: '13px',
  color: 'var(--color-charcoal)',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-charcoal-83)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-muted-text)',
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: 'var(--color-charcoal)',
  color: 'var(--color-off-white)',
  border: 'none',
  borderRadius: '9999px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: 'rgba(255,255,255,0.2) 0 0.5px 0 0 inset, rgba(0,0,0,0.2) 0 0 0 0.5px inset, rgba(0,0,0,0.05) 0 1px 2px 0',
  transition: 'opacity 0.15s',
}

const btnGhostStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: 'transparent',
  color: 'var(--color-charcoal)',
  border: '1px solid rgba(28,28,28,0.4)',
  borderRadius: '9999px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

export default function SettingsPanel({
  config,
  onUpdate,
  onTestConnection,
  onListModels,
  onClose,
}: SettingsPanelProps) {
  const [localApiUrl, setLocalApiUrl] = useState(config.apiUrl)
  const [localApiKey, setLocalApiKey] = useState(config.apiKey)
  const [localModel, setLocalModel] = useState(config.model)
  const [localProvider, setLocalProvider] = useState(config.provider || '')
  const [localMaxTokens, setLocalMaxTokens] = useState(config.maxTokens ?? 8192)
  const [localTemperature, setLocalTemperature] = useState(config.temperature ?? 0.7)

  const [showApiKey, setShowApiKey] = useState(false)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // 模型自动发现
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  useEffect(() => {
    setLocalApiUrl(config.apiUrl)
    setLocalProvider(config.provider || '')
    setLocalModel(config.model)
    setLocalMaxTokens(config.maxTokens ?? 8192)
    setLocalTemperature(config.temperature ?? 0.7)
  }, [config.apiUrl, config.provider, config.model, config.maxTokens, config.temperature])

  const formRef = useRef<HTMLFormElement>(null)

  const handleSave = useCallback(() => {
    if (!localApiUrl.trim()) {
      return
    }
    const keyError = validateApiKey(localApiKey, config.provider)
    if (keyError) {
      setApiKeyError(keyError)
      return
    }
    setApiKeyError(null)

    onUpdate({
      provider: localProvider.trim() || 'custom',
      apiUrl: localApiUrl,
      apiKey: localApiKey,
      model: localModel,
      maxTokens: localMaxTokens,
      temperature: localTemperature,
    })

    setSaveToast('✓ 配置已保存')
    setTimeout(() => setSaveToast(null), 2000)
  }, [localProvider, localApiUrl, localApiKey, localModel, localMaxTokens, localTemperature, config.provider, onUpdate])

  const handleTestConnection = useCallback(async () => {
    setTestStatus('testing')
    setTestError(null)
    setDiscoveredModels([])

    const currentConfig: ModelConfig = {
      provider: config.provider,
      apiUrl: localApiUrl,
      apiKey: localApiKey,
      model: localModel,
      maxTokens: localMaxTokens,
      temperature: localTemperature,
    }

    setModelsLoading(true)
    const models = await onListModels(currentConfig)
    setModelsLoading(false)

    const testModel = localModel.trim() || models[0]
    if (!testModel) {
      setTestStatus('error')
      setTestError('未发现模型，请手动输入模型名称后重试')
      return
    }

    const configToTest = { ...currentConfig, provider: localProvider.trim() || 'custom', model: testModel }
    const result = await onTestConnection(configToTest)
    if (result.ok) {
      setTestStatus('success')
      if (models.length > 0) setDiscoveredModels(models)
      setLocalModel(testModel)
    } else {
      setTestStatus('error')
      setTestError(result.error ?? '连接失败')
    }

    setTimeout(() => {
      setTestStatus('idle')
      setTestError(null)
    }, 5000)
  }, [config.provider, localProvider, localApiUrl, localApiKey, localModel, localMaxTokens, localTemperature, onTestConnection, onListModels])

  const handleApiKeyChange = useCallback(
    (value: string) => {
      setLocalApiKey(value)
      if (value.trim()) {
        setApiKeyError(validateApiKey(value, config.provider))
      } else {
        setApiKeyError(null)
      }
    },
    [config.provider]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave]
  )

  const canTest = localApiUrl.trim() && localApiKey.trim()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-cream)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600 }}>设置</h2>
        <button
          onClick={onClose}
          aria-label="关闭设置面板"
          style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', background: 'transparent', color: 'var(--color-muted-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(28,28,28,0.04)'; e.currentTarget.style.color = 'var(--color-charcoal)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted-text)' }}
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <form
        ref={formRef}
        onKeyDown={handleKeyDown}
        style={{ maxWidth: '440px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        aria-label="模型配置表单"
      >
        {/* Provider name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="settings-provider" style={labelStyle}>供应商名称（选填）</label>
          <input
            id="settings-provider"
            type="text"
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value)}
            placeholder="DeepSeek、智谱、OpenRouter..."
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          />
        </div>

        {/* API 地址 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="settings-api-url" style={labelStyle}>API 请求地址</label>
          <input
            id="settings-api-url"
            type="url"
            value={localApiUrl}
            onChange={(e) => setLocalApiUrl(e.target.value)}
            placeholder="https://api.deepseek.com"
            aria-describedby="settings-api-url-hint"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          />
          <span id="settings-api-url-hint" style={hintStyle}>
            填官方给出的 OpenAI-compatible 地址即可，可为服务根地址或 chat completions 端点
          </span>
        </div>

        {/* API Key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="settings-api-key" style={labelStyle}>API Key</label>
          <div style={{ position: 'relative' }}>
            <input
              id="settings-api-key"
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="输入 API Key"
              aria-invalid={apiKeyError ? 'true' : undefined}
              aria-describedby={apiKeyError ? 'settings-api-key-error' : undefined}
              style={{
                ...inputStyle,
                paddingRight: '36px',
                borderColor: apiKeyError ? '#c53030' : undefined,
              }}
              onFocus={(e) => { if (!apiKeyError) e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = apiKeyError ? '#c53030' : 'var(--color-border)' }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted-text)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-charcoal)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted-text)' }}
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {apiKeyError && (
            <span id="settings-api-key-error" style={{ fontSize: '11px', color: '#c53030', marginTop: '2px' }} role="alert">
              {apiKeyError}
            </span>
          )}
        </div>

        {/* 连接测试 + 模型发现 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={!canTest || testStatus === 'testing'}
            style={{
              ...btnGhostStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: (!canTest || testStatus === 'testing') ? 0.5 : 1,
              cursor: (!canTest || testStatus === 'testing') ? 'not-allowed' : 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (canTest && testStatus !== 'testing') {
                e.currentTarget.style.background = 'rgba(28,28,28,0.04)'
                e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(28,28,28,0.4)'
            }}
          >
            {testStatus === 'testing' || modelsLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            {testStatus === 'testing' ? '连接中…' : modelsLoading ? '发现模型中…' : '测试连接'}
          </button>

          {/* 测试结果 */}
          {testStatus === 'success' && !modelsLoading && (
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500 }} role="status">✓ 连接成功{discoveredModels.length > 0 ? `，发现 ${discoveredModels.length} 个模型` : ''}</span>
          )}
          {testStatus === 'error' && (
            <span style={{ fontSize: '12px', color: '#c53030', fontWeight: 500 }} role="alert" title={testError ?? ''}>
              ✗ {testError ?? '连接失败'}
            </span>
          )}
        </div>

        {/* 模型选择 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="settings-model" style={labelStyle}>模型</label>
          {discoveredModels.length > 0 ? (
            <select
              id="settings-model"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              style={{
                ...inputStyle,
                appearance: 'auto',
              }}
            >
              {discoveredModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              id="settings-model"
              type="text"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="测试连接后自动发现，或手动输入模型名称"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            />
          )}
          {discoveredModels.length === 0 && (
            <span style={hintStyle}>先测试连接，成功后自动列出可用模型</span>
          )}
        </div>

        {/* 高级设置折叠 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-charcoal-83)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-charcoal)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-charcoal-83)' }}
          >
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              style={{
                transition: 'transform 0.15s',
                transform: advancedOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            />
            高级设置
          </button>

          {advancedOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--color-border)' }}>
              {/* 温度 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>温度</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localTemperature}
                    onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-valuenow={localTemperature}
                    aria-label="温度"
                    style={{ flex: 1, accentColor: 'var(--color-charcoal)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                    {localTemperature.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* 最大 Token */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="settings-max-tokens" style={labelStyle}>最大 Token</label>
                <input
                  id="settings-max-tokens"
                  type="number"
                  min={256}
                  max={32768}
                  step={256}
                  value={localMaxTokens}
                  onChange={(e) => setLocalMaxTokens(parseInt(e.target.value, 10) || 8192)}
                  style={{ ...inputStyle, maxWidth: '120px' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(28,28,28,0.12)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <div style={{ marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!localApiUrl.trim() || !localApiKey.trim() || !localModel.trim()}
            style={{
              ...btnPrimaryStyle,
              width: '100%',
              opacity: (!localApiUrl.trim() || !localApiKey.trim() || !localModel.trim()) ? 0.5 : 1,
              cursor: (!localApiUrl.trim() || !localApiKey.trim() || !localModel.trim()) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (localApiUrl.trim() && localApiKey.trim() && localModel.trim()) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            保存配置
          </button>
        </div>
      </form>

      {/* Toast */}
      {saveToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-charcoal)',
            color: 'var(--color-off-white)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 50,
            animation: 'fadeIn 0.3s',
          }}
          role="status"
          aria-live="polite"
        >
          {saveToast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
