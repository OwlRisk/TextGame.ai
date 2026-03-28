import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUserFromRequest } from '@/lib/auth-server';
import {
  deductTokens,
  hasTokens,
  gptUsageToCoins,
  estimatedTokensToCoins,
  estimateTokensFromText,
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
    const chatModel = preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';
    const systemMessage = buildGMSystemPrompt({ hostPersonality, gameContext });

    const estTokens = estimateTokensFromText(systemMessage) + messages.reduce((s: number, m: any) => s + estimateTokensFromText(m.content || ''), 0) + maxTokens;
    const estCoins = estimatedTokensToCoins(estTokens, chatModel);
    if (!(await hasTokens(user.id, estCoins))) {
      return NextResponse.json({ error: 'Insufficient tokens', code: 'INSUFFICIENT_TOKENS' }, { status: 402 });
    }

    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg: any) => ({
        role: msg.role === 'gm' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

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

    return NextResponse.json({ 
      message: response,
      usage: completion.usage,
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
