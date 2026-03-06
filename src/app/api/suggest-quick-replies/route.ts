import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { sanitizeModel } from '@/lib/model-prefs';
import { deductTokens, estimatedTokensToCoins } from '@/lib/tokens';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/suggest-quick-replies
 * Body: { gameName, rules, recentMessages: { senderName, content }[], gamePhase? }
 * Returns: { suggestions: string[] } — 1 to 3 short quick-reply options for the current situation.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const {
      gameName = 'this game',
      rules = '',
      recentMessages = [],
      gamePhase = '',
      playerName = 'Player',
      playerRole = '',
      preferredModel,
    } = body as {
      gameName?: string;
      rules?: string;
      recentMessages?: Array<{ senderName: string; content: string }>;
      gamePhase?: string;
      playerName?: string;
      playerRole?: string;
      preferredModel?: string;
    };

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-10)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');
    const rulesSnippet = (rules || '').slice(0, 1200);

    const playerContext = playerRole
      ? `The human player is "${playerName}" (role: ${playerRole}).`
      : `The human player is "${playerName}".`;

    const humanHasSpoken = recentMessages.some((m) => m.senderName === playerName);

    const systemPrompt = `You are a quick-reply assistant for a multiplayer game. Given the game state, suggest 1-3 short messages the human player could send NEXT.

RULES:
- You are writing replies for the human player "${playerName}". ${playerContext}
- Suggest actions or statements that ONLY the human player can or should do based on their role and the game state — never parrot what AI players already said.
- If AI players already asked a question or made a request, do NOT suggest the same request. Instead suggest a different angle, a decision, or a game action.
- Each option: one short sentence (max 60 chars), natural tone matching the game genre.
- Output 1-3 suggestions, one per line. No numbering, no quotes, no extra text.${
      !humanHasSpoken
        ? `\n- IMPORTANT: The human player has NOT spoken yet. This is their FIRST message in the game. Suggest ice-breaker or opening lines — a greeting, a roleplay-flavored introduction, or a natural first move for this game. Make them feel confident about jumping in.`
        : ''
    }`;

    const userPrompt = `Game: ${gameName}${gamePhase ? `\nPhase: ${gamePhase}` : ''}
${playerContext}

Recent messages:
${recentText || '(No messages yet)'}

${rulesSnippet ? `Rules (excerpt):\n${rulesSnippet}\n` : ''}
Suggest 1-3 quick replies for "${playerName}" to send next:`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15_000);
    const completion = await openai.chat.completions.create({
      model: sanitizeModel(preferredModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 150,
      temperature: 0.6,
    }, { signal: ac.signal });
    clearTimeout(timer);

    const totalTokens = completion.usage?.total_tokens;
    if (totalTokens && totalTokens > 0) {
      const coins = estimatedTokensToCoins(totalTokens, sanitizeModel(preferredModel));
      deductTokens(user.id, Math.max(1, coins), 'suggest_quick_replies', `Quick replies ${totalTokens} tokens`)
        .catch((e) => console.error('[suggest-quick-replies] deduct error:', e));
    }

    const text = completion.choices?.[0]?.message?.content?.trim() || '';
    const suggestions = text
      .split('\n')
      .map((s) => s.replace(/^[\d.)\-\s]+/, '').replace(/^["']|["']$/g, '').trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('[suggest-quick-replies]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate quick replies' },
      { status: 500 }
    );
  }
}
