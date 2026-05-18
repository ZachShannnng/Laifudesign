/**
 * Design System 类型定义
 */

export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  primaryColor?: string;
  fontFamily?: string;
  author?: string;
  tags?: string[];
  content: string;
  directory: string;
  hasPreview?: boolean;
}
