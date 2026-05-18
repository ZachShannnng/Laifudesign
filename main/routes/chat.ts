/**
 * Laifu Design — Chat API 路由
 * POST /api/chat - SSE 流式聊天
 * POST /api/chat/stream - SSE 流式聊天（别名）
 */

import { Request, Response } from 'express';
import { openDatabase, getConversation } from '../db.js';
import { type OpenAIChatMessage, type OpenAIToolDefinition } from '../openai-compatible.js';
import { runLaifuAgent } from '../agent-runtime.js';

/** 聊天请求参数 */
interface ChatRequest {
  /** 对话 ID（可选，用于持久化） */
  conversationId?: string;
  /** 消息列表 */
  messages: OpenAIChatMessage[];
  /** 模型配置 */
  model: {
    /** API URL */
    apiUrl: string;
    /** API Key */
    apiKey: string;
    /** 模型名称 */
    model: string;
    /** 最大 token */
    maxTokens?: number;
    /** 温度 */
    temperature?: number;
  };
  /** 工具定义 */
  tools?: OpenAIToolDefinition[];
  /** 是否保存到数据库 */
  saveToDb?: boolean;
}

/**
 * SSE 响应辅助函数
 * 发送 SSE 格式数据
 */
function sendSSE(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function handleAgentChat(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const { conversationId, messages, model, tools, saveToDb = false } = req.body as ChatRequest;

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

  if (!conversationId) {
    sendSSE(res, { type: 'error', error: 'conversationId is required' });
    res.end();
    return;
  }

  const db = await openDatabase();
  if (!getConversation(db, conversationId)) {
    sendSSE(res, { type: 'error', error: 'Conversation not found' });
    res.end();
    return;
  }

  const controller = new AbortController();
  req.on('close', () => {
    controller.abort();
  });

  try {
    const stream = runLaifuAgent({
      conversationId,
      messages,
      model,
      tools,
      saveToDb,
      abortSignal: controller.signal,
    });

    for await (const event of stream) {
      sendSSE(res, event as unknown as Record<string, unknown>);
      if (event.type === 'error' || event.type === 'done') break;
    }
  } catch (err) {
    console.error('[API] chat error:', err);
    sendSSE(res, { type: 'error', error: `Server error: ${err instanceof Error ? err.message : String(err)}` });
  } finally {
    res.end();
  }
}

/**
 * 注册 Chat 路由
 */
export function registerChatRoutes(app: any): void {
  /**
   * POST /api/chat
   * SSE 流式聊天
   */
  app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
    await handleAgentChat(req, res);
  });

  /**
   * POST /api/chat/stream
   * SSE 流式聊天（别名，与 /api/chat 相同）
   */
  app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
    await handleAgentChat(req, res);
  });
}
