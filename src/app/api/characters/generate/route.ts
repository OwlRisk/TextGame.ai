import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const count = Math.min(Math.max(body.count ?? 3, 1), 10);
  const theme = body.theme?.trim() || "diverse and interesting";

  const openai = getOpenAI();
  const seed = Math.random().toString(36).substring(7);

  const prompt = `Generate ${count} unique fictional characters for a text-based game.
Theme/style: ${theme}

Each character should feel distinct — vary age, personality, background, gender, and cultural influences.

Return ONLY a valid JSON array. Each element:
{
  "name": "Character name (creative, fits theme)",
  "gender": "male" or "female" or "other",
  "personality": "5-10 word personality tag",
  "background": "5-10 word backstory/context"
}

Randomness seed: ${seed}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: "You generate creative game characters. Return only valid JSON arrays." },
        { role: "user", content: prompt },
      ],
      temperature: 1.0,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    const characters = JSON.parse(jsonMatch[0]) as Array<{
      name: string;
      gender?: string;
      personality?: string;
      background?: string;
    }>;

    const valid = characters
      .filter((c) => c.name?.trim())
      .slice(0, count)
      .map((c) => ({
        name: c.name.trim(),
        gender: c.gender || "other",
        personality: c.personality?.trim() || "Mysterious and interesting",
        background: c.background?.trim() || "A traveler from distant lands",
      }));

    return NextResponse.json({ characters: valid });
  } catch (err: any) {
    console.error("[characters/generate] error:", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
