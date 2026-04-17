import { describe, it, expect } from 'vitest';
import { getDefaultAICountForTemplate, AI_COLORS } from '../game-utils';

describe('getDefaultAICountForTemplate', () => {
  it('returns recommendedAICount for known templates', () => {
    expect(getDefaultAICountForTemplate('rpg-dungeon')).toBeGreaterThan(0);
  });
  it('returns 4 for unknown or undefined template', () => {
    expect(getDefaultAICountForTemplate('nonexistent')).toBe(4);
    expect(getDefaultAICountForTemplate(undefined)).toBe(4);
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
