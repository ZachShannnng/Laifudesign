/**
 * Laifu Design — built-in main-process agent runtime.
 *
 * This is the product agent boundary: Laifu does not detect or delegate to
 * external Claude/Codex/Windsurf/Cursor CLIs. It only uses the configured LLM API.
 */

import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  getConversation,
  getProject,
  insertMessage,
  openDatabase,
  upsertArtifact,
  upsertProjectFile,
  updateProject,
  type Project,
} from './db.js';
import { getSkill, type Skill } from './skills.js';
import { getDesignSystem, type DesignSystem } from './design-systems.js';
import { composeSystemPrompt } from './prompts/system.js';
import { openAICompatibleStream, type OpenAIChatMessage, type OpenAIToolDefinition } from './openai-compatible.js';
import { resolveProjectFilePath } from './utils/paths.js';
import { lintArtifact, getLintSummary } from './lint-artifact.js';
import { AgentStreamParser, type ParsedArtifact } from './artifact-parser.js';

export interface AgentModelConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface RunAgentParams {
  conversationId: string;
  messages: OpenAIChatMessage[];
  model: AgentModelConfig;
  tools?: OpenAIToolDefinition[];
  saveToDb?: boolean;
  abortSignal?: AbortSignal;
}

export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'artifact'; artifact: ParsedArtifact; lint?: { findings: unknown[]; summary: unknown } }
  | { type: 'question_form'; id: string; raw: string }
  | { type: 'tool_use'; tool_name?: string; tool_input?: Record<string, unknown> }
  | { type: 'error'; error: string }
  | { type: 'done' };

export async function* runLaifuAgent(params: RunAgentParams): AsyncGenerator<AgentEvent> {
  const db = await openDatabase();
  const conversation = getConversation(db, params.conversationId);
  if (!conversation) {
    yield { type: 'error', error: 'Conversation not found' };
    return;
  }

  const project = getProject(db, conversation.projectId);
  if (!project) {
    yield { type: 'error', error: 'Project not found' };
    return;
  }

  const userMessage = lastUserMessage(params.messages);
  const resolvedProject = await ensureProjectDefaults(project, userMessage?.content || '');
  const skill = resolvedProject.skillId ? await getSkill(resolvedProject.skillId) : null;
  const designSystem = resolvedProject.designSystemId
    ? await getDesignSystem(resolvedProject.designSystemId)
    : null;

  if (params.saveToDb && userMessage) {
    insertMessage(db, {
      conversationId: params.conversationId,
      role: 'user',
      content: userMessage.content || '',
    });
  }

  const systemPrompt = buildAgentSystemPrompt({
    project: resolvedProject,
    skill,
    designSystem,
  });

  const messages = withSystemPrompt(systemPrompt, params.messages);
  const parser = new AgentStreamParser();
  let assistantContent = '';

  const stream = openAICompatibleStream({
    apiUrl: params.model.apiUrl,
    apiKey: params.model.apiKey,
    model: params.model.model,
    messages,
    tools: params.tools,
    maxTokens: params.model.maxTokens,
    temperature: params.model.temperature,
    abortSignal: params.abortSignal,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'text') {
      assistantContent += chunk.content || '';
      for (const event of parser.parse(chunk.content || '')) {
        if (event.type === 'text' && event.content) {
          yield { type: 'text', content: event.content };
        } else if (event.type === 'artifact' && event.artifact) {
          const lint = await saveArtifact(resolvedProject.id, event.artifact);
          yield { type: 'artifact', artifact: event.artifact, lint };
        } else if (event.type === 'question_form' && event.questionForm) {
          yield { type: 'question_form', id: event.questionForm.id, raw: event.questionForm.raw };
        }
      }
    } else if (chunk.type === 'tool_use') {
      yield {
        type: 'tool_use',
        tool_name: chunk.toolName,
        tool_input: chunk.toolInput,
      };
    } else if (chunk.type === 'error') {
      yield { type: 'error', error: chunk.error || 'Unknown model error' };
      return;
    } else if (chunk.type === 'done') {
      break;
    }
  }

  for (const event of parser.flush()) {
    if (event.type === 'text' && event.content) {
      yield { type: 'text', content: event.content };
    }
  }

  if (params.saveToDb && assistantContent) {
    insertMessage(db, {
      conversationId: params.conversationId,
      role: 'assistant',
      content: assistantContent,
    });
  }

  yield { type: 'done' };
}

function buildAgentSystemPrompt(params: {
  project: Project;
  skill: Skill | null;
  designSystem: DesignSystem | null;
}): string {
  const metadata = params.project.metadata ?? {};
  const designSystem = params.designSystem
    ? {
        name: params.designSystem.name,
        description: params.designSystem.description,
        primaryColor: params.designSystem.primaryColor,
        fontFamily: params.designSystem.fontFamily,
        content: params.designSystem.content,
      }
    : undefined;

  return composeSystemPrompt({
    skill: params.skill ?? undefined,
    designSystem,
    includeDiscovery: true,
    extraContext: [
      `项目名称: ${params.project.name}`,
      `目标平台: ${String(metadata.platform ?? 'web')}`,
      `视觉方向: ${String(metadata.direction ?? '未选择')}`,
      '',
      'Laifu 架构约束:',
      '- 你正在运行于 Laifu 内置设计智能体中。',
      '- 不要要求用户安装或调用 Claude、Codex、Windsurf、Cursor 等外部智能体。',
      '- 生成设计时必须输出完整 <artifact>，需要澄清时输出 <question-form>。',
    ].join('\n'),
  });
}

async function ensureProjectDefaults(project: Project, latestUserText: string): Promise<Project> {
  const db = await openDatabase();
  const metadata = project.metadata ?? {};
  const nextSkillId = project.skillId || inferSkillId(latestUserText, String(metadata.platform ?? ''));
  const nextDesignSystemId = project.designSystemId || 'artistic';

  if (nextSkillId !== project.skillId || nextDesignSystemId !== project.designSystemId) {
    return updateProject(db, project.id, {
      skillId: nextSkillId,
      designSystemId: nextDesignSystemId,
      metadata,
    }) ?? project;
  }

  return project;
}

function inferSkillId(text: string, platform: string): string {
  const haystack = `${text} ${platform}`.toLowerCase();
  if (/mobile|iphone|android|app|小程序|移动|手机/.test(haystack)) return 'mobile-app';
  if (/dashboard|admin|console|analytics|仪表盘|后台|管理台|控制台/.test(haystack)) return 'dashboard';
  if (/landing|homepage|marketing|官网|落地页|营销/.test(haystack)) return 'saas-landing';
  if (/poster|image|海报|图片/.test(haystack)) return 'image-poster';
  return 'web-prototype';
}

function withSystemPrompt(systemPrompt: string, messages: OpenAIChatMessage[]): OpenAIChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.filter((message) => message.role !== 'system'),
  ];
}

function lastUserMessage(messages: OpenAIChatMessage[]): OpenAIChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i];
  }
  return undefined;
}

async function saveArtifact(projectId: string, artifact: ParsedArtifact): Promise<{ findings: unknown[]; summary: unknown }> {
  const db = await openDatabase();
  const id = randomUUID();
  const findings = lintArtifact(artifact.html);
  const summary = getLintSummary(findings);
  const { relativePath, fullPath } = resolveProjectFilePath(projectId, artifact.identifier, 'index.html');

  upsertArtifact(db, {
    id,
    projectId,
    identifier: relativePath,
    title: artifact.title,
    html: artifact.html,
    manifest: { lint: summary },
  });
  upsertProjectFile(db, projectId, relativePath, artifact.html);
  updateProject(db, projectId, {});

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, artifact.html, 'utf-8');

  return { findings, summary };
}
