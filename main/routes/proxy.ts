/**
 * Laifu Design — Proxy API 路由（BYOK - Bring Your Own Key）
 * POST /api/proxy/stream - 代理流式请求到 OpenAI 兼容端点
 * POST /api/proxy/models - 获取可用模型列表
 * POST /api/proxy/test - 测试连接
 */

import { Request, Response } from 'express';
import { openAICompatibleStream, testConnection, fetchModels } from '../openai-compatible.js';

/** SSE 响应辅助函数 */
function sendSSE(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * 注册 Proxy 路由
 */
export function registerProxyRoutes(app: any): void {
  /**
   * POST /api/proxy/stream
   * 代理流式请求到 OpenAI 兼容端点
   * 与 /api/chat 功能类似，但不涉及数据库持久化
   */
  app.post('/api/proxy/stream', async (req: Request, res: Response): Promise<void> => {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { messages, model, tools } = req.body;

    // 验证必需参数
    if (!messages || !Array.isArray(messages)) {
      sendSSE(res, { type: 'error', error: 'messages is required and must be an array' });
      res.end();
      return;
    }

    if (!model || !model.apiUrl || !model.apiKey || !model.model) {
      sendSSE(res, { type: 'error', error: 'model configuration is incomplete' });
      res.end();
      return;
    }

    // 创建 AbortController 用于取消请求
    const controller = new AbortController();
    req.on('close', () => {
      controller.abort();
    });

    try {
      // 调用 OpenAI 兼容 API
      const stream = openAICompatibleStream({
        apiUrl: model.apiUrl,
        apiKey: model.apiKey,
        model: model.model,
        messages,
        tools,
        maxTokens: model.maxTokens,
        temperature: model.temperature,
        abortSignal: controller.signal,
      });

      // 流式输出
      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          sendSSE(res, { type: 'text', content: chunk.content });
        } else if (chunk.type === 'tool_use') {
          sendSSE(res, {
            type: 'tool_use',
            tool_name: chunk.toolName,
            tool_input: chunk.toolInput,
          });
        } else if (chunk.type === 'error') {
          sendSSE(res, { type: 'error', error: chunk.error });
          break;
        } else if (chunk.type === 'done') {
          sendSSE(res, { type: 'done' });
          break;
        }
      }
    } catch (err) {
      console.error('[API] POST /api/proxy/stream error:', err);
      sendSSE(res, { type: 'error', error: `Server error: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      res.end();
    }
  });

  /**
   * POST /api/proxy/models
   * 获取可用模型列表
   */
  app.post('/api/proxy/models', async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiUrl, apiKey } = req.body;

      if (!apiUrl || !apiKey) {
        res.status(400).json({ ok: false, error: 'apiUrl and apiKey are required' });
        return;
      }

      const models = await fetchModels({ apiUrl, apiKey });
      res.json({ ok: true, models });
    } catch (err) {
      console.error('[API] POST /api/proxy/models error:', err);
      res.status(500).json({ ok: false, error: 'Failed to fetch models' });
    }
  });

  /**
   * POST /api/proxy/test
   * 测试 API 连接
   */
  app.post('/api/proxy/test', async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiUrl, apiKey, model } = req.body;

      if (!apiUrl || !apiKey || !model) {
        res.status(400).json({ ok: false, error: 'apiUrl, apiKey, and model are required' });
        return;
      }

      const result = await testConnection({ apiUrl, apiKey, model });
      res.json(result);
    } catch (err) {
      console.error('[API] POST /api/proxy/test error:', err);
      res.status(500).json({ ok: false, error: 'Failed to test connection' });
    }
  });
}
