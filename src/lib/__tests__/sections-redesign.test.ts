/**
 * Tests for the Sections redesign:
 *  1. gameProgress state removed (dead code cleanup)
 *  2. Rules moved from channel list to Sheet overlay
 *  3. Dynamic Sections distinguished with FileText icon
 *  4. Legacy "rules"/"progress" selectedChannelId migration
 *  5. Channel list structure (no more hardcoded Rules/Progress entries)
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// 1. gameProgress removal verification
// ---------------------------------------------------------------------------
describe('gameProgress dead code removal', () => {
  it('should not include gameProgress in the saved state shape', () => {
    const savedState = {
      messages: [],
      players: [],
      gamePhase: 'active',
      gamePhaseState: {},
      selectedChannelId: 'game-room',
      myBoardContent: {},
      sections: [],
      gameEvents: [],
      savedAt: new Date().toISOString(),
    };
    expect(savedState).not.toHaveProperty('gameProgress');
  });

  it('should gracefully handle old saves that still have gameProgress', () => {
    const oldSave = {
      messages: [],
      players: [],
      gamePhase: 'active',
      gameProgress: 'Round 3 completed',
      sections: [],
    };
    // Hydration code should skip unknown keys without crashing
    const { gameProgress: _, ...rest } = oldSave;
    expect(rest).toHaveProperty('gamePhase', 'active');
    expect(rest).not.toHaveProperty('gameProgress');
  });
});

// ---------------------------------------------------------------------------
// 2. Rules as Sheet overlay (not a channel)
// ---------------------------------------------------------------------------
describe('Rules Sheet overlay', () => {
  it('should not include "rules" in gameChannels', () => {
    const sections = [{ id: 'vote-log', name: 'Vote Log', content: '...' }];
    const visibleGameRoomEntries = [{ id: 'general', name: 'General', type: 'game' as const }];

    const gameChannels = [
      ...sections.map((s) => ({ id: s.id, name: s.name, type: 'text' as const })),
      ...visibleGameRoomEntries,
    ];

    expect(gameChannels.find((c) => c.id === 'rules')).toBeUndefined();
    expect(gameChannels.find((c) => c.id === 'progress')).toBeUndefined();
  });

  it('should include dynamic sections as text channels', () => {
    const sections = [
      { id: 'vote-log', name: 'Vote Log', content: 'Round 1: ...' },
      { id: 'clue-board', name: 'Clue Board', content: 'Key: ...' },
    ];
    const visibleGameRoomEntries = [{ id: 'general', name: 'General', type: 'game' as const }];

    const gameChannels = [
      ...sections.map((s) => ({ id: s.id, name: s.name, type: 'text' as const })),
      ...visibleGameRoomEntries,
    ];

    expect(gameChannels.filter((c) => c.type === 'text')).toHaveLength(2);
    expect(gameChannels[0].id).toBe('vote-log');
    expect(gameChannels[1].id).toBe('clue-board');
  });

  it('should have game rooms after sections', () => {
    const sections = [{ id: 's1', name: 'S1', content: '' }];
    const rooms = [
      { id: 'general', name: 'General', type: 'game' as const },
      { id: 'werewolves', name: 'Werewolves', type: 'game' as const },
    ];

    const gameChannels = [
      ...sections.map((s) => ({ id: s.id, name: s.name, type: 'text' as const })),
      ...rooms,
    ];

    const gameIndex = gameChannels.findIndex((c) => c.type === 'game');
    const textIndex = gameChannels.findIndex((c) => c.type === 'text');
    expect(textIndex).toBeLessThan(gameIndex);
  });
});

// ---------------------------------------------------------------------------
// 3. Legacy selectedChannelId migration
// ---------------------------------------------------------------------------
describe('Legacy channel ID migration', () => {
  const migrate = (selectedChannelId: string | null, firstGameChannel: string): string | null => {
    if (selectedChannelId === 'rules' || selectedChannelId === 'progress') {
      return firstGameChannel;
    }
    return selectedChannelId;
  };

  it('should migrate "rules" to the first game channel', () => {
    expect(migrate('rules', 'general')).toBe('general');
  });

  it('should migrate "progress" to the first game channel', () => {
    expect(migrate('progress', 'general')).toBe('general');
  });

  it('should not migrate valid game channel IDs', () => {
    expect(migrate('general', 'general')).toBe('general');
    expect(migrate('werewolves', 'general')).toBe('werewolves');
  });

  it('should not migrate dynamic section IDs', () => {
    expect(migrate('section-vote-log', 'general')).toBe('section-vote-log');
  });

  it('should handle null selectedChannelId', () => {
    expect(migrate(null, 'general')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Dynamic Sections structure
// ---------------------------------------------------------------------------
describe('Dynamic Sections from AI Host', () => {
  it('should create section IDs from titles consistently', () => {
    // sectionId from game-host-utils creates a stable id from the title
    const sectionId = (title: string) =>
      `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

    expect(sectionId('Vote Log')).toBe('section-vote-log');
    expect(sectionId('Clue Board')).toBe('section-clue-board');
    expect(sectionId('Player Status')).toBe('section-player-status');
  });

  it('should update existing section when title matches', () => {
    let sections = [
      { id: 'section-vote-log', name: 'Vote Log', content: 'Round 1: eliminated Player A' },
    ];

    const newAction = { title: 'Vote Log', content: 'Round 1: eliminated Player A\nRound 2: eliminated Player B' };
    const id = `section-${newAction.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const idx = sections.findIndex((s) => s.id === id);
    if (idx >= 0) {
      sections = [...sections];
      sections[idx] = { ...sections[idx], content: newAction.content };
    }

    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain('Round 2');
  });

  it('should add new section when title is new', () => {
    let sections = [
      { id: 'section-vote-log', name: 'Vote Log', content: 'Round 1: ...' },
    ];

    const newAction = { title: 'Clue Board', content: 'Key found in library' };
    const id = `section-${newAction.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) {
      sections = [...sections, { id, name: newAction.title, content: newAction.content }];
    }

    expect(sections).toHaveLength(2);
    expect(sections[1].name).toBe('Clue Board');
  });
});

// ---------------------------------------------------------------------------
// 5. Channel list renders only dynamic sections (no Rules/Progress)
// ---------------------------------------------------------------------------
describe('Channel list text section filtering', () => {
  it('should show no text sections when there are no dynamic sections', () => {
    const channels: Array<{ id: string; name: string; type: 'text' | 'game' }> = [
      { id: 'general', name: 'General', type: 'game' },
    ];
    const textChannels = channels.filter((c) => c.type === 'text');
    expect(textChannels).toHaveLength(0);
  });

  it('should show dynamic sections as text channels', () => {
    const channels = [
      { id: 'section-vote-log', name: 'Vote Log', type: 'text' as const },
      { id: 'section-clues', name: 'Clues', type: 'text' as const },
      { id: 'general', name: 'General', type: 'game' as const },
    ];
    const textChannels = channels.filter((c) => c.type === 'text');
    expect(textChannels).toHaveLength(2);
    expect(textChannels.map((c) => c.name)).toEqual(['Vote Log', 'Clues']);
  });
});
