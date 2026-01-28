import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization
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
    const { gameName, gameTemplate, rules } = body;

    if (!gameName) {
      return NextResponse.json(
        { error: 'gameName is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    // Build prompt for game icon
    let iconPrompt = `A simple, clean game icon for "${gameName}". `;
    
    if (gameTemplate === 'werewolf') {
      iconPrompt += 'Werewolf theme with moon and wolf silhouette. ';
    } else if (gameTemplate === 'undercover') {
      iconPrompt += 'Spy/detective theme with mysterious silhouette and magnifying glass. ';
    } else {
      // Analyze rules to determine theme
      const rulesLower = (rules || '').toLowerCase();
      if (rulesLower.includes('werewolf') || rulesLower.includes('wolf')) {
        iconPrompt += 'Werewolf theme with moon and wolf. ';
      } else if (rulesLower.includes('spy') || rulesLower.includes('detective') || rulesLower.includes('undercover')) {
        iconPrompt += 'Spy/detective theme with mystery elements. ';
      } else if (rulesLower.includes('mafia')) {
        iconPrompt += 'Mafia theme with hat and shadows. ';
      } else {
        iconPrompt += 'Social deduction game theme with multiple player silhouettes. ';
      }
    }

    iconPrompt += 'Flat design, minimal, icon style, solid colors, no text, no words, no letters. ';
    iconPrompt += 'Perfect for app icon. Dark background with vibrant accent colors. ';
    iconPrompt += 'Professional game icon aesthetic.';

    // Generate icon using DALL-E 2 with lowest resolution
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: iconPrompt,
      size: '256x256', // Smallest size, lowest cost
      response_format: 'b64_json',
      n: 1,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('No image data returned from DALL-E');
    }

    const imageUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json({ 
      icon: imageUrl,
      prompt: iconPrompt
    });

  } catch (error: any) {
    console.error('Error generating game icon:', error);
    
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
      { error: error.message || 'Failed to generate game icon' },
      { status: 500 }
    );
  }
}
