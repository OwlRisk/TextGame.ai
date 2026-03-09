import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Best Online Games for Large Groups of 10+ Players (2026)";
const DESCRIPTION =
  "Planning a game night for a big group? These online games support 10, 15, even 20+ players — from AI-hosted social deduction to drawing games and trivia.";
const CANONICAL = "/blog/games-for-large-groups";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "online games for large groups",
    "party games for 10 players",
    "multiplayer games 15 players",
    "big group games online",
    "games for 20 people",
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
    tags: ["Use Case", "Large Groups"],
    images: [{ url: "/blog/blog-games-for-large-groups.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-games-for-large-groups.png"],
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
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` },
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

export default function GamesForLargeGroupsPage() {
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
          <span className="text-zinc-400">Games for Large Groups</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Use Case
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Large Groups
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Most online games cap at 8 players. Great for a small hangout — useless for a
            birthday party, company event, or classroom. Here are the games that actually work
            when you&apos;ve got 10, 15, or 20+ people ready to play.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span>
            <span>·</span>
            <span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-games-for-large-groups.png"
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
              { id: "large-group-problem", label: "The Large Group Problem" },
              { id: "social-deduction", label: "Social Deduction Games (10–20+)" },
              { id: "trivia-drawing", label: "Trivia & Drawing Games" },
              { id: "managing-tips", label: "Tips for Managing Big Groups" },
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

        {/* ── The Large Group Problem ────────────────────────────────────── */}
        <H2 id="large-group-problem">The Large Group Problem</H2>

        <P>
          You&apos;ve got 15 people on a call and everyone wants to play a game. You open your
          go-to party game and it says &quot;max 8 players.&quot; Now half your group has to
          watch — or you split into separate rooms and lose the shared experience.
        </P>

        <P>
          The truth is, most game engines aren&apos;t built for scale. Turn-based games slow to
          a crawl with more players, real-time games lag, and chat gets chaotic. The games below
          are specifically designed — or naturally suited — for{" "}
          <strong className="text-white">double-digit player counts</strong>.
        </P>

        {/* ── Social Deduction Games ─────────────────────────────────────── */}
        <H2 id="social-deduction">Social Deduction Games (10–20+)</H2>

        <P>
          Social deduction actually gets <em>better</em> with more players. More suspects means
          more paranoia, more alliances, and more spectacular betrayals. AI hosting keeps the
          chaos manageable.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Werewolf (Up to 20+ Players)</H3>
            <P>
              The quintessential large-group game. With 12+ players you can add special roles —
              Seer, Doctor, Hunter, Witch — that make every night phase unpredictable. The AI
              Game Master handles role assignment, night actions, and vote counting so nobody
              has to moderate.
            </P>
            <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Werewolf →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Mafia (Up to 20+ Players)</H3>
            <P>
              The game that started it all. Simpler role structure than Werewolf makes it easier
              for newcomers, while still delivering the core experience — lies, accusations, and
              dramatic reveals. Scales beautifully to 15–20 players.
            </P>
            <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Mafia →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>The Resistance (5–15 Players)</H3>
            <P>
              No elimination — everyone plays until the end. The resistance tries to succeed on
              missions while spies sabotage from within. Fast rounds, constant suspicion, and
              nobody sits out. Perfect for groups that hate being eliminated early.
            </P>
            <TrackedGameLink href="/games/resistance" className="text-violet-400 hover:underline text-sm font-semibold">
              Play The Resistance →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Two Rooms and a Boom (10–30 Players)</H3>
            <P>
              Players split into two rooms and negotiate hostage exchanges. One room has the
              President, the other has the Bomber. The biggest social deduction game you can
              play — and {SITE_NAME}&apos;s AI version handles all the logistics.
            </P>
            <TrackedGameLink href="/games/two-rooms" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Two Rooms →
            </TrackedGameLink>
          </div>
        </div>

        {/* ── Trivia & Drawing Games ─────────────────────────────────────── */}
        <H2 id="trivia-drawing">Trivia &amp; Drawing Games</H2>

        <P>
          Not everyone wants social deduction. These games are lighter, faster, and just as fun
          with a big crowd.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>AI Trivia (Unlimited Players)</H3>
            <P>
              The AI generates fresh questions every round, so no one has an unfair advantage.
              With 15+ players, the leaderboard competition gets fierce. Works on any device,
              no app download, and rounds take just 2–3 minutes each.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Gartic Phone (Up to 30 Players)</H3>
            <P>
              A drawing telephone game — draw a prompt, pass it on, guess the next drawing. The
              more players, the more hilariously distorted the results. Runs in the browser
              alongside any video call.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Kahoot (Unlimited Players)</H3>
            <P>
              One host screen, everyone answers on their phone. Timed questions with a live
              leaderboard. Scales to hundreds of players, making it ideal for classrooms,
              conferences, and all-hands meetings.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Among Us (4–15 Players)</H3>
            <P>
              Complete tasks on a spaceship while impostors sabotage and kill. Emergency
              meetings turn into loud, chaotic debates. Best with 8–12 players for the right
              balance of suspicion and survival.
            </P>
          </div>
        </div>

        {/* ── Tips for Managing Big Groups ────────────────────────────────── */}
        <H2 id="managing-tips">Tips for Managing Big Groups</H2>

        <ol className="space-y-4 mb-8 list-decimal list-inside text-zinc-300">
          <li>
            <strong className="text-white">Appoint a host, not a moderator.</strong> With AI
            hosting, the &quot;host&quot; just picks the game and shares the link. The AI runs
            everything else.
          </li>
          <li>
            <strong className="text-white">Set a timer for discussions.</strong> With 15 people
            all wanting to talk during Werewolf&apos;s day phase, cap debates at 3–4 minutes to
            keep the pace up.
          </li>
          <li>
            <strong className="text-white">Use text chat alongside voice.</strong> Not everyone
            can talk at once. A text channel for side theories keeps quieter players engaged.
          </li>
          <li>
            <strong className="text-white">Rotate games.</strong> Play two rounds of Werewolf,
            then switch to trivia. Variety prevents fatigue and lets different personalities
            shine.
          </li>
          <li>
            <strong className="text-white">Split strategically if needed.</strong> Above 20
            players, run two parallel games with AI hosts — then swap players between rounds
            for cross-pollination.
          </li>
        </ol>

        <P>
          For more party game recommendations, browse our{" "}
          <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">
            best online party games
          </Link>{" "}
          guide.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>What&apos;s the maximum number of players on {SITE_NAME}?</H3>
            <P>
              Most games support up to 20 players, with some (like Two Rooms and a Boom)
              supporting 30+. The AI scales role assignments, pacing, and game mechanics
              automatically based on how many people join.
            </P>
          </div>
          <div>
            <H3>Do all players need accounts?</H3>
            <P>
              No. The host creates the game and shares an invite link. Guests click the link and
              join instantly in their browser — no sign-up needed.
            </P>
          </div>
          <div>
            <H3>What if some players drop mid-game?</H3>
            <P>
              The AI adapts. If a player disconnects in Werewolf, the AI can take over their
              role or adjust the balance. The game continues without restarting.
            </P>
          </div>
          <div>
            <H3>Which game is best for 15+ people who&apos;ve never played before?</H3>
            <P>
              Start with <strong className="text-white">Mafia</strong> — the rules are simple
              and the AI explains everything. Follow with trivia for a lighter round. Save
              complex games like Two Rooms for the second session when everyone knows the
              basics.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Host a Big Game Night
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game built for crowds, share the link, and let the AI host. From 10 players
            to 30 — no moderator required.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Large Group Games
          </Link>
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
