/**
 * Laifu Design — Electron 主进程入口
 *
 * 功能：
 * - 创建 Electron BrowserWindow
 * - 启动 Express HTTP 服务（localhost）
 * - IPC bridge (preload.ts)
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 端口配置
const PORT = 7456;
const HOST = '127.0.0.1';

// Express app
const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// 基础健康检查
expressApp.get('/api/health', (_req, res) => {
  res.json({ ok: true, version: app.getVersion() });
});

// CORS（渲染进程通过 HTTP 调用）
expressApp.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// 注册 API 路由
import { registerProjectRoutes } from './routes/projects.js';
import { registerConversationRoutes } from './routes/conversations.js';
import { registerArtifactRoutes } from './routes/artifacts.js';
import { registerFileRoutes } from './routes/files.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerProxyRoutes } from './routes/proxy.js';
import { registerSkillRoutes } from './routes/skills.js';
import { registerDesignSystemRoutes } from './routes/design-systems.js';

registerProjectRoutes(expressApp);
registerConversationRoutes(expressApp);
registerArtifactRoutes(expressApp);
registerFileRoutes(expressApp);
registerChatRoutes(expressApp);
registerProxyRoutes(expressApp);
registerSkillRoutes(expressApp);
registerDesignSystemRoutes(expressApp);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false, // 禁用 sandbox 以支持 ES modules
    },
    titleBarStyle: 'hiddenInset', // macOS 风格
    show: false, // 等加载完再显示
  });

  // 开发模式加载 Vite dev server，生产模式加载构建文件
  // 更可靠地判断是否为开发环境
  const isDev = process.env.NODE_ENV === 'development' ||
                  process.env.ELECTRON_IS_DEV === '1' ||
                  !app.isPackaged;
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 开发模式打开 DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// 启动 Express 服务
function startExpressServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = expressApp.listen(PORT, HOST, () => {
      const url = `http://${HOST}:${PORT}`;
      console.log(`[Laifu] Express server listening on ${url}`);
      resolve(url);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Laifu] Port ${PORT} is already in use`);
        reject(new Error(`Port ${PORT} is already in use`));
      } else {
        reject(err);
      }
    });
  });
}

// App 生命周期
app.whenReady().then(async () => {
  try {
    await startExpressServer();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (err) {
    console.error('[Laifu] Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers（基础）
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-api-url', () => `http://${HOST}:${PORT}`);
