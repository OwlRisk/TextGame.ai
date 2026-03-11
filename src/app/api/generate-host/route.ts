import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from '@/lib/auth-server';
import {
  deductTokens,
  hasTokens,
  gptUsageToCoins,
  estimatedTokensToCoins,
  estimateTokensFromText,
} from '@/lib/tokens';
import { logger } from '@/lib/logger';
import { pickVoiceForSpeaker } from '@/lib/inworld-voices';
import { createRateLimiter, rateLimitResponse } from '@/lib/rate-limit';

const limiter = createRateLimiter('generate-host', { limit: 10, windowSeconds: 60 });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = limiter.check(user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const { gameRules, gameName } = await req.json();

    if (!gameRules) {
      return NextResponse.json(
        { error: "Game rules are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a creative game design assistant. Generate a unique AI host for this game.

Based on the game's theme and rules, decide:
- What kind of name fits best (short modern name, role title, character name, etc.)
- What personality would enhance the experience
- How they should speak and interact with players
- What emoji and color represent them
- The host's gender (male/female) so voice and avatar match — pick male or female, avoid "other"
- A voiceStyle description (5-15 words) that captures how they sound — this is used to match a TTS voice by keyword similarity

Be creative and adaptive. For abstract games use simple names; for themed games use atmospheric names/titles that match the setting.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "name": "Host name or title that fits the game",
  "personality": "Brief personality description (20-40 words)",
  "voiceStyle": "How they sound (5-15 words, e.g. 'calm authoritative british' or 'warm playful energetic')",
  "systemPrompt": "How they behave and speak (50-150 words)",
  "icon": "Single emoji",
  "color": "Hex color code",
  "gender": "male or female"
}`;

    const seed = Math.random().toString(36).substring(2, 10);
    const userPrompt = `Game: ${gameName || "Custom Game"}

Rules:
${gameRules}

Create a host that perfectly fits this game's theme and atmosphere.
IMPORTANT: Be creative with the name — avoid reusing common/obvious choices. Each game deserves a fresh, unique host identity.
Randomness seed: ${seed}`;

    const estimatedTokens = estimateTokensFromText(systemPrompt) + estimateTokensFromText(userPrompt) + 500;
    const estimatedCoins = estimatedTokensToCoins(estimatedTokens, 'gpt-5.2');
    if (!(await hasTokens(user.id, estimatedCoins))) {
      return NextResponse.json(
        {
          error: 'Insufficient tokens',
          message: 'You need more tokens to generate a host. Please purchase tokens or upgrade to Pro.',
          code: 'INSUFFICIENT_TOKENS',
        },
        { status: 402 }
      );
    }

    logger.log(`[Generate Host] Generating host for game: ${gameName || "Unknown"}`);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.0, // High creativity for diverse hosts
      max_completion_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const model = (completion as { model?: string }).model ?? 'gpt-5.2';
    const coinsToDeduct = gptUsageToCoins(model, promptTokens, completionTokens);
    await deductTokens(
      user.id,
      coinsToDeduct,
      'game_creation',
      `Generate host ${promptTokens + completionTokens} tokens (${model})`
    );

    // Parse the JSON response
    let hostConfig;
    try {
      hostConfig = JSON.parse(response);
    } catch (parseError) {
      logger.error("[Generate Host] Failed to parse JSON:", parseError);
      logger.error("[Generate Host] Response was:", response);
      return NextResponse.json(
        { error: "Failed to parse host configuration" },
        { status: 500 }
      );
    }

    // Validate required fields
    const required = ["name", "personality", "voiceStyle", "systemPrompt", "icon", "color"];
    for (const field of required) {
      if (!hostConfig[field]) {
        logger.error(`[Generate Host] Missing field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 500 }
        );
      }
    }
    // Strip any LLM-generated ttsVoice — we assign it ourselves below
    if (hostConfig.ttsVoice) delete hostConfig.ttsVoice;
    if (hostConfig.gender && !["male", "female", "other"].includes(String(hostConfig.gender).toLowerCase())) {
      delete hostConfig.gender;
    }

    // Assign a voice_id from the Inworld TTS pool using the same selection logic
    // as AI players, so the host's voice comes from the same source and is
    // stored persistently in the game config (not re-assigned every session).
    const hostVoiceId = pickVoiceForSpeaker(
      hostConfig.gender ?? null,
      hostConfig.voiceStyle ?? hostConfig.personality ?? null,
      'EN_US',
      hostConfig.name ?? null,
    );
    hostConfig.voice_id = hostVoiceId;

    logger.log("[Generate Host] Generated host:", hostConfig.name, "voice:", hostVoiceId);

    return NextResponse.json(hostConfig);
  } catch (error) {
    logger.error("[Generate Host] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate host" },
      { status: 500 }
    );
  }
}
