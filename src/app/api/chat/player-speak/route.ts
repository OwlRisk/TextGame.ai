import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

const EMOTION_TAGS_SECTION = `EMOTION & SOUND TAGS (optional, use sparingly and only when they feel genuinely natural):
- ONE emotion tag at the very start when it fits: [angry] [happy] [sad] [surprised] [fearful] [disgusted] [laughing] [whispering]
- Sound effects anywhere in the line: [cough] [sigh] [laugh] [breathe] [clear_throat] [yawn]
- Examples:
  "[angry] I saw you near the body. Stop lying."
  "I don't know... [sigh] maybe you're right."
  "[fearful] Please, I swear it wasn't me."
  "[laughing] Are you serious right now?"`;

/**
 * Build a game-type-aware system prompt for an AI player.
 * Each game template calls for a different voice, strategy, and interaction style.
 */
function buildSystemPrompt(
  playerName: string,
  gameTemplate: string | undefined,
  gameName: string
): string {
  const base = `You are ${playerName}, a real person playing "${gameName}". Never break character. No labels like "As ${playerName}, I say...".`;
  const lengthRule = `LENGTH: Match the moment — a quick reaction or vote can be 1 sentence; a key argument or reveal can be 2–3 sentences. Never more than 3 sentences. No speeches, no monologues.`;

  switch (gameTemplate) {
    case 'werewolf':
    case 'mafia': {
      return `${base} You're at a game table with friends playing a social deduction game. Speak casually and directly—like a real player, not a movie villain. React to what was just said: make accusations, cast doubt, defend yourself, ask pointed questions, or rally others. Be strategic but human.

RULES:
- No flowery language or dramatic speeches.
- If you're a werewolf/mafia: blend in, deflect, mislead subtly.
- If you're a villager/detective: observe, deduce, call people out.
- Never reveal your role directly unless the game explicitly asks.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }

    case 'undercover': {
      return `${base} You're playing an undercover/word-guessing game. Use your word in a way that blends in—not too specific, not too vague. Listen to others and react naturally. If you're the undercover agent, stay vague and mirror the group's energy.

RULES:
- Describe your word sideways; don't say it outright.
- React to what others said—agree, push back, or add a new angle.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }

    case 'tarot': {
      return `${base} You're in a tarot / introspective storytelling experience. Speak thoughtfully—share a feeling, a memory, an interpretation, or a question. Be curious and reflective, not analytical. Warm and a little mysterious.

RULES:
- No game-theory talk or accusations.
- Build on what was just shared or offer a different lens.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }

    case 'trivia':
    case 'quiz': {
      return `${base} You're playing a trivia/quiz game. Speak like someone at a pub quiz—confident, competitive, playful. Share your guess or reaction; banter with other players.

RULES:
- Just your gut reaction and brief reasoning—no long explanations.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }

    case 'roleplay':
    case 'adventure': {
      return `${base} You're a character in an immersive roleplay / adventure game. Stay in character. React to the scene and other characters—advance the story, respond to events, make decisions that fit who you are.

RULES:
- Speak as your character, not as a player discussing the game.
- Be vivid and emotionally grounded.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }

    default: {
      return `${base} Speak like a real person at a game table—casual, direct, reacting to what was just said. Agree, push back, ask questions, share your take. Match the tone of the game.

RULES:
- No monologues. React specifically to the last thing said.
- ${lengthRule}

${EMOTION_TAGS_SECTION}`;
    }
  }
}

/**
 * POST /api/chat/player-speak
 * Body: {
 *   gameName, gameTemplate?, rules?,
 *   gamePhase?,
 *   player: { name, role?, personality?, background?, boardContent? },
 *   recentMessages: { senderName, content }[]
 * }
 * Returns: { message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { gameName, gameTemplate, rules, gamePhase, player, recentMessages } = body as {
      gameName?: string;
      gameTemplate?: string;
      rules?: string;
      gamePhase?: string;
      player: {
        name: string;
        role?: string;
        personality?: string;
        background?: string;
        /** Private My Board content the host wrote for this player (secret info they know). */
        boardContent?: string;
      };
      recentMessages: Array<{ senderName: string; content: string }>;
    };

    if (!player?.name || !Array.isArray(recentMessages)) {
      return NextResponse.json({ error: 'player.name and recentMessages array required' }, { status: 400 });
    }

    const openai = getOpenAI();
    const recentText = recentMessages
      .slice(-14)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');

    const system = buildSystemPrompt(player.name, gameTemplate, gameName || 'the game');

    // Build user content: game context + private knowledge + recent chat
    const lines: string[] = [];
    lines.push(`Game: ${gameName || 'Unknown game'}`);
    if (gameTemplate) lines.push(`Type: ${gameTemplate}`);
    if (gamePhase) lines.push(`Current phase: ${gamePhase}`);
    lines.push('');

    // Private info this player knows (from Host's My Board)
    if (player.boardContent?.trim()) {
      lines.push(`Your private info (only you know this — act accordingly):\n${player.boardContent.trim()}`);
      lines.push('');
    } else if (player.role) {
      lines.push(`Your secret role: ${player.role}`);
    }

    if (player.personality) lines.push(`Your personality: ${player.personality}`);
    if (player.background) lines.push(`Your background: ${player.background}`);

    if (rules?.trim()) {
      lines.push('');
      lines.push(`Game rules (summary):\n${rules.slice(0, 1200)}`);
    }

    lines.push('');
    lines.push(`Recent conversation:\n${recentText || '(No messages yet)'}`);
    lines.push('');
    lines.push(`Your turn. Reply as ${player.name}.`);

    const userContent = lines.join('\n');

    const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o';
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      max_tokens: 160,
      temperature: 0.85,
    });

    const message = (completion.choices[0]?.message?.content || '').trim();
    return NextResponse.json({ message: message || '...' });
  } catch (e) {
    console.error('[player-speak]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate player message' },
      { status: 500 }
    );
  }
}
