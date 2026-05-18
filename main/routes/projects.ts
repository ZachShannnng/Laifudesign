/**
 * Laifu Design — Projects API 路由
 * GET /api/projects - 列出所有项目
 * GET /api/projects/:id - 获取单个项目
 * POST /api/projects - 创建项目
 * PUT /api/projects/:id - 更新项目
 * DELETE /api/projects/:id - 删除项目
 */

import { Request, Response } from 'express';
import { openDatabase, listProjects, getProject, insertProject, updateProject, deleteProject } from '../db.js';
import { promises as fs } from 'node:fs';
import { getProjectDir } from '../utils/paths.js';

/** 注册项目路由 */
export function registerProjectRoutes(app: any): void {
  // GET /api/projects - 列出所有项目
  app.get('/api/projects', async (_req: Request, res: Response): Promise<void> => {
    try {
      const db = await openDatabase();
      const projects = listProjects(db);
      res.json({ ok: true, projects });
    } catch (err) {
      console.error('[API] GET /api/projects error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list projects' });
    }
  });

  // GET /api/projects/:id - 获取单个项目
  app.get('/api/projects/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();
      const project = getProject(db, id);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }
      res.json({ ok: true, project });
    } catch (err) {
      console.error('[API] GET /api/projects/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get project' });
    }
  });

  // POST /api/projects - 创建项目
  app.post('/api/projects', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, name, skillId, designSystemId, metadata } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({ ok: false, error: 'name is required' });
        return;
      }

      const db = await openDatabase();
      const project = insertProject(db, { id, name, skillId, designSystemId, metadata });

      // 创建项目目录
      const projectDir = getProjectDir(project.id);
      await fs.mkdir(projectDir, { recursive: true });

      res.status(201).json({ ok: true, project });
    } catch (err) {
      console.error('[API] POST /api/projects error:', err);
      res.status(500).json({ ok: false, error: 'Failed to create project' });
    }
  });

  // PUT /api/projects/:id - 更新项目
  app.put('/api/projects/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, skillId, designSystemId, metadata } = req.body;

      const db = await openDatabase();
      const project = updateProject(db, id, { name, skillId, designSystemId, metadata });

      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      res.json({ ok: true, project });
    } catch (err) {
      console.error('[API] PUT /api/projects/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to update project' });
    }
  });

  // DELETE /api/projects/:id - 删除项目
  app.delete('/api/projects/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();

      const project = getProject(db, id);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      deleteProject(db, id);

      // 删除项目目录
      const projectDir = getProjectDir(id);
      await fs.rm(projectDir, { recursive: true, force: true });

      res.json({ ok: true, deleted: id });
    } catch (err) {
      console.error('[API] DELETE /api/projects/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete project' });
    }
  });
}
