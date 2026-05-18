/**
 * Laifu Design — Skills API 路由
 * GET /api/skills - 列出所有 skills
 * GET /api/skills/:id - 获取单个 skill
 * GET /api/skills/:id/template - 获取 skill 模板
 * GET /api/skills/:id/checklist - 获取 skill checklist
 */

import { Request, Response } from 'express';
import { listSkills, getSkill, getSkillTemplate, getSkillChecklist } from '../skills.js';

/**
 * 注册 Skills 路由
 */
export function registerSkillRoutes(app: any): void {
  // GET /api/skills - 列出所有 skills
  app.get('/api/skills', async (_req: Request, res: Response): Promise<void> => {
    try {
      const skills = await listSkills();
      res.json({ ok: true, skills });
    } catch (err) {
      console.error('[API] GET /api/skills error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list skills' });
    }
  });

  // GET /api/skills/:id - 获取单个 skill
  app.get('/api/skills/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const skill = await getSkill(id);
      if (!skill) {
        res.status(404).json({ ok: false, error: 'Skill not found' });
        return;
      }
      res.json({ ok: true, skill });
    } catch (err) {
      console.error('[API] GET /api/skills/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get skill' });
    }
  });

  // GET /api/skills/:id/template - 获取 skill 模板
  app.get('/api/skills/:id/template', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await getSkillTemplate(id);
      if (!template) {
        res.status(404).json({ ok: false, error: 'Template not found' });
        return;
      }
      res.json({ ok: true, content: template });
    } catch (err) {
      console.error('[API] GET /api/skills/:id/template error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get template' });
    }
  });

  // GET /api/skills/:id/checklist - 获取 skill checklist
  app.get('/api/skills/:id/checklist', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const checklist = await getSkillChecklist(id);
      if (!checklist) {
        res.status(404).json({ ok: false, error: 'Checklist not found' });
        return;
      }
      res.json({ ok: true, content: checklist });
    } catch (err) {
      console.error('[API] GET /api/skills/:id/checklist error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get checklist' });
    }
  });
}
