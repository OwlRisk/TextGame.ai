/**
 * AI player personality and background system.
 * 
 * Strategy: Fixed pool + optional dynamic generation
 * - Fixed pool: 20 curated, high-quality personalities (fast, consistent, cacheable)
 * - Dynamic: Use LLM to generate new ones on demand (fresh, unlimited variety)
 * 
 * Recommendation: Use fixed pool by default (90-100%), occasionally generate new (10-20%)
 * This gives consistency + variety, with controlled costs.
 */

export interface AIPlayerTraits {
  personality: string;
  background: string;
  /** If true, this was dynamically generated (not from fixed pool) */
  isDynamic?: boolean;
}

export const AI_PLAYER_TRAITS: AIPlayerTraits[] = [
  { personality: "Skeptical and analytical. Asks sharp questions.", background: "Former debate champion who loves finding logical flaws." },
  { personality: "Warm and trusting. Often defends others.", background: "Elementary school teacher who believes in seeing the best in people." },
  { personality: "Quiet and observant. Speaks rarely but meaningfully.", background: "Retired chess player who reads people instead of boards." },
  { personality: "Chaotic and playful. Throws curveballs for fun.", background: "Stand-up comedian who can't resist testing the room." },
  { personality: "Strategic and patient. Plays the long game.", background: "Ex-military tactician who plans three steps ahead." },
  { personality: "Emotional and reactive. Hard to fake expressions.", background: "Theater actor who wears feelings on their sleeve." },
  { personality: "Cold and calculating. Rarely shows tells.", background: "Poker enthusiast with a knack for hiding intentions." },
  { personality: "Eager to please. Often agrees with the group.", background: "Diplomat’s kid who avoids conflict at all costs." },
  { personality: "Stubborn and principled. Won’t vote against gut.", background: "Former judge who values consistency over convenience." },
  { personality: "Paranoid and vigilant. Suspects everyone.", background: "Survivalist who’s been betrayed one too many times." },
  { personality: "Charismatic and persuasive. Natural leader.", background: "Startup founder used to pitching and rallying others." },
  { personality: "Sarcastic and witty. Uses humor as a shield.", background: "Satirical writer who deflects with one-liners." },
  { personality: "Naive and honest. Bad at lying.", background: "Fresh grad who hasn’t learned to hide the truth yet." },
  { personality: "Cunning and adaptable. Changes stance quickly.", background: "Sales veteran who reads the room and shifts strategy." },
  { personality: "Empathetic and intuitive. Senses tension.", background: "Therapist who picks up on subtle emotional cues." },
  { personality: "Competitive and bold. Takes risks.", background: "Pro gamer who plays to win, not to blend in." },
  { personality: "Reserved and mysterious. Keeps cards close.", background: "Novelist who prefers listening to telling." },
  { personality: "Outspoken and blunt. Says what others won’t.", background: "Investigative journalist used to asking uncomfortable questions." },
  { personality: "Nervous and jumpy. Easy to misread.", background: "First-time player who gets anxious under pressure." },
  { personality: "Calm and reassuring. Tries to de-escalate.", background: "Mediator who’s always stepping in to cool things down." },
];

export function pickRandomTraits(): AIPlayerTraits {
  return AI_PLAYER_TRAITS[Math.floor(Math.random() * AI_PLAYER_TRAITS.length)];
}

/**
 * Pick traits for multiple players from the fixed pool.
 * Ensures no duplicates within the same game.
 */
export function pickTraitsForPlayers(count: number): AIPlayerTraits[] {
  const shuffled = [...AI_PLAYER_TRAITS].sort(() => Math.random() - 0.5);
  const out: AIPlayerTraits[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ ...shuffled[i % shuffled.length], isDynamic: false });
  }
  return out;
}

/**
 * Generate a new AI player personality using LLM.
 * Call this when you want a truly unique character.
 * 
 * Note: This requires an API call. Use sparingly (e.g., 10-20% of players).
 */
export async function generateDynamicTraits(name: string, role?: string): Promise<AIPlayerTraits> {
  // TODO: Call LLM to generate personality + background
  // For now, return a placeholder that indicates it's dynamic
  // Example prompt: "Create a unique personality and background for a social deduction game player named {name}, role: {role}"
  
  // Placeholder - replace with actual LLM call
  return {
    personality: `Unique personality for ${name}.`,
    background: `Dynamic background generated for ${name}.`,
    isDynamic: true,
  };
}

/**
 * Hybrid selection: Mostly fixed pool, occasionally generate new.
 * @param count Number of players needed
 * @param dynamicRatio 0-1, probability each player is dynamically generated (default 0.1 = 10%)
 */
export async function pickTraitsHybrid(
  count: number,
  dynamicRatio: number = 0.1
): Promise<AIPlayerTraits[]> {
  const out: AIPlayerTraits[] = [];
  const fixedPool = [...AI_PLAYER_TRAITS].sort(() => Math.random() - 0.5);
  let fixedIndex = 0;

  for (let i = 0; i < count; i++) {
    const shouldGenerate = Math.random() < dynamicRatio;
    
    if (shouldGenerate) {
      // Generate dynamic (requires async - for now, fallback to fixed)
      // In production, call generateDynamicTraits(name, role)
      const dynamic = await generateDynamicTraits(`Player${i + 1}`);
      out.push(dynamic);
    } else {
      // Use fixed pool
      out.push({ ...fixedPool[fixedIndex % fixedPool.length], isDynamic: false });
      fixedIndex++;
    }
  }

  return out;
}
