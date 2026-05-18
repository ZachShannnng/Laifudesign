/**
 * Laifu Design — Design System 加载器
 * 扫描 design-systems/ 目录，解析 DESIGN.md 文件
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/** Design System 前置信息 */
export interface DesignSystemFrontmatter {
  /** 设计系统 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 主色调 */
  primaryColor?: string;
  /** 字体族 */
  fontFamily?: string;
  /** 作者 */
  author?: string;
  /** 标签 */
  tags?: string[];
}

/** Design System 完整信息 */
export interface DesignSystem extends DesignSystemFrontmatter {
  /** DESIGN.md 完整内容 */
  content: string;
  /** 目录路径 */
  directory: string;
  /** 是否有预览图 */
  hasPreview?: boolean;
}

/**
 * 解析 DESIGN.md frontmatter
 */
function parseDesignSystemFrontmatter(content: string): DesignSystemFrontmatter | null {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) return null;

  const frontmatterText = match[1];
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterText.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      frontmatter[key.trim()] = parseYamlValue(value);
    }
  }

  // 解析数组类型字段
  if (typeof frontmatter.tags === 'string') {
    frontmatter.tags = frontmatter.tags.split(',').map((s: string) => s.trim());
  }

  // 验证必需字段
  if (!frontmatter.id || !frontmatter.name) {
    return null;
  }

  return frontmatter as unknown as DesignSystemFrontmatter;
}

/** 解析 YAML 值 */
function parseYamlValue(value: string): unknown {
  // 布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;
  // 数字
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  // 字符串（去掉引号）
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * 获取 design-systems 目录路径
 */
function getDesignSystemsDir(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    return path.join(process.cwd(), 'design-systems');
  }
  // 生产环境需要从 electron app 的 resources 目录获取
  return process.env.LAIFU_DESIGN_SYSTEMS_DIR || path.join(process.resourcesPath, 'design-systems');
}

/**
 * 加载单个 Design System
 */
async function loadDesignSystem(dsDir: string): Promise<DesignSystem | null> {
  const designMdPath = path.join(dsDir, 'DESIGN.md');

  try {
    const content = await fs.readFile(designMdPath, 'utf-8');
    const frontmatter = parseDesignSystemFrontmatter(content);

    if (!frontmatter) {
      // 如果没有 frontmatter，从目录名推断 id
      const dirName = path.basename(dsDir);
      console.warn(`[DesignSystems] No frontmatter in ${dsDir}, using directory name as id`);
      return {
        id: dirName,
        name: dirName,
        description: '',
        content,
        directory: dsDir,
      };
    }

    // 检查是否有预览图
    const previewPath = path.join(dsDir, 'preview.png');
    const hasPreview = await fs.access(previewPath).then(() => true).catch(() => false);

    return {
      ...frontmatter,
      content,
      directory: dsDir,
      hasPreview,
    };
  } catch (err) {
    console.warn(`[DesignSystems] Failed to load ${dsDir}:`, err);
    return null;
  }
}

/**
 * 列出所有 Design Systems
 */
export async function listDesignSystems(): Promise<DesignSystem[]> {
  const dsDir = getDesignSystemsDir();
  const designSystems: DesignSystem[] = [];

  try {
    const entries = await fs.readdir(dsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dsPath = path.join(dsDir, entry.name);
        const designMdPath = path.join(dsPath, 'DESIGN.md');

        // 只处理包含 DESIGN.md 的目录
        try {
          await fs.access(designMdPath);
          const ds = await loadDesignSystem(dsPath);
          if (ds) {
            designSystems.push(ds);
          }
        } catch {
          // 没有 DESIGN.md，跳过
        }
      }
    }
  } catch (err) {
    console.error('[DesignSystems] Failed to scan directory:', err);
  }

  return designSystems;
}

/**
 * 根据 ID 获取单个 Design System
 */
export async function getDesignSystem(id: string): Promise<DesignSystem | null> {
  const designSystems = await listDesignSystems();
  return designSystems.find((ds) => ds.id === id) || null;
}

/**
 * 生成 Design System 预览 HTML
 */
export function generatePreviewHtml(designSystem: DesignSystem): string {
  const primaryColor = designSystem.primaryColor || '#6366f1';
  const fontFamily = designSystem.fontFamily || 'ui-sans-serif, system-ui, sans-serif';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${designSystem.name} - Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fontFamily};
      background: #f9fafb;
      padding: 40px;
      color: #111827;
    }
    .preview {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { margin-bottom: 8px; font-size: 24px; }
    .subtitle { color: #6b7280; margin-bottom: 24px; }
    .color-swatch {
      display: inline-block;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      margin-right: 12px;
      vertical-align: middle;
      border: 1px solid #e5e7eb;
    }
    .components { margin-top: 32px; }
    .components h2 { margin-bottom: 16px; font-size: 18px; }
    button {
      background: ${primaryColor};
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      margin-right: 8px;
    }
    button.secondary {
      background: white;
      color: ${primaryColor};
      border: 1px solid ${primaryColor};
    }
    input {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      width: 200px;
      margin-right: 8px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="preview">
    <h1>${designSystem.name}</h1>
    <p class="subtitle">${designSystem.description || '暂无描述'}</p>

    <div class="color-swatch" style="background: ${primaryColor}"></div>
    <span>主色: ${primaryColor}</span>
    <span style="margin-left: 16px">字体: ${fontFamily}</span>

    <div class="components">
      <h2>组件示例</h2>
      <button>主要按钮</button>
      <button class="secondary">次要按钮</button>
      <input placeholder="输入框" />
    </div>

    <div class="card">
      <strong>卡片示例</strong>
      <p style="margin-top: 8px; color: #6b7280">这是一个使用当前设计系统的卡片组件。</p>
    </div>
  </div>
</body>
</html>`;
}
