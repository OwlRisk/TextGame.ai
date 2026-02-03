import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid errors at module load time
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { playerCount, gameTemplate, rules, minPlayers, maxPlayers } = body;

    if (playerCount == null || playerCount < 1) {
      playerCount = 0;
    }

    const openai = getOpenAI();
    const randomSeed = Math.random().toString(36).substring(7);

    const needsRoles = gameTemplate === 'werewolf' || gameTemplate === 'mafia';
    const needsWords = gameTemplate === 'undercover';

    if (playerCount === 0) {
      const minAI = typeof minPlayers === 'number' && minPlayers >= 1 ? minPlayers - 1 : 1;
      const maxAI = typeof maxPlayers === 'number' && maxPlayers >= 2 ? maxPlayers - 1 : 19;
      const decideCountPrompt = `You are a game master. Based on the game rules below, decide the optimal number of AI players (user + AI = total). 

Game Template: ${gameTemplate || 'social deduction'}
Valid AI player range: ${minAI}-${maxAI} (total players: ${minAI + 1}-${maxAI + 1})

Game Rules:
${rules || 'Standard social deduction game'}

Consider: game balance, role distribution, pacing. Output ONLY a single number between ${minAI} and ${maxAI}, nothing else.`;

      const decideCompletion = await openai.chat.completions.create({
        model: 'gpt-5.2',
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
6. ROLE ASSIGNMENT (required): Based on the game rules above, assign each player exactly one role. The rules define which roles exist (e.g. Villager, Werewolf, Seer, Doctor). Distribute roles fairly: most should be Villagers/Town, a few special roles as defined in rules, and Werewolves/Mafia as appropriate. Ensure the distribution makes the game balanced. Output each player's "role" in the JSON.`;
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

Game: ${gameTemplate || 'social deduction'}

Rules:
${rules || 'Standard social deduction game'}

Based on this game's theme and setting, decide what naming style fits best:
- Modern/abstract games → modern names (Emma, Lucas, Sofia)
- Fantasy/historical → themed names with roles/titles (Sir Aldric, Witch Elara)
- Story-based → names that match the narrative setting
- Any other theme → adapt accordingly

Requirements:
1. ${playerCount} completely unique, diverse players
2. Mix genders naturally
3. Each personality must be distinct and memorable
4. Create backgrounds that enhance the game experience${roleInstructions}${wordInstructions}

Output ONLY valid JSON:${outputFormat}${wordPairFormat ? `

Top-level structure: { "players": [ ... ], "civilianWord": "...", "undercoverWord": "..." }` : `

Top-level structure: { "players": [ ... ] }`}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
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
      const parsed = JSON.parse(response.trim());
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

      const result: { players: any[]; count: number; civilianWord?: string; undercoverWord?: string } = {
        players: validPlayers,
        count: validPlayers.length
      };
      if (needsWords && parsed.civilianWord && parsed.undercoverWord) {
        result.civilianWord = parsed.civilianWord;
        result.undercoverWord = parsed.undercoverWord;
        validPlayers.forEach((p: any) => {
          const isUndercover = p.word === 'undercover';
          p.role = isUndercover ? 'Undercover' : 'Civilian';
          p.word = isUndercover ? parsed.undercoverWord : parsed.civilianWord;
        });
      }

      return NextResponse.json(result);

    } catch (parseError) {
      console.error('Error parsing player JSON:', parseError);
      console.error('Response was:', response);
      
      // Fallback: return error but don't crash
      return NextResponse.json(
        { error: 'Failed to parse generated players', raw: response },
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
