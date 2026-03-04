import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Blog — ${SITE_NAME}`,
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
    title: `Blog — ${SITE_NAME}`,
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

export default function BlogIndex() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
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
