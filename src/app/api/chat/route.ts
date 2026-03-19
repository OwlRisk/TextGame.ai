import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import {
  deductTokens,
  hasTokens,
  gptUsageToCoins,
  estimatedTokensToCoins,
  estimateTokensFromText,
  estimateChatTokens,
} from '@/lib/tokens';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { buildGMSystemPrompt } from '@/lib/gm-system-prompt';

const limiter = createRateLimiter('chat', { limit: 30, windowSeconds: 60 });

// Lazy initialization to avoid errors at module load time
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in your .env file.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = limiter.check(user.id);
    if (!rl.success) return rateLimitResponse(rl);

    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' 
        },
        { status: 500 }
      );
    }

    let body: {
      messages?: unknown;
      hostPersonality?: { name?: string; description?: string; personality?: string };
      gameContext?: { template?: string; playerCount?: number; gameName?: string; conversationState?: string; rules?: string };
      maxCompletionTokens?: number;
      preferredModel?: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { messages, hostPersonality, gameContext, maxCompletionTokens, preferredModel } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const maxTokens = typeof maxCompletionTokens === 'number' && maxCompletionTokens > 0
      ? Math.min(4096, Math.max(256, maxCompletionTokens))
      : 500;

    const openai = getOpenAI();
    const systemMessage = buildGMSystemPrompt({ hostPersonality, gameContext });


    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg: any) => ({
        role: msg.role === 'gm' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

    const chatModel = preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: chatModel,
      messages: formattedMessages,
      max_completion_tokens: maxTokens,
      stream: false,
    });

    // Deduct based on actual API cost (model + usage)
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const model = (completion as { model?: string }).model ?? 'gpt-5.3-chat-latest';
    const coinsToDeduct = gptUsageToCoins(model, promptTokens, completionTokens);
    await deductTokens(
      user.id,
      coinsToDeduct,
      'ai_chat',
      `Chat ${promptTokens + completionTokens} tokens (${model})`
    );

    let response = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!response) {
      return NextResponse.json(
        { error: 'The model returned no content. Please try again.' },
        { status: 500 }
      );
    }

    let imageUrl: string | undefined;

    const replyTypeMatch = response.match(/<REPLY_TYPE>\s*image\s*<\/REPLY_TYPE>/i);
    const imageSizeMatch = response.match(/<IMAGE_SIZE>\s*(\S+)\s*<\/IMAGE_SIZE>/i);
    const imagePromptMatch = response.match(/<IMAGE_PROMPT>([\s\S]*?)<\/IMAGE_PROMPT>/i);
    const captionMatch = response.match(/<CAPTION>([\s\S]*?)<\/CAPTION>/i);

    const sizeMap: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
      square: '1024x1024',
      portrait: '1024x1792',
      landscape: '1792x1024',
    };
    const imageSize = imageSizeMatch ? sizeMap[imageSizeMatch[1].toLowerCase()] ?? '1024x1024' : '1024x1024';

    if (replyTypeMatch && imagePromptMatch) {
      const imagePrompt = imagePromptMatch[1].trim().slice(0, 900);
      if (imagePrompt) {
        try {
          const imgRes = await openai.images.generate({
            model: 'dall-e-3',
            prompt: imagePrompt,
            size: imageSize,
            quality: 'hd',
            response_format: 'b64_json',
            n: 1,
          });
          const b64 = imgRes.data?.[0]?.b64_json;
          if (b64) imageUrl = `data:image/png;base64,${b64}`;
        } catch (imgErr: unknown) {
          console.error('[chat] Image generation failed:', imgErr);
        }
      }
      response = response
        .replace(/<REPLY_TYPE>\s*[\s\S]*?<\/REPLY_TYPE>/gi, '')
        .replace(/<IMAGE_SIZE>\s*[\s\S]*?<\/IMAGE_SIZE>/gi, '')
        .replace(/<IMAGE_PROMPT>[\s\S]*?<\/IMAGE_PROMPT>/gi, '')
        .replace(/<CAPTION>[\s\S]*?<\/CAPTION>/gi, '')
        .replace(/\n{2,}/g, '\n\n')
        .trim();
      if (captionMatch && captionMatch[1].trim()) response = captionMatch[1].trim();
    }

    return NextResponse.json({ 
      message: response,
      usage: completion.usage,
      ...(imageUrl && { imageUrl }),
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI API key configuration.' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    let message = error.message || 'Failed to get AI response';
    if (/connection error|connection refused|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message)) {
      message = 'Unable to connect to OpenAI. Check your network and OPENAI_API_KEY. You can set OPENAI_CHAT_MODEL=gpt-5.3-chat-latest in .env if the default model fails.';
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
