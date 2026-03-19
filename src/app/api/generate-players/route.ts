import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, estimatedTokensToCoins, hasTokens } from '@/lib/tokens';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';

const limiter = createRateLimiter('generate-players', { limit: 10, windowSeconds: 60 });

// Lazy initialization to avoid errors at module load time
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = limiter.check(user.id);
  if (!rl.success) return rateLimitResponse(rl);
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 }
      );
    }

    let body: { playerCount?: number; gameTemplate?: string; rules?: string; minPlayers?: number; maxPlayers?: number };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    let { playerCount, gameTemplate, rules, minPlayers, maxPlayers } = body;

    if (playerCount == null || playerCount < 1) {
      playerCount = 0;
    }

    const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';
    const minCoinsNeeded = estimatedTokensToCoins(1500, chatModel);
    if (!(await hasTokens(user.id, minCoinsNeeded))) {
      return NextResponse.json(
        { error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' },
        { status: 402 }
      );
    }

    const openai = getOpenAI();
    const randomSeed = Math.random().toString(36).substring(7);

    const { getGameTemplate } = await import('@/lib/game-templates');
    const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;
    const needsRoles = tmpl?.hasHiddenRoles ?? false;
    const needsWords = gameTemplate === 'undercover';

    let decideCompletion: OpenAI.Chat.Completions.ChatCompletion | null = null;
    if (playerCount === 0) {
      const minAI = typeof minPlayers === 'number' && minPlayers >= 1 ? minPlayers - 1 : 1;
      const maxAI = typeof maxPlayers === 'number' && maxPlayers >= 2 ? maxPlayers - 1 : 19;
      const decideCountPrompt = `You are a game master. Based on the game rules below, decide the optimal number of AI players (user + AI = total). 

Game Template: ${gameTemplate || 'custom'}
Valid AI player range: ${minAI}-${maxAI} (total players: ${minAI + 1}-${maxAI + 1})

Game Rules:
${rules || 'No specific rules provided.'}

Consider: game balance, role distribution, pacing. Output ONLY a single number between ${minAI} and ${maxAI}, nothing else.`;

      decideCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest',
        messages: [
          { role: 'system', content: 'You decide optimal player count for games. Output only a number.' },
          { role: 'user', content: decideCountPrompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 10,
      });
      const countStr = (decideCompletion.choices[0]?.message?.content || '').trim().replace(/\D/g, '');
      const parsed = parseInt(countStr, 10);
      playerCount = !isNaN(parsed) && parsed >= minAI && parsed <= maxAI ? parsed : Math.round((minAI + maxAI) / 2);
    }

    let outputFormat = `[
  {
    "name": "Name or character title that fits the game",
    "gender": "male/female/other",
    "personality": "Unique personality (5-10 words)",
    "background": "Unique background (5-10 words)"`;
    if (needsRoles) {
      outputFormat += `,
    "role": "Role from rules"`;
    }
    if (needsWords) {
      outputFormat += `,
    "word": "civilian" or "undercover"`;
    }
    outputFormat += `
  }
]`;

    let roleInstructions = '';
    if (needsRoles) {
      roleInstructions = `
6. ROLE ASSIGNMENT (required): There will be ${playerCount} AI players plus 1 human player (${playerCount + 1} total). Based on the game rules above, distribute roles among ALL ${playerCount + 1} players fairly: most should be Villagers/Town, a few special roles as defined in rules, and Werewolves/Mafia as appropriate. Assign ${playerCount} roles to the AI players in the JSON array, and output the remaining 1 role for the human player as a top-level "humanRole" field. The human can be ANY role (including Werewolf/Mafia) — make it random and balanced.`;
    }

    let wordInstructions = '';
    let wordPairFormat = '';
    if (needsWords) {
      wordInstructions = `
6. WORD PAIR: Generate ONE civilian word and ONE undercover word (similar but different, e.g. "Coffee"/"Tea"). These words are NOT in the player objects - output them separately at the top level: "civilianWord" and "undercoverWord".
7. WORD ASSIGNMENT: Assign "word": "civilian" to most players (all but one), and "word": "undercover" to exactly one random player.`;
      wordPairFormat = `
Also include at top level: "civilianWord": "your civilian word", "undercoverWord": "your undercover word"`;
    }

    const prompt = `Generate ${playerCount} unique AI players for this game. (Seed: ${randomSeed})

Game: ${gameTemplate || 'custom'}

Rules:
${rules || 'No specific rules provided.'}

Based on this game's theme and setting, decide what naming style fits best:
- Modern/abstract games → modern names (Emma, Lucas, Sofia)
- Fantasy/historical → first name + surname only, NO occupation titles in the name (e.g. "Aldric Stone", "Elara Frost" — NOT "Sir Aldric" or "Elara, Witch")
- Story-based → names that match the narrative setting (first + last name only)
- Any other theme → adapt accordingly

IMPORTANT: The "name" field must be a SHORT character name (1-3 words, max 20 characters). Do NOT include commas, occupations, titles, or role descriptions in the name. Occupations/backgrounds go in the "background" field.

Requirements:
1. ${playerCount} completely unique, diverse players
2. Mix genders naturally
3. Each personality must be distinct and memorable
4. Create backgrounds that enhance the game experience${roleInstructions}${wordInstructions}

Output ONLY valid JSON:${outputFormat}${wordPairFormat ? `

Top-level structure: { "players": [ ... ], "civilianWord": "...", "undercoverWord": "..." }` : `

Top-level structure: { "players": [ ... ]${needsRoles ? ', "humanRole": "RoleName"' : ''} }`}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a game character generator. Output only valid JSON objects, no other text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1.0,
      max_completion_tokens: 1200,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Parse and validate JSON
    try {
      // Strip markdown code fences (```json ... ```) that models sometimes wrap around JSON.
      const stripped = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(stripped);
      const players = Array.isArray(parsed) ? parsed : (parsed.players || []);
      
      if (!Array.isArray(players)) {
        throw new Error('Response is not an array');
      }

      const validPlayers = players.filter((p: any) => 
        p.name && p.gender && p.personality && p.background
      );

      if (validPlayers.length === 0) {
        throw new Error('No valid players generated');
      }

      const result: { players: any[]; count: number; civilianWord?: string; undercoverWord?: string; humanRole?: string } = {
        players: validPlayers,
        count: validPlayers.length
      };
      if (needsRoles && parsed.humanRole) {
        result.humanRole = parsed.humanRole;
      }
      if (needsWords && parsed.civilianWord && parsed.undercoverWord) {
        result.civilianWord = parsed.civilianWord;
        result.undercoverWord = parsed.undercoverWord;
        validPlayers.forEach((p: any) => {
          const isUndercover = p.word === 'undercover';
          p.role = isUndercover ? 'Undercover' : 'Civilian';
          p.word = isUndercover ? parsed.undercoverWord : parsed.civilianWord;
        });
      }

      // Deduct tokens for both API calls (count decision + player generation)
      const totalTokens = (decideCompletion?.usage?.total_tokens ?? 0) + (completion.usage?.total_tokens ?? 0);
      if (totalTokens > 0) {
        const coins = estimatedTokensToCoins(totalTokens, chatModel);
        deductTokens(user.id, Math.max(1, coins), 'generate_players', `Generate ${validPlayers.length} players, ${totalTokens} tokens`)
          .catch((e) => console.error('[generate-players] deduct error:', e));
      }

      return NextResponse.json(result);

    } catch (parseError) {
      console.error('Error parsing player JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated players' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error generating players:', error);
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate players' },
      { status: 500 }
    );
  }
}
