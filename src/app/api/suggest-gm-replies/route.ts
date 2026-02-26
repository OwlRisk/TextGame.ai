import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

const MAX_SUGGESTIONS = 8;

/**
 * POST /api/suggest-gm-replies
 * Body: { messages: { role: 'gm'|'user', content: string }[] }
 * Returns: { suggestions: string[] } — AI decides whether to show quick replies, how many, and their content; may be empty.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { messages = [] } = body as {
      messages?: { role: string; content: string }[];
    };

    const recent = (Array.isArray(messages) ? messages : []).slice(-8);
    const lastContent = recent.filter((m) => m.role === "gm").pop()?.content?.trim() || "";
    if (!lastContent) {
      return NextResponse.json({ suggestions: [] });
    }

    const openai = getOpenAI();

    const systemPrompt = `You are a Game Master chat assistant. Based on the GM's last message, you alone decide whether to show quick replies, how many (0 to ${MAX_SUGGESTIONS}), and what each says.
Rules:
- If the context does not need quick replies (e.g. GM is waiting for free-form input, or already in confirmation), output 0 lines (nothing or blank).
- If needed, output 1–${MAX_SUGGESTIONS} short suggestions, one per line; each one short sentence, natural and relevant. Decide the count by context; do not pad to a fixed number.
- Output only the suggestion texts, one per line. No numbering, no quotes. Use English.`;

    const convSnippet = recent
      .map((m) => `${m.role === "gm" ? "GM" : "User"}: ${(m.content || "").slice(0, 200)}`)
      .join("\n");
    const userPrompt = `Recent conversation:\n${convSnippet}\n\nDecide whether to show quick replies; if yes, output that many lines, one per line (0 lines is valid):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 280,
      temperature: 0.6,
    });

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
      { error: e instanceof Error ? e.message : "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
