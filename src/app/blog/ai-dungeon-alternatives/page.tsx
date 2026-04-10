import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "7 Best AI Dungeon Alternatives in 2026 — Free & Multiplayer";
const DESCRIPTION =
  "Comparing the best AI Dungeon alternatives in 2026 — from multiplayer AI games to open-source text adventures. Find free options with better stories, fewer filters, and multiplayer support.";
const CANONICAL = "/blog/ai-dungeon-alternatives";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai dungeon alternative",
    "ai dungeon alternatives 2026",
    "games like ai dungeon",
    "ai dungeon free alternative",
    "best ai game",
    "ai text adventure",
    "novel ai vs ai dungeon",
    "koboldai",
    "multiplayer ai game",
    "ai rpg",
    "apps like ai dungeon",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-ai-dungeon-alternatives.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-ai-dungeon-alternatives.png"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN },
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` } },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

function AltCard({ rank, name, tagline, pros, cons }: { rank: number; name: string; tagline: string; pros: string[]; cons: string[] }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">{rank}</span>
        <div>
          <p className="font-bold text-white text-lg">{name}</p>
          <p className="text-sm text-zinc-400">{tagline}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-emerald-400 font-semibold mb-1">Strengths</p>
          <ul className="space-y-1 text-zinc-300">{pros.map((p, i) => <li key={i}>✓ {p}</li>)}</ul>
        </div>
        <div>
          <p className="text-red-400 font-semibold mb-1">Weaknesses</p>
          <ul className="space-y-1 text-zinc-300">{cons.map((c, i) => <li key={i}>✗ {c}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

export default function AiDungeonAlternativesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI Dungeon Alternatives</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">AI Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            AI Dungeon pioneered AI-generated text adventures, but it&apos;s no longer the only option.
            Whether you want better writing, multiplayer support, fewer content filters, or open-source
            freedom — here are the 7 best alternatives in 2026.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-ai-dungeon-alternatives.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "why-switch", label: "Why Look Beyond AI Dungeon?" },
              { id: "alternatives", label: "The 7 Best Alternatives" },
              { id: "comparison", label: "Feature Comparison Table" },
              { id: "choosing", label: "How to Choose" },
              { id: "play-online", label: "Play AI Games Online Now" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Why Switch ───────────────────────────────────────────── */}
        <H2 id="why-switch">Why Look Beyond AI Dungeon?</H2>
        <P>
          AI Dungeon was groundbreaking when it launched — the first mainstream AI text adventure.
          But since then, the landscape has evolved dramatically. Common reasons people look for
          alternatives include:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Content filters</strong> that interrupt immersive stories</li>
          <li><strong className="text-white">Subscription costs</strong> for premium models</li>
          <li><strong className="text-white">Solo-only gameplay</strong> — no way to play with friends</li>
          <li><strong className="text-white">Limited game structures</strong> — freeform only, no rules or win conditions</li>
          <li><strong className="text-white">Privacy concerns</strong> after past data handling issues</li>
        </ul>

        {/* ── Alternatives ─────────────────────────────────────────── */}
        <H2 id="alternatives">The 7 Best Alternatives</H2>

        <AltCard
          rank={1}
          name={`${SITE_NAME} (TextGame.ai)`}
          tagline="Multiplayer AI games with rules, roles & structure"
          pros={["Multiplayer with friends + AI players", "Structured games (Werewolf, Avalon, RPGs)", "AI Game Master runs everything", "Create custom games with natural language"]}
          cons={["Not freeform open-world like AI Dungeon", "Newer platform, smaller community"]}
        />
        <AltCard
          rank={2}
          name="NovelAI"
          tagline="Premium AI writing with fine-tuned storytelling models"
          pros={["Excellent prose quality", "Custom AI models trained on fiction", "Image generation included", "Strong privacy — encrypted stories"]}
          cons={["Paid only ($10–25/mo)", "Solo experience only", "No game mechanics or rules"]}
        />
        <AltCard
          rank={3}
          name="KoboldAI"
          tagline="Open-source AI text adventure you can self-host"
          pros={["Completely free and open source", "Run your own models locally", "No content filters", "Highly customizable"]}
          cons={["Requires technical setup", "Needs a powerful GPU for good models", "Solo only, no multiplayer"]}
        />
        <AltCard
          rank={4}
          name="Character.AI"
          tagline="Chat with AI characters in various personas"
          pros={["Massive character library", "Fast responses", "Free tier available", "Active community"]}
          cons={["Strict content filters", "1-on-1 chat only, no group games", "No game mechanics or structure"]}
        />
        <AltCard
          rank={5}
          name="SillyTavern"
          tagline="Frontend for multiple AI backends with rich customization"
          pros={["Connect to any AI model", "Character cards and lorebooks", "Active modding community", "Free and open source"]}
          cons={["Complex setup process", "Need your own AI API keys", "Solo roleplay only"]}
        />
        <AltCard
          rank={6}
          name="Dreamily"
          tagline="Co-writing AI stories with anime-inspired aesthetics"
          pros={["Free tier available", "Good for anime/fiction stories", "Simple mobile-friendly UI", "Collaborative writing mode"]}
          cons={["Smaller model capabilities", "Limited English content", "No multiplayer games"]}
        />
        <AltCard
          rank={7}
          name="AI Dungeon (Classic)"
          tagline="The original — still available with updated models"
          pros={["Pioneer of the genre", "Large existing community", "Multiple AI models", "Freeform open-world play"]}
          cons={["Free tier is very limited", "Content filters can be aggressive", "Solo only", "No structured game modes"]}
        />

        {/* ── Comparison ───────────────────────────────────────────── */}
        <H2 id="comparison">Feature Comparison Table</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Platform</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Multiplayer</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Free</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Game Rules</th>
                <th className="py-3 text-zinc-400 font-semibold">Open Source</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-violet-400">{SITE_NAME}</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✓</td><td className="py-3">✗</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">NovelAI</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3">✗</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">KoboldAI</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✗</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Character.AI</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✗</td><td className="py-3">✗</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">SillyTavern</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✗</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Dreamily</td><td className="py-3 pr-4">~ Co-write</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✗</td><td className="py-3">✗</td></tr>
              <tr><td className="py-3 pr-4 font-semibold text-white">AI Dungeon</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">~ Limited</td><td className="py-3 pr-4">✗</td><td className="py-3">✗</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── How to Choose ────────────────────────────────────────── */}
        <H2 id="choosing">How to Choose</H2>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Want multiplayer?</strong> {SITE_NAME} is the only option with real-time multiplayer AI games.</li>
          <li><strong className="text-white">Want the best writing?</strong> NovelAI has the most polished prose generation.</li>
          <li><strong className="text-white">Want full control?</strong> KoboldAI or SillyTavern let you run your own models.</li>
          <li><strong className="text-white">Want to chat with characters?</strong> Character.AI has the largest roster.</li>
          <li><strong className="text-white">Want structured games?</strong> {SITE_NAME} offers Werewolf, Avalon, Secret Hitler, custom RPGs, and more — with rules enforced by an AI Game Master.</li>
        </ul>

        {/* ── Play Online ──────────────────────────────────────────── */}
        <H2 id="play-online">Play AI Games Online Now</H2>
        <P>
          If what you&apos;re really looking for is <strong className="text-white">playing games</strong> — not just
          writing stories — {SITE_NAME} is built for exactly that. Pick a template, invite friends,
          and the AI handles everything: rules, roles, narration, and characters.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is AI Dungeon still free?</H3>
            <P>
              AI Dungeon has a free tier, but it&apos;s limited to older, less capable models. The
              premium subscription ($10–30/mo) unlocks better AI. Many alternatives offer better
              free tiers or are entirely open source.
            </P>
          </div>
          <div>
            <H3>What&apos;s the best free AI Dungeon alternative?</H3>
            <P>
              For multiplayer games with structure, {SITE_NAME} is free to start. For solo open-world
              adventures, KoboldAI is completely free if you have the hardware. Character.AI also
              offers free chatting with AI characters.
            </P>
          </div>
          <div>
            <H3>Can I play AI text games with friends?</H3>
            <P>
              Most AI text adventure platforms are solo-only. {SITE_NAME} is specifically built for
              multiplayer — invite friends via a link, and AI fills any remaining seats.
            </P>
          </div>
          <div>
            <H3>Are there AI games without content filters?</H3>
            <P>
              KoboldAI and SillyTavern are self-hosted and have no content filters. NovelAI also
              offers more creative freedom than AI Dungeon. Content policies vary by platform.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎮 Try AI-Powered Games for Free</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Multiplayer AI games with rules, roles, and real strategy. Not just another chatbot.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Explore Games
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
