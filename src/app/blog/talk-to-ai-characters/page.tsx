import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Talk to AI Characters Online — Free AI Companions & Game Partners";
const DESCRIPTION =
  "Talk to AI characters for free — with voice, text, and multiplayer games. Discover the best platforms for AI companions, roleplay partners, and game buddies in 2026.";
const CANONICAL = "/blog/talk-to-ai-characters";
const PUBLISHED = "2026-03-04T00:00:00Z";
const MODIFIED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "talk to ai",
    "talk to ai characters",
    "talking ai",
    "talk ai",
    "ai friend chat",
    "talking app",
    "ai role play",
    "roleplay chat",
    "ai rp",
    "free ai roleplay",
    "ai roleplay free",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    modifiedTime: MODIFIED,
    authors: [SITE_NAME],
    tags: ["Guide", "AI Characters"],
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/hero.webp"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN },
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
};

/* ────────────────────────────────────────────────────────────────────────── */

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

function TableOfContents() {
  const items = [
    { id: "ways-to-talk", label: "Voice vs. Text — Ways to Talk to AI" },
    { id: "ai-game-partners", label: "AI as Game Partners" },
    { id: "ai-companions", label: "AI Companion Apps" },
    { id: "best-platforms", label: "Best Platforms for Talking to AI" },
    { id: "getting-started", label: "How to Start Talking to AI" },
    { id: "faq", label: "FAQ" },
  ];
  return (
    <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
      <ol className="space-y-1.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
              {i + 1}. {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function TalkToAiCharactersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Talk to AI Characters</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">AI Characters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Talking to AI characters has evolved far beyond text boxes. In 2026, you can hear AI voices, play multiplayer games with AI partners, and build ongoing relationships with AI companions — all for free.
          </p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span>
            <span>·</span>
            <span>7 min read</span>
          </div>
        </header>

        <TableOfContents />

        {/* ── Voice vs Text ──────────────────────────────────────────── */}
        <H2 id="ways-to-talk">Voice vs. Text — Ways to Talk to AI</H2>
        <P>
          There are two main ways to interact with AI characters: typing text messages or having voice conversations. Each has a different feel and use case.
        </P>

        <H3>Text-Based AI Chat</H3>
        <P>
          The most common format. You type messages and the AI responds with text in character. Platforms like Character.AI, Perchance, and Janitor AI all use this model. Text chat gives you time to think and craft your responses, making it ideal for detailed roleplay and storytelling.
        </P>

        <H3>Voice-Enabled AI Conversations</H3>
        <P>
          Some platforms now give AI characters distinct voices via text-to-speech. On <Link href="/" className="text-violet-400 hover:underline font-semibold">TextGame.ai</Link>, every AI character speaks with a unique voice — so when you&apos;re playing Werewolf, you can <em>hear</em> each character make their accusations and defenses. Replika and Talkie AI also offer voice calls where you speak naturally and the AI responds verbally.
        </P>
        <P>
          Voice adds immersion and emotional connection. Hearing an AI character&apos;s tone, pacing, and personality through audio makes the experience feel remarkably more real than reading text alone.
        </P>

        {/* ── AI as Game Partners ─────────────────────────────────────── */}
        <H2 id="ai-game-partners">AI as Game Partners</H2>
        <P>
          One of the most exciting developments in AI character interaction is using them as <em>game partners</em> — not just chat companions, but strategic players in structured games.
        </P>

        <H3>Social Deduction Games</H3>
        <P>
          Games like Werewolf, Mafia, and Secret Hitler require players to lie, deduce, and persuade. AI characters on <Link href="/" className="text-violet-400 hover:underline font-semibold">TextGame.ai</Link> are built for exactly this: they have hidden roles, form alliances, make accusations, and bluff convincingly. An AI Game Master runs the phases, so you get a complete game experience even if you&apos;re playing solo.
        </P>

        <H3>RPGs & Text Adventures</H3>
        <P>
          AI characters can serve as party members in RPG adventures, each with their own skills, motivations, and dialogue. On TextGame.ai, you can run a D&amp;D-style campaign where AI characters play alongside you as the Game Master narrates the story and enforces game mechanics.
        </P>

        <H3>Party Games & Ice Breakers</H3>
        <P>
          AI characters fill empty seats in party games like Codenames, trivia, or improv challenges. This means you can play games designed for larger groups even with just one or two human players — the AI fills in the rest with believable personalities.
        </P>

        {/* ── AI Companions ───────────────────────────────────────────── */}
        <H2 id="ai-companions">AI Companion Apps</H2>
        <P>
          Beyond games and roleplay, some people talk to AI characters for companionship — a friendly presence that&apos;s always available, never judgmental, and endlessly patient.
        </P>

        <H3>Replika — Long-Term AI Relationships</H3>
        <P>
          Replika is the pioneer in AI companionship. Your Replika learns from your conversations over time, remembers details about your life, and develops a consistent personality. It offers text, voice calls, and even AR experiences. Best for users seeking an ongoing emotional connection.
        </P>

        <H3>Talkie AI — Casual Voice Companions</H3>
        <P>
          Talkie AI offers a lighter companion experience with a focus on voice interactions. It&apos;s more about quick, fun conversations with varied AI characters than building a deep long-term bond. The mobile app is polished and the voice quality is solid.
        </P>

        <H3>TextGame.ai — AI Friends Who Actually Play With You</H3>
        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">TextGame.ai</Link> takes a different approach: instead of just talking <em>to</em> AI characters, you play <em>with</em> them. Each AI has a distinct personality and voice, and they interact with you through shared game experiences — lying in Werewolf, solving puzzles together, or competing in trivia. It&apos;s companionship through play.
        </P>

        {/* ── Best Platforms ──────────────────────────────────────────── */}
        <H2 id="best-platforms">Best Platforms for Talking to AI</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Platform</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Voice</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Games</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Multiplayer</th>
                <th className="py-3 text-zinc-400 font-semibold">Free</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-violet-400">TextGame.ai</td><td className="py-3 pr-4">✓ Per-character voices</td><td className="py-3 pr-4">✓ 20+ templates</td><td className="py-3 pr-4">✓ Real-time</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Replika</td><td className="py-3 pr-4">✓ Voice calls</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3">✓ Limited</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Talkie AI</td><td className="py-3 pr-4">✓ Voice calls</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3">✓</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Character.AI</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3">✓</td></tr>
              <tr><td className="py-3 pr-4 font-semibold text-white">Perchance</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3">✓</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── Getting Started ─────────────────────────────────────────── */}
        <H2 id="getting-started">How to Start Talking to AI</H2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
          <ol className="space-y-4 text-sm text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 font-bold text-xs flex items-center justify-center">1</span>
              <p><strong className="text-white">Decide what you want</strong> — casual chat? Deep companionship? Multiplayer games? This determines which platform to pick.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 font-bold text-xs flex items-center justify-center">2</span>
              <p><strong className="text-white">Pick a platform</strong> — for games with voice, try <Link href="/discover" className="text-violet-400 hover:underline">TextGame.ai</Link>. For voice companionship, try Replika or Talkie AI. For text roleplay, try Character.AI or Perchance.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 font-bold text-xs flex items-center justify-center">3</span>
              <p><strong className="text-white">Choose a character or game</strong> — browse available AI characters, game templates, or create a custom scenario.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 font-bold text-xs flex items-center justify-center">4</span>
              <p><strong className="text-white">Start talking</strong> — type or speak. On TextGame.ai, toggle AI voice to hear characters speak during games. Invite friends to join multiplayer sessions via a link.</p>
            </li>
          </ol>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I actually hear AI characters talk?</H3>
            <P>Yes. On TextGame.ai, every AI character has a unique text-to-speech voice — you hear them speak during games. Replika and Talkie AI offer voice call features where you can have spoken conversations with your AI companion.</P>
          </div>
          <div>
            <H3>Is talking to AI characters free?</H3>
            <P>Most platforms offer free access. TextGame.ai includes free starting credits, Character.AI and Perchance are free, and Replika has a free basic tier. Voice features are sometimes locked behind premium plans.</P>
          </div>
          <div>
            <H3>Can AI characters play games with me?</H3>
            <P>On <Link href="/" className="text-violet-400 hover:underline">TextGame.ai</Link>, yes — AI characters play structured games like Werewolf, Mafia, murder mysteries, and RPGs. They have hidden roles, make strategic decisions, and interact with human players under enforced rules.</P>
          </div>
          <div>
            <H3>What&apos;s the best AI talking app for mobile?</H3>
            <P>For voice companionship, Talkie AI and Replika have the best mobile apps. For multiplayer AI games on mobile, TextGame.ai works in any mobile browser — no app download needed.</P>
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Talk to AI Characters Who Actually Play Back</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            On TextGame.ai, AI characters don&apos;t just chat — they strategize, bluff, and compete in multiplayer games. Hear their voices, play together, and invite friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Discover AI Games
            </Link>
            <Link href="/signin" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Try Free
            </Link>
          </div>
        </div>

        {/* ── Back ───────────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
