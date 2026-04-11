/**
 * Build game config data for Script Kill games from structured case data.
 * Called at game creation time to replace the generic /api/generate-players flow.
 */

import { getMysteryCase } from "@/data/mystery-cases";
import { buildCaseRulesText } from "./suspect-prompt-builder";
import { getGameTemplate } from "./game-templates";
import { t } from "@/lib/i18n";

const PRESET_TO_CASE: Record<string, string> = {
  "script-kill-moonlight": "moonlight-inn",
  "script-kill-gallery": "silk-gallery",
  "script-kill-express": "midnight-express",
  "script-kill-campus": "haunted-campus",
  "script-kill-banquet": "poison-banquet",
  "script-kill-arctic": "arctic-station",
  "script-kill-jade": "jade-temple",
  "script-kill-cyber": "cyber-corp",
};

export function getCaseIdFromPreset(presetId: string): string | undefined {
  return PRESET_TO_CASE[presetId];
}

export interface ScriptKillSetup {
  configuredPlayers: {
    name: string;
    gender?: string;
    personality?: string;
    background?: string;
    role?: string;
  }[];
  rules: string;
  playerRules: string;
  humanRole: string;
  caseId: string;
  playerCount: number;
}

export function buildScriptKillGame(presetId: string, lang?: string): ScriptKillSetup | null {
  const caseId = getCaseIdFromPreset(presetId);
  if (!caseId) return null;

  const caseData = getMysteryCase(caseId);
  if (!caseData) return null;

  const tmpl = getGameTemplate("script-kill");
  const mechanicsPrompt = tmpl?.mechanicsPrompt ?? "";

  const configuredPlayers = caseData.suspects.map((s) => ({
    name: s.name,
    personality: s.personality,
    background: s.relationship,
    role: "Suspect",
  }));

  const caseRulesText = buildCaseRulesText(caseData);
  const rules = `${mechanicsPrompt}\n\n${caseRulesText}`;

  const suspectNames = caseData.suspects.map((s) => s.name).join(", ");
  const playerRules = [
    `# ${caseData.title}`,
    "",
    `**${caseData.victim.name}** ${t("pr.is_dead", lang)}`,
    "",
    `**${t("pr.suspects", lang)}:** ${suspectNames}`,
    "",
    `## ${t("pr.how_to_play", lang)}`,
    "",
    `- **${t("pr.ask_questions", lang)}** — ${t("pr.ask_questions_desc", lang)}`,
    `- **${t("pr.collect_evidence", lang)}** — ${t("pr.collect_evidence_desc", lang)}`,
    `- **${t("pr.present_evidence", lang)}** — ${t("pr.present_evidence_desc", lang)}`,
    `- **${t("pr.make_accusation", lang)}** — ${t("pr.make_accusation_desc", lang)}`,
    "",
    `## ${t("pr.tips", lang)}`,
    "",
    `- ${t("pr.tip_lies", lang)}`,
    `- ${t("pr.tip_nervous", lang)}`,
    `- ${t("pr.tip_no_rush", lang)}`,
  ].join("\n");

  return {
    configuredPlayers,
    rules,
    playerRules,
    humanRole: "Detective",
    caseId,
    playerCount: caseData.suspects.length + 1,
  };
}
