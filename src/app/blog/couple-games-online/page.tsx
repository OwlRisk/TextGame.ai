import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Best Couple Games Online — Fun AI Games for Two (2026)";
const DESCRIPTION =
  "Date night in? Play AI-powered games for two — trivia, storytelling, mystery, and more. No download, just share a link and play together.";
const CANONICAL = "/blog/couple-games-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "couple games online",
    "games for two online",
    "date night games",
    "online games for couples",
    "2 player browser games",
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
    tags: ["Use Case", "Couples"],
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

export default function CoupleGamesOnlinePage() {
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
          <span className="text-zinc-400">Couple Games Online</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Use Case
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Couples
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Finding good two-player online games is surprisingly hard. Most multiplayer games
            need at least four people. AI changes that — it fills the extra seats, narrates the
            story, and creates challenges designed for exactly two humans.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </header>

        {/* Table of Contents */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <ol className="space-y-1.5">
            {[
              { id: "two-player-problem", label: "The Two-Player Problem" },
              { id: "ai-solves-it", label: "How AI Solves the Player Count" },
              { id: "best-games", label: "Best Online Games for Couples" },
              { id: "date-night-tips", label: "Tips for Couple Game Night" },
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

        {/* ── The Two-Player Problem ─────────────────────────────────────── */}
        <H2 id="two-player-problem">The Two-Player Problem</H2>

        <P>
          Search for &quot;online games for two&quot; and you&apos;ll find chess, checkers, and
          a sea of mediocre mobile ports. The problem is structural: the best social games —
          Werewolf, Codenames, trivia showdowns — are built for groups. With just two people,
          there aren&apos;t enough roles, enough teams, or enough chaos.
        </P>

        <P>
          Couples end up defaulting to Netflix or scrolling on separate phones. Not because
          they don&apos;t want to play — because the games don&apos;t exist for their group
          size.
        </P>

        {/* ── How AI Solves the Player Count ──────────────────────────────── */}
        <H2 id="ai-solves-it">How AI Solves the Player Count</H2>

        <P>
          AI characters fill the gap. Need a third detective for a mystery? The AI plays one.
          Want a trivia rival? The AI generates questions and competes alongside you. Instead of
          designing games around player minimums, AI adapts the game to{" "}
          <strong className="text-white">however many humans show up</strong>.
        </P>

        <P>
          On{" "}
          <Link href="/" className="text-violet-400 hover:underline font-semibold">
            {SITE_NAME}
          </Link>
          , every game works with two players. The AI Game Master adjusts roles, pacing, and
          difficulty so it never feels empty — just intimate.
        </P>

        {/* ── Best Online Games for Couples ───────────────────────────────── */}
        <H2 id="best-games">Best Online Games for Couples</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Trivia Duels</H3>
            <P>
              Go head-to-head with AI-generated questions. Pick a topic you both love (movies,
              history, food) or go random for surprises. Friendly competition with a leaderboard
              that tracks your all-time scores. Perfect for couples who like a little rivalry.
            </P>
            <Link href="/games/trivia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Trivia →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Cooperative Storytelling</H3>
            <P>
              Build a story together, guided by the AI. One of you might play a brave knight,
              the other a cunning thief — the AI narrates the world and reacts to your choices.
              It&apos;s like co-authoring a novel in real time, with plot twists you didn&apos;t
              see coming.
            </P>
            <Link href="/games/storyteller" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Storytelling →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Mystery &amp; Detective Games</H3>
            <P>
              The AI generates a unique case — a stolen painting, a poisoned dinner guest, a
              missing heirloom. You and your partner gather clues, interrogate AI suspects, and
              piece the puzzle together. Collaborative, suspenseful, and different every time.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Improv Comedy for Two</H3>
            <P>
              The AI sets up scenes and you both riff. &quot;You&apos;re two rival chefs on a
              cooking show&quot; or &quot;You&apos;re stranded astronauts arguing about what to
              eat.&quot; Low pressure, high laughs — especially fun when you know each other
              well enough to play off shared humor.
            </P>
            <Link href="/games/improv-comedy" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Improv Comedy →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Escape Room</H3>
            <P>
              Solve AI-generated puzzles against the clock. Communication is everything — one
              person might spot a pattern the other missed. The time pressure creates genuine
              excitement and high-fives when you crack it.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Would You Rather — Couples Edition</H3>
            <P>
              AI-generated dilemmas tailored for two. Some are silly (&quot;Would you rather
              only communicate in song or only in rhyme?&quot;), some are deep (&quot;Would you
              rather relive your first date or skip to your 50th anniversary?&quot;). A
              conversation starter disguised as a game.
            </P>
          </div>
        </div>

        {/* ── Tips for Couple Game Night ──────────────────────────────────── */}
        <H2 id="date-night-tips">Tips for Couple Game Night</H2>

        <ol className="space-y-4 mb-8 list-decimal list-inside text-zinc-300">
          <li>
            <strong className="text-white">Alternate who picks the game.</strong> One person
            chooses this week, the other picks next. Avoids the &quot;what should we do&quot;
            loop.
          </li>
          <li>
            <strong className="text-white">Mix competitive and cooperative.</strong> A trivia
            duel followed by a co-op mystery keeps the energy varied.
          </li>
          <li>
            <strong className="text-white">Set the mood.</strong> Snacks, drinks, phones on
            silent. Treat it like a real date — it&apos;s more fun when you commit to it.
          </li>
          <li>
            <strong className="text-white">Keep it short.</strong> 30–45 minutes is ideal.
            Two or three quick games beats one long slog.
          </li>
        </ol>

        <P>
          Looking for games you can play with friends too? Check our{" "}
          <Link href="/blog/free-online-games-with-friends" className="text-violet-400 hover:underline">
            free online games with friends
          </Link>{" "}
          guide.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Can we play if we&apos;re in different locations?</H3>
            <P>
              Yes — that&apos;s the whole point. Each person opens the game link in their
              browser. You can be in the same room or on different continents. Pair it with a
              video call for the full date night experience.
            </P>
          </div>
          <div>
            <H3>Are AI-hosted games any good with just two people?</H3>
            <P>
              They&apos;re designed for it. The AI adjusts storylines, puzzles, and pacing for
              two players. Storytelling and mystery games are especially polished for small
              groups.
            </P>
          </div>
          <div>
            <H3>Is it really free?</H3>
            <P>
              {SITE_NAME} offers free games with optional upgrades for longer sessions and
              premium features. You can have a great date night without spending anything.
            </P>
          </div>
          <div>
            <H3>What if one of us isn&apos;t a &quot;gamer&quot;?</H3>
            <P>
              These aren&apos;t video games. They&apos;re text-based, conversation-driven, and
              need zero gaming experience. If you can type a message, you can play.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Start Date Night
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, share the link, and play together in minutes. AI handles the rules —
            you just enjoy the evening.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Couple Games
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
