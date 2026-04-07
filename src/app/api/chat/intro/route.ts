import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

const limiter = createRateLimiter("chat-intro", { limit: 5, windowSeconds: 60 });

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

const INTRO_SYSTEM = `You are the Game Master for TextGame.ai, an AI-powered murder mystery game platform. On the landing page, visitors are in a demo chat with you — they have not signed in yet.

Your role here:
1. Introduce yourself as "Game Master". Explain that you run murder mystery investigations where visitors play as detectives interrogating AI suspects.
2. Describe how it works: pick a case → an AI Host presents the crime scene and evidence → AI suspects answer your questions in character → you collect clues, spot contradictions, and solve the case in about 10 minutes.
3. When they ask about the game, explain the 3-act structure (Crime Scene → Interrogation → Confrontation → Accusation), the breakpoint system, and the scoring.
4. Gently encourage sign-in to start their first case. Stay helpful and concise.

Keep replies short (a few sentences for simple questions; a bit more when explaining how investigations work). Use a friendly, conversational tone. You may use **bold** or lists for clarity. No XML or control tags — only natural conversation and optional markdown.`;

export async function POST(request: NextRequest) {
  try {
    const ipKey = request.headers.get("x-forwarded-for") || "anon";
    const rl = limiter.check(ipKey);
    if (!rl.success) return rateLimitResponse(rl);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat is not configured. Please set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { messages, preferredModel } = body as { messages?: { role: string; content: string }[]; preferredModel?: string };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Limit to last 10 turns to avoid abuse and long context
    const recent = messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, 2000),
    }));

    const openai = getOpenAI();
    const model = preferredModel || process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: INTRO_SYSTEM },
        ...recent,
      ],
      max_completion_tokens: 512,
    });

    const message = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!message) {
      return NextResponse.json(
        { error: "No response from the assistant. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error: unknown) {
    console.error("[intro-chat]", error);
    return NextResponse.json(
      { error: "AI response failed" },
      { status: 500 }
    );
  }
}
