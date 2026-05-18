/**
 * Laifu Design — Main-process artifact parser.
 * Extracts complete <artifact> and <question-form> blocks from streamed model text.
 */

export interface ParsedArtifact {
  identifier: string;
  title?: string;
  html: string;
}

export interface ParsedQuestionForm {
  id: string;
  raw: string;
}

export interface ParsedAgentEvent {
  type: 'text' | 'artifact' | 'question_form';
  content?: string;
  artifact?: ParsedArtifact;
  questionForm?: ParsedQuestionForm;
}

const ARTIFACT_END = '</artifact>';
const QUESTION_FORM_END = '</question-form>';

export class AgentStreamParser {
  private buffer = '';

  parse(chunk: string): ParsedAgentEvent[] {
    this.buffer += chunk;
    const events: ParsedAgentEvent[] = [];

    while (this.buffer.length > 0) {
      const artifactStart = this.buffer.indexOf('<artifact');
      const questionStart = this.buffer.indexOf('<question-form');
      const nextStart = firstTagStart(artifactStart, questionStart);

      if (!nextStart) {
        const safeText = this.flushSafeText();
        if (safeText) events.push({ type: 'text', content: safeText });
        break;
      }

      if (nextStart.index > 0) {
        events.push({ type: 'text', content: this.buffer.slice(0, nextStart.index) });
        this.buffer = this.buffer.slice(nextStart.index);
      }

      if (nextStart.type === 'artifact') {
        const end = this.buffer.indexOf(ARTIFACT_END);
        if (end === -1) break;

        const raw = this.buffer.slice(0, end + ARTIFACT_END.length);
        const artifact = parseArtifactBlock(raw);
        if (artifact) events.push({ type: 'artifact', artifact });
        this.buffer = this.buffer.slice(end + ARTIFACT_END.length);
      } else {
        const end = this.buffer.indexOf(QUESTION_FORM_END);
        if (end === -1) break;

        const raw = this.buffer.slice(0, end + QUESTION_FORM_END.length);
        events.push({ type: 'question_form', questionForm: parseQuestionFormBlock(raw) });
        this.buffer = this.buffer.slice(end + QUESTION_FORM_END.length);
      }
    }

    return events;
  }

  flush(): ParsedAgentEvent[] {
    if (!this.buffer) return [];
    const content = this.buffer;
    this.buffer = '';
    return [{ type: 'text', content }];
  }

  private flushSafeText(): string {
    const partialArtifact = longestPartialSuffix(this.buffer, '<artifact');
    const partialQuestion = longestPartialSuffix(this.buffer, '<question-form');
    const keep = Math.max(partialArtifact, partialQuestion);
    if (keep === 0) {
      const text = this.buffer;
      this.buffer = '';
      return text;
    }

    const text = this.buffer.slice(0, -keep);
    this.buffer = this.buffer.slice(-keep);
    return text;
  }
}

function firstTagStart(
  artifactStart: number,
  questionStart: number
): { type: 'artifact' | 'question_form'; index: number } | null {
  if (artifactStart === -1 && questionStart === -1) return null;
  if (artifactStart !== -1 && (questionStart === -1 || artifactStart < questionStart)) {
    return { type: 'artifact', index: artifactStart };
  }
  return { type: 'question_form', index: questionStart };
}

function parseArtifactBlock(raw: string): ParsedArtifact | null {
  const identifier = attr(raw, 'identifier') || 'index.html';
  const title = attr(raw, 'title') || undefined;
  const htmlMatch = /<artifact\b[^>]*>([\s\S]*)<\/artifact>/i.exec(raw);
  const html = htmlMatch?.[1]?.trim() ?? '';
  if (!html) return null;
  return { identifier, title, html };
}

function parseQuestionFormBlock(raw: string): ParsedQuestionForm {
  return {
    id: attr(raw, 'id') || 'question-form',
    raw,
  };
}

function attr(raw: string, name: string): string | null {
  const match = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(raw);
  return match?.[1] ?? null;
}

function longestPartialSuffix(input: string, token: string): number {
  const max = Math.min(input.length, token.length - 1);
  for (let length = max; length > 0; length--) {
    if (token.startsWith(input.slice(-length))) return length;
  }
  return 0;
}
