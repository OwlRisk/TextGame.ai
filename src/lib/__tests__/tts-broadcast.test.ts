import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Supabase (hoisted before any imports that depend on it) ─────────────
vi.mock('@/lib/supabase', () => {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
  return {
    supabase: {
      channel: vi.fn().mockReturnValue(channel),
      removeChannel: vi.fn(),
    },
  };
});

import { supabase } from '@/lib/supabase';
import { ttsBroadcast } from '../tts-broadcast';

// ─── Mock channel builder ─────────────────────────────────────────────────────

type BroadcastListener = (msg: { payload: unknown }) => void;

function makeMockChannel() {
  const listeners = new Map<string, BroadcastListener>();
  const sent: Array<{ type: string; event: string; payload: unknown }> = [];

  const ch = {
    on: vi.fn((_type: string, opts: { event: string }, cb: BroadcastListener) => {
      listeners.set(opts.event, cb);
      return ch;
    }),
    subscribe: vi.fn(() => ch),
    send: vi.fn((msg: { type: string; event: string; payload: unknown }) => {
      sent.push(msg);
    }),
    _emit(event: string, payload: unknown) {
      listeners.get(event)?.({ payload });
    },
    _sent: sent,
  };
  return ch;
}

const VOICE = 'voice-abc';
const AUDIO = 'base64audio==';

// ─── Shared channel reference updated in beforeEach ───────────────────────────
let mockChannel = makeMockChannel();

// ─── Lifecycle tests ──────────────────────────────────────────────────────────

describe('TTSBroadcastManager – lifecycle', () => {
  beforeEach(() => {
    ttsBroadcast.teardown();
    mockChannel = makeMockChannel();
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never);
    vi.mocked(supabase.removeChannel).mockReset();
  });

  afterEach(() => {
    ttsBroadcast.teardown();
  });

  it('is inactive before setup', () => {
    expect(ttsBroadcast.isActive).toBe(false);
  });

  it('becomes active after setup', () => {
    ttsBroadcast.setup('game-1', true);
    expect(ttsBroadcast.isActive).toBe(true);
  });

  it('becomes inactive after teardown', () => {
    ttsBroadcast.setup('game-1', true);
    ttsBroadcast.teardown();
    expect(ttsBroadcast.isActive).toBe(false);
  });

  it('re-setup with same gameId + isOwner is a no-op (no duplicate subscribe)', () => {
    vi.mocked(supabase.channel).mockClear();
    ttsBroadcast.setup('game-1', true);
    ttsBroadcast.setup('game-1', true);
    expect(vi.mocked(supabase.channel).mock.calls).toHaveLength(1);
  });

  it('re-setup with different gameId tears down previous channel', () => {
    ttsBroadcast.setup('game-1', true);
    ttsBroadcast.setup('game-2', true);
    expect(vi.mocked(supabase.removeChannel)).toHaveBeenCalledOnce();
    expect(ttsBroadcast.isActive).toBe(true);
  });
});

// ─── Owner mode tests ─────────────────────────────────────────────────────────

describe('TTSBroadcastManager – owner mode', () => {
  beforeEach(() => {
    ttsBroadcast.teardown();
    mockChannel = makeMockChannel();
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never);
    ttsBroadcast.setup('game-owner', true);
  });

  afterEach(() => {
    ttsBroadcast.teardown();
  });

  it('calls the ownerFetcher to generate audio', async () => {
    const fetcher = vi.fn().mockResolvedValue(AUDIO);
    const result = await ttsBroadcast.getAudio('Hello world', VOICE, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(result).toBe(AUDIO);
  });

  it('broadcasts the generated audio on the channel', async () => {
    const fetcher = vi.fn().mockResolvedValue(AUDIO);
    await ttsBroadcast.getAudio('Hello world', VOICE, fetcher);
    expect(mockChannel.send).toHaveBeenCalledOnce();
    const sent = mockChannel._sent[0];
    expect(sent.type).toBe('broadcast');
    expect(sent.event).toBe('tts_audio');
    expect((sent.payload as { audioBase64: string }).audioBase64).toBe(AUDIO);
  });

  it('caches result so a second call does NOT call the fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue(AUDIO);
    await ttsBroadcast.getAudio('Hello world', VOICE, fetcher);
    const second = await ttsBroadcast.getAudio('Hello world', VOICE, fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(second).toBe(AUDIO);
  });

  it('returns null and does not broadcast when fetcher returns null', async () => {
    const fetcher = vi.fn().mockResolvedValue(null);
    const result = await ttsBroadcast.getAudio('No audio', VOICE, fetcher);
    expect(result).toBeNull();
    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it('uses first 48 chars of text as cache key (different suffixes = same cache)', async () => {
    const base = 'A'.repeat(48);
    const fetcher = vi.fn().mockResolvedValue(AUDIO);
    await ttsBroadcast.getAudio(base + 'extra1', VOICE, fetcher);
    // Same first 48 chars → cache hit, fetcher NOT called again
    const fetcher2 = vi.fn().mockResolvedValue('other-audio');
    const result = await ttsBroadcast.getAudio(base + 'extra2', VOICE, fetcher2);
    expect(fetcher2).not.toHaveBeenCalled();
    expect(result).toBe(AUDIO);
  });

  it('different texts produce different cache keys (no collision)', async () => {
    const f1 = vi.fn().mockResolvedValue('audio-1');
    const f2 = vi.fn().mockResolvedValue('audio-2');
    const r1 = await ttsBroadcast.getAudio('Text one', VOICE, f1);
    const r2 = await ttsBroadcast.getAudio('Text two', VOICE, f2);
    expect(r1).toBe('audio-1');
    expect(r2).toBe('audio-2');
    expect(f1).toHaveBeenCalledOnce();
    expect(f2).toHaveBeenCalledOnce();
  });
});

// ─── Guest mode tests ─────────────────────────────────────────────────────────

describe('TTSBroadcastManager – guest mode', () => {
  beforeEach(() => {
    ttsBroadcast.teardown();
    mockChannel = makeMockChannel();
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never);
    ttsBroadcast.setup('game-guest', false); // isOwner = false
  });

  afterEach(() => {
    ttsBroadcast.teardown();
  });

  it('does NOT call the ownerFetcher (guest has no API token)', async () => {
    const fetcher = vi.fn().mockResolvedValue(AUDIO);
    const key = `${'Hello guest'.slice(0, 48)}||${VOICE}`;
    setTimeout(() => mockChannel._emit('tts_audio', { key, audioBase64: AUDIO }), 10);

    const result = await ttsBroadcast.getAudio('Hello guest', VOICE, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toBe(AUDIO);
  });

  it('resolves with null after timeout when no broadcast arrives', async () => {
    const fetcher = vi.fn();
    const start = Date.now();
    const result = await ttsBroadcast.getAudio('Ghost text', VOICE, fetcher, 60);
    expect(result).toBeNull();
    expect(Date.now() - start).toBeGreaterThanOrEqual(55);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('serves from cache when broadcast arrived before getAudio is called', async () => {
    const key = `${'Pre-cached text'.slice(0, 48)}||${VOICE}`;
    mockChannel._emit('tts_audio', { key, audioBase64: AUDIO });
    await new Promise((r) => setTimeout(r, 5));

    const fetcher = vi.fn();
    const result = await ttsBroadcast.getAudio('Pre-cached text', VOICE, fetcher);
    expect(result).toBe(AUDIO);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('resolves pending request when broadcast arrives', async () => {
    const fetcher = vi.fn();
    const key = `${'Broadcast test'.slice(0, 48)}||${VOICE}`;

    const promise = ttsBroadcast.getAudio('Broadcast test', VOICE, fetcher, 500);
    setTimeout(() => mockChannel._emit('tts_audio', { key, audioBase64: AUDIO }), 20);

    const result = await promise;
    expect(result).toBe(AUDIO);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

// ─── Inactive mode ────────────────────────────────────────────────────────────

describe('TTSBroadcastManager – inactive', () => {
  it('isActive is false after teardown', () => {
    ttsBroadcast.teardown();
    expect(ttsBroadcast.isActive).toBe(false);
  });
});
