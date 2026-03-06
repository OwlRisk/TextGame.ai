import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Best Icebreaker Games Online — AI-Powered, No Prep (2026)";
const DESCRIPTION =
  "Break the ice instantly with AI-hosted online games. No prep, no awkward silence — just share a link and play. Perfect for new teams, classes, and meetups.";
const CANONICAL = "/blog/best-icebreaker-games-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "icebreaker games online",
    "virtual icebreaker activities",
    "icebreaker games for teams",
    "no prep icebreaker games",
    "online icebreaker for meetings",
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
    tags: ["Use Case", "Icebreakers"],
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

export default function BestIcebreakerGamesOnlinePage() {
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
          <span className="text-zinc-400">Icebreaker Games Online</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Use Case
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Icebreakers
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Icebreakers have a reputation problem. Most are cringe, need too much prep, or fall
            flat in a virtual setting. AI-hosted games flip the script — share a link, let the bot
            run the show, and watch strangers start laughing in minutes.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span>
            <span>·</span>
            <span>7 min read</span>
          </div>
        </header>

        {/* Table of Contents */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <ol className="space-y-1.5">
            {[
              { id: "why-icebreakers-fail", label: "Why Most Icebreakers Fail" },
              { id: "what-makes-good", label: "What Makes a Great Online Icebreaker" },
              { id: "best-games", label: "7 Best Online Icebreaker Games" },
              { id: "facilitator-tips", label: "Tips for Facilitators" },
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

        {/* ── Why Most Icebreakers Fail ──────────────────────────────────── */}
        <H2 id="why-icebreakers-fail">Why Most Icebreakers Fail</H2>

        <P>
          We&apos;ve all sat through painful icebreakers. &quot;Tell us a fun fact about
          yourself&quot; followed by thirty seconds of panic and a mumbled answer about liking
          pizza. Traditional icebreakers fail for three reasons:
        </P>

        <ul className="space-y-2 mb-6 list-disc list-inside text-zinc-300">
          <li>
            <strong className="text-white">Too cringe.</strong> Forced vulnerability with
            strangers feels awkward, not bonding.
          </li>
          <li>
            <strong className="text-white">Too much prep.</strong> Someone has to plan
            questions, print cards, or learn rules.
          </li>
          <li>
            <strong className="text-white">Don&apos;t work online.</strong> Physical games
            and whiteboard activities collapse over Zoom.
          </li>
        </ul>

        <P>
          The fix? Games that feel like games — not corporate exercises. When people are
          focused on winning, bluffing, or solving a puzzle, the ice breaks itself.
        </P>

        {/* ── What Makes a Great Online Icebreaker ───────────────────────── */}
        <H2 id="what-makes-good">What Makes a Great Online Icebreaker</H2>

        <P>
          The best icebreakers share four traits: they start instantly (no 10-minute rule
          explanation), include everyone equally, generate natural conversation, and end on a
          high note. AI-hosted games nail all four because the bot handles setup, pacing, and
          rules — the facilitator just clicks &quot;start.&quot;
        </P>

        {/* ── 7 Best Online Icebreaker Games ─────────────────────────────── */}
        <H2 id="best-games">7 Best Online Icebreaker Games</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>1. AI Trivia</H3>
            <P>
              The universal icebreaker. The AI generates questions on any theme — pop culture,
              science, company history — so everyone has a shot. Rounds are fast, competitive,
              and naturally spark conversation (&quot;How did you know that?!&quot;).
            </P>
            <Link href="/games/trivia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play AI Trivia →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>2. Improv Comedy</H3>
            <P>
              The AI acts as an improv coach, serving prompts and scenes. Players respond with
              whatever comes to mind. Low stakes, high laughs — perfect for loosening up a
              room full of strangers.
            </P>
            <Link href="/games/improv-comedy" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Improv Comedy →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>3. Codenames</H3>
            <P>
              Split into two teams, pick a spymaster, and try to guess words from one-word
              clues. Forces collaboration with people you just met — you have to think like
              your teammates to win.
            </P>
            <Link href="/games/codenames" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Codenames →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>4. Spyfall</H3>
            <P>
              Everyone gets the same secret location — except the spy. Players ask each other
              questions to find the spy while the spy bluffs. Five minutes of hilarious
              suspicion that gets people talking fast.
            </P>
            <Link href="/games/spyfall" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Spyfall →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>5. Two Truths and a Lie</H3>
            <P>
              A classic that actually works well online. Each person shares three statements —
              two true, one false — and the group votes. Simple enough for any crowd, and you
              learn something surprising about everyone.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>6. Would You Rather</H3>
            <P>
              The AI generates a stream of &quot;would you rather&quot; dilemmas, from silly
              to thought-provoking. Players vote and defend their choices. Zero learning curve
              and guaranteed debate.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>7. Kahoot-Style Quiz</H3>
            <P>
              If your group likes speed and competition, a timed quiz with leaderboards keeps
              energy high. Pair it with a themed topic (e.g., &quot;How well do you know our
              company?&quot;) for extra engagement.
            </P>
          </div>
        </div>

        {/* ── Tips for Facilitators ──────────────────────────────────────── */}
        <H2 id="facilitator-tips">Tips for Facilitators</H2>

        <ol className="space-y-4 mb-8 list-decimal list-inside text-zinc-300">
          <li>
            <strong className="text-white">Start with the easiest game.</strong> Trivia or
            Would You Rather before Spyfall or Codenames.
          </li>
          <li>
            <strong className="text-white">Keep rounds short.</strong> 5–10 minutes per game
            is the sweet spot. People can always vote for &quot;one more round.&quot;
          </li>
          <li>
            <strong className="text-white">Don&apos;t force participation.</strong> Let
            lurkers watch the first round. They&apos;ll join when they see how fun it is.
          </li>
          <li>
            <strong className="text-white">Use the AI host.</strong> Let the bot explain
            rules and manage turns so you can focus on energy and vibes.
          </li>
          <li>
            <strong className="text-white">End before it gets stale.</strong> Leave them
            wanting more, not checking the clock.
          </li>
        </ol>

        <P>
          For more team building ideas, check out our{" "}
          <Link href="/blog/virtual-team-building-games" className="text-violet-400 hover:underline">
            virtual team building games guide
          </Link>.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Do icebreaker games work for introverts?</H3>
            <P>
              Yes — especially text-based games. Players type responses at their own pace
              instead of performing in front of a camera. Codenames and trivia are great for
              quieter participants.
            </P>
          </div>
          <div>
            <H3>How many people can play?</H3>
            <P>
              Most games on {SITE_NAME} support 3–15 players. For larger groups, split into
              breakout rooms and run parallel games. The AI host manages each room independently.
            </P>
          </div>
          <div>
            <H3>Do I need to prepare anything?</H3>
            <P>
              No. Pick a game on{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">the discover page</Link>,
              share the link, and the AI handles setup, rules, and scoring. Zero prep.
            </P>
          </div>
          <div>
            <H3>Are these games free?</H3>
            <P>
              {SITE_NAME} offers free games with optional upgrades. You can run icebreaker
              sessions without paying a thing.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Start an Icebreaker Game
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            No prep, no downloads, no cringe. Pick a game, share the link, and let the AI
            break the ice for you.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Icebreaker Games
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
