import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildSceneCharacterPrompt, PLAYER_SPEAK_HARD_LIMIT_TOKENS } from '../player-speak-prompt';

// ─── Constants ────────────────────────────────────────────────────────────

describe('PLAYER_SPEAK_HARD_LIMIT_TOKENS', () => {
  it('is 220 tokens', () => {
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBe(220);
  });
});

describe('pacing rules in prompt output', () => {
  it('werewolf prompt enforces sentence limits', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'G');
    expect(prompt).toMatch(/3 sentences max/i);
    expect(prompt).toMatch(/2 preferred/i);
    expect(prompt).toMatch(/No speeches/i);
  });

  it('narrative templates get higher sentence limits', () => {
    const prompt = buildSystemPrompt('Alice', 'tarot', 'G');
    expect(prompt).toMatch(/4 sentences max/i);
    expect(prompt).toMatch(/2 preferred/i);
  });
});

// ─── buildSystemPrompt: shared guarantees ─────────────────────────────────

describe('buildSystemPrompt – shared guarantees', () => {
  const templates = ['werewolf', 'mafia', 'undercover', 'tarot', 'trivia', 'quiz', 'roleplay', 'adventure', undefined];

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

// ─── buildSystemPrompt: template-specific content ─────────────────────────

describe('buildSystemPrompt – werewolf / mafia', () => {
  it('werewolf prompt includes deduction-style accusation play', () => {
    const prompt = buildSystemPrompt('Bob', 'werewolf', 'Werewolf Night');
    expect(prompt).toMatch(/Werewolf/i);
    expect(prompt).toMatch(/accusation/i);
  });

  it('mafia prompt shares the same HOW TO PLAY structure as werewolf (distinct game names)', () => {
    const wPrompt = buildSystemPrompt('Bob', 'werewolf', 'G');
    const mPrompt = buildSystemPrompt('Bob', 'mafia', 'G');
    expect(wPrompt).toContain('One concrete accusation, defense, or observation per turn');
    expect(mPrompt).toContain('One concrete accusation, defense, or observation per turn');
    expect(wPrompt).toContain('playing Werewolf');
    expect(mPrompt).toContain('playing Mafia');
    expect(wPrompt).not.toBe(mPrompt);
  });

  it('prompt includes instructions to give a concrete accusation or defense', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'G');
    expect(prompt).toMatch(/concrete accusation/i);
  });
});

describe('buildSystemPrompt – undercover', () => {
  it('includes word-guessing / undercover language', () => {
    const prompt = buildSystemPrompt('Eve', 'undercover', 'Word Game');
    expect(prompt).toMatch(/undercover/i);
  });

  it('instructs not to say the word outright', () => {
    const prompt = buildSystemPrompt('Eve', 'undercover', 'Word Game');
    expect(prompt).toMatch(/Describe your word indirectly/i);
    expect(prompt).toMatch(/not give it away/i);
  });
});

describe('buildSystemPrompt – tarot', () => {
  it('uses reflective / introspective language', () => {
    const prompt = buildSystemPrompt('Maya', 'tarot', 'Tarot Circle');
    expect(prompt).toMatch(/tarot/i);
    expect(prompt).toMatch(/reflective/i);
  });

  it('discourages game-theory talk', () => {
    const prompt = buildSystemPrompt('Maya', 'tarot', 'Tarot Circle');
    expect(prompt).toMatch(/No meta-commentary about game procedure/i);
  });
});

describe('buildSystemPrompt – trivia / quiz', () => {
  it('trivia prompt references pub quiz energy', () => {
    const prompt = buildSystemPrompt('Sam', 'trivia', 'Quiz Night');
    expect(prompt).toMatch(/pub quiz/i);
  });

  it('trivia uses registered template; unknown "quiz" id falls back to generic HOW TO PLAY', () => {
    const tPrompt = buildSystemPrompt('Sam', 'trivia', 'G');
    const qPrompt = buildSystemPrompt('Sam', 'quiz', 'G');
    expect(tPrompt).toContain('pub quiz');
    expect(qPrompt).not.toContain('pub quiz');
    expect(qPrompt).toMatch(/game table with opinions and stakes/i);
    expect(tPrompt).toMatch(/competitive pub quiz/i);
  });
});

describe('buildSystemPrompt – roleplay / adventure', () => {
  it('roleplay prompt asks to stay in character', () => {
    const prompt = buildSystemPrompt('Zara', 'roleplay', 'Fantasy Quest');
    expect(prompt).toMatch(/never break character/i);
  });

  it('adventure and roleplay share the same prompt branch', () => {
    const rPrompt = buildSystemPrompt('Zara', 'roleplay', 'G');
    const aPrompt = buildSystemPrompt('Zara', 'adventure', 'G');
    expect(rPrompt).toBe(aPrompt);
  });
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

  it('default prompt forbids speeches and long turns', () => {
    const prompt = buildSystemPrompt('Lena', undefined, 'G');
    expect(prompt).toMatch(/No speeches/i);
  });
});

// ─── buildSystemPrompt: elaboration guidance in PACING_RULE ───────────────

describe('buildSystemPrompt – pacing enforcement', () => {
  it('deduction games require mandatory contribution', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game');
    expect(prompt).toMatch(/MUST contribute each turn/i);
  });

  it('enforces sentence limits in all templates', () => {
    const prompt = buildSystemPrompt('Alice', 'mafia', 'Game');
    expect(prompt).toMatch(/3 sentences max/i);
  });
});

// ─── buildSystemPrompt: contentLanguage ────────────────────────────────────

describe('buildSystemPrompt – contentLanguage', () => {
  it('includes LANGUAGE ADAPTATION by default (no contentLanguage)', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('does not add explicit LANGUAGE rule for English', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game', undefined, undefined, undefined, undefined, undefined, 'en');
    expect(prompt).not.toMatch(/LANGUAGE:.*Respond in English/);
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('adds Chinese language instruction', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game', undefined, undefined, undefined, undefined, undefined, 'zh-CN');
    expect(prompt).toContain('Respond in Simplified Chinese');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('adds Japanese language instruction', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game', undefined, undefined, undefined, undefined, undefined, 'ja');
    expect(prompt).toContain('Japanese');
  });

  it('keeps directive keywords in English', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game', undefined, undefined, undefined, undefined, undefined, 'ko');
    expect(prompt).toContain('always remain in English');
  });

  it('language instruction appears for all template types', () => {
    for (const tmpl of ['werewolf', 'mafia', 'tarot', 'trivia', 'roleplay', undefined]) {
      const prompt = buildSystemPrompt('Zara', tmpl, 'Game', undefined, undefined, undefined, undefined, undefined, 'fr');
      expect(prompt).toContain('Respond in French');
    }
  });
});

// ─── buildSceneCharacterPrompt: contentLanguage ────────────────────────────

describe('buildSceneCharacterPrompt – contentLanguage', () => {
  it('includes LANGUAGE ADAPTATION by default', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook');
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });

  it('adds Chinese language instruction', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook', undefined, undefined, undefined, undefined, 'zh-CN');
    expect(prompt).toContain('Respond in Simplified Chinese');
  });

  it('does not add explicit LANGUAGE rule for English', () => {
    const prompt = buildSceneCharacterPrompt('Kai', 'museum-heist', 'Brook', undefined, undefined, undefined, undefined, 'en');
    expect(prompt).not.toMatch(/LANGUAGE:.*Respond in English/);
    expect(prompt).toContain('LANGUAGE ADAPTATION');
  });
});
