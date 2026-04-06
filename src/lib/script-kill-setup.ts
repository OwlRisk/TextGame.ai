/**
 * Build game config data for Script Kill games from structured case data.
 * Called at game creation time to replace the generic /api/generate-players flow.
 */

import { getMysteryCase } from "@/data/mystery-cases";
import { buildCaseRulesText } from "./suspect-prompt-builder";
import { getGameTemplate } from "./game-templates";

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
  humanRole: string;
  caseId: string;
  playerCount: number;
}

export function buildScriptKillGame(presetId: string): ScriptKillSetup | null {
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

  return {
    configuredPlayers,
    rules,
    humanRole: "Detective",
    caseId,
    playerCount: caseData.suspects.length + 1,
  };
}
