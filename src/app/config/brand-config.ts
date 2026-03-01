// Brand configuration (landing, meta, etc.)
export const BRAND_CONFIG = {
  name: "textgame.ai",
  shortName: "TextGame",
  tagline: "Any game you can describe, you can play",
  description:
    "Describe any game idea in plain English. AI builds the rules, runs the session, and fills every seat.",

  logo: {
    square: "/logo.svg",
    horizontal: "/logo-horizontal.svg",
    favicon: "/favicon.svg",
  },

  colors: {
    primary: "#8B5CF6",
    secondary: "#6366F1",
    accent: "#A855F7",
  },

  url: "https://textgame.ai",
} as const;
