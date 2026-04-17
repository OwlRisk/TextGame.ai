import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { CHEAP_AI_MODEL } from "@/lib/model-prefs";
import { deductTokens, hasTokens, gptUsageToCoins, estimatedTokensToCoins } from "@/lib/tokens";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

const limiter = createRateLimiter("suggest-gm-replies", { limit: 40, windowSeconds: 60 });
const MAX_SUGGESTIONS = 8;

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = limiter.check(user.id);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { messages = [], language, gameName, rulesSnippet, playerCount } = body as {
      messages?: { role: string; content: string }[];
      preferredModel?: string;
      language?: string;
      gameName?: string;
      rulesSnippet?: string;
      playerCount?: number;
    };

    const recent = (Array.isArray(messages) ? messages : []).slice(-8);
    const lastContent = recent.filter((m) => m.role === "gm").pop()?.content?.trim() || "";
    if (!lastContent) {
      return NextResponse.json({ suggestions: [] });
    }

    const model = CHEAP_AI_MODEL;
    const estCoins = estimatedTokensToCoins(800, model);
    if (!(await hasTokens(user.id, estCoins))) {
      return NextResponse.json({ error: "Insufficient tokens", code: "INSUFFICIENT_TOKENS" }, { status: 402 });
    }

    const openai = getOpenAI();

    const langInstruction = language === "zh" ? "Reply in Chinese (简体中文)." : "Reply in English.";
    const gameContext = gameName ? `The user is designing a game called "${gameName}".` : "The user is designing a new game.";
    const playersContext = playerCount ? ` Current player count: ${playerCount} AI + 1 human.` : "";
    const rulesContext = rulesSnippet ? `\nCurrent rules (excerpt):\n${rulesSnippet.slice(0, 600)}` : "";

    const systemPrompt = `You are a Game Master chat assistant helping a user design game rules. ${gameContext}${playersContext}
Based on the GM's last message and the current game setup, suggest quick replies the user might want to send.

Rules:
- If the context does not need quick replies (e.g. GM is waiting for free-form creative input), output 0 lines.
- Suggestions should be specific to the current game design state — propose concrete changes to rules, player count, roles, or game mechanics rather than vague responses like "Sounds good".
- If needed, output 1–${MAX_SUGGESTIONS} short suggestions, one per line; each one short sentence, natural and relevant. Decide the count by context.
- Output only the suggestion texts, one per line. No numbering, no quotes. ${langInstruction}`;

    const convSnippet = recent
      .map((m) => `${m.role === "gm" ? "GM" : "User"}: ${(m.content || "").slice(0, 200)}`)
      .join("\n");
    const userPrompt = `${rulesContext ? rulesContext + "\n\n" : ""}Recent conversation:\n${convSnippet}\n\nDecide whether to show quick replies; if yes, output that many lines, one per line (0 lines is valid):`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15_000);
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 280,
    }, { signal: ac.signal });
    clearTimeout(timer);

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const actualModel = (completion as { model?: string }).model ?? model;
    if (promptTokens + completionTokens > 0) {
      const coins = gptUsageToCoins(actualModel, promptTokens, completionTokens);
      await deductTokens(user.id, Math.max(1, coins), "suggest_gm_replies", `GM replies ${promptTokens}+${completionTokens} tokens (${actualModel})`);
    }

    const text = completion.choices?.[0]?.message?.content?.trim() || "";
    const suggestions = text
      .split("\n")
      .map((s) => s.replace(/^[\d.)\-\s]+/, "").replace(/^["']|["']$/g, "").trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, MAX_SUGGESTIONS);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[suggest-gm-replies]", e);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}
