import { describe, it, expect } from 'vitest';
import { getDefaultAICountForTemplate, AI_COLORS } from '../game-utils';

describe('getDefaultAICountForTemplate', () => {
  it('returns 7 for werewolf', () => {
    expect(getDefaultAICountForTemplate('werewolf')).toBe(7);
  });
  it('returns 6 for undercover', () => {
    expect(getDefaultAICountForTemplate('undercover')).toBe(6);
  });
  it('returns 9 for mafia', () => {
    expect(getDefaultAICountForTemplate('mafia')).toBe(9);
  });
  it('returns 6 for unknown template', () => {
    expect(getDefaultAICountForTemplate('custom')).toBe(6);
    expect(getDefaultAICountForTemplate(undefined)).toBe(6);
  });
});

describe('AI_COLORS', () => {
  it('has 10 hex colors', () => {
    expect(AI_COLORS).toHaveLength(10);
    AI_COLORS.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
