import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, tips, and deep dives on AI murder mystery games, detective strategies, and how AI suspects work.",
  keywords: [
    "AI murder mystery guide",
    "detective game tips",
    "AI suspect interrogation",
    "murder mystery blog",
    "script kill guide",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog · ${SITE_NAME}`,
    description: "Guides, tips, and deep dives on AI murder mystery games and detective strategies.",
    type: "website",
    url: `${SITE_DOMAIN}/blog`,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: `Blog · ${SITE_NAME}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog · ${SITE_NAME}`,
    description: "Guides, tips, and deep dives on AI murder mystery games and detective strategies.",
    images: ["/hero.webp"],
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

// Only murder-mystery-relevant posts are shown in the index.
// All blog page files are preserved (URLs still work) — just not listed here.
const posts: BlogPost[] = [
  {
    slug: "ai-murder-mystery-games",
    title: "AI Murder Mystery Games — Host a Virtual Whodunit Online",
    excerpt: "Host an AI-powered murder mystery game online. No prep, no moderator — the AI runs the clues, suspects, and reveals.",
    date: "March 4, 2026",
    readTime: "7 min read",
    tags: ["Murder Mystery", "Guide"],
  },
  {
    slug: "play-murder-mystery-alone",
    title: "Play Murder Mystery Alone — AI Solo Detective Games",
    excerpt: "How to play a murder mystery game solo with AI suspects. Interrogate, collect evidence, and solve the case by yourself.",
    date: "March 5, 2026",
    readTime: "6 min read",
    tags: ["Murder Mystery", "Solo"],
  },
  {
    slug: "how-textgame-ai-works",
    title: "How TextGame.ai Works — Inside the AI Game Master",
    excerpt: "A look inside TextGame.ai's AI Game Master — how it runs investigations, plays suspects, and reacts to your questions.",
    date: "March 6, 2026",
    readTime: "7 min read",
    tags: ["Product", "AI Game Master"],
  },
  {
    slug: "ai-npc-explained",
    title: "AI NPCs Explained — How AI Suspects Think and React",
    excerpt: "How AI characters form personalities, maintain secrets, and react dynamically to your interrogation. The tech behind smart game NPCs.",
    date: "March 4, 2026",
    readTime: "6 min read",
    tags: ["AI Characters", "Deep Dive"],
  },
  {
    slug: "ai-game-master-guide",
    title: "What Is an AI Game Master? Everything You Need to Know",
    excerpt: "How an AI Game Master hosts murder mystery sessions — assigning roles, revealing evidence, tracking your progress, and scoring your detective work.",
    date: "March 4, 2026",
    readTime: "5 min read",
    tags: ["AI Game Master", "Guide"],
  },
  {
    slug: "ai-game-design-guide",
    title: "How to Design AI-Powered Mystery Games",
    excerpt: "A guide to designing murder mystery cases for AI. How to create suspects, plant evidence, write breakpoints, and build compelling investigations.",
    date: "March 5, 2026",
    readTime: "8 min read",
    tags: ["Game Design", "Guide"],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `Blog — ${SITE_NAME}`,
  description:
    "Guides, tips, and deep dives on AI murder mystery games, detective strategies, and how AI suspects work.",
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
        Guides and deep dives on AI murder mystery games.
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
