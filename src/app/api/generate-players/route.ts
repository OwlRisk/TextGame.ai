import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import { deductTokens, gptUsageToCoins, estimatedTokensToCoins, hasTokens } from '@/lib/tokens';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { resolvePlayerGender } from '@/lib/player-gender';
import { getWorldById } from '@/lib/rpg/worlds';
import { createCharacterFromClass } from '@/lib/rpg/classes';
import type { ClassDefinition } from '@/lib/rpg/classes';
import { archetypeIdForClass, archetypeAvatarPath } from '@/lib/rpg/archetypes';
import { supabaseAdmin } from '@/lib/supabase';

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

    let body: { playerCount?: number; gameTemplate?: string; rules?: string; minPlayers?: number; maxPlayers?: number; rpgWorldId?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    let { playerCount } = body;
    const { gameTemplate, rules, minPlayers, maxPlayers, rpgWorldId } = body;

    if (playerCount == null || playerCount < 1) {
      playerCount = 0;
    }

    // ─── RPG mode: generate class-based party members ───
    if (rpgWorldId) {
      const world = getWorldById(rpgWorldId);
      if (!world) {
        return NextResponse.json({ error: `Unknown world: ${rpgWorldId}` }, { status: 400 });
      }
      const count = playerCount || 3;
      const chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';
      const minCoinsNeeded = estimatedTokensToCoins(1500, chatModel);
      if (!(await hasTokens(user.id, minCoinsNeeded))) {
        return NextResponse.json({ error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' }, { status: 402 });
      }

      const selectedClasses: ClassDefinition[] = [];
      const shuffled = [...world.classes].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        selectedClasses.push(shuffled[i % shuffled.length]);
      }

      const factionNames = world.factions.map(f => f.name).join(', ');
      const classDescriptions = selectedClasses.map((c, i) => `Player ${i + 1}: ${c.name} — ${c.description}`).join('\n');

      const openai = getOpenAI();
      const randomSeed = Math.random().toString(36).substring(7);
      const rpgPrompt = `Generate ${count} RPG party members for a ${world.name} adventure. (Seed: ${randomSeed})

World: ${world.description}

Each character has a pre-assigned class. Give them fitting names, personalities, and backgrounds that match their class and the world setting.

Classes assigned:
${classDescriptions}

Available factions: ${factionNames}

For ${world.id === 'wuxia' ? 'Wuxia: use Romanized Chinese names in pinyin (e.g. Lin Jianxin, Fang Wukong, Shen Duanqiu). Do NOT use Chinese characters — use English/pinyin only. Backgrounds should reference sects, martial arts, jianghu lore.' : 'Western Fantasy: use fantasy names (e.g. Aldric Stone, Lyra Frost). Backgrounds should reference guilds, quests, magical lore.'}

Requirements:
1. Each name must be SHORT (1-3 words, max 20 characters). No titles or class in the name.
2. Personality must be SPECIFIC behavioral details, not generic. How they react in combat, what they fear, how they argue.
3. speechStyle must make each character sound DIFFERENT in dialogue.
4. Assign each character to a faction from the list above.
5. "goal" — a concrete personal motivation that drives this character beyond "survive". It should create roleplay hooks (e.g. "Find the lost grimoire her master hid before dying" or "Prove she's worthy of inheriting the sect").
6. "fear" — a specific, visceral fear that can surface in gameplay (e.g. "Being sealed underground — she was trapped in a mine collapse as a child" or "Losing control of his berserker rage and hurting allies").
7. "attitudeToPlayer" — how this character relates to the human party leader. Each character should have a DIFFERENT dynamic (e.g. "Respects the leader's decisions but will argue if lives are at stake" or "Slightly jealous — thinks she should be leading instead").

Output ONLY valid JSON:
{ "players": [
  {
    "name": "Character Name",
    "gender": "male/female",
    "classId": "${selectedClasses[0].id}",
    "faction": "Faction Name",
    "personality": "Specific behavioral details...",
    "background": "Background that fits class and world...",
    "speechStyle": "How they talk...",
    "quirk": "Memorable behavioral quirk...",
    "goal": "Personal motivation...",
    "fear": "Specific fear...",
    "attitudeToPlayer": "Relationship dynamic with the leader..."
  }
] }`;

      const completion = await openai.chat.completions.create({
        model: chatModel,
        messages: [
          { role: 'system', content: 'You are an RPG character generator. Output only valid JSON.' },
          { role: 'user', content: rpgPrompt },
        ],
        max_completion_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const stripped = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(stripped);
      const rawPlayers = (Array.isArray(parsed) ? parsed : (parsed.players || [])).slice(0, count);

      const rpgPlayers = rawPlayers.map((p: any, i: number) => {
        const cls = selectedClasses[i] || selectedClasses[0];
        const faction = p.faction || world.factions[0]?.name;
        const rpgChar = createCharacterFromClass(cls, faction);
        const gender = resolvePlayerGender(String(p.name || cls.name), p.gender, {
          personality: p.personality,
          background: p.background,
        });
        const archId = archetypeIdForClass(cls.id);
        let avatarUrl: string | undefined;
        if (archId && supabaseAdmin) {
          const storagePath = archetypeAvatarPath(archId, gender);
          const { data } = supabaseAdmin.storage.from('avatars').getPublicUrl(storagePath);
          if (data?.publicUrl) avatarUrl = data.publicUrl;
        }
        return {
          name: p.name || `${cls.name} ${i + 1}`,
          gender,
          personality: p.personality || cls.description,
          background: p.background || '',
          speechStyle: p.speechStyle || '',
          quirk: p.quirk || '',
          goal: p.goal || '',
          fear: p.fear || '',
          attitudeToPlayer: p.attitudeToPlayer || '',
          rpg: rpgChar,
          ...(archId && { archetypeId: archId }),
          ...(avatarUrl && { avatar_url: avatarUrl }),
        };
      });

      const gp = completion.usage?.prompt_tokens ?? 0;
      const gc = completion.usage?.completion_tokens ?? 0;
      const actualModel = (completion as { model?: string }).model ?? chatModel;
      const totalCoins = gptUsageToCoins(actualModel, gp, gc);
      if (totalCoins > 0) {
        await deductTokens(user.id, Math.max(1, totalCoins), 'generate_players', `RPG party ${count} chars ${gp}+${gc} tokens (${actualModel})`);
      }

      return NextResponse.json({ players: rpgPlayers, count: rpgPlayers.length, rpgWorldId });
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
    "personality": "2-3 sentences: how they think, react, and behave. Include specific speech patterns, emotional tendencies, and tells (e.g. 'Gets louder when nervous. Speaks in short bursts. Always returns to evidence over gut feeling.')",
    "background": "2-3 sentences: their real-life background that shapes how they play. Include details that create conversation hooks (e.g. 'Former ER nurse. Stays calm in chaos but panics over small social conflicts. Brings up medical analogies.')",
    "speechStyle": "Specific speech pattern — NOT generic. e.g. 'Terse fragments, drops pronouns, never says please' / 'Dramatic and theatrical, treats everything like a stage performance' / 'Nervous run-on sentences that trail off mid-thought'",
    "quirk": "A memorable behavioral quirk that other players will notice — e.g. 'Always sides with the underdog then switches at the last second' / 'Gets suspicious of whoever is being too quiet' / 'Makes dark jokes when the situation gets tense'"`;
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
1. ${playerCount} completely unique, diverse players who feel like REAL PEOPLE, not archetypes
2. Mix genders naturally
3. Each personality MUST include specific behavioral details — how they react under pressure, what triggers them, how they argue. Generic traits like "friendly and helpful" are BANNED. Be specific: "Agrees enthusiastically then quietly undermines the plan. Gets defensive when called out — deflects by complimenting the accuser."
4. Backgrounds should create NATURAL CONFLICT between characters — one is a control freak while another hates being told what to do. One trusts too easily, another sees conspiracies everywhere. These dynamics make the game dramatic without the GM forcing it.
5. CRITICAL — speechStyle and quirk: Every player MUST sound completely different when they talk. One speaks in terse fragments, another is verbose and dramatic, another peppers in slang, another is painfully polite. Quirks should be things OTHER players would notice and react to.
6. Give each character a RELATIONSHIP SEED — a detail that naturally creates interaction with other players (e.g. "Immediately trusts whoever speaks first" or "Always challenges the loudest person in the room")${roleInstructions}${wordInstructions}

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
      max_completion_tokens: 2500,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    // Parse and validate JSON
    try {
      // Strip markdown code fences (```json ... ```) that models sometimes wrap around JSON.
      const stripped = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(stripped);
      const players = (Array.isArray(parsed) ? parsed : (parsed.players || [])).slice(0, playerCount);
      
      if (!Array.isArray(players)) {
        throw new Error('Response is not an array');
      }

      const enrichedPlayers = players.map((p: Record<string, unknown>) => ({
        ...p,
        gender: resolvePlayerGender(String(p.name || "Player"), p.gender as string | undefined, {
          personality: typeof p.personality === "string" ? p.personality : undefined,
          background: typeof p.background === "string" ? p.background : undefined,
        }),
      }));

      const validPlayers = enrichedPlayers.filter((p: any) =>
        p.name && p.personality && p.background
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

      const dp = decideCompletion?.usage?.prompt_tokens ?? 0;
      const dc = decideCompletion?.usage?.completion_tokens ?? 0;
      const gp = completion.usage?.prompt_tokens ?? 0;
      const gc = completion.usage?.completion_tokens ?? 0;
      const actualModel = (completion as { model?: string }).model ?? chatModel;
      const totalCoins = gptUsageToCoins(actualModel, dp + gp, dc + gc);
      if (totalCoins > 0) {
        await deductTokens(user.id, Math.max(1, totalCoins), 'generate_players', `Generate ${validPlayers.length} players ${dp + gp}+${dc + gc} tokens (${actualModel})`);
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
      { error: 'Character generation failed' },
      { status: 500 }
    );
  }
}
