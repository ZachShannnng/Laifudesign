/**
 * Laifu Design — Discovery 提示词
 * RULE 1/2/3：初始化表单 → 方向分支
 */

/** 视觉方向选项 */
export interface VisualDirection {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  mood: string;
  keywords: string[];
}

/** 预定义的视觉方向 */
export const VISUAL_DIRECTIONS: VisualDirection[] = [
  {
    id: 'modern-minimal',
    name: '现代极简',
    description: '大量留白，清晰的排版，专注内容本身',
    primaryColor: '#1a1a1a',
    secondaryColor: '#f5f5f5',
    mood: '专业、冷静、高效',
    keywords: ['极简', '留白', '清晰'],
  },
  {
    id: 'warm-cream',
    name: '温暖奶油',
    description: '柔和的暖色调，舒适的视觉体验',
    primaryColor: '#c9b8a0',
    secondaryColor: '#f7f4ed',
    mood: '温暖、舒适、亲和',
    keywords: ['温暖', '柔和', '舒适'],
  },
  {
    id: 'vibrant-gradient',
    name: '活力渐变',
    description: '大胆的渐变色彩，充满活力和创意',
    primaryColor: '#6366f1',
    secondaryColor: '#ec4899',
    mood: '活力、创意、年轻',
    keywords: ['渐变', '活力', '创意'],
  },
  {
    id: 'dark-mode',
    name: '深色模式',
    description: '深色背景，高对比度文字，护眼且专业',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    mood: '专业、科技、护眼',
    keywords: ['深色', '科技', '专业'],
  },
  {
    id: 'nature-green',
    name: '自然绿意',
    description: '绿色为主调，给人宁静自然的感觉',
    primaryColor: '#059669',
    secondaryColor: '#d1fae5',
    mood: '自然、健康、宁静',
    keywords: ['绿色', '自然', '健康'],
  },
];

/** 获取发现提示词 */
export function getDiscoveryPrompt(): string {
  return `# Discovery 流程

## RULE 1：初始化表单

当用户请求创建新设计时，首先使用 \`<question-form>\` 标签收集必要信息。

### 必须收集的信息

\`\`\`
<question-form id="project-discovery">
  <field type="text" name="projectName" label="项目名称" required />
  <field type="select" name="projectType" label="项目类型" required>
    <option value="landing-page">落地页</option>
    <option value="dashboard">仪表盘</option>
    <option value="mobile-app">移动应用</option>
    <option value="website">完整网站</option>
  </field>
  <field type="text" name="targetAudience" label="目标用户" required />
  <field type="textarea" name="coreFeatures" label="核心功能描述" required />
  <field type="text" name="brandColors" label="品牌颜色（可选）" />
  <field type="textarea" name="references" label="参考网站（可选）" />
</question-form>
\`\`\`

## RULE 2：方向选择

收集完基础信息后，如果用户没有指定设计风格，展示视觉方向选项：

\`\`\`
<question-form id="visual-direction">
  <field type="direction-cards" name="direction" required>
    <card id="modern-minimal" name="现代极简" description="大量留白，清晰的排版" color="#1a1a1a" />
    <card id="warm-cream" name="温暖奶油" description="柔和的暖色调，舒适的视觉" color="#c9b8a0" />
    <card id="vibrant-gradient" name="活力渐变" description="大胆的渐变色彩，充满活力" color="#6366f1" />
    <card id="dark-mode" name="深色模式" description="深色背景，高对比度文字" color="#0f172a" />
    <card id="nature-green" name="自然绿意" description="绿色为主调，给人宁静感" color="#059669" />
  </field>
</question-form>
\`\`\`

## RULE 3：生成 Artifact

收集完所有信息后，生成完整的 HTML artifact：

\`\`\`
<artifact identifier="index.html" title="首页">
  <!-- 完整的 HTML 代码 -->
</artifact>
\`\`\`
`;
}

/** 格式化用户答案为提示词 */
export function formatUserAnswers(answers: Record<string, string>): string {
  const parts: string[] = [];
  parts.push('--- 用户回答 ---');

  if (answers.projectName) parts.push(`项目名称: ${answers.projectName}`);
  if (answers.projectType) parts.push(`项目类型: ${answers.projectType}`);
  if (answers.targetAudience) parts.push(`目标用户: ${answers.targetAudience}`);
  if (answers.coreFeatures) parts.push(`核心功能: ${answers.coreFeatures}`);
  if (answers.brandColors) parts.push(`品牌颜色: ${answers.brandColors}`);
  if (answers.references) parts.push(`参考网站: ${answers.references}`);
  if (answers.direction) parts.push(`视觉方向: ${answers.direction}`);

  parts.push('--- 结束 ---');
  return parts.join('\n');
}
