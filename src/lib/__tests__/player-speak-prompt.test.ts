import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, PACING_RULE, PLAYER_SPEAK_HARD_LIMIT_TOKENS } from '../player-speak-prompt';

// ─── Constants ────────────────────────────────────────────────────────────

describe('PLAYER_SPEAK_HARD_LIMIT_TOKENS', () => {
  it('is 180 tokens', () => {
    expect(PLAYER_SPEAK_HARD_LIMIT_TOKENS).toBe(180);
  });
});

describe('PACING_RULE', () => {
  it('enforces a hard limit of 2 sentences per turn', () => {
    expect(PACING_RULE).toMatch(/2 sentences/i);
  });

  it('instructs AI to prefer 1 sentence', () => {
    expect(PACING_RULE).toMatch(/1 preferred/i);
  });

  it('forbids speeches and paragraphs', () => {
    expect(PACING_RULE).toMatch(/No speeches/i);
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
  it('werewolf prompt includes social deduction language', () => {
    const prompt = buildSystemPrompt('Bob', 'werewolf', 'Werewolf Night');
    expect(prompt).toMatch(/social deduction/i);
  });

  it('mafia prompt shares the same branch as werewolf', () => {
    const wPrompt = buildSystemPrompt('Bob', 'werewolf', 'G');
    const mPrompt = buildSystemPrompt('Bob', 'mafia', 'G');
    expect(wPrompt).toBe(mPrompt);
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
    expect(prompt).toMatch(/don't say it outright/i);
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
    expect(prompt).toMatch(/no game-theory/i);
  });
});

describe('buildSystemPrompt – trivia / quiz', () => {
  it('trivia prompt references pub quiz energy', () => {
    const prompt = buildSystemPrompt('Sam', 'trivia', 'Quiz Night');
    expect(prompt).toMatch(/pub quiz/i);
  });

  it('quiz and trivia share the same prompt branch', () => {
    const tPrompt = buildSystemPrompt('Sam', 'trivia', 'G');
    const qPrompt = buildSystemPrompt('Sam', 'quiz', 'G');
    expect(tPrompt).toBe(qPrompt);
  });
});

describe('buildSystemPrompt – roleplay / adventure', () => {
  it('roleplay prompt asks to stay in character', () => {
    const prompt = buildSystemPrompt('Zara', 'roleplay', 'Fantasy Quest');
    expect(prompt).toMatch(/stay in character/i);
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

describe('buildSystemPrompt – elaboration pacing', () => {
  it('mentions that the Host will prompt again when elaboration is needed', () => {
    const prompt = buildSystemPrompt('Alice', 'werewolf', 'Game');
    expect(prompt).toMatch(/host will prompt again/i);
  });

  it('limits elaboration answer to 2 sentences', () => {
    const prompt = buildSystemPrompt('Alice', 'mafia', 'Game');
    expect(prompt).toMatch(/2 sentences/);
  });
});
