/** Structured case data for AI Script Kill (剧本杀) games. */

export interface TimelineEvent {
  time: string;
  actor: string;
  action: string;
  /** Whether this event is known to the detective at game start */
  isPublic: boolean;
}

export interface Evidence {
  id: string;
  name: string;
  description: string;
  /** Which act this evidence is revealed in (1 = initial, 2 = mid-game, 3 = confrontation) */
  revealAct: 1 | 2 | 3;
  type: "physical" | "testimony" | "document" | "digital";
  /** Suspect ID this evidence points toward (may be misleading) */
  pointsTo: string;
  isRedHerring: boolean;
}

export interface Suspect {
  id: string;
  name: string;
  /** Used for avatar / voice consistency (pool + prompts default to male when omitted). */
  gender?: "male" | "female" | "other";
  /** Strongly differentiated personality (e.g. "nervous stutterer", "arrogant aristocrat") */
  personality: string;
  relationship: string;
  alibi: string;
  alibiTruth: boolean;
  /** Secrets the suspect hides — not all related to the crime */
  secrets: string[];
  /** Statements the suspect will proactively lie about */
  lies: string[];
  /** Evidence IDs or question topics that crack this suspect open */
  breakpoints: string[];
  /** Full character prompt built by buildSuspectPrompt() at runtime */
  systemPrompt?: string;
}

export interface CaseSolution {
  culpritId: string;
  motive: string;
  method: string;
  /** Evidence IDs that form the conclusive proof chain */
  keyEvidence: string[];
}

/** Localized display strings for a mystery case (board-visible fields only). */
export interface CaseTranslation {
  title?: string;
  victim?: {
    name?: string;
    description?: string;
    causeOfDeath?: string;
  };
  evidence?: Record<string, { name?: string; description?: string }>;
  suspects?: Record<string, { name?: string; relationship?: string; alibi?: string }>;
}

export interface MysteryCase {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  /** Rich description of the crime scene and setting */
  setting: string;
  victim: {
    name: string;
    description: string;
    causeOfDeath: string;
  };
  timeline: TimelineEvent[];
  evidence: Evidence[];
  suspects: Suspect[];
  solution: CaseSolution;
  translations?: Partial<Record<string, CaseTranslation>>;
}

export interface CaseAccusation {
  culpritId: string;
  motive: string;
  method: string;
  evidenceCited: string[];
}

export interface CaseScore {
  correctCulprit: boolean;
  correctMotive: boolean;
  correctMethod: boolean;
  evidenceBonus: number;
  total: number;
  maxPossible: number;
  grade: "S" | "A" | "B" | "C" | "F";
}
