import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Board Games Online with AI Players — No Friends Needed";
const DESCRIPTION =
  "Play board game-style games online with AI — Werewolf, Mafia, Avalon, Secret Hitler, and more. AI fills seats, AI hosts. Start anytime, no downloads.";
const CANONICAL = "/blog/play-board-games-online-ai";
const PUBLISHED = "2026-03-04T00:00:00Z";
const MODIFIED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play board games online",
    "ai board game",
    "online board games with ai",
    "board games with ai players",
    "virtual board games",
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
    tags: ["Guide", "Board Games"],
    images: [{ url: "/blog/blog-play-board-games-online-ai.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-board-games-online-ai.png"],
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

export default function PlayBoardGamesOnlineAiPage() {
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
          <span className="text-zinc-400">Play Board Games Online with AI</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Guide
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Board Games
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Love board games but can&apos;t get enough people together? AI players fill the table.
            Play Werewolf, Mafia, Avalon, and more online — AI hosts, AI fills empty seats, and you
            can start anytime. No friends needed, no downloads.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-board-games-online-ai.png"
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
              { id: "problem", label: "The Problem with Online Board Games" },
              { id: "how-ai-solves", label: "How AI Solves This" },
              { id: "board-game-style", label: "Board Game-Style Games You Can Play with AI" },
              { id: "create-your-own", label: "Create Your Own Board Game with AI" },
              { id: "comparison", label: "Comparison: Board Game Platforms" },
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

        {/* ── The Problem with Online Board Games ────────────────────────── */}
        <H2 id="problem">The Problem with Online Board Games</H2>

        <P>
          Online board games usually require <strong className="text-white">enough people</strong> —
          often 4–8 players. If your group is small or scattered across time zones, you&apos;re stuck.
          You also need someone to <strong className="text-white">moderate</strong> — deal cards,
          enforce rules, run phases. That person often can&apos;t play fully.
        </P>

        <P>
          Scheduling is another headache. Getting everyone online at the same time is hard. AI
          solves all of this.
        </P>

        {/* ── How AI Solves This ───────────────────────────────────────── */}
        <H2 id="how-ai-solves">How AI Solves This</H2>

        <P>
          With AI-powered board game platforms like {SITE_NAME}:
        </P>

        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li>
            <strong className="text-white">AI fills seats.</strong> Play with 1–2 humans; AI
            characters take the rest. Full table, any time.
          </li>
          <li>
            <strong className="text-white">AI hosts.</strong> No human moderator. The AI assigns
            roles, runs phases, and keeps the game moving.
          </li>
          <li>
            <strong className="text-white">Instant start.</strong> No waiting for lobbies or
            matchmaking. Create a game and play.
          </li>
          <li>
            <strong className="text-white">Any time.</strong> 2 AM or 2 PM — AI is always ready.
          </li>
        </ul>

        {/* ── Board Game-Style Games You Can Play with AI ──────────────── */}
        <H2 id="board-game-style">Board Game-Style Games You Can Play with AI</H2>

        <P>
          These seven games are available on {SITE_NAME} — all playable with AI players and an AI
          host:
        </P>

        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🐺</span>
            <div>
              <strong className="text-white">Werewolf</strong> — Classic social deduction. Hidden
              werewolves, day/night phases, voting.{" "}
              <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">
                Play Werewolf
              </TrackedGameLink>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🎭</span>
            <div>
              <strong className="text-white">Mafia</strong> — Same mechanics as Werewolf, urban
              crime theme. Townspeople vs mafia.
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">⚔️</span>
            <div>
              <strong className="text-white">Avalon</strong> — The Resistance: Avalon. Hidden
              loyalty, missions, deduction.{" "}
              <TrackedGameLink href="/games/avalon" className="text-violet-400 hover:underline">
                Play Avalon
              </TrackedGameLink>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🎩</span>
            <div>
              <strong className="text-white">Secret Hitler</strong> — Liberals vs Fascists. Secret
              roles, policy cards, betrayal.{" "}
              <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">
                Play Secret Hitler
              </TrackedGameLink>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🕵️</span>
            <div>
              <strong className="text-white">Who&apos;s the Spy</strong> — Word-guessing with a
              hidden spy. Describe your word, find the imposter.
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🔍</span>
            <div>
              <strong className="text-white">Murder Mystery</strong> — Solve a crime. AI generates
              the case; you interrogate suspects and accuse the culprit.
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">🚪</span>
            <div>
              <strong className="text-white">Escape Room</strong> — AI-generated puzzles. Work
              through clues to escape before time runs out.
            </div>
          </div>
        </div>

        {/* ── Create Your Own Board Game with AI ──────────────────────── */}
        <H2 id="create-your-own">Create Your Own Board Game with AI</H2>

        <P>
          Don&apos;t see your favorite? Describe any board game concept in plain English — the AI
          builds the rules. Custom social deduction, cooperative quests, or your own twist on a
          classic. See our{" "}
          <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">
            create game with AI guide
          </Link>{" "}
          for details.
        </P>

        {/* ── Comparison: Board Game Platforms ─────────────────────────── */}
        <H2 id="comparison">Comparison: Board Game Platforms</H2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">{SITE_NAME}</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Board Game Arena</th>
                <th className="py-3 text-zinc-400 font-semibold">Tabletop Simulator</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">AI players?</td>
                <td className="py-3 pr-4">✓ Yes</td>
                <td className="py-3 pr-4">✗ No</td>
                <td className="py-3">✗ No</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">Free?</td>
                <td className="py-3 pr-4">✓ Starting credits</td>
                <td className="py-3 pr-4">~ Limited free</td>
                <td className="py-3">✗ Paid</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-zinc-400">No download?</td>
                <td className="py-3 pr-4">✓ Browser only</td>
                <td className="py-3 pr-4">✓ Browser only</td>
                <td className="py-3">✗ Steam required</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-zinc-400">AI host?</td>
                <td className="py-3 pr-4">✓ Yes</td>
                <td className="py-3 pr-4">✗ No</td>
                <td className="py-3">✗ No</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          {SITE_NAME} is built for games that need a host and multiple players. AI fills both roles
          — so you can play alone or with a small group anytime.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I play traditional board games like Monopoly or Catan?</H3>
            <P>
              {SITE_NAME} focuses on social deduction and party-style games (Werewolf, Mafia,
              Avalon, etc.) — games that work well as text-based experiences with an AI host. For
              traditional board games with physical pieces, Board Game Arena or Tabletop Simulator
              are better fits. But you can describe custom game concepts and the AI will try to
              build them.
            </P>
          </div>
          <div>
            <H3>How good are the AI players?</H3>
            <P>
              AI characters have distinct personalities and strategies. They bluff, accuse, defend,
              and form alliances. They&apos;re not perfect, but they provide a solid challenge and
              make games feel full even when you&apos;re playing solo or with one friend.
            </P>
          </div>
          <div>
            <H3>Do I need to own the physical board game?</H3>
            <P>
              No. {SITE_NAME} runs everything in the browser. No physical copy, no downloads. The AI
              knows the rules and enforces them. Just create a game and play.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Play Board Games Online — No Friends Needed
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI fills seats. AI hosts. Werewolf, Mafia, Avalon, and more. Start in seconds. See our{" "}
            <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">
              best online party games
            </Link>{" "}
            for more ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse Games
            </Link>
            <TrackedGameLink
              href="/games/werewolf"
              className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors"
            >
              Try Werewolf
            </TrackedGameLink>
          </div>
        </div>

        {/* ── Back ────────────────────────────────────────────────────── */}
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
