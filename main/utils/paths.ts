/**
 * Laifu Design — 路径工具模块
 * 统一管理应用数据目录和项目目录路径
 */

import path from 'node:path';

/**
 * 获取应用数据目录
 * - 开发环境：项目根目录下的 .laifu
 * - 生产环境：Electron app.getPath('userData') 下的 .laifu
 */
export function getDataDir(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    return path.join(process.cwd(), '.laifu');
  }
  // 生产环境需要从 electron app 获取，这里使用环境变量作为回退
  // 在 main.ts 中启动时会正确设置
  return process.env.LAIFU_USER_DATA
    ? path.join(process.env.LAIFU_USER_DATA, '.laifu')
    : path.join(process.cwd(), '.laifu');
}

/**
 * 设置生产环境的用户数据目录
 * 在 Electron 主进程启动时调用
 */
export function setUserDataDir(userData: string): void {
  process.env.LAIFU_USER_DATA = userData;
}

/**
 * 获取项目目录路径
 * @param projectId 项目 ID
 */
export function getProjectDir(projectId: string): string {
  const dataDir = getDataDir();
  return path.join(dataDir, 'projects', projectId);
}

/** 规范化项目内文件路径，拒绝目录穿越和绝对路径。 */
export function normalizeProjectRelativePath(userPath: string | undefined, fallback = 'index.html'): string {
  const raw = (userPath || fallback).trim().replace(/\\/g, '/');
  if (!raw || path.posix.isAbsolute(raw)) {
    throw new Error('Invalid project file path');
  }

  const parts = raw.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Invalid project file path');
  }

  return parts.join('/');
}

/** 获取项目内文件的绝对路径，确保结果仍在项目目录内。 */
export function resolveProjectFilePath(projectId: string, userPath: string | undefined, fallback = 'index.html'): {
  relativePath: string;
  fullPath: string;
} {
  const projectDir = getProjectDir(projectId);
  const relativePath = normalizeProjectRelativePath(userPath, fallback);
  const fullPath = path.resolve(projectDir, ...relativePath.split('/'));
  const base = path.resolve(projectDir);

  if (fullPath !== base && !fullPath.startsWith(base + path.sep)) {
    throw new Error('Path traversal detected');
  }

  return { relativePath, fullPath };
}

/**
 * 获取项目数据目录（projects 子目录）
 * 与 getProjectDir 保持一致，提供更明确的语义
 */
export function getProjectDataDir(): string {
  const dataDir = getDataDir();
  return path.join(dataDir, 'projects');
}
