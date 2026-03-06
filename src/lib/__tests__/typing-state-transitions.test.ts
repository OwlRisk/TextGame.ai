import { describe, it, expect } from 'vitest';

/**
 * Tests for typing state transitions during speaker queue execution.
 *
 * These test the logic of how typingUsers[] evolves as AI players speak
 * in seedInitialPlayerReplies and runSpeakerQueue / speakAndReveal.
 */

interface Player {
  id: string;
  name: string;
  avatar: string;
  personality?: string;
}

interface TypingUser {
  name: string;
  avatar: string;
}

const toTypingEntry = (p: Player): TypingUser => ({
  name: p.name,
  avatar: p.avatar,
});

// ─── seedInitialPlayerReplies typing transitions ─────────────────────────────

describe('seedInitialPlayerReplies – typing state transitions', () => {
  const players: Player[] = [
    { id: 'ai-1', name: 'Jonah', avatar: '#ff0000' },
    { id: 'ai-2', name: 'Samir', avatar: '#00ff00' },
    { id: 'ai-3', name: 'Maya', avatar: '#0000ff' },
    { id: 'ai-4', name: 'Leila', avatar: '#ffff00' },
  ];

  function simulateSeedTypingTransitions(toReply: Player[]): TypingUser[][] {
    const states: TypingUser[][] = [];

    // Initial: show upcoming typers (up to 3)
    const initial = toReply.slice(0, Math.min(3, toReply.length)).map(toTypingEntry);
    states.push(initial);

    for (let i = 0; i < toReply.length; i++) {
      // Before API call: current + remaining (up to 3)
      const remaining = toReply.slice(i).slice(0, 3).map(toTypingEntry);
      states.push(remaining);

      // After API call completes, during typewriter: remove current, keep rest
      const after = toReply.slice(i + 1).slice(0, 3).map(toTypingEntry);
      states.push(after);
    }

    // Final: empty
    states.push([]);
    return states;
  }

  it('3 players: shows decreasing count as each finishes', () => {
    const toReply = players.slice(0, 3);
    const states = simulateSeedTypingTransitions(toReply);

    // Initial state: all 3
    expect(states[0].map((u) => u.name)).toEqual(['Jonah', 'Samir', 'Maya']);

    // Before Jonah speaks: [Jonah, Samir, Maya]
    expect(states[1].map((u) => u.name)).toEqual(['Jonah', 'Samir', 'Maya']);
    // After Jonah done: [Samir, Maya]
    expect(states[2].map((u) => u.name)).toEqual(['Samir', 'Maya']);

    // Before Samir speaks: [Samir, Maya]
    expect(states[3].map((u) => u.name)).toEqual(['Samir', 'Maya']);
    // After Samir done: [Maya]
    expect(states[4].map((u) => u.name)).toEqual(['Maya']);

    // Before Maya speaks: [Maya]
    expect(states[5].map((u) => u.name)).toEqual(['Maya']);
    // After Maya done: []
    expect(states[6]).toEqual([]);

    // Final cleanup
    expect(states[states.length - 1]).toEqual([]);
  });

  it('4 players: caps at 3 shown initially', () => {
    const states = simulateSeedTypingTransitions(players);

    // Initial: capped at 3
    expect(states[0]).toHaveLength(3);
    expect(states[0].map((u) => u.name)).toEqual(['Jonah', 'Samir', 'Maya']);

    // After Jonah done: Leila enters the visible set
    expect(states[2].map((u) => u.name)).toEqual(['Samir', 'Maya', 'Leila']);
  });

  it('single player: shows one then clears', () => {
    const toReply = [players[0]];
    const states = simulateSeedTypingTransitions(toReply);

    expect(states[0].map((u) => u.name)).toEqual(['Jonah']);
    expect(states[1].map((u) => u.name)).toEqual(['Jonah']); // before speak
    expect(states[2]).toEqual([]); // after speak
    expect(states[3]).toEqual([]); // final
  });

  it('two players: shows both then one then empty', () => {
    const toReply = players.slice(0, 2);
    const states = simulateSeedTypingTransitions(toReply);

    expect(states[0].map((u) => u.name)).toEqual(['Jonah', 'Samir']);
    expect(states[2].map((u) => u.name)).toEqual(['Samir']);
    expect(states[4]).toEqual([]);
  });
});

// ─── speakAndReveal upcoming players logic ───────────────────────────────────

describe('speakAndReveal – upcoming player collection', () => {
  interface SpeakerQueueItem {
    type: 'ai' | 'human' | 'everyone';
    player?: Player;
  }

  /**
   * Mirrors the logic in runSpeakerQueue that collects upcoming AI players
   * for the typing indicator when processing a queue item.
   */
  function collectUpcomingAi(
    queue: SpeakerQueueItem[],
    currentIndex: number,
    maxCount = 3
  ): Player[] {
    const upcoming: Player[] = [];
    for (let ni = currentIndex + 1; ni < queue.length; ni++) {
      const next = queue[ni];
      if (next.type === 'ai' && next.player) {
        upcoming.push(next.player);
        if (upcoming.length >= maxCount) break;
      }
      if (next.type === 'human' || next.type === 'everyone') break;
    }
    return upcoming;
  }

  const ai = (name: string): SpeakerQueueItem => ({
    type: 'ai',
    player: { id: `ai-${name}`, name, avatar: '#000' },
  });
  const human: SpeakerQueueItem = { type: 'human' };
  const everyone: SpeakerQueueItem = { type: 'everyone' };

  it('collects next 3 AI players from queue', () => {
    const queue = [ai('A'), ai('B'), ai('C'), ai('D'), ai('E')];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming.map((p) => p.name)).toEqual(['B', 'C', 'D']);
  });

  it('stops before human turn', () => {
    const queue = [ai('A'), ai('B'), human, ai('C')];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming.map((p) => p.name)).toEqual(['B']);
  });

  it('stops before everyone turn', () => {
    const queue = [ai('A'), everyone, ai('C')];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming).toHaveLength(0);
  });

  it('returns empty when current is last in queue', () => {
    const queue = [ai('A'), ai('B')];
    const upcoming = collectUpcomingAi(queue, 1);
    expect(upcoming).toHaveLength(0);
  });

  it('caps at 3 even if more AI follow', () => {
    const queue = [ai('A'), ai('B'), ai('C'), ai('D'), ai('E'), ai('F')];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming).toHaveLength(3);
  });

  it('collects from middle of queue correctly', () => {
    const queue = [ai('A'), ai('B'), ai('C'), ai('D')];
    const upcoming = collectUpcomingAi(queue, 1);
    expect(upcoming.map((p) => p.name)).toEqual(['C', 'D']);
  });

  it('handles queue with only human items', () => {
    const queue = [human, human];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming).toHaveLength(0);
  });

  it('mixed queue: AI, human, AI — only collects before human', () => {
    const queue = [ai('A'), ai('B'), ai('C'), human, ai('D'), ai('E')];
    const upcoming = collectUpcomingAi(queue, 0);
    expect(upcoming.map((p) => p.name)).toEqual(['B', 'C']);
  });
});

// ─── "everyone" mode typing transitions ──────────────────────────────────────

describe('everyone mode – typing state', () => {
  const players: Player[] = [
    { id: 'ai-1', name: 'Jonah', avatar: '#ff0000' },
    { id: 'ai-2', name: 'Samir', avatar: '#00ff00' },
    { id: 'ai-3', name: 'Maya', avatar: '#0000ff' },
  ];

  function simulateEveryoneMode(picks: Player[]): TypingUser[][] {
    const states: TypingUser[][] = [];

    for (let pi = 0; pi < picks.length; pi++) {
      const upcoming = picks.slice(pi + 1).map(toTypingEntry);

      // Before speak: current + upcoming
      states.push([toTypingEntry(picks[pi]), ...upcoming.slice(0, 2)]);

      // After speak: just upcoming
      states.push(upcoming.slice(0, 3));
    }

    // Final clear
    states.push([]);
    return states;
  }

  it('3 picks: shows current + upcoming, then decreasing', () => {
    const states = simulateEveryoneMode(players);

    // Jonah speaking: [Jonah, Samir, Maya]
    expect(states[0].map((u) => u.name)).toEqual(['Jonah', 'Samir', 'Maya']);
    // Jonah done: [Samir, Maya]
    expect(states[1].map((u) => u.name)).toEqual(['Samir', 'Maya']);

    // Samir speaking: [Samir, Maya]
    expect(states[2].map((u) => u.name)).toEqual(['Samir', 'Maya']);
    // Samir done: [Maya]
    expect(states[3].map((u) => u.name)).toEqual(['Maya']);

    // Maya speaking: [Maya]
    expect(states[4].map((u) => u.name)).toEqual(['Maya']);
    // Maya done: []
    expect(states[5]).toEqual([]);
  });

  it('single pick: shows one then clears', () => {
    const states = simulateEveryoneMode([players[0]]);
    expect(states[0].map((u) => u.name)).toEqual(['Jonah']);
    expect(states[1]).toEqual([]);
  });
});

// ─── toTypingEntry helper ────────────────────────────────────────────────────

describe('toTypingEntry – player to typing user conversion', () => {
  it('maps player fields correctly', () => {
    const player: Player = { id: 'ai-1', name: 'Jonah', avatar: '#ff0000' };
    const entry = toTypingEntry(player);
    expect(entry).toEqual({ name: 'Jonah', avatar: '#ff0000' });
  });

  it('does not include id or personality', () => {
    const player: Player = {
      id: 'ai-1',
      name: 'Jonah',
      avatar: '#ff0000',
      personality: 'Bold and decisive',
    };
    const entry = toTypingEntry(player);
    expect(entry).toEqual({ name: 'Jonah', avatar: '#ff0000' });
    expect('id' in entry).toBe(false);
    expect('personality' in entry).toBe(false);
  });
});
