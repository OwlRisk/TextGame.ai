import { describe, it, expect } from 'vitest';

/**
 * Tests for the multi-user typing indicator system.
 *
 * The typing indicator now supports showing multiple users simultaneously
 * (up to 3 avatars + names), with visibility filtering against streaming messages.
 */

interface TypingUser {
  name: string;
  avatar: string;
}

interface Message {
  senderName: string;
  isStreaming?: boolean;
}

// ─── Visibility filtering logic (mirrors chat-area.tsx) ──────────────────────

/** Filter out typing users whose streaming message is already visible. */
function getVisibleTypingUsers(
  typingUsers: TypingUser[],
  messages: Message[]
): TypingUser[] {
  return typingUsers.filter(
    (u) => !messages.some((m) => m.senderName === u.name && m.isStreaming)
  );
}

/** Get display data for the typing indicator. */
function getTypingDisplay(visible: TypingUser[], maxShow = 3) {
  const displayLimit = Math.min(visible.length, maxShow);
  const shown = visible.slice(0, displayLimit);
  const extra = visible.length - displayLimit;
  return { shown, extra };
}

// ─── Visibility filtering ────────────────────────────────────────────────────

describe('typing indicator – visibility filtering', () => {
  it('shows all typing users when none have streaming messages', () => {
    const typing: TypingUser[] = [
      { name: 'Jonah', avatar: '#ff0000' },
      { name: 'Samir', avatar: '#00ff00' },
    ];
    const messages: Message[] = [
      { senderName: 'Jonah', isStreaming: false },
    ];
    const visible = getVisibleTypingUsers(typing, messages);
    expect(visible).toHaveLength(2);
  });

  it('hides typing user when their streaming message is already visible', () => {
    const typing: TypingUser[] = [
      { name: 'Jonah', avatar: '#ff0000' },
      { name: 'Samir', avatar: '#00ff00' },
    ];
    const messages: Message[] = [
      { senderName: 'Jonah', isStreaming: true },
    ];
    const visible = getVisibleTypingUsers(typing, messages);
    expect(visible).toHaveLength(1);
    expect(visible[0].name).toBe('Samir');
  });

  it('hides all typing users when all have streaming messages', () => {
    const typing: TypingUser[] = [
      { name: 'Jonah', avatar: '#ff0000' },
      { name: 'Samir', avatar: '#00ff00' },
    ];
    const messages: Message[] = [
      { senderName: 'Jonah', isStreaming: true },
      { senderName: 'Samir', isStreaming: true },
    ];
    const visible = getVisibleTypingUsers(typing, messages);
    expect(visible).toHaveLength(0);
  });

  it('shows typing user if their message finished streaming (isStreaming: false)', () => {
    const typing: TypingUser[] = [{ name: 'Jonah', avatar: '#ff0000' }];
    const messages: Message[] = [
      { senderName: 'Jonah', isStreaming: false },
    ];
    const visible = getVisibleTypingUsers(typing, messages);
    expect(visible).toHaveLength(1);
  });

  it('handles empty typing users', () => {
    expect(getVisibleTypingUsers([], [])).toHaveLength(0);
  });

  it('handles empty messages', () => {
    const typing: TypingUser[] = [{ name: 'Jonah', avatar: '#ff0000' }];
    expect(getVisibleTypingUsers(typing, [])).toHaveLength(1);
  });
});

// ─── Display limit logic ─────────────────────────────────────────────────────

describe('typing indicator – display limit', () => {
  const makeUsers = (count: number): TypingUser[] =>
    Array.from({ length: count }, (_, i) => ({
      name: `Player${i + 1}`,
      avatar: `#${String(i).padStart(6, '0')}`,
    }));

  it('shows all users when count <= 3', () => {
    const { shown, extra } = getTypingDisplay(makeUsers(2));
    expect(shown).toHaveLength(2);
    expect(extra).toBe(0);
  });

  it('shows exactly 3 users when count === 3', () => {
    const { shown, extra } = getTypingDisplay(makeUsers(3));
    expect(shown).toHaveLength(3);
    expect(extra).toBe(0);
  });

  it('caps at 3 shown and reports extra count', () => {
    const { shown, extra } = getTypingDisplay(makeUsers(5));
    expect(shown).toHaveLength(3);
    expect(extra).toBe(2);
  });

  it('handles single user', () => {
    const { shown, extra } = getTypingDisplay(makeUsers(1));
    expect(shown).toHaveLength(1);
    expect(extra).toBe(0);
  });

  it('handles empty list', () => {
    const { shown, extra } = getTypingDisplay([]);
    expect(shown).toHaveLength(0);
    expect(extra).toBe(0);
  });

  it('extra count label format: "+2" for 5 users', () => {
    const { extra } = getTypingDisplay(makeUsers(5));
    const label = extra > 0 ? ` +${extra}` : '';
    expect(label).toBe(' +2');
  });
});

// ─── Name display formatting ─────────────────────────────────────────────────

describe('typing indicator – name formatting', () => {
  it('single user: just the name', () => {
    const shown = [{ name: 'Jonah', avatar: '#000' }];
    const label = shown.map((u) => u.name).join(', ');
    expect(label).toBe('Jonah');
  });

  it('two users: comma-separated', () => {
    const shown = [
      { name: 'Jonah', avatar: '#000' },
      { name: 'Samir', avatar: '#111' },
    ];
    const label = shown.map((u) => u.name).join(', ');
    expect(label).toBe('Jonah, Samir');
  });

  it('three users: comma-separated', () => {
    const shown = [
      { name: 'Jonah', avatar: '#000' },
      { name: 'Samir', avatar: '#111' },
      { name: 'Maya', avatar: '#222' },
    ];
    const label = shown.map((u) => u.name).join(', ');
    expect(label).toBe('Jonah, Samir, Maya');
  });

  it('five users: three shown + extra label', () => {
    const all = [
      { name: 'Jonah', avatar: '#000' },
      { name: 'Samir', avatar: '#111' },
      { name: 'Maya', avatar: '#222' },
      { name: 'Leila', avatar: '#333' },
      { name: 'Owen', avatar: '#444' },
    ];
    const { shown, extra } = getTypingDisplay(all);
    const label = shown.map((u) => u.name).join(', ') + (extra > 0 ? ` +${extra}` : '');
    expect(label).toBe('Jonah, Samir, Maya +2');
  });
});
