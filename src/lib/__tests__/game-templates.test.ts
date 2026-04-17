import { describe, it, expect } from 'vitest';
import { GAME_TEMPLATES, getGameTemplate } from '../game-templates';

describe('GAME_TEMPLATES – structural integrity', () => {
  it('has at least one template', () => {
    expect(GAME_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has a non-empty id, name, icon, color, estimatedTime', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.id, `template "${t.name}" is missing id`).toBeTruthy();
      expect(t.name, `template "${t.id}" is missing name`).toBeTruthy();
      expect(t.icon, `template "${t.id}" is missing icon`).toBeTruthy();
      expect(t.color, `template "${t.id}" is missing color`).toBeTruthy();
      expect(t.estimatedTime, `template "${t.id}" is missing estimatedTime`).toBeTruthy();
    }
  });

  it('every template id is unique', () => {
    const ids = GAME_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('GAME_TEMPLATES – player count constraints', () => {
  it('every template has 1 ≤ minPlayers ≤ maxPlayers ≤ 20', () => {
    for (const t of GAME_TEMPLATES) {
      expect(t.minPlayers, `"${t.id}"`).toBeGreaterThanOrEqual(1);
      expect(t.maxPlayers, `"${t.id}"`).toBeGreaterThanOrEqual(t.minPlayers);
      expect(t.maxPlayers, `"${t.id}"`).toBeLessThanOrEqual(20);
    }
  });
});

describe('getGameTemplate', () => {
  it('returns undefined for unknown ids', () => {
    expect(getGameTemplate('nonexistent')).toBeUndefined();
    expect(getGameTemplate('')).toBeUndefined();
  });

  it('returns a template for every id in GAME_TEMPLATES', () => {
    for (const t of GAME_TEMPLATES) {
      expect(getGameTemplate(t.id)).toBeDefined();
    }
  });
});
