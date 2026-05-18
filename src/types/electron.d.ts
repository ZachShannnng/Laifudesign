/**
 * Electron IPC API 类型声明
 * 由 main/preload.ts 注入到 window.laifu
 */

export interface LaifuAPI {
  getAppVersion: () => Promise<string>;
  getApiUrl: () => Promise<string>;
}

declare global {
  interface Window {
    laifu: LaifuAPI;
  }
}

export {};
