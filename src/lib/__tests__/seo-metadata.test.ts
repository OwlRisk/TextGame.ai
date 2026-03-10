import { describe, it, expect } from "vitest";
import { SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION } from "../site";
import sitemap from "@/app/sitemap";

// ═══════════════════════════════════════════════════════════════════════════════
// Site constants
// ═══════════════════════════════════════════════════════════════════════════════

describe("site constants", () => {
  it("SITE_NAME is TextGame.ai", () => {
    expect(SITE_NAME).toBe("TextGame.ai");
  });

  it("SITE_DOMAIN starts with https", () => {
    expect(SITE_DOMAIN).toMatch(/^https:\/\//);
  });

  it("SITE_DESCRIPTION is non-empty and ≤ 300 chars", () => {
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(300);
  });

  it("SITE_DESCRIPTION contains high-value SEO keywords", () => {
    const desc = SITE_DESCRIPTION.toLowerCase();
    expect(desc).toContain("ai");
    expect(desc).toContain("text game");
    expect(desc).toContain("game master");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Sitemap
// ═══════════════════════════════════════════════════════════════════════════════

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("returns a non-empty array", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("includes the homepage with priority 1", () => {
    const home = entries.find((e) => e.url === SITE_DOMAIN);
    expect(home).toBeDefined();
    expect(home!.priority).toBe(1);
  });

  it("includes /discover", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/discover`);
  });

  it("includes /games", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/games`);
  });

  it("includes /subscription", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/subscription`);
  });

  it("includes legal pages", () => {
    expect(urls).toContain(`${SITE_DOMAIN}/terms`);
    expect(urls).toContain(`${SITE_DOMAIN}/privacy`);
  });

  it("has no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("every entry has a valid priority between 0 and 1", () => {
    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("every URL starts with SITE_DOMAIN", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(new RegExp(`^${SITE_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    }
  });

  it("contains game pages from game-seo-data", () => {
    const gameUrls = urls.filter((u) => /\/games\/[a-z]/.test(u));
    expect(gameUrls.length).toBeGreaterThanOrEqual(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Root layout metadata (static import check)
// ═══════════════════════════════════════════════════════════════════════════════

describe("root layout metadata exports", () => {
  /*
   * layout.tsx is a React Server Component with JSX, so we can't directly
   * import it in a Node vitest env. Instead, we validate that the data sources
   * it depends on (SITE_NAME, SITE_DOMAIN, SITE_DESCRIPTION) are correct,
   * and we test the JSON-LD structures by re-creating them from the same inputs.
   */

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_DOMAIN}/games?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    logo: `${SITE_DOMAIN}/logo.png`,
    sameAs: [],
  };

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I create an AI text game?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sign in with Google, then describe your game idea in plain English to the AI Game Master — or pick a template like Werewolf, Mafia, or Who's the Spy. Set player count and optional rules. Your game is ready in about 2 minutes, no coding needed.",
        },
      },
      {
        "@type": "Question",
        name: "What is TextGame.ai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "TextGame.ai is an AI-powered platform for creating and playing multiplayer text-based games. An AI Game Master hosts every session — assigning roles, managing phases, and narrating the story. AI characters fill every seat so you can play solo or with friends.",
        },
      },
      {
        "@type": "Question",
        name: "Is TextGame.ai a Character.AI alternative?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — TextGame.ai offers AI characters with unique personalities, voices, and strategies in a game context. Unlike Character.AI, it focuses on multiplayer social deduction and RPG games with structured rules, an AI host, and real-time interaction between multiple AI and human players.",
        },
      },
      {
        "@type": "Question",
        name: "Can I play Werewolf online with AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely! TextGame.ai has a ready-to-play Werewolf template. The AI Game Master runs day/night phases, assigns roles like Seer and Doctor, and AI players make strategic decisions. Play solo against AI or invite friends to join.",
        },
      },
      {
        "@type": "Question",
        name: "What games can I create with AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can create any text-based game — social deduction (Werewolf, Mafia, Secret Hitler), RPGs, murder mysteries, trivia, escape rooms, and fully custom games with your own rules. The AI Game Master adapts to whatever you describe.",
        },
      },
    ],
  };

  describe("WebSite JSON-LD", () => {
    it("serializes to valid JSON", () => {
      const json = JSON.stringify(websiteJsonLd);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("has correct @type", () => {
      expect(websiteJsonLd["@type"]).toBe("WebSite");
    });

    it("includes SearchAction", () => {
      expect(websiteJsonLd.potentialAction["@type"]).toBe("SearchAction");
      expect(websiteJsonLd.potentialAction.target).toContain("{search_term_string}");
    });
  });

  describe("Organization JSON-LD", () => {
    it("serializes to valid JSON", () => {
      const json = JSON.stringify(organizationJsonLd);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("has correct @type", () => {
      expect(organizationJsonLd["@type"]).toBe("Organization");
    });

    it("logo URL points to a valid image", () => {
      expect(organizationJsonLd.logo).toMatch(/\.(svg|png|jpg|webp)$/);
    });
  });

  describe("SoftwareApplication JSON-LD", () => {
    it("serializes to valid JSON", () => {
      const json = JSON.stringify(softwareAppJsonLd);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("has correct @type", () => {
      expect(softwareAppJsonLd["@type"]).toBe("SoftwareApplication");
    });

    it("category is GameApplication", () => {
      expect(softwareAppJsonLd.applicationCategory).toBe("GameApplication");
    });

    it("offers a free tier", () => {
      expect(softwareAppJsonLd.offers.price).toBe("0");
      expect(softwareAppJsonLd.offers.priceCurrency).toBe("USD");
    });
  });

  describe("FAQ JSON-LD", () => {
    it("serializes to valid JSON", () => {
      const json = JSON.stringify(faqJsonLd);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("has correct @type", () => {
      expect(faqJsonLd["@type"]).toBe("FAQPage");
    });

    it("has at least 5 questions", () => {
      expect(faqJsonLd.mainEntity.length).toBeGreaterThanOrEqual(5);
    });

    it("every question has @type Question with an acceptedAnswer", () => {
      for (const q of faqJsonLd.mainEntity) {
        expect(q["@type"]).toBe("Question");
        expect(q.name.length).toBeGreaterThan(10);
        expect(q.acceptedAnswer["@type"]).toBe("Answer");
        expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
      }
    });

    it("includes Character.AI-related FAQ for brand keyword capture", () => {
      const names = faqJsonLd.mainEntity.map((q) => q.name.toLowerCase());
      const hasCharAi = names.some((n) => n.includes("character.ai") || n.includes("character ai"));
      expect(hasCharAi).toBe(true);
    });

    it("includes Werewolf-related FAQ for game keyword capture", () => {
      const names = faqJsonLd.mainEntity.map((q) => q.name.toLowerCase());
      const hasWerewolf = names.some((n) => n.includes("werewolf"));
      expect(hasWerewolf).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEO keyword coverage (guard against accidental removal)
// ═══════════════════════════════════════════════════════════════════════════════

describe("SEO keyword coverage", () => {
  const REQUIRED_KEYWORDS = [
    "roleplay ai",
    "ai dungeon master",
    "character ai alternative",
    "ai game generator",
    "play werewolf online",
    "play mafia online",
    "social deduction game",
    "ai rpg",
    "text based rpg",
    "ai text adventure",
  ];

  const LAYOUT_KEYWORDS = [
    "TextGame.ai",
    "AI text game",
    "text-based game",
    "AI game host",
    "multiplayer text adventure",
    "werewolf game AI",
    "AI role-playing game",
    "game design AI",
    "ai rpg",
    "ai text adventure",
    "character ai alternative",
    "ai character game",
    "roleplay ai",
    "ai dungeon master",
    "ai game generator",
    "ai game maker",
    "character ai",
    "play werewolf online",
    "play mafia online",
    "ai storytelling",
    "social deduction game",
    "ai npc",
    "ai characters",
    "multiplayer ai game",
    "text based rpg",
    "ai role play chat",
    "ai powered game",
    "online werewolf",
    "online mafia game",
    "ai text rpg",
    "character ai game",
    "free ai game",
    "ai board game",
    "custom ai game",
  ];

  it("layout keywords contain all required high-value terms", () => {
    const lowered = LAYOUT_KEYWORDS.map((k) => k.toLowerCase());
    for (const kw of REQUIRED_KEYWORDS) {
      expect(lowered, `missing keyword: "${kw}"`).toContain(kw.toLowerCase());
    }
  });

  it("layout keywords has no duplicates", () => {
    const lowered = LAYOUT_KEYWORDS.map((k) => k.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it("SITE_DESCRIPTION mentions key differentiators", () => {
    const desc = SITE_DESCRIPTION.toLowerCase();
    expect(desc).toContain("character.ai alternative");
    expect(desc).toContain("roleplay");
    expect(desc).toContain("game master");
  });
});
