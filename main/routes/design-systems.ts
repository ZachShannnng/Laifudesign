/**
 * Laifu Design — Design Systems API 路由
 * GET /api/design-systems - 列出所有 design systems
 * GET /api/design-systems/:id - 获取单个 design system
 * GET /api/design-systems/:id/preview - 生成设计系统预览 HTML
 * GET /api/design-systems/:id/content - 获取 DESIGN.md 原始内容
 */

import { Request, Response } from 'express';
import { renderDesignSystemPreview } from '../design-system-preview.js';
import { getDesignSystem, listDesignSystems } from '../design-systems.js';

/** 注册 Design Systems 路由 */
export function registerDesignSystemRoutes(app: any): void {
  // GET /api/design-systems - 列出所有 design systems
  app.get('/api/design-systems', async (_req: Request, res: Response): Promise<void> => {
    try {
      const designSystems = await listDesignSystems();
      res.json({ ok: true, designSystems });
    } catch (err) {
      console.error('[API] GET /api/design-systems error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list design systems' });
    }
  });

  // GET /api/design-systems/:id - 获取单个 design system
  app.get('/api/design-systems/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const designSystem = await getDesignSystem(id);
      if (!designSystem) {
        res.status(404).json({ ok: false, error: 'Design system not found' });
        return;
      }
      res.json({ ok: true, designSystem });
    } catch (err) {
      console.error('[API] GET /api/design-systems/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get design system' });
    }
  });

  // GET /api/design-systems/:id/preview - 生成设计系统预览 HTML
  app.get('/api/design-systems/:id/preview', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const designSystem = await getDesignSystem(id);
      if (!designSystem) {
        res.status(404).json({ ok: false, error: 'Design system not found' });
        return;
      }

      // 生成预览 HTML
      const previewHtml = renderDesignSystemPreview(id, designSystem.content);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(previewHtml);
    } catch (err) {
      console.error('[API] GET /api/design-systems/:id/preview error:', err);
      res.status(500).json({ ok: false, error: 'Failed to generate preview' });
    }
  });

  // GET /api/design-systems/:id/content - 获取 DESIGN.md 原始内容
  app.get('/api/design-systems/:id/content', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const designSystem = await getDesignSystem(id);
      if (!designSystem) {
        res.status(404).json({ ok: false, error: 'Design system not found' });
        return;
      }

      res.json({ ok: true, content: designSystem.content });
    } catch (err) {
      console.error('[API] GET /api/design-systems/:id/content error:', err);
      res.status(500).json({ ok: false, error: 'Failed to read design system content' });
    }
  });
}
