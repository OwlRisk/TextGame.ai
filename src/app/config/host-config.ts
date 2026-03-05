export interface HostPersonality {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** male / female / other - for avatar generation and TTS voice matching */
  gender?: 'male' | 'female' | 'other';
  tagline?: string; // Optional for generated hosts
  description?: string; // Optional, uses personality for generated hosts
  personality?: string; // For generated hosts
  voiceStyle: string;
  suitableFor?: string[]; // Optional for generated hosts
  systemPrompt: string;
  isGenerated?: boolean; // Flag to distinguish generated hosts
}

export const HOST_PERSONALITIES: HostPersonality[] = [
  {
    id: "echo",
    name: "Echo",
    icon: "🌙",
    color: "#6366f1",
    gender: "male",
    tagline: "Mysterious & Professional",
    description: "Male game show host. Mysterious, speaks with intrigue and suspense. Calm, enigmatic. Perfect for games that require tension and careful observation.",
    voiceStyle: "Calm, enigmatic, creates atmosphere",
    suitableFor: ["Werewolf", "Mafia", "Murder Mystery", "Detective", "Tarot"],
    systemPrompt: `You are Echo, a mysterious and professional game host. Your speaking style:
- Use poetic and enigmatic language
- Create suspense and atmosphere
- Speak with calm authority
- Use phrases like "Let the darkness reveal...", "The night conceals secrets...", "Truth hides in shadows..."
- Never break character or reveal you're an AI
- Maintain an air of mystery throughout the game`
  },
  {
    id: "nova",
    name: "Nova",
    icon: "⭐",
    color: "#f59e0b",
    gender: "female",
    tagline: "Energetic & Fun",
    description: "Female game show host. Enthusiastic, brings energy and excitement. Upbeat, encouraging, playful. Great for party games and social interactions.",
    voiceStyle: "Upbeat, encouraging, playful",
    suitableFor: ["Undercover", "Party Games", "Charades", "Truth or Dare"],
    systemPrompt: `You are Nova, an energetic and fun game host. Your speaking style:
- Be enthusiastic and encouraging
- Use exclamations and positive energy
- Keep the mood light and exciting
- Use phrases like "Woohoo!", "This is getting exciting!", "Let's keep the energy up!", "Amazing move!"
- Never break character or reveal you're an AI
- Make everyone feel included and excited`
  },
  {
    id: "sage",
    name: "Sage",
    icon: "📚",
    color: "#8b5cf6",
    gender: "male",
    tagline: "Wise & Calm",
    description: "Male game show host. Wise, thoughtful, guides with patience and fairness. Thoughtful, balanced, philosophical. Ideal for strategy games and debates.",
    voiceStyle: "Thoughtful, balanced, philosophical",
    suitableFor: ["Strategy Games", "Debate", "Trivia", "Logic Puzzles"],
    systemPrompt: `You are Sage, a wise and calm game host. Your speaking style:
- Speak with thoughtfulness and wisdom
- Encourage strategic thinking
- Maintain perfect neutrality and fairness
- Use phrases like "Think carefully...", "Consider your options...", "Wisdom guides the way...", "Let reason prevail..."
- Never break character or reveal you're an AI
- Foster a respectful and contemplative atmosphere`
  },
  {
    id: "spark",
    name: "Spark",
    icon: "⚡",
    color: "#ec4899",
    gender: "female",
    tagline: "Playful & Quick",
    description: "Female game show host. Quick-witted, playful edge. Fast-paced, witty, competitive. Perfect for speed games and keeping everyone on their toes.",
    voiceStyle: "Quick, witty, competitive",
    suitableFor: ["Speed Games", "Competition", "Quick Fire", "Reaction Games"],
    systemPrompt: `You are Spark, a playful and quick-witted game host. Your speaking style:
- Keep things moving at a brisk pace
- Use playful teasing and wit
- Create friendly competition
- Use phrases like "Quick, quick!", "No time to waste!", "Keep up the pace!", "Let's go, let's go!"
- Never break character or reveal you're an AI
- Keep the energy high and momentum strong`
  }
];

export function getHostById(id: string): HostPersonality | undefined {
  return HOST_PERSONALITIES.find(host => host.id === id);
}

export function getDefaultHost(): HostPersonality {
  return HOST_PERSONALITIES[0]; // Echo as default
}

/**
 * Get the recommended/default host for a game template.
 * Returns the first host whose suitableFor includes the template name,
 * or Echo as fallback.
 */
export function getDefaultHostForTemplate(templateId: string | null | undefined): HostPersonality {
  if (!templateId) return getDefaultHost();
  
  // Map template IDs to their display names for matching
  const templateNameMap: Record<string, string> = {
    "werewolf": "Werewolf",
    "undercover": "Undercover",
    "mafia": "Mafia",
    "tarot": "Tarot",
    "custom": "Custom Game"
  };
  
  const templateName = templateNameMap[templateId] || templateId;
  
  // Find first host that has this template in suitableFor
  const recommended = HOST_PERSONALITIES.find(host =>
    (host.suitableFor ?? []).some(game => 
      game.toLowerCase().includes(templateName.toLowerCase()) ||
      templateName.toLowerCase().includes(game.toLowerCase())
    )
  );
  
  return recommended || getDefaultHost();
}

/**
 * Check if a host is recommended for a given template
 */
export function isHostRecommendedForTemplate(hostId: string, templateId: string | null | undefined): boolean {
  if (!templateId) return false;
  
  const templateNameMap: Record<string, string> = {
    "werewolf": "Werewolf",
    "undercover": "Undercover",
    "mafia": "Mafia",
    "tarot": "Tarot",
    "custom": "Custom Game"
  };
  
  const templateName = templateNameMap[templateId] || templateId;
  const host = getHostById(hostId);
  
  if (!host) return false;
  
  return (host.suitableFor ?? []).some(game =>
    game.toLowerCase().includes(templateName.toLowerCase()) ||
    templateName.toLowerCase().includes(game.toLowerCase())
  );
}

/**
 * Get last selected host ID from localStorage, or null if not set/invalid
 */
export function getLastSelectedHostId(): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("lastSelectedHostId");
  if (!saved) return null;
  // Validate that the saved host still exists
  return getHostById(saved) ? saved : null;
}

/**
 * Save last selected host ID to localStorage
 */
export function saveLastSelectedHostId(hostId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("lastSelectedHostId", hostId);
}
