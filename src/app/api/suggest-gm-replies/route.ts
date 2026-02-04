import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

/**
 * POST /api/suggest-gm-replies
 * Body: { messages: { role: 'gm'|'user', content: string }[], language?: 'en'|'zh' }
 * Returns: { suggestions: string[] } — 3–5 short quick-reply texts the user could send to the Game Master.
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
      ? `你是 Game Master 聊天助手。根据当前对话中 GM 最后一条消息，生成 3～5 条用户可一键发送的「快速回复」。
要求：每条一句话、简短、自然，符合当前语境（例如选某项、确认、追问、或通用如「还有什么选项？」）。
只输出建议内容本身，每行一条，不要编号、不要引号。语言与 GM 一致（这里用中文）。`
      : `You are a Game Master chat assistant. Based on the GM's last message in the conversation, generate 3–5 short "quick reply" texts the user could tap to send.
Rules: Each is one short sentence, natural and relevant (e.g. pick an option, confirm, ask for more, or generic like "What else can I do?").
Output only the suggestion texts, one per line. No numbering, no quotes. Use the same language as the GM (here: English).`;

    const convSnippet = recent
      .map((m) => `${m.role === "gm" ? "GM" : "User"}: ${(m.content || "").slice(0, 200)}`)
      .join("\n");
    const userPrompt = isZh
      ? `最近对话：\n${convSnippet}\n\n请根据 GM 最后一条消息生成 3～5 条快速回复（每行一条）：`
      : `Recent conversation:\n${convSnippet}\n\nGenerate 3–5 quick replies based on the GM's last message (one per line):`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.6,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || "";
    const suggestions = text
      .split("\n")
      .map((s) => s.replace(/^[\d.)\-\s]+/, "").replace(/^["']|["']$/g, "").trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[suggest-gm-replies]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
