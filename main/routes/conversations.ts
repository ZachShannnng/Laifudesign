/**
 * Laifu Design — Conversations API 路由
 * GET /api/projects/:projectId/conversations - 列出项目的所有对话
 * GET /api/conversations/:id - 获取单个对话
 * POST /api/projects/:projectId/conversations - 创建对话
 * PUT /api/conversations/:id - 更新对话
 * DELETE /api/conversations/:id - 删除对话
 *
 * GET /api/conversations/:id/messages - 获取对话的消息列表
 * POST /api/conversations/:id/messages - 发送消息
 */

import { Request, Response } from 'express';
import {
  openDatabase,
  listConversations,
  getConversation,
  insertConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  insertMessage,
  deleteMessages,
  getProject,
  updateProject,
} from '../db.js';

/** 注册对话和消息路由 */
export function registerConversationRoutes(app: any): void {
  // GET /api/projects/:projectId/conversations - 列出项目的所有对话
  app.get('/api/projects/:projectId/conversations', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const conversations = listConversations(db, projectId);
      res.json({ ok: true, conversations });
    } catch (err) {
      console.error('[API] GET /api/projects/:projectId/conversations error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list conversations' });
    }
  });

  // GET /api/conversations/:id - 获取单个对话
  app.get('/api/conversations/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();
      const conversation = getConversation(db, id);
      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }
      res.json({ ok: true, conversation });
    } catch (err) {
      console.error('[API] GET /api/conversations/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get conversation' });
    }
  });

  // POST /api/projects/:projectId/conversations - 创建对话
  app.post('/api/projects/:projectId/conversations', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { id, title } = req.body;

      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const conversation = insertConversation(db, { id, projectId, title });

      // 更新项目的 updatedAt
      updateProject(db, projectId, {});

      res.status(201).json({ ok: true, conversation });
    } catch (err) {
      console.error('[API] POST /api/projects/:projectId/conversations error:', err);
      res.status(500).json({ ok: false, error: 'Failed to create conversation' });
    }
  });

  // PUT /api/conversations/:id - 更新对话
  app.put('/api/conversations/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const db = await openDatabase();
      const conversation = updateConversation(db, id, { title });

      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }

      // 更新项目的 updatedAt
      updateProject(db, conversation.projectId, {});

      res.json({ ok: true, conversation });
    } catch (err) {
      console.error('[API] PUT /api/conversations/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to update conversation' });
    }
  });

  // DELETE /api/conversations/:id - 删除对话
  app.delete('/api/conversations/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();

      const conversation = getConversation(db, id);
      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }

      deleteConversation(db, id);

      // 更新项目的 updatedAt
      updateProject(db, conversation.projectId, {});

      res.json({ ok: true, deleted: id });
    } catch (err) {
      console.error('[API] DELETE /api/conversations/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete conversation' });
    }
  });

  // GET /api/conversations/:id/messages - 获取对话的消息列表
  app.get('/api/conversations/:id/messages', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();

      // 验证对话存在
      const conversation = getConversation(db, id);
      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }

      const messages = listMessages(db, id);
      res.json({ ok: true, messages });
    } catch (err) {
      console.error('[API] GET /api/conversations/:id/messages error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list messages' });
    }
  });

  // POST /api/conversations/:id/messages - 发送消息
  app.post('/api/conversations/:id/messages', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { id: msgId, role, content, toolName, toolInput, toolResult } = req.body;

      if (!role || !content) {
        res.status(400).json({ ok: false, error: 'role and content are required' });
        return;
      }

      const db = await openDatabase();

      // 验证对话存在
      const conversation = getConversation(db, id);
      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }

      const message = insertMessage(db, {
        id: msgId,
        conversationId: id,
        role,
        content,
        toolName,
        toolInput,
        toolResult,
      });

      // 更新对话和项目的 updatedAt
      updateConversation(db, id, {});
      updateProject(db, conversation.projectId, {});

      res.status(201).json({ ok: true, message });
    } catch (err) {
      console.error('[API] POST /api/conversations/:id/messages error:', err);
      res.status(500).json({ ok: false, error: 'Failed to create message' });
    }
  });

  // DELETE /api/conversations/:id/messages - 删除对话的所有消息
  app.delete('/api/conversations/:id/messages', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();

      // 验证对话存在
      const conversation = getConversation(db, id);
      if (!conversation) {
        res.status(404).json({ ok: false, error: 'Conversation not found' });
        return;
      }

      deleteMessages(db, id);

      res.json({ ok: true, deleted: id });
    } catch (err) {
      console.error('[API] DELETE /api/conversations/:id/messages error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete messages' });
    }
  });
}
