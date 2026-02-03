import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

/**
 * POST /api/suggest-prompts
 * Body: { gameName: string, lastHostMessage: string, rulesSnippet?: string, language?: 'en'|'zh' }
 * Returns: { suggestions: string[] } — 3–5 short prompts the player could send (e.g. theme ideas, round length, ready).
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      gameName = 'this game',
      lastHostMessage = '',
      rulesSnippet = '',
      language = 'en',
    } = body as {
      gameName?: string;
      lastHostMessage?: string;
      rulesSnippet?: string;
      language?: 'en' | 'zh';
    };

    const isZh = language === 'zh';
    const openai = getOpenAI();

    const systemPrompt = isZh
      ? `你是一个游戏房间的助手。根据主持人（Host）刚刚说的话，生成 3～5 条玩家可以快速点击发送的「建议回复」。
要求：每条一句话、简短、自然，符合当前对话（例如：主题建议、回合时长、是否计分、或表示准备好了）。
只输出建议内容本身，每行一条，不要编号、不要引号、不要其他说明。语言与主持人一致（这里用中文）。`
      : `You are a game room assistant. Based on what the host just said, generate 3–5 short "suggestion prompts" that a player could tap to send as their reply.
Rules: Each suggestion is one short sentence, natural and relevant (e.g. theme ideas, round length, scoring vs casual, or "I'm ready").
Output only the suggestions, one per line. No numbering, no quotes, no extra text. Use the same language as the host (here: English).`;

    const userPrompt = isZh
      ? `游戏名：${gameName}\n主持人刚说的内容：\n${lastHostMessage}\n${rulesSnippet ? `规则摘要：\n${rulesSnippet.slice(0, 400)}\n` : ''}\n请生成 3～5 条简短建议回复（每行一条）：`
      : `Game: ${gameName}\nHost's last message:\n${lastHostMessage}\n${rulesSnippet ? `Rules snippet:\n${rulesSnippet.slice(0, 400)}\n` : ''}\nGenerate 3–5 short suggestion replies (one per line):`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || '';
    const suggestions = text
      .split('\n')
      .map((s) => s.replace(/^[\d.)\-\s]+/, '').trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 5);

    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error('[suggest-prompts]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
