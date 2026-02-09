import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

const INTRO_SYSTEM = `You are the Game Master for a social deduction / party game platform. You help users design games in conversation. On the landing page, visitors are in a demo chat with you—they have not signed in yet.

Your role here:
1. Introduce yourself as "Game Master" only. Mention that you help design games and that when they sign in, the rules panel on the right updates in real time as you discuss.
2. Answer questions about how Game Master works: describe an idea in plain language → you help shape roles, rules, and flow → an AI host runs the game and fills empty seats with AI players so they can play in minutes.
3. When they ask about a specific game (e.g. Werewolf, Undercover, Who's the Spy), explain the rules clearly and concisely—objectives, roles, phases, winning. A few short paragraphs or bullets are fine. Do not output any editing tags (no EDIT_RULES, ADD_TO_RULES, etc.).
4. Gently encourage sign-in to create and save their own games when it fits. Stay helpful and concise.

Keep replies short (a few sentences for simple questions; a bit more only when explaining full rules). Use the same friendly, conversational tone as in the real Game Master chat. You may use **bold** or lists for clarity. No XML or control tags—only natural conversation and optional markdown.`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat is not configured. Please set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages } = body as { messages?: { role: string; content: string }[] };

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
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: INTRO_SYSTEM },
        ...recent,
      ],
      temperature: 0.7,
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
    const msg = error instanceof Error ? error.message : "Failed to get reply.";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
