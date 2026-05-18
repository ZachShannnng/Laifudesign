/**
 * Laifu Design — Files API 路由
 * GET /api/projects/:projectId/files - 列出项目的所有文件
 * GET /api/projects/:projectId/files/* - 读取文件内容
 * PUT /api/projects/:projectId/files/* - 写入文件内容
 * DELETE /api/projects/:projectId/files/* - 删除文件
 */

import { Request, Response } from 'express';
import { openDatabase, listProjectFiles, upsertProjectFile, deleteProjectFile, getProject, updateProject } from '../db.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getProjectDir } from '../utils/paths.js';

/** 禁止的路径段，防止目录遍历 */
const FORBIDDEN_SEGMENT = /^$|^\.\.?$/;

/** 解析安全路径，防止目录遍历 */
function resolveSafe(baseDir: string, userPath: string): string {
  const parts = userPath.split(path.sep).filter((p) => !FORBIDDEN_SEGMENT.test(p));
  if (parts.length === 0) {
    return baseDir;
  }
  const resolved = path.join(baseDir, ...parts);
  const normalized = path.normalize(resolved);
  if (!normalized.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return normalized;
}

/** 注册 Files 路由 */
export function registerFileRoutes(app: any): void {
  // GET /api/projects/:projectId/files - 列出项目的所有文件
  app.get('/api/projects/:projectId/files', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      // 返回数据库中的文件元数据（不含 content）
      const dbFiles = listProjectFiles(db, projectId);
      const files = dbFiles.map(f => ({
        path: f.path,
        size: 0, // 数据库中不存储 size，需要从文件系统获取
        mtime: f.updatedAt,
      }));

      // 同时扫描实际文件系统，补充完整信息
      const projectDir = getProjectDir(projectId);
      const fsFiles = await scanFiles(projectDir, '');

      // 合并文件系统扫描结果（优先使用 fs 的 size 和 mtime）
      const fsMap = new Map(fsFiles.map(f => [f.path, f]));
      const merged = files.map(f => {
        const fsInfo = fsMap.get(f.path);
        return fsInfo || f;
      });

      // 添加数据库中不存在但文件系统存在的文件
      for (const fsFile of fsFiles) {
        if (!files.some(f => f.path === fsFile.path)) {
          merged.push(fsFile);
        }
      }

      res.json({ ok: true, files: merged });
    } catch (err) {
      console.error('[API] GET /api/projects/:projectId/files error:', err);
      res.status(500).json({ ok: false, error: 'Failed to list files' });
    }
  });

  // GET /api/projects/:projectId/files/* - 读取文件内容
  app.get('/api/projects/:projectId/files/*', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const filePath = req.params[0] || ''; // 捕获通配符部分

      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const projectDir = getProjectDir(projectId);
      const fullPath = resolveSafe(projectDir, filePath);

      // 检查文件是否存在
      const stat = await fs.stat(fullPath).catch(() => null);
      if (!stat) {
        res.status(404).json({ ok: false, error: 'File not found' });
        return;
      }

      if (!stat.isFile()) {
        res.status(400).json({ ok: false, error: 'Not a file' });
        return;
      }

      // 判断文件类型
      const ext = path.extname(fullPath).toLowerCase();
      const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext);
      const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.zip'].includes(ext);

      if (isImage) {
        // 返回图片
        const buffer = await fs.readFile(fullPath);
        res.setHeader('Content-Type', getMimeType(ext));
        res.send(buffer);
      } else if (isBinary) {
        // 二进制文件返回下载
        const buffer = await fs.readFile(fullPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(fullPath))}"`);
        res.send(buffer);
      } else {
        // 文本文件
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ ok: true, path: filePath, content, size: stat.size, mtime: stat.mtimeMs });
      }
    } catch (err) {
      console.error('[API] GET /api/projects/:projectId/files/* error:', err);
      res.status(500).json({ ok: false, error: 'Failed to read file' });
    }
  });

  // PUT /api/projects/:projectId/files/* - 写入文件内容
  app.put('/api/projects/:projectId/files/*', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const filePath = req.params[0] || '';
      const { content, base64 } = req.body;

      if (!filePath) {
        res.status(400).json({ ok: false, error: 'File path is required' });
        return;
      }

      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const projectDir = getProjectDir(projectId);
      const fullPath = resolveSafe(projectDir, filePath);

      // 确保目录存在
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // 写入文件
      if (base64) {
        const buffer = Buffer.from(base64, 'base64');
        await fs.writeFile(fullPath, buffer);
      } else {
        await fs.writeFile(fullPath, content ?? '', 'utf-8');
      }

      // 更新数据库中的文件记录
      const stat = await fs.stat(fullPath);
      upsertProjectFile(db, projectId, filePath, content);

      // 更新项目的 updatedAt
      updateProject(db, projectId, { updatedAt: Date.now() });

      res.json({
        ok: true,
        path: filePath,
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    } catch (err) {
      console.error('[API] PUT /api/projects/:projectId/files/* error:', err);
      res.status(500).json({ ok: false, error: 'Failed to write file' });
    }
  });

  // DELETE /api/projects/:projectId/files/* - 删除文件
  app.delete('/api/projects/:projectId/files/*', async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const filePath = req.params[0] || '';

      if (!filePath) {
        res.status(400).json({ ok: false, error: 'File path is required' });
        return;
      }

      const db = await openDatabase();

      // 验证项目存在
      const project = getProject(db, projectId);
      if (!project) {
        res.status(404).json({ ok: false, error: 'Project not found' });
        return;
      }

      const projectDir = getProjectDir(projectId);
      const fullPath = resolveSafe(projectDir, filePath);

      // 删除文件
      await fs.unlink(fullPath).catch(() => {
        // 忽略文件不存在的情况
      });

      // 从数据库中删除记录
      deleteProjectFile(db, projectId, filePath);

      // 更新项目的 updatedAt
      updateProject(db, projectId, { updatedAt: Date.now() });

      res.json({ ok: true, deleted: filePath });
    } catch (err) {
      console.error('[API] DELETE /api/projects/:projectId/files/* error:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete file' });
    }
  });
}

/** 递归扫描目录下的所有文件 */
async function scanFiles(dir: string, relDir: string): Promise<Array<{ path: string; size: number; mtime: number }>> {
  const out: Array<{ path: string; size: number; mtime: number }> = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过隐藏文件
      if (entry.name.startsWith('.')) continue;

      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await scanFiles(fullPath, relPath);
        out.push(...subFiles);
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        out.push({
          path: relPath,
          size: stat.size,
          mtime: stat.mtimeMs,
        });
      }
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return out;
}

/** 根据扩展名获取 MIME 类型 */
function getMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.html': 'text/html',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
