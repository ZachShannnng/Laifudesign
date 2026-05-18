/**
 * Laifu Design — Artifacts API 路由
 * GET /api/projects/:projectId/artifacts - 列出项目的所有 artifacts
 * GET /api/artifacts/:id - 获取单个 artifact
 * POST /api/artifacts - 保存/更新 artifact
 * DELETE /api/artifacts/:id - 删除 artifact
 * POST /api/artifacts/lint - Lint artifact（Anti-slop，后续实现）
 */

import { Request, Response } from 'express';
import { openDatabase, listArtifacts, getArtifact, upsertArtifact, deleteArtifact, getProject, updateProject as dbUpdateProject } from '../db.js';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveProjectFilePath } from '../utils/paths.js';
import { lintArtifact, getLintSummary } from '../lint-artifact.js';

/** 注册 Artifacts 路由 */
export function registerArtifactRoutes(app: any): void {
  // GET /api/projects/:projectId/artifacts - 列出项目的所有 artifacts
  app.get('/api/projects/:projectId/artifacts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const artifacts = listArtifacts(db, projectId);
      res.json({ ok: true, artifacts });
    } catch (err) {
      console.error('[API] GET /api/projects/:projectId/artifacts error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list artifacts' });
    }
  });

  // GET /api/artifacts/:id - 获取单个 artifact
  app.get('/api/artifacts/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();
      const artifact = getArtifact(db, id);
      if (!artifact) {
        res.status(404).json({ ok: false, error: 'Artifact not found' });
        return;
      }
      res.json({ ok: true, artifact });
    } catch (err) {
      console.error('[API] GET /api/artifacts/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to get artifact' });
    }
  });

  // POST /api/artifacts - 保存/更新 artifact
  app.post('/api/artifacts', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, projectId, identifier, title, html, manifest } = req.body;

      if (!projectId || !identifier || !html) {
        res.status(400).json({
          ok: false,
          error: 'projectId, identifier, and html are required',
        });
        return;
      }

      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const artifactId = id || randomUUID();
      const { relativePath, fullPath } = resolveProjectFilePath(projectId, identifier, 'index.html');
      const artifact = upsertArtifact(db, {
        id: artifactId,
        projectId,
        identifier: relativePath,
        title,
        html,
        manifest,
      });

      // 同时保存到项目文件
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, html, 'utf-8');

      // 更新项目的 updatedAt
      dbUpdateProject(db, projectId, {});

      res.status(201).json({ ok: true, artifact });
    } catch (err) {
      console.error('[API] POST /api/artifacts error:', err);
      res.status(500).json({ ok: false, error: 'Failed to save artifact' });
    }
  });

  // DELETE /api/artifacts/:id - 删除 artifact
  app.delete('/api/artifacts/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await openDatabase();

      const artifact = getArtifact(db, id);
      if (!artifact) {
        res.status(404).json({ ok: false, error: 'Artifact not found' });
        return;
      }

      deleteArtifact(db, id);

      // 删除项目文件
      const { fullPath } = resolveProjectFilePath(artifact.projectId, artifact.identifier, 'index.html');
      await fs.unlink(fullPath).catch(() => {
        // 忽略文件不存在的情况
      });

      // 更新项目的 updatedAt
      dbUpdateProject(db, artifact.projectId, {});

      res.json({ ok: true, deleted: id });
    } catch (err) {
      console.error('[API] DELETE /api/artifacts/:id error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete artifact' });
    }
  });

  // POST /api/artifacts/lint - Lint artifact（Anti-slop）
  app.post('/api/artifacts/lint', (req: Request, res: Response): void => {
    try {
      const { html, options } = req.body;

      if (!html || typeof html !== 'string') {
        res.status(400).json({ ok: false, error: 'html is required' });
        return;
      }

      const findings = lintArtifact(html, options);
      const summary = getLintSummary(findings);

      res.json({
        ok: true,
        findings,
        summary,
      });
    } catch (err) {
      console.error('[API] POST /api/artifacts/lint error:', err);
      res.status(500).json({ ok: false, error: 'Failed to lint artifact' });
    }
  });
}
