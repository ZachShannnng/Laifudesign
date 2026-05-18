/**
 * Laifu Design — SQLite 持久化层（sql.js 版本）
 *
 * 表结构：
 * - projects: 项目列表
 * - conversations: 对话列表
 * - messages: 消息历史
 * - artifacts: 生成的 HTML 产物
 * - project_files: 文件工作区（元数据，实际文件在 .laifu/projects/<id>/ 下）
 */

import initSqlJs, { Database, type SqlJsStatic } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { randomUUID } from 'node:crypto';

let dbInstance: Database | null = null;
let sqlJs: SqlJsStatic | null = null;

/** 获取数据库目录路径 */
function getDataDir(): string {
  // Electron 生产环境使用 userData，开发环境使用项目根目录
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    return path.join(process.cwd(), '.laifu');
  }
  return path.join(app.getPath('userData'), '.laifu');
}

/** 打开/获取数据库实例 */
export async function openDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dir = getDataDir();
  const file = path.join(dir, 'app.sqlite');
  fs.mkdirSync(dir, { recursive: true });

  // 初始化 sql.js - 开发环境从 node_modules 读取，生产环境从 extraResources 读取
  const isDev = process.env.NODE_ENV !== 'production';
  const sqlJsPath = isDev
    ? path.join(process.cwd(), 'node_modules', 'sql.js', 'dist')
    : path.join(process.resourcesPath, 'sql.js');
  sqlJs = await initSqlJs({
    locateFile: (file) => path.join(sqlJsPath, file),
  });

  // 加载或创建数据库
  let db: Database;
  if (fs.existsSync(file)) {
    const buffer = fs.readFileSync(file);
    db = new sqlJs.Database(buffer);
  } else {
    db = new sqlJs.Database();
  }

  // 优化 SQLite 性能
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA synchronous = NORMAL');

  migrate(db);
  dbInstance = db;

  // 保存数据库的函数
  const saveDb = () => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(file, buffer);
  };

  // 定期保存
  const saveInterval = setInterval(saveDb, 5000);

  // 退出时保存
  process.on('exit', () => {
    clearInterval(saveInterval);
    saveDb();
  });

  return db;
}

/** 关闭数据库 */
export function closeDatabase(): void {
  if (dbInstance) {
    // 保存最后状态
    const dir = getDataDir();
    const file = path.join(dir, 'app.sqlite');
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(file, buffer);
    dbInstance.close();
    dbInstance = null;
    sqlJs = null;
  }
}

/** 数据库迁移：创建表结构 */
function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      skill_id TEXT,
      design_system_id TEXT,
      metadata_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_project
      ON conversations(project_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_name TEXT,
      tool_input TEXT,
      tool_result TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(conversation_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      identifier TEXT NOT NULL,
      title TEXT,
      html TEXT NOT NULL,
      manifest_json TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_artifacts_project
      ON artifacts(project_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      path TEXT NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_files_path
      ON project_files(project_id, path);
  `);

  // 向后兼容：添加新列（如果不存在）
  const projectsCols = db.exec(`PRAGMA table_info(projects)`)[0]?.values || [];
  const colNames = projectsCols.map((row: any[]) => row[1]);
  if (!colNames.includes('metadata_json')) {
    db.exec(`ALTER TABLE projects ADD COLUMN metadata_json TEXT`);
  }
}

// ==================== Helper Functions ====================

/** 执行查询并返回所有行 */
function queryAll(db: Database, sql: string, params: any[] = []): any[][] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[][] = [];
  while (stmt.step()) {
    results.push(stmt.get() as any[]);
  }
  stmt.free();
  return results;
}

/** 执行查询并返回第一行 */
function queryGet(db: Database, sql: string, params: any[] = []): any[] | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.get() as any[];
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

/** 执行更新/插入/删除 */
function queryRun(db: Database, sql: string, params: any[] = []): void {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

// ==================== Projects ====================

export interface Project {
  id: string;
  name: string;
  skillId?: string;
  designSystemId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

function normalizeProject(row: any[]): Project {
  let metadata: Record<string, unknown> | undefined;
  if (row[4]) {
    try {
      metadata = JSON.parse(String(row[4]));
    } catch {
      metadata = undefined;
    }
  }
  return {
    id: String(row[0]),
    name: String(row[1]),
    skillId: row[2] ? String(row[2]) : undefined,
    designSystemId: row[3] ? String(row[3]) : undefined,
    metadata,
    createdAt: Number(row[5]),
    updatedAt: Number(row[6]),
  };
}

export function listProjects(db: Database): Project[] {
  const rows = queryAll(db, 'SELECT id, name, skill_id, design_system_id, metadata_json, created_at, updated_at FROM projects ORDER BY updated_at DESC');
  return rows.map((row) => normalizeProject(row));
}

export function getProject(db: Database, id: string): Project | null {
  const row = queryGet(db, 'SELECT id, name, skill_id, design_system_id, metadata_json, created_at, updated_at FROM projects WHERE id = ?', [id]);
  if (!row) return null;
  return normalizeProject(row);
}

export function insertProject(db: Database, p: Omit<Project, 'createdAt' | 'updatedAt'>): Project {
  const now = Date.now();
  const id = p.id || randomUUID();
  queryRun(
    db,
    `INSERT INTO projects (id, name, skill_id, design_system_id, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      p.name,
      p.skillId ?? null,
      p.designSystemId ?? null,
      p.metadata ? JSON.stringify(p.metadata) : null,
      now,
      now,
    ]
  );
  return getProject(db, id)!;
}

export function updateProject(db: Database, id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | null {
  const existing = getProject(db, id);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...patch,
    updatedAt: typeof patch.updatedAt === 'number' ? patch.updatedAt : Date.now(),
  };

  queryRun(
    db,
    `UPDATE projects
        SET name = ?, skill_id = ?, design_system_id = ?, metadata_json = ?, updated_at = ?
      WHERE id = ?`,
    [
      merged.name,
      merged.skillId ?? null,
      merged.designSystemId ?? null,
      merged.metadata ? JSON.stringify(merged.metadata) : null,
      merged.updatedAt,
      id,
    ]
  );

  return getProject(db, id);
}

export function deleteProject(db: Database, id: string): void {
  queryRun(db, 'DELETE FROM projects WHERE id = ?', [id]);
}

// ==================== Conversations ====================

export interface Conversation {
  id: string;
  projectId: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
}

function normalizeConversation(row: any[]): Conversation {
  return {
    id: String(row[0]),
    projectId: String(row[1]),
    title: row[2] ? String(row[2]) : undefined,
    createdAt: Number(row[3]),
    updatedAt: Number(row[4]),
  };
}

export function listConversations(db: Database, projectId: string): Conversation[] {
  const rows = queryAll(db, 'SELECT id, project_id, title, created_at, updated_at FROM conversations WHERE project_id = ? ORDER BY updated_at DESC', [projectId]);
  return rows.map((row) => normalizeConversation(row));
}

export function getConversation(db: Database, id: string): Conversation | null {
  const row = queryGet(db, 'SELECT id, project_id, title, created_at, updated_at FROM conversations WHERE id = ?', [id]);
  if (!row) return null;
  return normalizeConversation(row);
}

export function insertConversation(db: Database, c: Omit<Conversation, 'createdAt' | 'updatedAt'>): Conversation {
  const now = Date.now();
  const id = c.id || randomUUID();
  queryRun(
    db,
    'INSERT INTO conversations (id, project_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, c.projectId, c.title ?? null, now, now]
  );
  return getConversation(db, id)!;
}

export function updateConversation(db: Database, id: string, patch: Partial<Omit<Conversation, 'id' | 'createdAt'>>): Conversation | null {
  const existing = getConversation(db, id);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...patch,
    updatedAt: typeof patch.updatedAt === 'number' ? patch.updatedAt : Date.now(),
  };

  queryRun(
    db,
    'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
    [merged.title ?? null, merged.updatedAt, id]
  );

  return getConversation(db, id);
}

export function deleteConversation(db: Database, id: string): void {
  queryRun(db, 'DELETE FROM conversations WHERE id = ?', [id]);
}

// ==================== Messages ====================

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolName?: string;
  toolInput?: string;
  toolResult?: string;
  createdAt: number;
}

function normalizeMessage(row: any[]): Message {
  return {
    id: String(row[0]),
    conversationId: String(row[1]),
    role: String(row[2]) as 'user' | 'assistant' | 'system',
    content: String(row[3]),
    toolName: row[4] ? String(row[4]) : undefined,
    toolInput: row[5] ? String(row[5]) : undefined,
    toolResult: row[6] ? String(row[6]) : undefined,
    createdAt: Number(row[7]),
  };
}

export function listMessages(db: Database, conversationId: string): Message[] {
  const rows = queryAll(db, 'SELECT id, conversation_id, role, content, tool_name, tool_input, tool_result, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId]);
  return rows.map((row) => normalizeMessage(row));
}

export function insertMessage(db: Database, m: Omit<Message, 'createdAt' | 'id'> & { id?: string }): Message {
  const now = Date.now();
  const id = m.id || randomUUID();
  queryRun(
    db,
    `INSERT INTO messages (id, conversation_id, role, content, tool_name, tool_input, tool_result, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      m.conversationId,
      m.role,
      m.content,
      m.toolName ?? null,
      m.toolInput ?? null,
      m.toolResult ?? null,
      now,
    ]
  );
  return { ...m, id, createdAt: now };
}

export function deleteMessages(db: Database, conversationId: string): void {
  queryRun(db, 'DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
}

// ==================== Artifacts ====================

export interface Artifact {
  id: string;
  projectId: string;
  identifier: string;
  title?: string;
  html: string;
  manifest?: Record<string, unknown>;
  createdAt: number;
}

function normalizeArtifact(row: any[]): Artifact {
  let manifest: Record<string, unknown> | undefined;
  if (row[5]) {
    try {
      manifest = JSON.parse(String(row[5]));
    } catch {
      manifest = undefined;
    }
  }
  return {
    id: String(row[0]),
    projectId: String(row[1]),
    identifier: String(row[2]),
    title: row[3] ? String(row[3]) : undefined,
    html: String(row[4]),
    manifest,
    createdAt: Number(row[6]),
  };
}

export function listArtifacts(db: Database, projectId: string): Artifact[] {
  const rows = queryAll(db, 'SELECT id, project_id, identifier, title, html, manifest_json, created_at FROM artifacts WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
  return rows.map((row) => normalizeArtifact(row));
}

export function getArtifact(db: Database, id: string): Artifact | null {
  const row = queryGet(db, 'SELECT id, project_id, identifier, title, html, manifest_json, created_at FROM artifacts WHERE id = ?', [id]);
  if (!row) return null;
  return normalizeArtifact(row);
}

export function upsertArtifact(db: Database, a: Omit<Artifact, 'createdAt'>): Artifact {
  const existing = queryGet(db, 'SELECT id FROM artifacts WHERE id = ?', [a.id]);
  const now = Date.now();

  if (existing) {
    queryRun(
      db,
      'UPDATE artifacts SET identifier = ?, title = ?, html = ?, manifest_json = ? WHERE id = ?',
      [a.identifier, a.title ?? null, a.html, a.manifest ? JSON.stringify(a.manifest) : null, a.id]
    );
  } else {
    queryRun(
      db,
      `INSERT INTO artifacts (id, project_id, identifier, title, html, manifest_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.projectId, a.identifier, a.title ?? null, a.html, a.manifest ? JSON.stringify(a.manifest) : null, now]
    );
  }

  return getArtifact(db, a.id)!;
}

export function deleteArtifact(db: Database, id: string): void {
  queryRun(db, 'DELETE FROM artifacts WHERE id = ?', [id]);
}

// ==================== Project Files ====================

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

function normalizeProjectFile(row: any[]): ProjectFile {
  return {
    id: String(row[0]),
    projectId: String(row[1]),
    path: String(row[2]),
    content: row[3] ? String(row[3]) : undefined,
    createdAt: Number(row[4]),
    updatedAt: Number(row[5]),
  };
}

export function listProjectFiles(db: Database, projectId: string): ProjectFile[] {
  const rows = queryAll(db, 'SELECT id, project_id, path, content, created_at, updated_at FROM project_files WHERE project_id = ? ORDER BY path ASC', [projectId]);
  return rows.map((row) => normalizeProjectFile(row));
}

export function getProjectFile(db: Database, projectId: string, filePath: string): ProjectFile | null {
  const row = queryGet(db, 'SELECT id, project_id, path, content, created_at, updated_at FROM project_files WHERE project_id = ? AND path = ?', [projectId, filePath]);
  if (!row) return null;
  return normalizeProjectFile(row);
}

export function upsertProjectFile(
  db: Database,
  projectId: string,
  filePath: string,
  content?: string
): ProjectFile {
  const existing = getProjectFile(db, projectId, filePath);
  const now = Date.now();

  if (existing) {
    queryRun(
      db,
      'UPDATE project_files SET content = ?, updated_at = ? WHERE id = ?',
      [content ?? null, now, existing.id]
    );
  } else {
    const id = randomUUID();
    queryRun(
      db,
      `INSERT INTO project_files (id, project_id, path, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, filePath, content ?? null, now, now]
    );
    return { id, projectId, path: filePath, content, createdAt: now, updatedAt: now };
  }

  return getProjectFile(db, projectId, filePath)!;
}

export function deleteProjectFile(db: Database, projectId: string, filePath: string): void {
  queryRun(db, 'DELETE FROM project_files WHERE project_id = ? AND path = ?', [projectId, filePath]);
}
