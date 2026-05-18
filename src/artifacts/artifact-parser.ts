/**
 * Laifu Design — Artifact 流式解析器
 * 从 SSE 流中提取 `<artifact>` 和 `<question-form>` 标签
 */

/** 解析事件类型 */
export interface ParsedEvent {
  type: 'artifact' | 'question_form' | 'text';
  content?: string;
  artifact?: {
    identifier: string;
    title?: string;
    html: string;
  };
  questionForm?: {
    id: string;
    fields: QuestionFormField[];
  };
}

/** 问题表单字段 */
export interface QuestionFormField {
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'direction-cards';
  name: string;
  label: string;
  required?: boolean;
  options?: QuestionFormOption[];
  cards?: DirectionCard[];
}

/** 表单选项 */
export interface QuestionFormOption {
  value: string;
  label: string;
}

/** 方向卡片 */
export interface DirectionCard {
  id: string;
  name: string;
  description: string;
  color: string;
}

/** 解析状态 */
interface ParseState {
  buffer: string;
  inArtifact: boolean;
  inQuestionForm: boolean;
  artifactStart: number;
  questionFormStart: number;
}

/**
 * Artifact 解析器
 */
export class ArtifactParser {
  private state: ParseState = {
    buffer: '',
    inArtifact: false,
    inQuestionForm: false,
    artifactStart: 0,
    questionFormStart: 0,
  };

  /**
   * 解析文本块，返回提取的事件
   */
  parse(text: string): ParsedEvent[] {
    const events: ParsedEvent[] = [];
    this.state.buffer += text;

    // 检查 artifact 标签
    if (!this.state.inArtifact) {
      const artifactStart = this.state.buffer.indexOf('<artifact');
      if (artifactStart !== -1) {
        this.state.inArtifact = true;
        this.state.artifactStart = artifactStart;
        // 提取前面的文本
        const beforeText = this.state.buffer.slice(0, artifactStart);
        if (beforeText.trim()) {
          events.push({ type: 'text', content: beforeText });
        }
      }
    }

    // 检查 artifact 结束标签
    if (this.state.inArtifact) {
      const artifactEnd = this.state.buffer.indexOf('</artifact>', this.state.artifactStart);
      if (artifactEnd !== -1) {
        const artifactContent = this.state.buffer.slice(
          this.state.artifactStart,
          artifactEnd + '</artifact>'.length
        );
        const parsed = this.parseArtifact(artifactContent);
        if (parsed) {
          events.push({ type: 'artifact', artifact: parsed });
        }
        this.state.inArtifact = false;
        this.state.buffer = this.state.buffer.slice(artifactEnd + '</artifact>'.length);
      }
    }

    // 检查 question-form 标签
    if (!this.state.inQuestionForm && !this.state.inArtifact) {
      const qfStart = this.state.buffer.indexOf('<question-form');
      if (qfStart !== -1) {
        this.state.inQuestionForm = true;
        this.state.questionFormStart = qfStart;
        // 提取前面的文本
        const beforeText = this.state.buffer.slice(0, qfStart);
        if (beforeText.trim()) {
          events.push({ type: 'text', content: beforeText });
        }
      }
    }

    // 检查 question-form 结束标签
    if (this.state.inQuestionForm) {
      const qfEnd = this.state.buffer.indexOf('</question-form>', this.state.questionFormStart);
      if (qfEnd !== -1) {
        const qfContent = this.state.buffer.slice(
          this.state.questionFormStart,
          qfEnd + '</question-form>'.length
        );
        const parsed = this.parseQuestionForm(qfContent);
        if (parsed) {
          events.push({ type: 'question_form', questionForm: parsed });
        }
        this.state.inQuestionForm = false;
        this.state.buffer = this.state.buffer.slice(qfEnd + '</question-form>'.length);
      }
    }

    // 返回累积的纯文本（如果在标签外）
    if (!this.state.inArtifact && !this.state.inQuestionForm && this.state.buffer) {
      const text = this.state.buffer;
      this.state.buffer = '';
      events.push({ type: 'text', content: text });
    }

    return events;
  }

  /**
   * 解析 artifact 标签
   */
  private parseArtifact(content: string): ParsedEvent['artifact'] | null {
    // 提取属性
    const idMatch = content.match(/identifier\s*=\s*["']([^"']+)["']/);
    const titleMatch = content.match(/title\s*=\s*["']([^"']+)["']/);

    // 提取 HTML 内容
    const htmlMatch = content.match(/<artifact[^>]*>([\s\S]*)<\/artifact>/);
    const html = htmlMatch ? htmlMatch[1].trim() : '';

    return {
      identifier: idMatch ? idMatch[1] : 'index.html',
      title: titleMatch ? titleMatch[1] : undefined,
      html,
    };
  }

  /**
   * 解析 question-form 标签
   */
  private parseQuestionForm(content: string): ParsedEvent['questionForm'] | null {
    const idMatch = content.match(/id\s*=\s*["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : 'form';

    // 提取所有字段
    const fields: QuestionFormField[] = [];

    // 简单的 field 正则提取（非完整解析器）
    const fieldRegex = /<field\s+([^>]+)>([\s\S]*?)<\/field>/g;
    let match: RegExpExecArray | null;

    while ((match = fieldRegex.exec(content)) !== null) {
      const attrs = match[1];
      const inner = match[2];

      const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
      const nameMatch = attrs.match(/name\s*=\s*["']([^"']+)["']/);
      const labelMatch = attrs.match(/label\s*=\s*["']([^"']+)["']/);
      const requiredMatch = attrs.match(/required/);

      const type = typeMatch ? typeMatch[1] : 'text';
      const name = nameMatch ? nameMatch[1] : '';
      const label = labelMatch ? labelMatch[1] : '';
      const required = !!requiredMatch;

      // 解析选项（select, radio, checkbox）
      let options: QuestionFormOption[] | undefined;
      if (type === 'select' || type === 'radio' || type === 'checkbox') {
        const optionRegex = /<option\s+value\s*=\s*["']([^"']+)["']>([^<]*)<\/option>/g;
        let optMatch: RegExpExecArray | null;
        const opts: QuestionFormOption[] = [];

        while ((optMatch = optionRegex.exec(inner)) !== null) {
          opts.push({
            value: optMatch[1],
            label: optMatch[2].trim(),
          });
        }
        options = opts;
      }

      // 解析方向卡片
      let cards: DirectionCard[] | undefined;
      if (type === 'direction-cards') {
        const cardRegex = /<card\s+id\s*=\s*["']([^"']+)["']\s+name\s*=\s*["']([^"']+)["']\s+description\s*=\s*["']([^"']+)["']\s+color\s*=\s*["']([^"']+)["']\s*\/>/g;
        let cardMatch: RegExpExecArray | null;
        cards = [];

        while ((cardMatch = cardRegex.exec(inner)) !== null) {
          cards.push({
            id: cardMatch[1],
            name: cardMatch[2],
            description: cardMatch[3],
            color: cardMatch[4],
          });
        }
      }

      fields.push({
        type: type as QuestionFormField['type'],
        name,
        label,
        required,
        options,
        cards,
      });
    }

    return { id, fields };
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.state = {
      buffer: '',
      inArtifact: false,
      inQuestionForm: false,
      artifactStart: 0,
      questionFormStart: 0,
    };
  }

  /**
   * 获取未完成的缓冲区
   */
  getBuffer(): string {
    return this.state.buffer;
  }
}

/**
 * 简单的解析函数（非流式）
 */
export function parseArtifact(text: string): ParsedEvent['artifact'] | null {
  const parser = new ArtifactParser();
  const events = parser.parse(text);
  return events.find((e) => e.type === 'artifact')?.artifact || null;
}

/**
 * 简单的 question-form 解析函数
 */
export function parseQuestionForm(text: string): ParsedEvent['questionForm'] | null {
  const parser = new ArtifactParser();
  const events = parser.parse(text);
  return events.find((e) => e.type === 'question_form')?.questionForm || null;
}
