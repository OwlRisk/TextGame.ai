import type { LucideIcon } from "lucide-react";
import { Search, Fingerprint, Zap, Clock } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LandingMessage {
  isHost?: boolean;
  name: string;
  role?: string;
  personality?: string;
  gender?: string;
  time: string;
  text: string;
}

export interface InsideGameMessage extends LandingMessage {
  badge: string | null;
}

export interface InsideGameStep {
  id: string;
  step: string;
  total: string;
  icon: string;
  title: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  messages: InsideGameMessage[];
}

export interface GameScenario {
  title: string;
  messages: LandingMessage[];
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  image: string;
  alt: string;
}

export interface FeaturedGame {
  emoji: string;
  title: string;
  players: string;
  tags: string[];
  description: string;
  cover: string;
  accent: string;
  border: string;
  presetId: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface MarqueeCharacter {
  name: string;
  role: string;
  personality: string;
  game: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

/** Static pre-generated avatar map for landing page characters */
export const LANDING_AVATAR_MAP: Record<string, string> = {
  "Host":              "/avatars/preview/landing-avatar-detective-kate.webp",
  "Detective Kate":    "/avatars/preview/landing-avatar-detective-kate.webp",
  "Ms. Chen":          "/avatars/preview/landing-avatar-casey.webp",
  "Colonel Hayes":     "/avatars/preview/landing-avatar-captain-rex.webp",
  "Dr. Voss":          "/avatars/preview/landing-avatar-dr-chen.webp",
  "Butler Graves":     "/avatars/preview/landing-avatar-gideon.webp",
  "Lady Ashford":      "/avatars/preview/landing-avatar-lucia.webp",
  "Chef Moreau":       "/avatars/preview/landing-avatar-marco.webp",
  "Prof. Sterling":    "/avatars/preview/landing-avatar-morgan.webp",
  "Maid Rosie":        "/avatars/preview/landing-avatar-riley.webp",
  "Curator Lin":       "/avatars/preview/landing-avatar-jordan.webp",
};

export const INSIDE_GAME_STEPS: InsideGameStep[] = [
  {
    id: "choose-case",
    step: "01",
    total: "04",
    icon: "📁",
    title: "Choose a Case",
    heading: "Pick a murder mystery to investigate",
    description:
      "Browse the case library and choose from 8 unique murder mystery cases — each with different settings, suspects, and hidden secrets. One click and you're in.",
    image: "/steps/step-design.png",
    imageAlt: "Browse murder mystery cases in the case library",
    messages: [
      { isHost: true, name: "Host", badge: "GM", time: "", text: "Welcome, Detective. A body has been found at the Moonlight Inn. The victim: Mr. Harrington, discovered in the locked study." },
      { isHost: true, name: "Host", badge: "GM", time: "", text: "Three suspects are waiting to be questioned. The evidence will be revealed across three acts. You have 11 questions to solve the case." },
    ],
  },
  {
    id: "investigate",
    step: "02",
    total: "04",
    icon: "🔍",
    title: "Investigate",
    heading: "Examine the crime scene and evidence",
    description:
      "The AI Host describes the crime scene in vivid detail. Evidence is revealed across three acts — some real, some red herrings. Build your theory as new clues surface.",
    image: "/steps/step-host.png",
    imageAlt: "Crime scene investigation with evidence being revealed",
    messages: [
      { isHost: true, name: "Host", badge: "GM", time: "", text: "Evidence found: A shattered whiskey glass with traces of an unknown substance. A torn letter behind the bookshelf reading 'Pay what you owe, or everyone finds out.'" },
      { isHost: true, name: "Host", badge: "GM", time: "", text: "The study door was locked from the inside. A window was found slightly open, though the room is on the second floor." },
    ],
  },
  {
    id: "interrogate",
    step: "03",
    total: "04",
    icon: "❓",
    title: "Interrogate",
    heading: "Question AI suspects — they react like real people",
    description:
      "Each suspect has their own personality, alibis, and secrets. Ask the right questions and they'll get nervous. Present the right evidence and they'll crack — revealing what they've been hiding.",
    image: "/steps/step-ai-players.png",
    imageAlt: "Interrogating AI suspects who react with real emotions",
    messages: [
      { name: "You", badge: "YOU", time: "", text: "Ms. Chen, where were you between 9 and 11 PM last night?", role: "Detective", personality: "Sharp, methodical", gender: "other" },
      { name: "Ms. Chen", badge: "AI", time: "", text: "I was in my room, reading. I heard nothing unusual... though I did notice the study light was on around 10.", role: "Suspect", personality: "Nervous, hiding something", gender: "female" },
      { name: "You", badge: "YOU", time: "", text: "I'd like to show Ms. Chen the torn letter we found.", role: "Detective", personality: "Sharp, methodical", gender: "other" },
      { name: "Ms. Chen", badge: "AI", time: "", text: "Where did you find that?! I... that letter wasn't supposed to... *trails off, visibly shaken*", role: "Suspect", personality: "Nervous, hiding something", gender: "female" },
    ],
  },
  {
    id: "solve",
    step: "04",
    total: "04",
    icon: "⚖️",
    title: "Solve the Case",
    heading: "Make your accusation — the truth is revealed",
    description:
      "Name the killer, state the motive and method. The AI reveals the full truth and scores your detective work. Can you get an S-rank?",
    image: "/steps/step-you-play.png",
    imageAlt: "Making the final accusation and receiving a detective score",
    messages: [
      { name: "You", badge: "YOU", time: "", text: "I'm ready to make my accusation. I believe Ms. Chen poisoned Mr. Harrington to prevent him from revealing her embezzlement.", role: "Detective", personality: "Confident", gender: "other" },
      { isHost: true, name: "Host", badge: "GM", time: "", text: "Correct! Ms. Chen laced the whiskey with digitalis. Motive: covering up a year-long embezzlement scheme. Detective Grade: A — Solid deduction. 85 points." },
    ],
  },
];

export const GAME_SCENARIOS: Record<string, GameScenario> = {
  moonlight: {
    title: "Moonlight Inn",
    messages: [
      { isHost: true, name: "Host", time: "Act 1", text: "A body has been found at the Moonlight Inn. The victim: Mr. Harrington, discovered in the locked study with a shattered whiskey glass." },
      { name: "You", time: "Act 1", text: "Ms. Chen, where were you between 9 and 11 PM?", role: "Detective", personality: "Sharp, methodical", gender: "other" },
      { name: "Ms. Chen", time: "Act 1", text: "I was in my room, reading. I heard nothing... though the study light was on around 10.", role: "Suspect", personality: "Nervous", gender: "female" },
      { name: "You", time: "Act 2", text: "I'd like to show Ms. Chen the torn letter we found behind the bookshelf.", role: "Detective", personality: "Sharp, methodical", gender: "other" },
    ],
  },
  gallery: {
    title: "Silk Gallery",
    messages: [
      { isHost: true, name: "Host", time: "Act 1", text: "The renowned art collector Madame Dubois was found dead in her private gallery. The priceless Silk Painting has vanished." },
      { name: "You", time: "Act 1", text: "Curator Lin, when did you last see Madame Dubois alive?", role: "Detective", personality: "Observant", gender: "other" },
      { name: "Curator Lin", time: "Act 1", text: "Around 7 PM. She was admiring the new acquisition... she seemed agitated, actually.", role: "Suspect", personality: "Guarded, precise", gender: "female" },
      { name: "You", time: "Act 2", text: "The security logs show someone accessed the gallery at 11:43 PM. Care to explain?", role: "Detective", personality: "Observant", gender: "other" },
    ],
  },
  banquet: {
    title: "Poison Banquet",
    messages: [
      { isHost: true, name: "Host", time: "Act 1", text: "Lord Ashford collapsed during the banquet. The doctor confirms: poison. Everyone at the table is a suspect." },
      { name: "You", time: "Act 1", text: "Chef Moreau, who had access to Lord Ashford's wine glass?", role: "Detective", personality: "Direct", gender: "other" },
      { name: "Chef Moreau", time: "Act 1", text: "Anyone at the table could have! I prepared the food, not the drinks. Ask the butler — he poured the wine.", role: "Suspect", personality: "Defensive, quick-tempered", gender: "male" },
      { name: "You", time: "Act 2", text: "Butler Graves, the toxicology report says the poison was in the food, not the wine.", role: "Detective", personality: "Direct", gender: "other" },
    ],
  },
};

export const FEATURES: Feature[] = [
  {
    icon: Fingerprint,
    title: "AI suspects with real personalities",
    description: "Each suspect has unique secrets, alibis, and breaking points. They lie, deflect, and crack under pressure — just like real people.",
    gradient: "from-rose-500 to-red-500",
    image: "/features/feature-ai-plays.png",
    alt: "AI suspects with unique personalities reacting to interrogation",
  },
  {
    icon: Search,
    title: "Evidence-driven breakthroughs",
    description: "Present the right evidence to the right suspect and they'll crack — revealing secrets they were trying to hide. Red herrings keep you guessing.",
    gradient: "from-amber-500 to-orange-500",
    image: "/features/feature-ai-host.png",
    alt: "Evidence board with clues and suspect connections",
  },
  {
    icon: Zap,
    title: "Every choice matters",
    description: "You have limited questions per act. Choose wisely — who to interrogate, what evidence to present, when to press harder.",
    gradient: "from-violet-500 to-purple-500",
    image: "/features/feature-always-players.png",
    alt: "Detective making strategic choices during investigation",
  },
  {
    icon: Clock,
    title: "Quick to play — 10 minutes per case",
    description: "No setup, no waiting. Pick a case and start investigating. Solo play — anytime, anywhere.",
    gradient: "from-emerald-500 to-teal-500",
    image: "/features/feature-easy-start.png",
    alt: "Quick one-click game start on any device",
  },
];

export const FEATURED_GAMES: FeaturedGame[] = [
  {
    emoji: "🕵️",
    title: "Moonlight Inn",
    players: "Solo",
    tags: ["Murder Mystery", "Classic"],
    description: "A stormy night, a locked room, three suspects. You have 11 questions to solve the case.",
    cover: "/games/game-cover-script-kill-moonlight.webp",
    accent: "from-rose-500/20 to-red-500/10",
    border: "hover:border-rose-500/50",
    presetId: "script-kill-moonlight",
  },
  {
    emoji: "🖼️",
    title: "Silk Gallery",
    players: "Solo",
    tags: ["Murder Mystery", "Art Heist"],
    description: "A renowned collector dead, a priceless painting gone. Unravel the gallery's dark secrets.",
    cover: "/games/game-cover-script-kill-gallery.webp",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "hover:border-violet-500/50",
    presetId: "script-kill-gallery",
  },
  {
    emoji: "☠️",
    title: "Poison Banquet",
    players: "Solo",
    tags: ["Murder Mystery", "Dinner Party"],
    description: "Lord Ashford poisoned at his own banquet. Everyone at the table had a motive.",
    cover: "/games/game-cover-script-kill-banquet.webp",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "hover:border-amber-500/50",
    presetId: "script-kill-banquet",
  },
  {
    emoji: "🏔️",
    title: "Arctic Station",
    players: "Solo",
    tags: ["Murder Mystery", "Sci-Fi"],
    description: "A researcher found dead at a remote arctic outpost. No one could have left — or arrived.",
    cover: "/games/game-cover-script-kill-arctic.webp",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "hover:border-cyan-500/50",
    presetId: "script-kill-arctic",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is this game?",
    answer: "It's an AI-powered murder mystery game. You play as a detective investigating a murder case. AI suspects — each with unique personalities and hidden secrets — respond to your questions in real time. Collect evidence, spot contradictions, and solve the case.",
  },
  {
    question: "How long does a case take?",
    answer: "About 10–15 minutes. Each case has three acts with a limited question budget, keeping investigations focused and fast-paced. Pick a case, start investigating, and solve it in one sitting.",
  },
  {
    question: "Do AI suspects really react to my questions?",
    answer: "Yes. Each suspect has a unique personality, hidden secrets, and breaking points. Ask the right questions or present the right evidence, and they'll crack — revealing information they were trying to hide. They lie, deflect, and get emotional just like real people.",
  },
  {
    question: "Can I play solo?",
    answer: "Absolutely. Every case is designed for solo play. You're the detective, and all suspects are AI characters. No need to find other players or wait for anyone.",
  },
  {
    question: "How many cases are there?",
    answer: "We currently have 8 unique murder mystery cases, each with different settings, suspects, motives, and solutions. More cases are being added regularly.",
  },
  {
    question: "Do I need to sign in? Is it free?",
    answer: "Sign in with Google to start playing — takes a few seconds. New accounts get free credits to try your first case. Each case costs a small number of credits.",
  },
  {
    question: "Can I replay a case?",
    answer: "You can, but since you'll know the solution, it's more fun to try a different case. With 8 cases available, there's plenty to investigate.",
  },
  {
    question: "How is this different from a murder mystery book or movie?",
    answer: "Unlike passive media, you choose who to interrogate, what evidence to present, and when to press harder. The AI responds dynamically to your choices. You're scored on your detective work — can you get an S-rank?",
  },
];

const BASE_MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  { name: "Ms. Chen",        role: "Suspect",   personality: "Nervous, hiding financial secrets",     game: "Moonlight Inn" },
  { name: "Colonel Hayes",   role: "Suspect",   personality: "Stoic, with a military past",           game: "Moonlight Inn" },
  { name: "Dr. Voss",        role: "Suspect",   personality: "Cold, clinical, knows too much",        game: "Moonlight Inn" },
  { name: "Curator Lin",     role: "Suspect",   personality: "Guarded, meticulous with details",      game: "Silk Gallery" },
  { name: "Lady Ashford",    role: "Suspect",   personality: "Grief-stricken — or is she?",           game: "Poison Banquet" },
  { name: "Chef Moreau",     role: "Suspect",   personality: "Hot-tempered, defensive about his work", game: "Poison Banquet" },
  { name: "Butler Graves",   role: "Suspect",   personality: "Loyal servant, but loyal to whom?",     game: "Poison Banquet" },
  { name: "Prof. Sterling",  role: "Suspect",   personality: "Brilliant mind, questionable ethics",   game: "Arctic Station" },
  { name: "Maid Rosie",      role: "Suspect",   personality: "Quiet observer, sees everything",       game: "Jade Temple" },
];

/** Duplicated for seamless infinite marquee loop */
export const MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  ...BASE_MARQUEE_CHARACTERS,
  ...BASE_MARQUEE_CHARACTERS,
];
