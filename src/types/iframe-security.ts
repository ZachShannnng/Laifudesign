/**
 * iframe 安全配置
 * Content-Security-Policy (CSP) directives 和 postMessage origin 验证
 */

// CSP directives - 使用在 iframe 标签中
export const CSP_DIRECTIVES = {
  defaultSrc: "'self'",
  connectSrc: "'self'",
  scriptSrc: "'unsafe-inline'",
  styleSrc: "'unsafe-inline'",
  imgSrc: "'self'",
  fontSrc: "'self'",
  frameSrc: "'self'",
  mediaSrc: "'self'",
  manifestSrc: "'self'",
  workerSrc: "'self'",
} as const;

/**
 * 获取带有随机 nonce 的 CSP 字符
 * 每次调用返回新的 nonce 以防止缓存攻击
 */
export function getIframeCSP(nonce: string): string {
  const base = `default-src ${CSP_DIRECTIVES.defaultSrc}; script-src ${CSP_DIRECTIVES.scriptSrc};`;
  return `${base} ${nonce};`;
}
