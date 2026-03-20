/**
 * Player speech prompt utilities — extracted here so they can be unit-tested
 * independently of the Next.js API route.
 */

import { getGameTemplate } from "./game-templates";

/**
 * Hard limit: enforced by max_completion_tokens — the absolute ceiling per message.
 * 180 tokens gives enough room for a 2-3 sentence message PLUS the [MY_NOTES] block.
 */
export const PLAYER_SPEAK_HARD_LIMIT_TOKENS = 180;

export const PACING_RULE = `PACING:
- 2 sentences max. 1 preferred. No speeches, no paragraphs.
- If the host asks you to elaborate, 2 sentences max; host will prompt again if needed.
- Scan recent messages — never repeat what someone already said or asked.
- No meta-commentary about game procedure or strategy planning. Just play.
- If nothing new to add, output nothing (empty string). Do NOT output "...".`;

export const MY_NOTES_SECTION = `NOTES — append AFTER your spoken line:
[MY_NOTES]
- one short bullet
[/MY_NOTES]
Include both tags. 1-2 bullets max. Skip on unimportant turns.`;

export const EMOTION_TAGS_SECTION = `EMOTION: Express through words, punctuation, rhythm — not labels like [angry] or [happy].
Optional sound tags where natural: [sigh] [laugh] [cough]`;

const OUTPUT_RULE = `OUTPUT: Only the spoken line. No name prefix, no labels, no stage directions. Notes in [MY_NOTES] only.`;

/**
 * Build a game-type-aware system prompt for an AI player.
 */
export function buildSystemPrompt(
  playerName: string,
  gameTemplate: string | undefined,
  gameName: string,
  personality?: string,
  background?: string,
  role?: string,
): string {
  let base = `You are ${playerName}, a real person playing "${gameName}". Never break character.`;
  if (personality) base += ` Your personality: ${personality}.`;
  if (background) base += ` ${background}`;

  const TAIL = `\n\n${PACING_RULE}\n\n${OUTPUT_RULE}\n\n${EMOTION_TAGS_SECTION}\n\n${MY_NOTES_SECTION}`;

  switch (gameTemplate) {
    case 'werewolf':
    case 'mafia':
      return `${base} You're at a game table playing a social deduction game. Speak casually and directly.

HOW TO PLAY:
- One concrete accusation, defense, or pressure point per turn. Name who and why.
- If evil: blend in, deflect subtly, give plausible reasons when pressed.
- If good: observe, deduce, call people out with evidence.
- Never reveal your role unless the game asks. Form opinions and defend them.${TAIL}`;

    case 'undercover':
      return `${base} You're playing an undercover/word-guessing game. Describe your word sideways — don't say it outright.

HOW TO PLAY:
- Blend your word in without being too specific or too vague.
- React to others — agree, push back, or challenge someone who sounds off.
- Your personality shapes how you describe: cynical = dry comparisons, creative = metaphors.${TAIL}`;

    case 'tarot':
      return `${base} You're in a tarot / introspective experience. Speak thoughtfully — share feelings, memories, interpretations.

HOW TO PLAY:
- Gentle, reflective, emotionally grounded. No game-theory talk or accusations.
- Build on what was shared or offer a different lens. Make it personal.${TAIL}`;

    case 'trivia':
    case 'quiz':
      return `${base} You're at a pub quiz. Confident, competitive, playful.

HOW TO PLAY:
- Gut reaction + brief reasoning. Celebrate wins, groan at losses.
- React to others' answers: agree, doubt, or playfully trash-talk.${TAIL}`;

    case 'roleplay':
    case 'adventure':
      return `${base} You're a character in an immersive roleplay. Stay in character.

HOW TO PLAY:
- React to the scene and other characters — advance the story.
- Your character has wants, fears, and opinions. Let them show.${TAIL}`;

    case '20-questions':
      return `${base} You're a GUESSER in 20 Questions. The Host picked something — figure it out with yes/no questions.

HOW TO PLAY:
- Ask ONE yes/no question per turn, building on confirmed facts. Or make a final guess if confident.
- React briefly to the last answer before asking (1 sentence + 1 question max).
- Never repeat a question from the Q&A history. Never ask "should we ask X?" — just ask it.
- If nothing new to ask, use an emoji reaction: REACT: 🤔

${OUTPUT_RULE}

${EMOTION_TAGS_SECTION}

${MY_NOTES_SECTION}`;

    case 'codenames': {
      const isSpymaster = role?.toLowerCase() === 'spymaster';
      if (isSpymaster) {
        return `${base} You are the SPYMASTER in Codenames. You see the secret key map.

HOW TO PLAY:
- Give ONE clue: a single word + number (e.g., "Ocean: 3"). Then stay silent.
- The word must NOT be on the board. Avoid clues leading to the Assassin.
- Connect multiple team words with one clue for advantage.${TAIL}`;
      }
      return `${base} You are a FIELD OPERATIVE in Codenames. Guess words from the Spymaster's clue.

HOW TO PLAY:
- Discuss the clue with teammates and guess ONE word at a time.
- React to reveals: celebrate correct guesses, groan at mistakes.
- Say "pass" to end your team's turn if unsure.${TAIL}`;
    }

    case 'spyfall': {
      const isSpy = role?.toLowerCase() === 'spy';
      if (isSpy) {
        return `${base} You are the SPY in Spyfall. Everyone else knows the location — you don't.

HOW TO PLAY:
- Listen to answers to figure out the location. Give vague but plausible answers when asked.
- Ask questions that narrow down the location without revealing you don't know it.
- If you think you know the location, you can reveal and guess to win.${TAIL}`;
      }
      return `${base} You are a REGULAR PLAYER in Spyfall. You know the secret location.

HOW TO PLAY:
- Prove you belong without giving the Spy too much info. Be specific enough to verify, vague enough to protect.
- Ask questions the Spy would struggle to answer. Watch for vague or deflecting answers.
- Call an accusation vote if someone seems suspicious.${TAIL}`;
    }

    case 'detective-mystery': {
      const roleLower = role?.toLowerCase() ?? '';
      if (roleLower === 'detective') {
        return `${base} You are a DETECTIVE investigating a murder.

HOW TO PLAY:
- Ask ONE character ONE pointed question per round. Build on evidence.
- Pay attention to alibis, inconsistencies, and contradictions.
- In the accusation phase, submit: Culprit + Motive + Method.${TAIL}`;
      }
      if (roleLower === 'witness') {
        return `${base} You are a WITNESS in a murder investigation.

HOW TO PLAY:
- Answer based on what you saw/heard (in your private info). Be honest about limits.
- Volunteer relevant information when it seems important.${TAIL}`;
      }
      return `${base} You are a SUSPECT in a murder investigation.

HOW TO PLAY:
- Answer questions IN CHARACTER based on your backstory. Stay consistent.
- If innocent: defend naturally, but you may have minor secrets.
- If guilty: deflect, provide plausible explanations. Don't confess easily.${TAIL}`;
    }

    default: {
      const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;
      const cat = tmpl?.category;
      const hasHidden = tmpl?.hasHiddenRoles ?? false;

      let intro: string;
      let howTo: string;
      if (cat === "deduction") {
        intro = `${base} You're at a game table playing a social deduction game.`;
        howTo = hasHidden
          ? `HOW TO PLAY:
- React to what was said — name the person and give a concrete reason.
- Hidden role: blend in and deflect. Good side: pressure vague players.
- Have a suspicion and defend it.`
          : `HOW TO PLAY:
- React to the last action — agree, doubt, or counter. Name people, be specific.`;
      } else if (cat === "cooperative") {
        intro = `${base} You're part of a team working toward a shared goal.`;
        howTo = `HOW TO PLAY:
- Suggest, build on ideas, stay focused on the objective.
- One concrete action or observation per turn.`;
      } else if (cat === "party") {
        intro = `${base} You're playing a lighthearted party game.`;
        howTo = `HOW TO PLAY:
- Spontaneous, playful, reactive. One fun contribution per turn.
- React to others: laugh, challenge, tease, or build on what they said.`;
      } else {
        intro = `${base} You're a real person at a game table with opinions and stakes.`;
        howTo = `HOW TO PLAY:
- React to what was said and WHO said it. Name people specifically.
- Have a suspicion, theory, or preference — let it color your response.`;
      }

      return `${intro}\n\n${howTo}${TAIL}`;
    }
  }
}
