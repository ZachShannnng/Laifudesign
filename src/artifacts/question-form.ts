/**
 * Laifu Design — Question Form 类型定义
 * 与 artifact-parser.ts 的类型保持一致
 */

/** 问题表单字段类型 */
export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'direction-cards';

/** 问题表单字段 */
export interface QuestionFormField {
  /** 字段类型 */
  type: FieldType;
  /** 字段名称 */
  name: string;
  /** 标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 选项（select/radio/checkbox） */
  options?: QuestionFormOption[];
  /** 方向卡片（direction-cards） */
  cards?: DirectionCard[];
}

/** 表单选项 */
export interface QuestionFormOption {
  /** 选项值 */
  value: string;
  /** 选项标签 */
  label: string;
}

/** 方向卡片 */
export interface DirectionCard {
  /** 卡片 ID */
  id: string;
  /** 卡片名称 */
  name: string;
  /** 卡片描述 */
  description: string;
  /** 主色调 */
  color: string;
}

/** 问题表单 */
export interface QuestionForm {
  /** 表单 ID */
  id: string;
  /** 表单字段 */
  fields: QuestionFormField[];
}

/** 表单答案 */
export interface QuestionFormAnswers {
  [key: string]: string | string[];
}

/**
 * 格式化表单答案为提示词
 */
export function formatAnswersForPrompt(answers: QuestionFormAnswers): string {
  const lines: string[] = ['--- 用户回答 ---'];

  for (const [key, value] of Object.entries(answers)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${value.join(', ')}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('--- 结束 ---');
  return lines.join('\n');
}

/**
 * 验证表单答案
 */
export function validateAnswers(form: QuestionForm, answers: QuestionFormAnswers): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  for (const field of form.fields) {
    if (field.required) {
      const value = answers[field.name];
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
        errors[field.name] = `${field.label} 是必填项`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
