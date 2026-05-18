/**
 * Laifu Design — Electron Preload Script
 *
 * 暴露安全的 IPC API 给渲染进程
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron');

const API = {
  // App 信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),

  // 后续会添加更多 IPC handlers：
  // - 文件对话框（选择图片、导出 HTML）
  // - 窗口控制（最大化/最小化/关闭）
  // - 通知
};

// 暴露到 window.laifu
contextBridge.exposeInMainWorld('laifu', API);

// TypeScript 类型声明（在 preload 侧，实际需要在渲染进程声明）
// export type LaifuAPI = typeof API;
