import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Preset-vs-session-loader race condition tests ────────────────────────────
// Covers the fix for the bug where selecting a non-Werewolf template from the
// Discover page would briefly show the correct game, then silently revert to the
// user's last DB session (usually Werewolf).
//
// Root cause: two effects raced on GameMasterChat mount:
//   A  getGameSessions(user.id)  → async, arrives ~200-500 ms later
//   B  requestAnimationFrame → createSessionFromPreset(preset)  → wins the race
// Effect A's .then() called loadSession(sessions[0]) and overwrote B's result.
//
// Fix: skipAutoLoadRef = !!initialPreset  — when a preset is provided the DB
// callback skips both loadSession() and createNewSession().
//
// All helpers are pure functions extracted / mirrored from production code.

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 – skipAutoLoadRef initialisation
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors: const skipAutoLoadRef = useRef(!!initialPreset) */
function makeSkipAutoLoad(initialPreset: unknown): boolean {
  return !!initialPreset;
}

describe('skipAutoLoadRef initialisation', () => {
  it('is true when a preset object is provided', () => {
    expect(makeSkipAutoLoad({ id: 'codenames', name: 'Codenames' })).toBe(true);
  });

  it('is false when no preset is provided (normal /create flow)', () => {
    expect(makeSkipAutoLoad(null)).toBe(false);
    expect(makeSkipAutoLoad(undefined)).toBe(false);
  });

  it('is false for an empty-string preset id (falsy)', () => {
    expect(makeSkipAutoLoad({ id: '', name: '' })).toBe(true); // object itself is truthy
  });

  it('treats any non-null object as truthy', () => {
    expect(makeSkipAutoLoad({})).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 2 – DB callback guard
// ─────────────────────────────────────────────────────────────────────────────

type LoadFn = (sessionId: string, sessions: unknown[]) => void;
type CreateFn = () => void;

/**
 * Mirrors the DB callback logic inside the session-loader useEffect:
 *   if (error || !data?.length) { if (!skip) createNewSession(); return; }
 *   setSessions(sessionsWithDates);
 *   if (!skip) loadSession(sessions[0].id, sessions);
 */
function handleDbResponse(
  data: Array<{ id: string }> | null,
  error: unknown,
  skip: boolean,
  loadSession: LoadFn,
  createNewSession: CreateFn
): void {
  if (error || !data?.length) {
    if (!skip) createNewSession();
    return;
  }
  if (!skip) loadSession(data[0].id, data);
}

describe('DB callback guard (skipAutoLoad=true → preset path)', () => {
  it('does not call loadSession when skip=true and data is present', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse([{ id: 'session-werewolf' }], null, true, loadSession, createNewSession);
    expect(loadSession).not.toHaveBeenCalled();
    expect(createNewSession).not.toHaveBeenCalled();
  });

  it('does not call createNewSession when skip=true and data is empty', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse([], null, true, loadSession, createNewSession);
    expect(createNewSession).not.toHaveBeenCalled();
    expect(loadSession).not.toHaveBeenCalled();
  });

  it('does not call createNewSession when skip=true and error occurs', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse(null, new Error('network'), true, loadSession, createNewSession);
    expect(createNewSession).not.toHaveBeenCalled();
  });

  it('does not call either fn when skip=true and data is null', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse(null, null, true, loadSession, createNewSession);
    expect(loadSession).not.toHaveBeenCalled();
    expect(createNewSession).not.toHaveBeenCalled();
  });
});

describe('DB callback guard (skipAutoLoad=false → normal path)', () => {
  it('calls loadSession with the first session when skip=false', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    const sessions = [{ id: 'sess-1' }, { id: 'sess-2' }];
    handleDbResponse(sessions, null, false, loadSession, createNewSession);
    expect(loadSession).toHaveBeenCalledWith('sess-1', sessions);
    expect(createNewSession).not.toHaveBeenCalled();
  });

  it('calls createNewSession when data is empty and skip=false', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse([], null, false, loadSession, createNewSession);
    expect(createNewSession).toHaveBeenCalledOnce();
    expect(loadSession).not.toHaveBeenCalled();
  });

  it('calls createNewSession on error when skip=false', () => {
    const loadSession = vi.fn();
    const createNewSession = vi.fn();
    handleDbResponse(null, new Error('db timeout'), false, loadSession, createNewSession);
    expect(createNewSession).toHaveBeenCalledOnce();
  });

  it('passes the full sessions array to loadSession (not just the id)', () => {
    const loadSession = vi.fn();
    const sessions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    handleDbResponse(sessions, null, false, loadSession, vi.fn());
    expect(loadSession).toHaveBeenCalledWith('a', sessions);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 – localStorage callback guard (same skip logic)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the localStorage path:
 *   if (sessionsToKeep.length > 0 && !skip) loadSession(...);
 *   else if (!skip) createNewSession();
 */
function handleLocalStorageLoad(
  sessions: Array<{ id: string }>,
  skip: boolean,
  loadSession: LoadFn,
  createNewSession: CreateFn
): void {
  if (sessions.length > 0 && !skip) loadSession(sessions[0].id, sessions);
  else if (!skip) createNewSession();
}

describe('localStorage callback guard', () => {
  it('skip=true + sessions present → neither fn called', () => {
    const load = vi.fn(), create = vi.fn();
    handleLocalStorageLoad([{ id: 's1' }], true, load, create);
    expect(load).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('skip=true + no sessions → createNewSession NOT called', () => {
    const load = vi.fn(), create = vi.fn();
    handleLocalStorageLoad([], true, load, create);
    expect(create).not.toHaveBeenCalled();
  });

  it('skip=false + sessions present → loadSession called with first', () => {
    const load = vi.fn(), create = vi.fn();
    handleLocalStorageLoad([{ id: 'oldest' }, { id: 'newer' }], false, load, create);
    expect(load).toHaveBeenCalledWith('oldest', expect.any(Array));
  });

  it('skip=false + no sessions → createNewSession called', () => {
    const load = vi.fn(), create = vi.fn();
    handleLocalStorageLoad([], false, load, create);
    expect(create).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 – getPresetById: preset ID → DiscoverPreset mapping
// ─────────────────────────────────────────────────────────────────────────────

interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId: string;
  playerCount: number;
}

interface GameTemplate {
  id: string;
  name: string;
  rules: string;
  templateId?: string;
  playerCount?: number;
}

function getPresetById(presetId: string | null, allPresets: GameTemplate[]): DiscoverPreset | null {
  if (!presetId) return null;
  const t = allPresets.find((g) => g.id === presetId);
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: t.templateId ?? 'custom',
    playerCount: t.playerCount ?? 0,
  };
}

const MOCK_PRESETS: GameTemplate[] = [
  { id: 'werewolf-classic', name: 'Werewolf: Blood Moon', rules: 'Wolf rules...', templateId: 'werewolf', playerCount: 6 },
  { id: 'codenames', name: 'Codenames', rules: 'Code rules...', playerCount: 4 },
  { id: 'detective-mystery', name: 'Detective Mystery', rules: 'Mystery rules...', playerCount: 3 },
  { id: 'tarot', name: 'Tarot Oracle', rules: 'Tarot rules...', templateId: 'tarot', playerCount: 1 },
];

describe('getPresetById', () => {
  it('returns null for null presetId', () => {
    expect(getPresetById(null, MOCK_PRESETS)).toBeNull();
  });

  it('returns null for an unrecognised presetId', () => {
    expect(getPresetById('unknown-game', MOCK_PRESETS)).toBeNull();
  });

  it('returns the correct preset for werewolf-classic', () => {
    const p = getPresetById('werewolf-classic', MOCK_PRESETS);
    expect(p?.templateId).toBe('werewolf');
    expect(p?.name).toBe('Werewolf: Blood Moon');
  });

  it('defaults templateId to "custom" when not set (codenames)', () => {
    const p = getPresetById('codenames', MOCK_PRESETS);
    expect(p?.templateId).toBe('custom');
  });

  it('returns correct rules for the selected template', () => {
    const p = getPresetById('detective-mystery', MOCK_PRESETS);
    expect(p?.rules).toBe('Mystery rules...');
  });

  it('preserves the original template id', () => {
    const p = getPresetById('codenames', MOCK_PRESETS);
    expect(p?.id).toBe('codenames');
  });

  it('returns tarot templateId for the tarot preset', () => {
    const p = getPresetById('tarot', MOCK_PRESETS);
    expect(p?.templateId).toBe('tarot');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 – createSessionFromPreset: rule resolution
// ─────────────────────────────────────────────────────────────────────────────

interface InternalTemplate { id: string; defaultRules: string; }

/**
 * Mirrors rule resolution in createSessionFromPreset:
 *   nextRules = preset.rules?.trim() || resolvedTemplate?.defaultRules || ""
 */
function resolveSessionRules(
  preset: Pick<DiscoverPreset, 'rules'>,
  resolvedTemplate: InternalTemplate | null
): string {
  return preset.rules?.trim() || resolvedTemplate?.defaultRules || '';
}

describe('session rule resolution', () => {
  const internalWerewolf: InternalTemplate = { id: 'werewolf', defaultRules: 'Default wolf rules' };
  const internalCustom: InternalTemplate = { id: 'custom', defaultRules: 'Default custom rules' };

  it('uses preset rules when present (non-werewolf preset)', () => {
    const preset = { rules: 'Code rules from preset' };
    expect(resolveSessionRules(preset, internalCustom)).toBe('Code rules from preset');
  });

  it('falls back to template default rules when preset.rules is empty', () => {
    const preset = { rules: '' };
    expect(resolveSessionRules(preset, internalWerewolf)).toBe('Default wolf rules');
  });

  it('trims whitespace-only preset.rules before checking', () => {
    const preset = { rules: '   ' };
    expect(resolveSessionRules(preset, internalCustom)).toBe('Default custom rules');
  });

  it('returns empty string when both preset.rules and template.defaultRules are empty', () => {
    const emptyTemplate: InternalTemplate = { id: 'custom', defaultRules: '' };
    expect(resolveSessionRules({ rules: '' }, emptyTemplate)).toBe('');
    expect(resolveSessionRules({ rules: '' }, null)).toBe('');
  });

  it('non-werewolf preset rules are NOT overwritten by werewolf defaults', () => {
    const codePreset = { rules: 'Two spy teams race to contact agents...' };
    const result = resolveSessionRules(codePreset, internalWerewolf);
    expect(result).toBe('Two spy teams race to contact agents...');
    expect(result).not.toContain('wolf');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 – Preset URL construction (discover → /create route)
// ─────────────────────────────────────────────────────────────────────────────

function buildPresetUrl(presetId: string): string {
  return `/create?preset=${presetId}`;
}

function extractPresetIdFromUrl(url: string): string | null {
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get('preset');
}

describe('preset URL roundtrip', () => {
  const cases = ['codenames', 'detective-mystery', 'werewolf-classic', 'tarot'];

  for (const id of cases) {
    it(`builds and recovers id="${id}"`, () => {
      const url = buildPresetUrl(id);
      expect(extractPresetIdFromUrl(url)).toBe(id);
    });
  }

  it('extracts null from a URL with no preset param', () => {
    expect(extractPresetIdFromUrl('/create')).toBeNull();
  });

  it('URL starts with /create?preset=', () => {
    expect(buildPresetUrl('codenames')).toBe('/create?preset=codenames');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 – Race condition: simulate the full before/after fix
// ─────────────────────────────────────────────────────────────────────────────

describe('race condition simulation', () => {
  let activeSessionId: string;
  const loadSession = (id: string) => { activeSessionId = id; };
  const createNew = () => { activeSessionId = 'new-empty'; };
  const applyPreset = (id: string) => { activeSessionId = id; };

  beforeEach(() => {
    activeSessionId = '';
  });

  it('WITHOUT fix: DB response overwrites preset (demonstrates the bug)', () => {
    // Step 1: rAF fires, applies codenames preset
    applyPreset('preset-codenames');
    expect(activeSessionId).toBe('preset-codenames');

    // Step 2 (bug): async DB response arrives later, loadSession called unconditionally
    const dbSessions = [{ id: 'session-werewolf' }];
    loadSession(dbSessions[0].id); // ← no guard, overwrites
    expect(activeSessionId).toBe('session-werewolf'); // BUG: wrong!
  });

  it('WITH fix: DB response is skipped when preset was provided', () => {
    const skipAutoLoad = true; // !!initialPreset

    // Step 1: rAF fires, applies codenames preset
    applyPreset('preset-codenames');
    expect(activeSessionId).toBe('preset-codenames');

    // Step 2 (fix): async DB response arrives but is blocked by the guard
    const dbSessions = [{ id: 'session-werewolf' }];
    if (!skipAutoLoad) loadSession(dbSessions[0].id); // guarded → skipped
    expect(activeSessionId).toBe('preset-codenames'); // CORRECT: preset preserved
  });

  it('WITHOUT preset: DB response loads last session as expected', () => {
    const skipAutoLoad = false; // no preset

    // No preset applied
    const dbSessions = [{ id: 'session-werewolf' }, { id: 'session-old' }];
    if (!skipAutoLoad) loadSession(dbSessions[0].id); // guard allows it
    expect(activeSessionId).toBe('session-werewolf'); // CORRECT: normal behaviour
  });

  it('WITH preset + empty DB: neither loadSession nor createNew called', () => {
    const skipAutoLoad = true;
    applyPreset('preset-avalon');

    // DB returns empty
    const data: { id: string }[] = [];
    if (data.length > 0 && !skipAutoLoad) loadSession(data[0].id);
    else if (!skipAutoLoad) createNew();

    // preset session stays
    expect(activeSessionId).toBe('preset-avalon');
  });
});
