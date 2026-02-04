/**
 * Optional reply material for the Game Master (design-phase chat).
 * Each item can be: a full sentence, a short phrase, a keyword, or any other form.
 * The LLM sees these as inspiration only—it decides the actual reply content, wording, and when to use each.
 */

export const GM_HINTS: string[] = [
  "可以主动推荐狼人杀、卧底、自定义等模板，并简要说明各自特点。",
  "提醒用户右侧规则面板会随对话实时更新，可随时直接编辑。",
  "根据用户描述的游戏类型或人数偏好，给出合适的人数建议。",
  "若用户拿不定主意，可提供 2～3 个选项并说明差异，由用户选择。",
  "规则或阶段讨论时，可提示可先定大框架再细化，避免一次写太长。",
  "推荐模板",
  "人数与节奏",
];

export function getGMHintsPrompt(): string {
  if (GM_HINTS.length === 0) return "";
  return (
    "\n\nReply material (optional; each item can be a sentence, phrase, or any form—you decide the actual reply content and whether/when to use each; no need to quote verbatim):\n" +
    GM_HINTS.map((h) => `- ${h.trim()}`).join("\n")
  );
}
