import { withDefaults } from "./types";

export const custom = withDefaults({
  id: "custom",
  name: "Custom Game",
  description: "Create your own game with custom rules and roles.",
  minPlayers: 2,
  maxPlayers: 20,
  recommendedAICount: 4,
  hasHiddenRoles: false,
  hasElimination: false,
  pacing: { progressionThreshold: 6, maxRounds: 20, hint: "Creative freedom, but no dead air. Drop a hook if momentum fades." },
  category: "open",
  icon: "✨",
  color: "from-violet-600 to-fuchsia-600",
  estimatedTime: "Varies",
  roles: [],

  mechanicsPrompt: "This is a custom game. Follow whatever rules the players have defined. If no rules are set, ask players what kind of game they'd like to play and adapt accordingly. Use NEXT_SPEAKER to manage turn order.",

  playerPrompts: {
    default:
      "You are a player in a custom game. Follow the rules set by the host, stay in character, and contribute to the experience. Adapt to whatever format the game takes — be creative, cooperative, and engaged.",
  },

  quickActions: [
    { label: "Continue", template: "Let's keep going — ", icon: "▶️" },
    {
      label: "Respond",
      template: "@{player} ",
      icon: "💬",
      needsTarget: true,
    },
    { label: "React", template: "That's ", icon: "😮" },
  ],

  defaultRules: "A free-form game — define your own rules, roles, and objectives. The host will adapt to whatever you create.",
});
