import { describe, expect, it } from 'vitest';
import { composeSystemPrompt } from './system';

describe('composeSystemPrompt', () => {
  it('includes full skill content and design system content', () => {
    const prompt = composeSystemPrompt({
      skill: {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Dashboard summary',
        content: `---\nid: dashboard\n---\n# Dashboard Skill\nUse dense enterprise layouts.`,
        directory: '/tmp/dashboard',
      },
      designSystem: {
        name: 'Quiet Enterprise',
        content: '# Quiet Enterprise\nUse restrained operational UI.',
      },
    });

    expect(prompt).toContain('# Dashboard Skill');
    expect(prompt).toContain('Use dense enterprise layouts.');
    expect(prompt).toContain('# Quiet Enterprise');
    expect(prompt).toContain('Use restrained operational UI.');
    expect(prompt).not.toContain('id: dashboard');
  });
});
