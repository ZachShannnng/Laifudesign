/**
 * Laifu Design — Skill 加载器
 * 扫描 skills/ 目录，加载 SKILL.md 文件
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/** Skill 前置信息（从 SKILL.md frontmatter 解析） */
export interface SkillFrontmatter {
  id: string;
  name: string;
  description: string;
  category?: string;
  platforms?: string[];
  outputFormats?: string[];
}

/** Skill 完整信息 */
export interface Skill extends SkillFrontmatter {
  /** SKILL.md 完整内容 */
  content: string;
  /** 技能目录路径 */
  directory: string;
  /** 是否包含模板文件 */
  hasTemplate?: boolean;
  /** 是否包含 checklist */
  hasChecklist?: boolean;
}

/**
 * 解析 SKILL.md frontmatter
 * 格式：---
 * key: value
 * ---
 */
function parseSkillFrontmatter(content: string): SkillFrontmatter | null {
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
  if (typeof frontmatter.platforms === 'string') {
    frontmatter.platforms = frontmatter.platforms.split(',').map((s: string) => s.trim());
  }
  if (typeof frontmatter.outputFormats === 'string') {
    frontmatter.outputFormats = frontmatter.outputFormats.split(',').map((s: string) => s.trim());
  }

  // 验证必需字段
  if (!frontmatter.id || !frontmatter.name || !frontmatter.description) {
    return null;
  }

  return frontmatter as unknown as SkillFrontmatter;
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
 * 获取 skills 目录路径
 */
function getSkillsDir(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    return path.join(process.cwd(), 'skills');
  }
  // 生产环境需要从 electron app 的 resources 目录获取
  return process.env.LAIFU_SKILLS_DIR || path.join(process.resourcesPath, 'skills');
}

/**
 * 加载单个 Skill
 */
async function loadSkill(skillDir: string): Promise<Skill | null> {
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  try {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    const frontmatter = parseSkillFrontmatter(content);

    if (!frontmatter) {
      console.warn(`[Skills] Invalid SKILL.md: ${skillDir}`);
      return null;
    }

    // 检查是否有模板文件
    const templatePath = path.join(skillDir, 'template.html');
    const hasTemplate = await fs.access(templatePath).then(() => true).catch(() => false);

    // 检查是否有 checklist
    const checklistPath = path.join(skillDir, 'checklist.md');
    const hasChecklist = await fs.access(checklistPath).then(() => true).catch(() => false);

    return {
      ...frontmatter,
      content,
      directory: skillDir,
      hasTemplate,
      hasChecklist,
    };
  } catch (err) {
    console.warn(`[Skills] Failed to load ${skillDir}:`, err);
    return null;
  }
}

/**
 * 列出所有 Skills
 */
export async function listSkills(): Promise<Skill[]> {
  const skillsDir = getSkillsDir();
  const skills: Skill[] = [];

  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = path.join(skillsDir, entry.name);
        const skill = await loadSkill(skillDir);
        if (skill) {
          skills.push(skill);
        }
      }
    }
  } catch (err) {
    console.error('[Skills] Failed to scan skills directory:', err);
  }

  return skills;
}

/**
 * 根据 ID 获取单个 Skill
 */
export async function getSkill(id: string): Promise<Skill | null> {
  const skills = await listSkills();
  return skills.find((s) => s.id === id) || null;
}

/**
 * 获取 Skill 的模板文件内容
 */
export async function getSkillTemplate(skillId: string): Promise<string | null> {
  const skillDir = path.join(getSkillsDir(), skillId);
  const templatePath = path.join(skillDir, 'template.html');

  try {
    return await fs.readFile(templatePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * 获取 Skill 的 checklist 内容
 */
export async function getSkillChecklist(skillId: string): Promise<string | null> {
  const skillDir = path.join(getSkillsDir(), skillId);
  const checklistPath = path.join(skillDir, 'checklist.md');

  try {
    return await fs.readFile(checklistPath, 'utf-8');
  } catch {
    return null;
  }
}
