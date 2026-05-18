/**
 * Laifu Design — 系统提示词组装器
 * composeSystemPrompt()：组装完整的系统提示词
 */

import { getOfficialSystem } from './official-system.js';
import { getDiscoveryPrompt } from './discovery.js';
import type { Skill } from '../skills.js';

/** 设计系统配置 */
export interface DesignSystemConfig {
  /** 设计系统名称 */
  name: string;
  /** 主色调 */
  primaryColor?: string;
  /** 字体族 */
  fontFamily?: string;
  /** 设计系统描述 */
  description?: string;
  /** 完整的 DESIGN.md 内容 */
  content?: string;
}

/** 系统提示词组装参数 */
export interface ComposeSystemPromptParams {
  /** Skill 信息 */
  skill?: Skill;
  /** 设计系统配置 */
  designSystem?: DesignSystemConfig;
  /** 是否包含 discovery 流程 */
  includeDiscovery?: boolean;
  /** 额外的上下文信息 */
  extraContext?: string;
}

/**
 * 组装完整的系统提示词
 */
export function composeSystemPrompt(params: ComposeSystemPromptParams = {}): string {
  const parts: string[] = [];

  // 1. 官方系统提示词
  parts.push(getOfficialSystem());
  parts.push('');

  // 2. Discovery 流程（如果需要）
  if (params.includeDiscovery !== false) {
    parts.push(getDiscoveryPrompt());
    parts.push('');
  }

  // 3. Skill 信息
  if (params.skill) {
    parts.push(`# Skill: ${params.skill.name}`);
    parts.push('');
    parts.push(params.skill.description);
    parts.push('');

    if (params.skill.category) {
      parts.push(`类别: ${params.skill.category}`);
    }
    if (params.skill.platforms) {
      parts.push(`平台: ${params.skill.platforms.join(', ')}`);
    }
    if (params.skill.outputFormats) {
      parts.push(`输出格式: ${params.skill.outputFormats.join(', ')}`);
    }
    parts.push('');

    if (params.skill.content) {
      parts.push('## Skill 详细规则');
      parts.push(stripFrontmatter(params.skill.content));
      parts.push('');
    }
  }

  // 4. 设计系统信息
  if (params.designSystem) {
    parts.push(`# Design System: ${params.designSystem.name}`);
    parts.push('');

    if (params.designSystem.description) {
      parts.push(params.designSystem.description);
      parts.push('');
    }

    if (params.designSystem.primaryColor) {
      parts.push(`主色调: ${params.designSystem.primaryColor}`);
    }
    if (params.designSystem.fontFamily) {
      parts.push(`字体: ${params.designSystem.fontFamily}`);
    }
    parts.push('');

    // 如果有完整的 DESIGN.md 内容，追加
    if (params.designSystem.content) {
      parts.push('## 设计系统详情');
      parts.push(params.designSystem.content);
      parts.push('');
    }
  }

  // 5. 额外上下文
  if (params.extraContext) {
    parts.push('# 上下文');
    parts.push(params.extraContext);
    parts.push('');
  }

  return parts.join('\n');
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}
