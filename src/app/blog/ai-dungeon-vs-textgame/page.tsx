import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "AI Dungeon vs TextGame.ai — Which AI Game Platform is Right for You?";
const DESCRIPTION =
  "Compare AI Dungeon and TextGame.ai: open-ended solo adventures vs multiplayer games with an AI Game Master. Find out which platform fits your play style.";
const CANONICAL = "/blog/ai-dungeon-vs-textgame";
const PUBLISHED = "2026-03-04T00:00:00Z";
const MODIFIED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai dungeon",
    "ai dungeon alternative",
    "ai dungeon vs",
    "ai text adventure",
    "ai game platform",
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
    tags: ["Comparison", "AI Games"],
    images: [{ url: "/blog/blog-ai-dungeon-vs-textgame.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-ai-dungeon-vs-textgame.png"],
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
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
};

/* ────────────────────────────────────────────────────────────────────────── */

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function AiDungeonVsTextgamePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            {SITE_NAME}
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-zinc-400">AI Dungeon vs TextGame.ai</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Comparison
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              AI Games
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Both AI Dungeon and TextGame.ai use AI to power text-based experiences — but they&apos;re built
            for completely different play styles. One excels at solo, open-ended storytelling; the other
            at multiplayer games with rules and structure. Here&apos;s how they compare.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-ai-dungeon-vs-textgame.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Table of Contents */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is-ai-dungeon", label: "What is AI Dungeon?" },
              { id: "what-is-textgame", label: "What is TextGame.ai?" },
              { id: "key-differences", label: "Key Differences" },
              { id: "when-ai-dungeon", label: "When to Choose AI Dungeon" },
              { id: "when-textgame", label: "When to Choose TextGame.ai" },
              { id: "use-both", label: "Can You Use Both?" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── What is AI Dungeon ───────────────────────────────────── */}
        <H2 id="what-is-ai-dungeon">What is AI Dungeon?</H2>

        <P>
          <strong className="text-white">AI Dungeon</strong> is an open-ended text adventure where you
          type actions and the AI narrates what happens next. There are no predefined rules, turns, or
          win conditions — you can do anything you can describe. It&apos;s like a solo D&amp;D session where
          the AI plays the role of both dungeon master and world.
        </P>

        <P>
          The experience is <strong className="text-white">freeform and creative</strong>. You might
          start as a knight in a fantasy realm, then decide to become a merchant, explore a dungeon,
          or rewrite the story entirely. The AI adapts to your choices and keeps the narrative going.
          It&apos;s designed for <em>solo storytelling</em> — you&apos;re the only player, and the AI
          responds to your imagination.
        </P>

        {/* ── What is TextGame.ai ───────────────────────────────────── */}
        <H2 id="what-is-textgame">What is TextGame.ai?</H2>

        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">
            {SITE_NAME}
          </Link>{" "}
          is built for <strong className="text-white">multiplayer games with an AI Game Master</strong>.
          Instead of open-ended storytelling, you get structured games with rules, roles, phases, and
          victory conditions. An AI host runs the session — assigning roles, managing turns, narrating
          events — while AI characters fill empty seats and play alongside you.
        </P>

        <P>
          You can play classic social deduction games like{" "}
          <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">
            Werewolf
          </TrackedGameLink>{" "}
          and{" "}
          <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">
            Mafia
          </TrackedGameLink>
          , or describe any custom game in plain English and the AI builds the rules for you. Each AI
          character has a unique personality and strategy — they bluff, accuse, defend, and form
          alliances. It&apos;s designed for <em>playing games with friends</em>, whether you have a full
          group or need AI to fill the table.
        </P>

        {/* ── Key Differences ───────────────────────────────────────── */}
        <H2 id="key-differences">Key Differences</H2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">AI Dungeon</th>
                <th className="py-3 text-zinc-400 font-semibold">{SITE_NAME}</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Multiplayer</td>
                <td className="py-3 pr-4">✗ Solo only</td>
                <td className="py-3">✓ Real-time with friends</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Game Rules</td>
                <td className="py-3 pr-4">✗ Freeform</td>
                <td className="py-3">✓ Full rules engine</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">AI Host</td>
                <td className="py-3 pr-4">~ Narrator only</td>
                <td className="py-3">✓ Dedicated Game Master</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Voice</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3">✓ Per-character TTS</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Players</td>
                <td className="py-3 pr-4">You + AI world</td>
                <td className="py-3">Humans + AI characters</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Free Tier</td>
                <td className="py-3 pr-4">✓ Limited</td>
                <td className="py-3">✓ Starting credits</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-zinc-400">Best For</td>
                <td className="py-3 pr-4">Solo adventures, creative writing</td>
                <td className="py-3">Multiplayer games, social deduction</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── When to Choose AI Dungeon ─────────────────────────────── */}
        <H2 id="when-ai-dungeon">When to Choose AI Dungeon</H2>

        <P>
          AI Dungeon shines when you want <strong className="text-white">solo, open-ended storytelling</strong>.
          Choose it if you:
        </P>

        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li>
            Want to explore a fantasy or sci-fi world with no constraints — do anything, go anywhere
          </li>
          <li>
            Prefer <strong className="text-white">creative writing</strong> and narrative freedom over
            game mechanics
          </li>
          <li>
            Enjoy long-running campaigns where the AI remembers your story and builds on it
          </li>
          <li>
            Don&apos;t need rules, turns, or other players — you just want to co-create a story with AI
          </li>
        </ul>

        <P>
          It&apos;s the pioneer of AI text adventures and still the best option for that specific,
          freeform experience.
        </P>

        {/* ── When to Choose TextGame.ai ─────────────────────────────── */}
        <H2 id="when-textgame">When to Choose TextGame.ai</H2>

        <P>
          {SITE_NAME} is the right choice when you want{" "}
          <strong className="text-white">multiplayer games with structure</strong>. Choose it if you:
        </P>

        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li>
            Want to play <strong className="text-white">Werewolf</strong>,{" "}
            <strong className="text-white">Mafia</strong>, or other social deduction games with friends
          </li>
          <li>
            Need an AI host to run the game — assign roles, manage phases, narrate events
          </li>
          <li>
            Like structured rules, win conditions, and strategic gameplay
          </li>
          <li>
            Want to play with friends but don&apos;t have enough people — AI characters fill empty seats
          </li>
        </ul>

        <P>
          <Link href="/discover" className="text-violet-400 hover:underline font-semibold">
            Browse game templates
          </Link>{" "}
          or create your own. For more on AI-powered multiplayer, see our{" "}
          <Link href="/blog/roleplay-ai-guide" className="text-violet-400 hover:underline">
            roleplay AI guide
          </Link>{" "}
          and{" "}
          <Link href="/blog/character-ai-alternatives" className="text-violet-400 hover:underline">
            Character.AI alternatives comparison
          </Link>
          .
        </P>

        {/* ── Can You Use Both? ─────────────────────────────────────── */}
        <H2 id="use-both">Can You Use Both?</H2>

        <P>
          Yes. AI Dungeon and TextGame.ai serve different needs. If you enjoy both solo creative
          writing and multiplayer games, there&apos;s no reason to pick one. Use AI Dungeon when you want
          to escape into an open-ended adventure alone, and TextGame.ai when you want to play
          structured games with friends or AI characters.
        </P>

        <P>
          They complement each other — one is a storytelling engine, the other is a game engine. Many
          players use both depending on their mood.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Is AI Dungeon good for multiplayer?</H3>
            <P>
              No. AI Dungeon is designed for solo play. You&apos;re the only human player; the AI responds
              to your actions as narrator and world. For multiplayer AI games, use{" "}
              <Link href="/" className="text-violet-400 hover:underline">
                {SITE_NAME}
              </Link>
              .
            </P>
          </div>
          <div>
            <H3>Can TextGame.ai do open-ended storytelling like AI Dungeon?</H3>
            <P>
              TextGame.ai is built for structured games with rules and roles. You can create custom
              games by describing your rules, but the experience is game-focused rather than
              freeform narrative. For open-ended solo adventures, AI Dungeon is the better fit.
            </P>
          </div>
          <div>
            <H3>Which has a better free tier?</H3>
            <P>
              Both offer free access with limits. AI Dungeon&apos;s free tier is quite restricted; premium
              is $10/month. TextGame.ai gives new users starting credits and allows guest play for
              friends. Try both to see which fits your usage.
            </P>
          </div>
          <div>
            <H3>Can I play Werewolf or Mafia on AI Dungeon?</H3>
            <P>
              Not really. AI Dungeon has no game structure — no role assignment, voting, or phase
              management. You could try to prompt it to run Werewolf, but it won&apos;t enforce rules
              consistently. For social deduction games,{" "}
              <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">
                TextGame.ai
              </TrackedGameLink>{" "}
              has dedicated templates with a full rules engine.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Play Multiplayer Games with AI?
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game template or describe your own rules. The AI Game Master handles everything —
            roles, phases, and narration. Free to start, no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Game Templates
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors"
            >
              Start Creating Free
            </Link>
          </div>
        </div>

        {/* ── Back ─────────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </>
  );
}
