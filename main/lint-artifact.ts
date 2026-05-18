/**
 * Laifu Design — Anti-Slop Artifact Linter
 * 检查 artifact 中的常见设计问题
 */

/** Lint 检查结果 */
export interface LintFinding {
  /** 严重程度: error | warning | info */
  severity: 'error' | 'warning' | 'info';
  /** 问题代码 */
  code: string;
  /** 问题描述 */
  message: string;
  /** 问题位置（行号） */
  line?: number;
  /** 建议修复方案 */
  suggestion?: string;
}

/** Lint 选项 */
export interface LintOptions {
  /** 检查颜色对比度 */
  checkContrast?: boolean;
  /** 检查字体大小 */
  checkFontSize?: boolean;
  /** 检查空状态 */
  checkEmptyStates?: boolean;
  /** 检查加载状态 */
  checkLoadingStates?: boolean;
  /** 检查表单验证 */
  checkFormValidation?: boolean;
}

/** 默认选项 */
const DEFAULT_OPTIONS: LintOptions = {
  checkContrast: true,
  checkFontSize: true,
  checkEmptyStates: true,
  checkLoadingStates: true,
  checkFormValidation: true,
};

/**
 * 解析 HTML 提取样式信息
 */
function parseHtmlStyles(html: string): {
  inlineStyles: Map<number, Record<string, string>>;
  colors: Set<string>;
  fontSizes: Set<string>;
} {
  const lines = html.split('\n');
  const inlineStyles = new Map<number, Record<string, string>>();
  const colors = new Set<string>();
  const fontSizes = new Set<string>();

  // 简单的正则提取（非完整解析器，但足以捕获常见问题）
  const styleRegex = /style="([^"]+)"/g;

  lines.forEach((line, idx) => {
    const styleMatch = line.match(styleRegex);
    if (styleMatch) {
      const styleStr = styleMatch[1];
      const styles: Record<string, string> = {};

      // 解析 style 属性
      styleStr.split(';').forEach((decl) => {
        const [prop, value] = decl.split(':').map((s) => s.trim());
        if (prop && value) {
          styles[prop] = value;

          // 提取颜色
          const colorMatch = prop.match(/color|background/i);
          if (colorMatch) {
            colors.add(value);
          }

          // 提取字体大小
          if (prop === 'font-size') {
            fontSizes.add(value);
          }
        }
      });

      inlineStyles.set(idx + 1, styles);
    }
  });

  return { inlineStyles, colors, fontSizes };
}

/**
 * 检查颜色对比度
 */
function checkColors(colors: Set<string>): LintFinding[] {
  const findings: LintFinding[] = [];

  // 检查常见的低对比度组合
  const lowContrastPairs: [string, string][] = [
    ['#cccccc', '#ffffff'], // 浅灰 + 白
    ['#eeeeee', '#ffffff'], // 极浅灰 + 白
    ['#666666', '#999999'], // 中灰 + 浅灰
  ];

  const colorArray = Array.from(colors).map((c) => c.toLowerCase());

  for (const [bg, fg] of lowContrastPairs) {
    if (colorArray.includes(bg.toLowerCase()) && colorArray.includes(fg.toLowerCase())) {
      findings.push({
        severity: 'warning',
        code: 'LOW_CONTRAST',
        message: `检测到可能的低对比度组合: ${bg} 和 ${fg}`,
        suggestion: '使用更深的前景色或更浅的背景色，确保 WCAG AA 标准（对比度 ≥ 4.5:1）',
      });
    }
  }

  return findings;
}

/**
 * 检查字体大小
 */
function checkFontSizes(fontSizes: Set<string>): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const size of fontSizes) {
    // 提取数值
    const pxMatch = size.match(/(\d+(?:\.\d+)?)px/i);
    if (pxMatch) {
      const pxValue = parseFloat(pxMatch[1]);
      if (pxValue < 14) {
        findings.push({
          severity: 'warning',
          code: 'SMALL_FONT',
          message: `字体大小过小: ${size}（建议不小于 14px，正文不小于 16px）`,
          suggestion: '增大字体以提高可读性',
        });
      }
    }
  }

  return findings;
}

/**
 * 检查空状态
 */
function checkEmptyStates(html: string): LintFinding[] {
  const findings: LintFinding[] = [];

  // 检查是否有列表/表格但没有空状态
  const hasList = /<(?:ul|ol|table|div.*list)/i.test(html);
  const hasEmptyState = /(?:empty|no.*data|nothing.*found)/i.test(html);

  if (hasList && !hasEmptyState) {
    findings.push({
      severity: 'info',
      code: 'MISSING_EMPTY_STATE',
      message: '检测到列表/表格但可能缺少空状态设计',
      suggestion: '为无数据的情况添加友好的空状态提示',
    });
  }

  return findings;
}

/**
 * 检查加载状态
 */
function checkLoadingStates(html: string): LintFinding[] {
  const findings: LintFinding[] = [];

  // 检查是否有按钮但没有加载状态指示
  const hasButton = /<button/i.test(html);
  const hasLoader = /(?:loader|spinner|loading|disabled)/i.test(html);

  if (hasButton && !hasLoader) {
    findings.push({
      severity: 'info',
      code: 'MISSING_LOADING_STATE',
      message: '检测到按钮但可能缺少加载状态指示',
      suggestion: '为异步操作的按钮添加加载状态（spinner、禁用状态等）',
    });
  }

  return findings;
}

/**
 * 检查表单验证
 */
function checkFormValidation(html: string): LintFinding[] {
  const findings: LintFinding[] = [];

  // 检查是否有表单但没有验证相关元素
  const hasForm = /<(?:form|input)/i.test(html);
  const hasValidation = /(?:required|pattern|placeholder|error|invalid)/i.test(html);

  if (hasForm && !hasValidation) {
    findings.push({
      severity: 'warning',
      code: 'MISSING_FORM_VALIDATION',
      message: '检测到表单但可能缺少验证机制',
      suggestion: '添加 required 属性、验证消息和错误提示样式',
    });
  }

  return findings;
}

/**
 * Lint artifact HTML
 */
export function lintArtifact(html: string, options: LintOptions = {}): LintFinding[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const findings: LintFinding[] = [];

  const { colors, fontSizes } = parseHtmlStyles(html);

  // 执行各项检查
  if (opts.checkContrast) {
    findings.push(...checkColors(colors));
  }

  if (opts.checkFontSize) {
    findings.push(...checkFontSizes(fontSizes));
  }

  if (opts.checkEmptyStates) {
    findings.push(...checkEmptyStates(html));
  }

  if (opts.checkLoadingStates) {
    findings.push(...checkLoadingStates(html));
  }

  if (opts.checkFormValidation) {
    findings.push(...checkFormValidation(html));
  }

  // 去重
  const uniqueFindings = findings.filter((f, idx, arr) =>
    arr.findIndex((other) => other.code === f.code && other.message === f.message) === idx
  );

  // 按 severity 排序
  const severityOrder = { error: 0, warning: 1, info: 2 };
  return uniqueFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * 获取 lint 报告摘要
 */
export function getLintSummary(findings: LintFinding[]): {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
} {
  return {
    total: findings.length,
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
    infos: findings.filter((f) => f.severity === 'info').length,
  };
}
