import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

/**
 * POST /api/generate-human-game-identity
 * Body: { gameName: string, rules?: string }
 * Returns: { name: string } — a short in-game character name for the human player that fits the game theme.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { gameName = "Custom Game", rules = "" } = body as { gameName?: string; rules?: string };

    const openai = getOpenAI();
    const rulesSnippet = (rules || "").slice(0, 800);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You generate a single short in-game character name for the human player. The name must fit the game's theme and setting (e.g. for a school mystery: a student name; for werewolf: a villager name; for fantasy: a fitting first name). One name only, 1-3 words, no explanation. Use English.`,
        },
        {
          role: "user",
          content: `Game: ${gameName}\n${rulesSnippet ? `Rules (excerpt):\n${rulesSnippet}\n\n` : ""}Generate one short in-game character name for the human player:`,
        },
      ],
      max_tokens: 30,
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const name = raw.replace(/^["']|["']$/g, "").split("\n")[0].trim().slice(0, 40) || "Player";
    return NextResponse.json({ name });
  } catch (e) {
    console.error("[generate-human-game-identity]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate identity" },
      { status: 500 }
    );
  }
}
