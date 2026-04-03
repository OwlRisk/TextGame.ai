/**
 * Score a detective's accusation against the case solution.
 * Used both client-side (for display) and can be used server-side for validation.
 */

import type { MysteryCase, CaseAccusation, CaseScore } from "@/types/mystery-case";

const POINTS_CULPRIT = 50;
const POINTS_MOTIVE = 25;
const POINTS_METHOD = 25;
const POINTS_PER_KEY_EVIDENCE = 10;

export function scoreAccusation(caseData: MysteryCase, accusation: CaseAccusation): CaseScore {
  const correctCulprit = accusation.culpritId === caseData.solution.culpritId;

  const correctMotive = correctCulprit && fuzzyMatch(accusation.motive, caseData.solution.motive);
  const correctMethod = correctCulprit && fuzzyMatch(accusation.method, caseData.solution.method);

  let evidenceBonus = 0;
  if (correctCulprit) {
    for (const eId of caseData.solution.keyEvidence) {
      if (accusation.evidenceCited.includes(eId)) {
        evidenceBonus += POINTS_PER_KEY_EVIDENCE;
      }
    }
  }

  const total =
    (correctCulprit ? POINTS_CULPRIT : 0) +
    (correctMotive ? POINTS_MOTIVE : 0) +
    (correctMethod ? POINTS_METHOD : 0) +
    evidenceBonus;

  const maxPossible =
    POINTS_CULPRIT +
    POINTS_MOTIVE +
    POINTS_METHOD +
    caseData.solution.keyEvidence.length * POINTS_PER_KEY_EVIDENCE;

  return {
    correctCulprit,
    correctMotive,
    correctMethod,
    evidenceBonus,
    total,
    maxPossible,
    grade: calculateGrade(total),
  };
}

function calculateGrade(total: number): CaseScore["grade"] {
  if (total >= 90) return "S";
  if (total >= 70) return "A";
  if (total >= 50) return "B";
  if (total >= 25) return "C";
  return "F";
}

/**
 * Fuzzy match between player's stated reason and the actual solution.
 * Checks for keyword overlap — the player doesn't need to be exact,
 * just capture the key concepts.
 */
function fuzzyMatch(playerText: string, solutionText: string): boolean {
  if (!playerText || !solutionText) return false;

  const playerWords = extractKeywords(playerText);
  const solutionWords = extractKeywords(solutionText);

  if (solutionWords.length === 0) return false;

  let matches = 0;
  for (const word of solutionWords) {
    if (playerWords.some((pw) => pw.includes(word) || word.includes(pw))) {
      matches++;
    }
  }

  return matches / solutionWords.length >= 0.3;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "was", "were", "are", "be", "been",
  "has", "had", "have", "do", "did", "does", "will", "would", "could",
  "should", "may", "might", "that", "this", "it", "he", "she", "they",
  "his", "her", "their", "him", "them", "who", "which", "what", "when",
  "where", "how", "not", "no", "all", "each", "very", "just", "about",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function getGradeLabel(grade: CaseScore["grade"]): string {
  switch (grade) {
    case "S": return "Perfect Detective";
    case "A": return "Sharp Investigator";
    case "B": return "Decent Deduction";
    case "C": return "Partial Success";
    case "F": return "Case Cold";
  }
}

export function getGradeColor(grade: CaseScore["grade"]): string {
  switch (grade) {
    case "S": return "text-amber-400";
    case "A": return "text-emerald-400";
    case "B": return "text-blue-400";
    case "C": return "text-orange-400";
    case "F": return "text-red-400";
  }
}
