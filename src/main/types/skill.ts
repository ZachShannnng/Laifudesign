/**
 * Skill 类型定义
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  category?: string;
  platforms?: string[];
  outputFormats?: string[];
  content: string;
  directory: string;
  hasTemplate?: boolean;
  hasChecklist?: boolean;
}
