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

    function isSafetyRejection(err: any): boolean {
      const msg = (err?.message || err?.error?.message || '').toString();
      return (
        err?.status === 400 &&
        (msg.includes('safety') || msg.includes('rejected') || msg.includes('not allowed'))
      );
    }

    async function generateWithPrompt(iconPrompt: string): Promise<string> {
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt: iconPrompt,
        size: '256x256',
        response_format: 'b64_json',
        n: 1,
      });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image data returned from DALL-E');
      return `data:image/png;base64,${b64}`;
    }

    const safeSuffix =
      'Flat design, minimal, no text no letters. Single clear motif. Square icon, suitable for app icon.';

    let iconPrompt: string;
    let imageUrl: string;

    try {
      const rulesSnippet = (rules || '').trim().slice(0, 400);
      const systemPrompt = `You are an expert at designing app icon concepts for games. Given a game name and optional rules summary, output exactly one short image prompt (1-2 sentences, in English) for DALL-E to draw. Decide yourself: subject (character, object, scene, symbol), style, mood, and colors. Be creative and specific. Do not mention game controller, joystick, or gamepad. Output only the image description, no other text. Keep content safe and family-friendly.`;
      const userPrompt = `Game name: "${String(gameName).slice(0, 100)}".${gameTemplate ? ` Template: ${gameTemplate}.` : ''}${rulesSnippet ? ` Rules summary: ${rulesSnippet}` : ''}\n\nWrite one short DALL-E image prompt that captures this game.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const aiConcept = completion.choices?.[0]?.message?.content?.trim() || '';
      const basePrompt = aiConcept
        ? `${aiConcept} `
        : `A distinctive app icon that represents the game "${String(gameName).slice(0, 80)}". `;
      iconPrompt = basePrompt + safeSuffix;
      imageUrl = await generateWithPrompt(iconPrompt);
    } catch (firstErr: any) {
      if (!isSafetyRejection(firstErr)) throw firstErr;
      const safePrompt =
        'Abstract geometric app icon, flat design, single vibrant color on dark background, no text, no people, game theme. ' + safeSuffix;
      iconPrompt = safePrompt;
      imageUrl = await generateWithPrompt(safePrompt);
    }

    return NextResponse.json({
      icon: imageUrl,
      prompt: iconPrompt,
    });
  } catch (error: any) {
    console.error('Error generating game icon:', error);

    if (error.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    if (error.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    if (error.status === 400) {
      return NextResponse.json(
        { error: 'Image request was rejected. Try again or use a different game name.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate game icon' },
      { status: 500 }
    );
  }
}
