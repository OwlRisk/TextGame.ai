// Brand configuration (landing, meta, etc.)
export const BRAND_CONFIG = {
  name: "TextGame.ai",
  shortName: "TextGame",
  tagline: "Any game you can describe, you can play",
  description:
    "Describe any game idea in plain English. AI builds the rules, runs the session, and fills every seat.",

  logo: {
    square: "/logo.png",
    horizontal: "/logo-horizontal.svg",
    favicon: "/favicon.ico",
  },

  colors: {
    primary: "#8B5CF6",
    secondary: "#6366F1",
    accent: "#A855F7",
  },

  url: "https://textgame.ai",
} as const;
