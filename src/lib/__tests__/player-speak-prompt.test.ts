import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildSceneCharacterPrompt, PLAYER_SPEAK_HARD_LIMIT_TOKENS } from '../player-speak-prompt';

describe('PLAYER_SPEAK_HARD_LIMIT_TOKENS', () => {
  it('is 400 tokens', () => {
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBe(400);
  });
});

describe('buildSystemPrompt – shared guarantees', () => {
  const templates = ['custom', 'rpg-dungeon', 'roleplay', 'adventure', undefined];

  for (const template of templates) {
    it(`includes the player name for template="${template ?? 'undefined'}"`, () => {
      const prompt = buildSystemPrompt('Alice', template, 'Test Game');
      expect(prompt).toContain('Alice');
    });

    it(`includes the game name for template="${template ?? 'undefined'}"`, () => {
      const prompt = buildSystemPrompt('Alice', template, 'Midnight Mystery');
      expect(prompt).toContain('Midnight Mystery');
    });

    it(`includes the pacing rule for template="${template ?? 'undefined'}"`, () => {
      const prompt = buildSystemPrompt('Alice', template, 'Test Game');
      expect(prompt).toContain('PACING');
    });

    it(`includes emotion tags section for template="${template ?? 'undefined'}"`, () => {
      const prompt = buildSystemPrompt('Alice', template, 'Test Game');
      expect(prompt).toContain('EMOTION');
    });

    it(`instructs player not to break character for template="${template ?? 'undefined'}"`, () => {
      const prompt = buildSystemPrompt('Alice', template, 'Test Game');
      expect(prompt).toMatch(/never break character/i);
    });
  }
});

describe('buildSystemPrompt – default (unknown template)', () => {
  it('returns a prompt for unknown template', () => {
    const prompt = buildSystemPrompt('Lena', 'unknown-type', 'My Game');
    expect(prompt).toContain('Lena');
    expect(prompt).toContain('My Game');
  });

  it('undefined template falls through to default', () => {
    const prompt = buildSystemPrompt('Lena', undefined, 'My Game');
    expect(prompt).toContain('Lena');
    expect(prompt).toContain('PACING');
  });

  it('default prompt forbids monologues and long turns', () => {
    const prompt = buildSystemPrompt('Lena', undefined, 'G');
    expect(prompt).toMatch(/No monologues/i);
  });
});

describe('buildSystemPrompt – contentLanguage', () => {
  it('includes LANGUAGE ADAPTATION by default (no contentLanguage)', () => {
    const prompt = buildSystemPrompt('Alice', 'custom', 'Game');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('does not add explicit LANGUAGE rule for English', () => {
    const prompt = buildSystemPrompt('Alice', 'custom', 'Game', undefined, undefined, undefined, undefined, undefined, 'en');
    expect(prompt).not.toMatch(/LANGUAGE:.*Respond in English/);
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('adds Chinese language instruction', () => {
    const prompt = buildSystemPrompt('Alice', 'custom', 'Game', undefined, undefined, undefined, undefined, undefined, 'zh-CN');
    expect(prompt).toContain('Simplified Chinese');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
    expect(prompt).toContain('MUST');
  });

  it('language instruction appears for all template types', () => {
    for (const tmpl of ['custom', 'rpg-dungeon', 'roleplay', undefined]) {
      const prompt = buildSystemPrompt('Zara', tmpl, 'Game', undefined, undefined, undefined, undefined, undefined, 'fr');
      expect(prompt).toContain('French');
      expect(prompt).toContain('MUST');
    }
  });
});

describe('buildSceneCharacterPrompt – contentLanguage', () => {
  it('includes LANGUAGE ADAPTATION by default', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('adds Chinese language instruction', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook', undefined, undefined, undefined, undefined, 'zh-CN');
    expect(prompt).toContain('Simplified Chinese');
    expect(prompt).toContain('MUST');
  });

  it('does not add explicit LANGUAGE rule for English', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook', undefined, undefined, undefined, undefined, 'en');
    expect(prompt).not.toMatch(/LANGUAGE:.*Respond in English/);
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });
});
