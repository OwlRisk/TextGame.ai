/**
 * Build AI system prompts for Script Kill suspects and inject case data into Host rules.
 */

import type { MysteryCase, Suspect, Evidence } from "@/types/mystery-case";

/**
 * Build a character-specific system prompt for an AI suspect.
 * The prompt instructs the AI to play the character faithfully:
 * maintain lies, guard secrets, and break when breakpoints are triggered.
 */
export function buildSuspectPrompt(suspect: Suspect, caseData: MysteryCase): string {
  const isCulprit = suspect.id === caseData.solution.culpritId;

  const lines: string[] = [
    `You are ${suspect.name}, being interrogated as a suspect in the murder of ${caseData.victim.name}.`,
    `Personality: ${suspect.personality}`,
    `Your relationship to the victim: ${suspect.relationship}`,
    "",
    "YOUR ALIBI:",
    suspect.alibi,
    suspect.alibiTruth
      ? "(This alibi is TRUE. Defend it confidently.)"
      : "(This alibi is FALSE or incomplete. You must maintain it but may falter under pressure.)",
    "",
    "YOUR SECRETS (never volunteer these):",
    ...suspect.secrets.map((s) => `- ${s}`),
    "",
    "YOUR LIES (maintain these unless a breakpoint is triggered):",
    ...suspect.lies.map((l) => `- "${l}"`),
  ];

  if (isCulprit) {
    lines.push(
      "",
      "YOU ARE THE KILLER.",
      `You killed ${caseData.victim.name}. Motive: ${caseData.solution.motive}`,
      `Method: ${caseData.solution.method}`,
      "Stay calm and helpful. Deflect suspicion onto others. NEVER confess unless all your breakpoints have been triggered AND the detective directly confronts you with overwhelming evidence.",
    );
  } else {
    lines.push(
      "",
      "YOU ARE INNOCENT.",
      "You did NOT commit the murder, but you have secrets that make you look suspicious.",
      "Be defensive when accused. Show genuine confusion or indignation.",
    );
  }

  lines.push(
    "",
    "BREAKPOINTS — when the detective presents ANY of these, you MUST crack:",
    ...suspect.breakpoints.map((b) => `- ${b}`),
    "",
    'When a breakpoint is triggered: hesitate, show emotion, then admit ONE secret or retract ONE lie. Do not dump everything at once. Build drama.',
    "",
    "INTERROGATION BEHAVIOR:",
    "- Answer in 2-3 sentences max. You are being interrogated, not giving a speech.",
    "- Be specific and in-character. React to the detective's tone and evidence.",
    "- If asked something your character would not know, say so.",
    "- If asked about another suspect, share observations but be biased by your own perspective.",
    "- Never use meta-language about the game. You are a real person in a real interrogation.",
    "",
    "OUTPUT: Only your spoken response. No name prefix, no labels, no stage directions.",
  );

  return lines.join("\n");
}

/**
 * Build the case data section that gets injected into the Host's rulesText.
 * This gives the Host full knowledge of the case to run it faithfully.
 */
export function buildCaseRulesText(caseData: MysteryCase): string {
  const suspectList = caseData.suspects
    .map((s) => {
      const isCulprit = s.id === caseData.solution.culpritId;
      return [
        `### ${s.name} ${isCulprit ? "[CULPRIT]" : "[INNOCENT]"}`,
        `- ID: ${s.id}`,
        `- Relationship: ${s.relationship}`,
        `- Alibi: ${s.alibi} (${s.alibiTruth ? "TRUE" : "FALSE"})`,
        `- Secrets: ${s.secrets.join("; ")}`,
        `- Lies: ${s.lies.join("; ")}`,
        `- Breakpoints: ${s.breakpoints.join("; ")}`,
      ].join("\n");
    })
    .join("\n\n");

  const evidenceByAct = [1, 2, 3].map((act) => {
    const items = caseData.evidence.filter((e) => e.revealAct === act);
    if (items.length === 0) return "";
    return `**Act ${act} Evidence:**\n${items.map((e) => formatEvidence(e)).join("\n")}`;
  }).filter(Boolean).join("\n\n");

  const timelineText = caseData.timeline
    .map((t) => `- ${t.time} | ${t.actor}: ${t.action}${t.isPublic ? "" : " [HIDDEN]"}`)
    .join("\n");

  return `## CASE DATA — ${caseData.title.toUpperCase()}

**Setting:** ${caseData.setting}

**Victim:** ${caseData.victim.name} — ${caseData.victim.description}
**Cause of Death:** ${caseData.victim.causeOfDeath}

## COMPLETE TIMELINE (for your reference — do NOT reveal hidden entries)
${timelineText}

## EVIDENCE (reveal at designated acts)
${evidenceByAct}

## SUSPECTS
${suspectList}

## SOLUTION
- **Culprit:** ${caseData.suspects.find((s) => s.id === caseData.solution.culpritId)?.name ?? caseData.solution.culpritId}
- **Motive:** ${caseData.solution.motive}
- **Method:** ${caseData.solution.method}
- **Key Evidence:** ${caseData.solution.keyEvidence.join(", ")}

## QUESTION BUDGET
- Act 1: 3 questions
- Act 2: 5 questions
- Act 3: 3 questions
Total: 11 questions before accusation.`;
}

function formatEvidence(e: Evidence): string {
  const herring = e.isRedHerring ? " [RED HERRING]" : "";
  return `- **${e.name}** (${e.type}): ${e.description} → Points to: ${e.pointsTo}${herring}`;
}

/**
 * Build the initial evidence board content (Markdown) for the detective.
 * Shown via [BOARD:You] at game start.
 */
export function buildInitialEvidenceBoard(caseData: MysteryCase): string {
  const act1Evidence = caseData.evidence.filter((e) => e.revealAct === 1);

  const lines: string[] = [
    `# ${caseData.title}`,
    "",
    `**Victim:** ${caseData.victim.name}`,
    `**Cause of Death:** ${caseData.victim.causeOfDeath}`,
    "",
    "---",
    "",
    "## Evidence Collected",
    "",
  ];

  if (act1Evidence.length > 0) {
    for (const e of act1Evidence) {
      lines.push(`**${e.name}** _(${e.type})_`);
      lines.push(`${e.description}`);
      lines.push("");
    }
  }

  lines.push("---", "", "## Suspect Notes", "");
  for (const s of caseData.suspects) {
    lines.push(`**${s.name}** — ${s.relationship}`);
    lines.push(`_Alibi:_ ${s.alibi}`);
    lines.push("");
  }

  return lines.join("\n");
}
