import { NextRequest } from 'next/server';
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
import { isDatabaseConfigured, isDatabaseError } from '@/lib/db-ready';
import { sanitizeModel } from '@/lib/model-prefs';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';
import { buildGMSystemPrompt } from '@/lib/gm-system-prompt';

const limiter = createRateLimiter('chat-stream', { limit: 30, windowSeconds: 60 });

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const rl = limiter.check(user.id);
    if (!rl.success) return rateLimitResponse(rl);

    if (!isDatabaseConfigured()) {
      return new Response(
        JSON.stringify({ error: 'Database not configured. Set DATABASE_URL and run npm run db:setup.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    type Body = {
      messages?: unknown;
      hostPersonality?: { name?: string; description?: string; personality?: string };
      gameContext?: { template?: string; playerCount?: number; gameName?: string; conversationState?: string; rules?: string; minPlayers?: number; maxPlayers?: number; recommendedAICount?: number; category?: string; hasHiddenRoles?: boolean; hasElimination?: boolean };
      maxCompletionTokens?: number;
      systemPrompt?: string;
      preferredModel?: string;
    };
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { messages, hostPersonality, gameContext, maxCompletionTokens, systemPrompt: customSystemPrompt, preferredModel } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (messages.length > 60) {
      return new Response(
        JSON.stringify({ error: 'Too many messages (max 60)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = getOpenAI();
    const systemMessage = buildGMSystemPrompt({ hostPersonality, gameContext, customSystemPrompt });

    const maxTokens = typeof maxCompletionTokens === 'number' && maxCompletionTokens > 0
      ? Math.min(4096, Math.max(256, maxCompletionTokens))
      : 500;
    const systemTokens = estimateTokensFromText(systemMessage);
    const messagesTokens = (messages as { content?: string }[]).reduce(
      (sum, m) => sum + estimateTokensFromText(m?.content ?? ''),
      0
    );
    const totalEstimate = estimateChatTokens(systemTokens, messagesTokens, maxTokens);
    const chatModel = sanitizeModel(preferredModel);
    const estimatedCoins = estimatedTokensToCoins(totalEstimate, chatModel);
    if (!(await hasTokens(user.id, estimatedCoins))) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient tokens',
          message: 'You need more tokens to continue. Please purchase tokens or upgrade to Pro.',
          code: 'INSUFFICIENT_TOKENS',
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg: any) => ({
        role: msg.role === 'gm' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 120_000);

    const stream = await openai.chat.completions.create({
      model: chatModel,
      messages: formattedMessages,
      max_completion_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    }, { signal: ac.signal });

    const userId = user.id;
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let promptTokens = 0;
        let completionTokens = 0;
        let fullContent = '';

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens ?? 0;
              completionTokens = chunk.usage.completion_tokens ?? 0;
            }
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          clearTimeout(timer);

          const actualModel = chatModel;
          const actualCoins = (promptTokens + completionTokens) > 0
            ? gptUsageToCoins(actualModel, promptTokens, completionTokens)
            : estimatedTokensToCoins(systemTokens + messagesTokens + Math.ceil(fullContent.length / 3), chatModel);
          try {
            await deductTokens(userId, Math.max(1, actualCoins), 'ai_chat',
              (promptTokens + completionTokens) > 0
                ? `Chat ${promptTokens}+${completionTokens} tokens (${actualModel})`
                : `Chat ~${systemTokens + messagesTokens + Math.ceil(fullContent.length / 3)} tokens (estimate)`
            );
          } catch (deductErr) {
            console.error('[stream] CRITICAL deduct error — user received content without paying:', deductErr, { userId, coins: actualCoins });
          }
        } catch (err) {
          clearTimeout(timer);
          const errMsg = err instanceof Error ? err.message : 'Stream interrupted';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    if (isDatabaseError(error)) {
      return new Response(
        JSON.stringify({ error: 'Database unavailable. Check DATABASE_URL and that migrations have been run.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let message = error.message || 'Failed to stream AI response';
    if (/connection error|connection refused|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message)) {
      message = 'Unable to connect to OpenAI. Check your network and OPENAI_API_KEY.';
    }
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
