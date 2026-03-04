import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, comparisons, and tips on AI-powered text games, social deduction, roleplay AI, and multiplayer gaming with AI characters.",
  keywords: [
    "ai game blog",
    "roleplay ai guide",
    "character ai alternative",
    "social deduction games",
    "ai text game tips",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog · ${SITE_NAME}`,
    description: "Guides, comparisons, and tips on AI-powered text games and multiplayer gaming with AI characters.",
    type: "website",
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
}

const posts: BlogPost[] = [
  {
    slug: "chai-ai-alternatives",
    title: "7 Best Chai AI Alternatives for AI Chat & Roleplay (2026)",
    excerpt:
      "Chai AI is popular for 1-on-1 chat, but lacks multiplayer games. Compare 7 alternatives — from textgame.ai's multiplayer AI games to Character.AI, Talkie, and more.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Comparison", "AI Chat"],
  },
  {
    slug: "textgame-vs-novel-ai",
    title: "textgame.ai vs Novel AI — AI Gaming vs AI Writing (2026)",
    excerpt:
      "Comparing textgame.ai and Novel AI: multiplayer AI games vs premium AI writing. Find out which platform fits your creative needs.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Comparison", "AI Games"],
  },
  {
    slug: "ai-changing-board-games",
    title: "How AI is Changing Board Games and Tabletop RPGs (2026)",
    excerpt:
      "From AI Game Masters to dynamic NPCs — how artificial intelligence is transforming board games, tabletop RPGs, and the way we play together.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Editorial", "AI Games", "Tabletop"],
  },
  {
    slug: "polybuzz-ai-alternatives",
    title: "7 Best PolyBuzz Alternatives for AI Chat & Roleplay (2026)",
    excerpt:
      "Looking for PolyBuzz alternatives? Compare 7 AI chat platforms for roleplay and multiplayer games — including options with voice, game mechanics, and free tiers.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Comparison", "AI Chat"],
  },
  {
    slug: "talkie-ai-alternatives",
    title: "7 Best Talkie AI Alternatives — AI Chat & Character Apps (2026)",
    excerpt:
      "Explore the best Talkie AI alternatives for AI character chat, roleplay, and multiplayer games. Compare features, voice, pricing, and find your fit.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Comparison", "AI Chat"],
  },
  {
    slug: "best-ai-chat-sites",
    title: "10 Best AI Chat Sites for Roleplay & Games (2026)",
    excerpt:
      "The ultimate guide to AI chat platforms — Character.AI, PolyBuzz, Talkie AI, Janitor AI, and more. Compare features, pricing, and find the best AI chat site.",
    date: "March 4, 2026",
    readTime: "10 min read",
    tags: ["Listicle", "AI Chat"],
  },
  {
    slug: "perchance-ai-alternatives",
    title: "5 Best Perchance AI Alternatives for Chat & Roleplay (2026)",
    excerpt:
      "Looking for Perchance alternatives? Compare 5 AI roleplay platforms with better multiplayer, voice, and game features.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Comparison", "AI Roleplay"],
  },
  {
    slug: "chat-with-ai-characters",
    title: "Chat with AI Characters — Free, No Sign Up Required",
    excerpt:
      "Chat with AI characters for free — no sign up, no download. Discover the best platforms for AI character conversations, roleplay, and multiplayer games.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Guide", "AI Characters"],
  },
  {
    slug: "talk-to-ai-characters",
    title: "Talk to AI Characters Online — Free AI Companions & Game Partners",
    excerpt:
      "Talk to AI characters with voice and text — play games, roleplay, or just chat. Discover the best free platforms for AI companions and game partners.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Guide", "AI Characters"],
  },
  {
    slug: "ourdream-ai-alternatives",
    title: "5 Best OurDream AI Alternatives for AI Chat & Roleplay (2026)",
    excerpt:
      "Looking for OurDream AI alternatives? Compare 5 AI chat platforms for character roleplay, multiplayer games, and voice interactions.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Comparison", "AI Chat"],
  },
  {
    slug: "wsup-ai-alternatives",
    title: "5 Best Wsup AI Alternatives for AI Chat & Characters (2026)",
    excerpt:
      "Explore the best Wsup AI alternatives for AI character chat and roleplay. Compare platforms with multiplayer, voice, and game features.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Comparison", "AI Chat"],
  },
  {
    slug: "text-based-games-comeback",
    title: "Text-Based Games Are Back — Why AI Makes Them Better Than Ever",
    excerpt:
      "From Zork to AI-powered narratives — how LLMs are reviving text adventures with unlimited stories, multiplayer, and accessibility for everyone.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Editorial", "AI Games"],
  },
  {
    slug: "ai-npc-explained",
    title: "AI NPCs Explained: How AI Characters Make Games Better",
    excerpt:
      "What are AI NPCs, how do they differ from scripted characters, and why are they transforming gaming? Explore the tech behind AI game characters.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Guide", "AI Characters"],
  },
  {
    slug: "textgame-vs-janitor-ai",
    title: "textgame.ai vs Janitor AI — Which AI Roleplay Platform is Better?",
    excerpt:
      "Comparing textgame.ai and Janitor AI: multiplayer games vs character chat, structured rules vs freeform roleplay. Find which platform fits your needs.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Comparison", "AI Roleplay"],
  },
  {
    slug: "among-us-alternatives",
    title: "10 Best Among Us Alternatives — Social Deduction Games Online (2026)",
    excerpt:
      "Love Among Us? Try these 10 social deduction games online — Werewolf, Mafia, Secret Hitler, Avalon, Spyfall, and more. Many with AI players.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Listicle", "Social Deduction"],
  },
  {
    slug: "ai-trivia-games",
    title: "Best AI Trivia Games Online — Play Free with Friends (2026)",
    excerpt:
      "Discover AI-powered trivia games with unlimited questions, adaptive difficulty, and multiplayer. Compare with Kahoot, Trivia Crack, and more.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Trivia", "Listicle"],
  },
  {
    slug: "ai-tarot-reading",
    title: "AI Tarot Reading — Get a Free Online Tarot Card Reading",
    excerpt:
      "Get a free AI tarot card reading online. Learn how AI interprets tarot cards, explore major arcana meanings, reading types, and try an interactive AI tarot experience.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Tarot", "Guide"],
  },
  {
    slug: "host-game-night-online",
    title: "How to Host a Virtual Game Night — Complete Guide (2026)",
    excerpt:
      "Everything you need to host an amazing virtual game night — choosing games, inviting friends, tech setup, icebreakers, and how AI simplifies hosting for any group size.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Guide", "Game Night"],
  },
  {
    slug: "ai-dungeon-alternatives",
    title: "7 Best AI Dungeon Alternatives in 2026 — Free & Multiplayer",
    excerpt:
      "Comparing the best AI Dungeon alternatives in 2026 — from multiplayer AI games to open-source text adventures. Find free options with better stories and multiplayer support.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Comparison", "AI Games"],
  },
  {
    slug: "resistance-vs-avalon",
    title: "The Resistance vs Avalon — Rules, Differences & How to Play Online",
    excerpt:
      "Compare The Resistance and Avalon: rules, roles like Merlin, key differences, which to choose for your group, and how to play both online for free with AI.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Comparison", "Social Deduction"],
  },
  {
    slug: "free-online-games-with-friends",
    title: "20 Best Free Online Games to Play with Friends — No Download (2026)",
    excerpt:
      "The ultimate list of free online multiplayer games — social deduction, word games, trivia, escape rooms, storytelling, and more. No download needed.",
    date: "March 4, 2026",
    readTime: "10 min read",
    tags: ["Listicle", "Multiplayer", "Free Games"],
  },
  {
    slug: "ai-murder-mystery-games",
    title: "AI Murder Mystery Games — Host a Virtual Whodunit Online",
    excerpt:
      "Host an AI-powered murder mystery game online. No prep, no moderator — the AI runs the clues, suspects, and reveals. Perfect for parties and team events.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Murder Mystery", "Guide"],
  },
  {
    slug: "ai-text-adventure-games",
    title: "Best AI Text Adventure Games in 2026 — Play Free Online",
    excerpt:
      "The best AI-powered text adventure games you can play right now — from AI Dungeon to multiplayer story games. Compare platforms and find your next adventure.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Listicle", "Text Adventure"],
  },
  {
    slug: "play-dnd-with-ai",
    title: "How to Play D&D with AI — Solo or Multiplayer (2026 Guide)",
    excerpt:
      "Use AI as your Dungeon Master for D&D-style RPGs. Play solo or with friends — create characters, run campaigns, and explore worlds with an AI DM.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Guide", "D&D", "RPG"],
  },
  {
    slug: "play-avalon-online",
    title: "Play Avalon Online with AI — Rules, Roles & Strategy Guide",
    excerpt:
      "Learn the rules of Avalon, every role explained (Merlin, Assassin, Percival, Morgana), quest mechanics, strategy tips, and how to play online with AI.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Avalon", "How to Play"],
  },
  {
    slug: "play-codenames-online",
    title: "Play Codenames Online with AI — Rules, Tips & Free Game",
    excerpt:
      "Learn the rules of Codenames, Spymaster vs Operative strategy, how to give and guess clues, and play online for free with an AI partner.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Codenames", "How to Play"],
  },
  {
    slug: "play-spyfall-online",
    title: "Play Spyfall Online Free — Rules, Tips & AI-Hosted Game",
    excerpt:
      "Learn the rules of Spyfall, how locations work, spy vs regular player dynamics, question strategy, and play online with an AI host for free.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Spyfall", "How to Play"],
  },
  {
    slug: "play-clue-online",
    title: "Play Clue (Cluedo) Online with AI — Rules, Characters & Free Game",
    excerpt:
      "Learn the rules of Clue/Cluedo, all characters and weapons, deduction strategy, and play online for free with an AI Game Master.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Clue", "How to Play"],
  },
  {
    slug: "play-undercover-online",
    title: "Play Who's the Spy (Undercover) Online — Rules & Strategy",
    excerpt:
      "Learn the rules of Who's the Spy (Undercover / 谁是卧底), role strategy for Civilian, Undercover, and Mr. White, and play online with AI.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Undercover", "How to Play"],
  },
  {
    slug: "play-escape-room-online",
    title: "Play Escape Room Games Online — Free AI-Powered Puzzles",
    excerpt:
      "Play virtual escape rooms powered by AI — solve puzzles, crack codes, and escape before time runs out. Free, no download, with an AI host.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Escape Room", "Guide"],
  },
  {
    slug: "play-mafia-online",
    title: "Play Mafia Online: Free AI-Powered Game for 3-15 Players",
    excerpt:
      "Learn the rules of Mafia, every role explained, and how to play online for free with an AI host. Mafia vs Werewolf differences, strategy tips, and more.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Mafia", "How to Play"],
  },
  {
    slug: "create-game-with-ai",
    title: "How to Create Your Own AI Game — No Coding Required",
    excerpt:
      "Step-by-step guide to creating custom AI-powered games. Describe your idea in plain English and the AI builds the rules, roles, and gameplay for you.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Tutorial", "Game Design"],
  },
  {
    slug: "ai-dungeon-vs-textgame",
    title: "AI Dungeon vs textgame.ai — Which AI Game Platform is Right for You?",
    excerpt:
      "Comparing AI Dungeon and textgame.ai: solo adventures vs multiplayer games, freeform vs structured rules. Find out which platform fits your play style.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Comparison", "AI Games"],
  },
  {
    slug: "ai-storytelling-games",
    title: "AI Storytelling Games: Let AI Write Your Adventure",
    excerpt:
      "Discover AI storytelling games where AI generates narrative in response to your choices. Compare platforms, explore types of AI narrative games, and find the best experience.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Guide", "Storytelling"],
  },
  {
    slug: "ai-game-master-guide",
    title: "What is an AI Game Master? How AI Hosts Tabletop Games",
    excerpt:
      "Learn what an AI Game Master is, how it automates hosting tabletop games like Werewolf and D&D, assigns roles, manages phases, and narrates — plus how it compares to human GMs.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Guide", "AI Game Master"],
  },
  {
    slug: "best-social-deduction-games",
    title: "10 Best Social Deduction Games You Can Play Online in 2026",
    excerpt:
      "From Werewolf to Secret Hitler — the best social deduction games you can play online with friends or AI. Includes free options and AI-powered alternatives.",
    date: "March 4, 2026",
    readTime: "10 min read",
    tags: ["Listicle", "Social Deduction", "Online Games"],
  },
  {
    slug: "best-online-party-games",
    title: "15 Best Online Party Games for Groups — Free, No Download (2026)",
    excerpt:
      "The best online party games you can play with friends — social deduction, word games, trivia, bluffing, and storytelling. Free, no download, many with AI hosts.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Listicle", "Party Games"],
  },
  {
    slug: "virtual-team-building-games",
    title: "Virtual Team Building Games with AI — Fun Ideas for Remote Teams",
    excerpt:
      "Discover AI-powered team building games for remote teams — Werewolf, Murder Mystery, Trivia, and more. No moderator needed. Build connection and morale from anywhere.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Team Building", "Remote Work"],
  },
  {
    slug: "best-single-player-ai-games",
    title: "Best Single Player Games with AI Companions (2026)",
    excerpt:
      "Play games alone with AI — solo Werewolf, Murder Mystery, AI Dungeon, and more. No friends online? AI fills every seat. Available 24/7, adapts to you.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Listicle", "Solo Gaming"],
  },
  {
    slug: "play-board-games-online-ai",
    title: "Play Board Games Online with AI Players — No Friends Needed",
    excerpt:
      "Play board game-style games online with AI — Werewolf, Mafia, Avalon, Secret Hitler, and more. AI fills seats, AI hosts. Start anytime, no downloads.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["Guide", "Board Games"],
  },
  {
    slug: "play-secret-hitler-online",
    title: "Play Secret Hitler Online with AI — Rules, Strategy & Free Game",
    excerpt:
      "Learn the rules of Secret Hitler, every role explained, winning strategies, and how to play online for free with an AI Game Master. Liberals vs Fascists — no moderator needed.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Secret Hitler", "How to Play"],
  },
  {
    slug: "play-werewolf-online",
    title: "How to Play Werewolf Online with AI — Rules, Roles & Free Game",
    excerpt:
      "Learn the complete rules of Werewolf, every role explained, winning strategies for both teams, and how to play online for free with an AI Game Master.",
    date: "March 4, 2026",
    readTime: "9 min read",
    tags: ["Werewolf", "How to Play", "Strategy"],
  },
  {
    slug: "roleplay-ai-guide",
    title: "What is Roleplay AI? The Complete Guide to AI Role-Playing Games (2026)",
    excerpt:
      "Learn what roleplay AI is, how it works, and the best platforms for AI-powered role-playing games — from social deduction to custom RPGs with AI characters.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Guide", "AI Characters", "Roleplay"],
  },
  {
    slug: "character-ai-alternatives",
    title: "5 Best Character.AI Alternatives for Multiplayer Games (2026)",
    excerpt:
      "Looking for AI characters you can actually play games with? We compare the top Character.AI alternatives for social deduction, RPGs, and multiplayer roleplay.",
    date: "March 4, 2026",
    readTime: "8 min read",
    tags: ["Comparison", "AI Characters", "Multiplayer"],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `Blog — ${SITE_NAME}`,
  description:
    "Guides, comparisons, and tips on AI-powered text games, social deduction, roleplay AI, and multiplayer gaming with AI characters.",
  url: `${SITE_DOMAIN}/blog`,
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_DOMAIN },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_DOMAIN}/blog/${post.slug}`,
      name: post.title,
    })),
  },
};

export default function BlogIndex() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-4xl font-black text-white mb-3">Blog</h1>
      <p className="text-lg text-zinc-400 mb-12">
        Guides, comparisons, and ideas for AI-powered multiplayer games.
      </p>

      <div className="space-y-8">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/40 rounded-2xl p-6 sm:p-8 transition-all duration-300"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-violet-400 transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
