/**
 * SEO-enriched game data for /games/[slug] landing pages.
 * Kept separate from discover-page.tsx (client component) so Server Components can import it.
 */

export interface GameFAQ {
  question: string;
  answer: string;
}

export interface ChatPreviewMessage {
  name: string;
  text: string;
  isHost?: boolean;
}

export interface GameSEOData {
  slug: string;
  /** templateId used in /create?preset= */
  presetId: string;
  name: string;
  tagline: string;
  description: string;
  /** For <meta name="description"> */
  metaDescription: string;
  keywords: string[];
  icon: string;
  coverImage?: string;
  players: string;
  duration: string;
  style: "Casual" | "Strategic" | "Competitive";
  category: string;
  /** Detailed how-to-play steps */
  howToPlay: string[];
  /** Roles with name + description */
  roles?: { name: string; description: string }[];
  /** Feature highlights shown on the landing page */
  features: string[];
  /** FAQ items for structured data + page display */
  faq: GameFAQ[];
  /** Related game slugs */
  related: string[];
  /** Sample in-game chat messages shown on the template page */
  chatPreview?: ChatPreviewMessage[];
}

// Product pivot: only Script Kill / Murder Mystery SEO pages are active.
// Original entries (werewolf, mafia, undercover, etc.) preserved in git history.

export const GAME_SEO_DATA: GameSEOData[] = [
  {
    slug: "murder-mystery",
    presetId: "script-kill-moonlight",
    name: "AI Murder Mystery — Script Kill",
    tagline: "You are the detective. AI suspects have secrets to hide.",
    description:
      "Step into a crime scene. Interrogate AI suspects — each with a unique personality, hidden secrets, and breaking points. Collect evidence across three acts, spot contradictions, and crack the case. Every investigation plays differently.",
    metaDescription:
      "Play AI murder mystery games online. Interrogate suspects with real personalities, collect evidence, and solve the case in 10 minutes. Free to start.",
    keywords: [
      "AI murder mystery",
      "detective game online",
      "script kill",
      "murder mystery game",
      "AI interrogation game",
      "solve murder mystery online",
      "whodunit game",
      "interactive mystery game",
    ],
    icon: "🕵️",
    coverImage: "/games/game-cover-script-kill-moonlight.webp",
    players: "Solo",
    duration: "10–15 min",
    style: "Strategic",
    category: "Mystery",
    howToPlay: [
      "Choose a murder mystery case from the case library.",
      "Act 1 — Crime Scene: Examine the scene, learn about the victim, and meet the suspects.",
      "Act 2 — Interrogation: Question suspects, present evidence, and trigger breakpoints to crack their alibis.",
      "Act 3 — Confrontation: Confront your prime suspect with accumulated evidence.",
      "Make your final accusation: name the killer, motive, and method. You're scored on accuracy.",
    ],
    roles: [
      { name: "Detective", description: "You investigate the case. Question suspects, examine evidence, and make the final accusation." },
      { name: "Suspect", description: "AI-controlled. Each suspect has a unique personality, alibis, secrets, and breaking points." },
    ],
    features: [
      "8 unique murder mystery cases",
      "AI suspects with real personalities and hidden secrets",
      "Evidence-driven breakpoint system",
      "Solo investigation — play anytime",
      "Scored detective performance (S/A/B/C/F grades)",
    ],
    faq: [
      { question: "How long does a case take?", answer: "Each case takes about 10–15 minutes. You have a limited question budget across three acts, keeping investigations focused and fast-paced." },
      { question: "Can I replay the same case?", answer: "You can, but since you know the solution it's more fun to try a different case. We have 8 unique cases with different settings and suspects." },
      { question: "Do AI suspects really react to my questions?", answer: "Yes. Each suspect has a unique personality and hidden secrets. Ask the right questions or present the right evidence, and they'll crack — revealing information they were trying to hide." },
      { question: "How is this different from a murder mystery book?", answer: "Unlike a book, you choose who to interrogate, what evidence to present, and when to confront suspects. The AI responds dynamically to your choices, making every investigation unique." },
      { question: "Is it free to play?", answer: "New accounts get free credits to start. Each case costs a small number of credits based on the AI processing involved." },
    ],
    related: [],
    chatPreview: [
      { name: "Host", text: "A body has been found at the Moonlight Inn. The victim: Mr. Harrington, found in the locked study with a shattered whiskey glass.", isHost: true },
      { name: "Detective", text: "Ms. Chen, where were you between 9 and 11 PM last night?" },
      { name: "Host", text: "Ms. Chen: 'I was in my room, reading. I heard nothing unusual... though I did notice the study light was on around 10.'", isHost: true },
      { name: "Detective", text: "I'd like to show Ms. Chen the torn letter we found behind the bookshelf." },
      { name: "Host", text: "Ms. Chen's composure cracks. 'Where did you find that? I... that letter wasn't supposed to...' She trails off, visibly shaken.", isHost: true },
    ],
  },
];

/** Look up SEO data by slug. */
export function getGameSEOData(slug: string): GameSEOData | undefined {
  return GAME_SEO_DATA.find((g) => g.slug === slug);
}

/** All slugs — used for generateStaticParams. */
export const ALL_GAME_SLUGS = GAME_SEO_DATA.map((g) => g.slug);
