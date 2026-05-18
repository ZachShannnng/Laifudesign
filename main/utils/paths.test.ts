import { describe, expect, it } from 'vitest';
import { normalizeProjectRelativePath } from './paths';

describe('normalizeProjectRelativePath', () => {
  it('allows simple and nested project files', () => {
    expect(normalizeProjectRelativePath('index.html')).toBe('index.html');
    expect(normalizeProjectRelativePath('pages/home.html')).toBe('pages/home.html');
  });

  it('rejects traversal and absolute paths', () => {
    expect(() => normalizeProjectRelativePath('../x.html')).toThrow();
    expect(() => normalizeProjectRelativePath('/tmp/x.html')).toThrow();
    expect(() => normalizeProjectRelativePath('..\\x.html')).toThrow();
    expect(() => normalizeProjectRelativePath('pages//home.html')).toThrow();
  });
});
