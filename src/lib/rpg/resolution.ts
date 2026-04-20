/**
 * RPG action-resolution rules — the SINGLE SOURCE OF TRUTH for combat math.
 *
 * Three places previously embedded their own d20 description:
 *   - `host-prompt-builder.ts` (RPG director prompt)
 *   - `templates/rpg-dungeon.ts` (defaultRules + mechanicsPrompt)
 *
 * Drift between them produced bugs where the GM would narrate "rolls a 17"
 * one round and "ATK overpowers DEF" the next. All three now reference
 * `RPG_RESOLUTION_RULES` so changes propagate.
 *
 * Calibration: stat modifiers are intentionally small (typically 1-6) so a
 * d20 + stat sits in the 7-26 range. The hit threshold (11+) gives:
 *   - Lv1 character (mod ~+2): 60% hit rate.
 *   - Lv5 character (mod ~+5): 75% hit rate.
 *   - Lv10 character (mod ~+8): 90% hit rate (capped — see below).
 * The "modified roll capped at 25" rule keeps high-level characters from
 * trivially auto-hitting and preserves miss drama all the way through.
 */

export const RPG_RESOLUTION_RULES = `COMBAT (single resolution model — DO NOT mix systems):
- When enemies appear, output COMBAT_START in directives with enemy data.
- Each round: describe the battlefield, then let each party member choose an action.
- RESOLUTION: roll a virtual d20 + the character's relevant stat modifier:
    - melee → ATK modifier
    - spells → INT modifier
    - ranged / sneak → DEX modifier
  Stat modifier = floor(stat / 4) — for typical stats this gives +1 to +6.
  Modified roll is CAPPED AT 25, so even high-stat characters can miss on a low roll.
- HIT/MISS: 11+ on the modified roll = hit. Natural 20 = critical (max damage + flavour).
- DAMAGE: base weapon/spell damage scaled by how far above 11 the roll landed (12–14: light, 15–18: solid, 19+: strong, crit: max). DEF reduces incoming damage flat (DEF / 2, min 1).
- SPEED: highest speed acts first if turn order matters.
- Pick this approach and stick with it the whole game — never mix narrative ATK-vs-DEF math into the same combat.
- After each action, output PLAYER_UPDATE for HP/MP changes; COMBAT_END after the last enemy falls.
- Death: HP=0 = unconscious (revivable). Total party wipe → see ## DEATH AND REVIVAL.`;

/**
 * Player-facing summary — shown in defaultRules / template rule panels.
 * Shorter and non-prescriptive (no "DO NOT mix systems" warning intended for
 * the GM model).
 */
export const RPG_RESOLUTION_RULES_PLAYER_FACING = `Combat is turn-based. Each action rolls a virtual d20 + the character's relevant stat modifier (ATK / INT / DEX). 11+ on the modified roll = hit; the higher the roll, the better the result. DEF reduces incoming damage. A character at 0 HP is knocked out and can be revived; the party only loses if EVERYONE is down at once.`;
