import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

/** Section id must be lowercase, alphanumeric + hyphen only (for URLs/state). */
function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

/**
 * POST /api/suggest-sections
 * Body: { gameName: string, rules?: string, template?: string }
 * Returns: { sections: { id: string, name: string }[] }
 * AI decides which sidebar sections to show (e.g. rules, progress, scoreboard, characters).
 * Always includes "rules" and "progress"; may add more based on game type.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      gameName = 'Game',
      rules = '',
      template = 'custom',
    } = body as { gameName?: string; rules?: string; template?: string };

    const rulesSnippet = (rules || '').trim().slice(0, 800);
    const openai = getOpenAI();

    const systemPrompt = `You are a game UI assistant. Given a game name and its rules (or template), decide which sidebar "sections" (channels) to show to players. Each section is a read-only or host-editable panel (e.g. rules, progress, scoreboard, character list).

Rules:
- You MUST always include exactly two sections with these IDs: "rules" (display name "Rules" or localized) and "progress" (display name "Progress" or similar). They are required.
- You MAY add 0–3 more sections that fit this game (e.g. "scoreboard", "characters", "roles", "items", "map", "notes"). Use short, clear display names.
- Section id: lowercase, letters/numbers/hyphens only (e.g. "rules", "progress", "scoreboard", "character-list"). We will normalize your suggestion.
- Output valid JSON only: { "sections": [ { "id": "rules", "name": "Rules" }, { "id": "progress", "name": "Progress" }, ... ] }. No markdown, no explanation.`;

    const userPrompt = `Game name: ${gameName}
Template: ${template}
Rules (snippet):
${rulesSnippet || 'No rules provided.'}

Return JSON with a "sections" array. Always include id "rules" and "progress"; add more sections only if they clearly fit this game.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 300,
      temperature: 0.4,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? (() => { try { return JSON.parse(jsonMatch[0]); } catch { return null; } })() : null;

    const suggested: Array<{ id: string; name: string }> = parsed?.sections && Array.isArray(parsed.sections)
      ? parsed.sections
          .map((s: { id?: string; name?: string }) => ({
            id: normalizeId(String(s?.id || s?.name || 'section')),
            name: typeof s?.name === 'string' && s.name.length > 0 ? s.name.trim().slice(0, 32) : (s?.id || 'Section'),
          }))
          .filter((s: { id: string }) => s.id.length > 0)
      : [];

    const hasRules = suggested.some(s => s.id === 'rules');
    const hasProgress = suggested.some(s => s.id === 'progress');
    const result: Array<{ id: string; name: string }> = [];
    if (!hasRules) result.push({ id: 'rules', name: 'Rules' });
    if (!hasProgress) result.push({ id: 'progress', name: 'Progress' });
    suggested.forEach(s => {
      if (s.id === 'rules' && !result.some(r => r.id === 'rules')) result.push({ id: 'rules', name: s.name || 'Rules' });
      else if (s.id === 'progress' && !result.some(r => r.id === 'progress')) result.push({ id: 'progress', name: s.name || 'Progress' });
      else if (s.id !== 'rules' && s.id !== 'progress' && !result.some(r => r.id === s.id)) result.push(s);
    });

    return NextResponse.json({ sections: result });
  } catch (e) {
    console.error('[suggest-sections]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to suggest sections' },
      { status: 500 }
    );
  }
}
