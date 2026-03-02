import { describe, it, expect } from 'vitest';
import { GAME_TEMPLATES, DEFAULT_SLASH_COMMANDS, getGameTemplate } from '../game-templates';

// ─── GAME_TEMPLATES: structural integrity ─────────────────────────────────

describe('GAME_TEMPLATES – structural integrity', () => {
  it('has at least one template', () => {
    expect(GAME_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has a non-empty id', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.id, `template "${t.name}" is missing id`).toBeTruthy();
    }
  });

  it('every template id is unique', () => {
    const ids = GAME_TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has a non-empty name', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.name, `template "${t.id}" is missing name`).toBeTruthy();
    }
  });

  it('every template has a non-empty icon', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.icon, `template "${t.id}" is missing icon`).toBeTruthy();
    }
  });

  it('every template has a non-empty color', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.color, `template "${t.id}" is missing color`).toBeTruthy();
    }
  });

  it('every template has a non-empty estimatedTime', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.estimatedTime, `template "${t.id}" is missing estimatedTime`).toBeTruthy();
    }
  });
});

// ─── GAME_TEMPLATES: player count constraints ─────────────────────────────

describe('GAME_TEMPLATES – player count constraints', () => {
  it('every template has minPlayers ≥ 1', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.minPlayers, `"${t.id}" minPlayers < 1`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template has maxPlayers ≥ minPlayers', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.maxPlayers, `"${t.id}" maxPlayers < minPlayers`).toBeGreaterThanOrEqual(t.minPlayers);
    }
  });

  it('every template has maxPlayers ≤ 20', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.maxPlayers, `"${t.id}" maxPlayers > 20`).toBeLessThanOrEqual(20);
    }
  });
});

// ─── GAME_TEMPLATES: roles ────────────────────────────────────────────────

describe('GAME_TEMPLATES – roles array', () => {
  it('every template has a roles field (array)', () => {
    for (const t of GAME_TEMPLATES) {
      expect(Array.isArray(t.roles), `"${t.id}" roles is not an array`).toBe(true);
    }
  });

  it('social deduction templates have at least 2 roles', () => {
    const socialDeduction = ['werewolf', 'mafia', 'undercover'];
    for (const id of socialDeduction) {
      const t = GAME_TEMPLATES.find((x) => x.id === id);
      expect(t?.roles?.length, `"${id}" should have ≥ 2 roles`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every role name is a non-empty string', () => {
    for (const t of GAME_TEMPLATES) {
      for (const role of t.roles ?? []) {
        expect(typeof role).toBe('string');
        expect(role.trim().length, `empty role in "${t.id}"`).toBeGreaterThan(0);
      }
    }
  });
});

// ─── GAME_TEMPLATES: defaultRules ────────────────────────────────────────

describe('GAME_TEMPLATES – defaultRules', () => {
  it('social deduction templates have non-empty defaultRules', () => {
    const required = ['werewolf', 'mafia', 'undercover'];
    for (const id of required) {
      const t = GAME_TEMPLATES.find((x) => x.id === id);
      expect(t?.defaultRules?.trim().length, `"${id}" defaultRules is empty`).toBeGreaterThan(0);
    }
  });

  it('werewolf rules mention WIN CONDITIONS', () => {
    const t = GAME_TEMPLATES.find((x) => x.id === 'werewolf');
    expect(t?.defaultRules).toMatch(/WIN CONDITIONS/i);
  });

  it('mafia rules mention ROLES', () => {
    const t = GAME_TEMPLATES.find((x) => x.id === 'mafia');
    expect(t?.defaultRules).toMatch(/ROLES/i);
  });
});

// ─── getGameTemplate ──────────────────────────────────────────────────────

describe('getGameTemplate', () => {
  it('returns the correct template for a known id', () => {
    const t = getGameTemplate('werewolf');
    expect(t).toBeDefined();
    expect(t?.id).toBe('werewolf');
    expect(t?.name).toBe('Werewolf');
  });

  it('returns undefined for an unknown id', () => {
    expect(getGameTemplate('nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getGameTemplate('')).toBeUndefined();
  });

  it('returns a template for every id in GAME_TEMPLATES', () => {
    for (const t of GAME_TEMPLATES) {
      expect(getGameTemplate(t.id)).toBeDefined();
    }
  });
});

// ─── DEFAULT_SLASH_COMMANDS ───────────────────────────────────────────────

describe('DEFAULT_SLASH_COMMANDS', () => {
  it('has entries for every known social deduction template', () => {
    const expected = ['werewolf', 'mafia', 'undercover', 'tarot', 'custom'];
    for (const id of expected) {
      expect(DEFAULT_SLASH_COMMANDS[id], `missing slash commands for "${id}"`).toBeDefined();
    }
  });

  it('every command starts with /', () => {
    for (const [templateId, cmds] of Object.entries(DEFAULT_SLASH_COMMANDS)) {
      for (const { cmd } of cmds) {
        expect(cmd, `command "${cmd}" in "${templateId}" should start with /`).toMatch(/^\//);
      }
    }
  });

  it('every command has a non-empty hint', () => {
    for (const [templateId, cmds] of Object.entries(DEFAULT_SLASH_COMMANDS)) {
      for (const { hint } of cmds) {
        expect(hint.trim().length, `empty hint in "${templateId}"`).toBeGreaterThan(0);
      }
    }
  });

  it('werewolf has a /vote command', () => {
    expect(DEFAULT_SLASH_COMMANDS.werewolf.some((c) => c.cmd === '/vote')).toBe(true);
  });
});
