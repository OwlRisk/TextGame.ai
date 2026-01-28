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
    const { playerCount, gameTemplate, rules } = body;

    if (!playerCount || playerCount < 1) {
      return NextResponse.json(
        { error: 'playerCount is required and must be greater than 0' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    // Add randomness to ensure different results each time
    const randomSeed = Math.random().toString(36).substring(7);
    
    // Build prompt for generating diverse players
    const prompt = `Generate ${playerCount} diverse game players for a ${gameTemplate || 'social deduction'} game. (Seed: ${randomSeed})

Game Rules:
${rules || 'Standard social deduction game'}

Requirements:
1. Generate ${playerCount} COMPLETELY UNIQUE players - never repeat the same combinations
2. Balance gender distribution (roughly 50/50 male/female, with some variety)
3. Use culturally diverse names from different origins:
   - Western: Alex, Sarah, Michael, Emma, David, Lisa
   - Asian: Yuki, Kenji, Mei, Wei, Priya, Raj
   - Hispanic: Sofia, Diego, Maria, Carlos
   - Middle Eastern: Amir, Layla, Omar, Fatima
   - African: Amara, Kwame, Zuri, Jabari
4. Each player must have a UNIQUE personality (never duplicate):
   - Strategic thinker
   - Intuitive empath
   - Bold risk-taker
   - Cautious observer
   - Charismatic leader
   - Analytical detective
   - Creative storyteller
   - Diplomatic negotiator
   - Quick-witted improviser
   - Patient listener
5. Backgrounds should be varied and interesting:
   - Professional: detective, lawyer, doctor, teacher, engineer
   - Academic: psychology student, philosophy major, debate champion
   - Creative: theater actor, novelist, musician, comedian
   - Strategic: poker player, chess master, military strategist
   - Social: therapist, social worker, event planner, diplomat

Output ONLY a valid JSON array in this exact format:
[
  {
    "name": "Player Name",
    "gender": "male/female/other",
    "personality": "Brief unique personality (5-8 words)",
    "background": "Brief unique background (5-8 words)"
  }
]

Important: Output ONLY the JSON array, no other text. Ensure maximum diversity and uniqueness.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use faster, cheaper model for this task
      messages: [
        {
          role: 'system',
          content: 'You are a game character generator. Output only valid JSON arrays, no other text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1.0, // High creativity for diverse characters
      max_completion_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    
    // Parse and validate JSON
    try {
      const players = JSON.parse(response.trim());
      
      if (!Array.isArray(players)) {
        throw new Error('Response is not an array');
      }

      // Validate each player has required fields
      const validPlayers = players.filter(p => 
        p.name && p.gender && p.personality && p.background
      );

      if (validPlayers.length === 0) {
        throw new Error('No valid players generated');
      }

      return NextResponse.json({ 
        players: validPlayers,
        count: validPlayers.length 
      });

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
