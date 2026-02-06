import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

const MAX_SUGGESTIONS = 8;

/**
 * POST /api/suggest-gm-replies
 * Body: { messages: { role: 'gm'|'user', content: string }[], language?: 'en'|'zh' }
 * Returns: { suggestions: string[] } — AI 决定是否显示、显示几条、内容；可为空数组表示不显示快速回复。
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      messages = [],
      language = "en",
    } = body as {
      messages?: { role: string; content: string }[];
      language?: "en" | "zh";
    };

    const recent = (Array.isArray(messages) ? messages : []).slice(-8);
    const lastContent = recent.filter((m) => m.role === "gm").pop()?.content?.trim() || "";
    if (!lastContent) {
      return NextResponse.json({ suggestions: [] });
    }

    const isZh = language === "zh";
    const openai = getOpenAI();

    const systemPrompt = isZh
      ? `你是 Game Master 聊天助手。根据当前对话中 GM 最后一条消息，由你完全决定是否展示「快速回复」、展示几条、以及每条的内容。
规则：
- 若当前语境不需要快捷回复（例如 GM 在等待用户自由输入、或已进入确认阶段不需要再选），则输出 0 条（空），即不输出任何内容或只输出空行。
- 若需要，则输出 1～${MAX_SUGGESTIONS} 条，每条一句话、简短、自然，符合当前语境（选某项、确认、追问等）。条数由你根据语境决定，不必凑满。
- 只输出建议内容本身，每行一条；不要编号、不要引号。语言与 GM 一致（这里用中文）。`
      : `You are a Game Master chat assistant. Based on the GM's last message, you alone decide whether to show quick replies, how many (0 to ${MAX_SUGGESTIONS}), and what each says.
Rules:
- If the context does not need quick replies (e.g. GM is waiting for free-form input, or already in confirmation), output 0 lines (nothing or blank).
- If needed, output 1–${MAX_SUGGESTIONS} short suggestions, one per line; each one short sentence, natural and relevant. Decide the count by context; do not pad to a fixed number.
- Output only the suggestion texts, one per line. No numbering, no quotes. Use the same language as the GM (here: English).`;

    const convSnippet = recent
      .map((m) => `${m.role === "gm" ? "GM" : "User"}: ${(m.content || "").slice(0, 200)}`)
      .join("\n");
    const userPrompt = isZh
      ? `最近对话：\n${convSnippet}\n\n请根据 GM 最后一条消息，由你决定：是否需要快速回复；若需要，输出几条、每行一条（可以 0 条）：`
      : `Recent conversation:\n${convSnippet}\n\nDecide whether to show quick replies; if yes, output that many lines, one per line (0 lines is valid):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
