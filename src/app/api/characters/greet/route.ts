import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  const personality = (body.personality as string)?.trim() || "";
  const background = (body.background as string)?.trim() || "";
  const isHost = body.isHost === true;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = isHost
    ? `You are "${name}", a game host. Personality: ${personality || "charismatic"}. Background: ${background || "experienced game master"}.
Say a single short greeting (1 sentence, under 20 words) to welcome players to the game lobby. Stay in character. English only.`
    : `You are "${name}", a game character. Personality: ${personality || "friendly"}. Background: ${background || "adventurer"}.
Say a single short greeting (1 sentence, under 15 words) introducing yourself in the lobby. Stay in character. English only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Output ONLY the greeting line. No quotes, no stage directions, no asterisks." },
        { role: "user", content: prompt },
      ],
      temperature: 1.0,
      max_tokens: 60,
    });

    const greeting = (completion.choices[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    if (!greeting) {
      return NextResponse.json({ error: "Empty response" }, { status: 500 });
    }

    return NextResponse.json({ greeting });
  } catch (err: any) {
    console.error("[characters/greet]", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
