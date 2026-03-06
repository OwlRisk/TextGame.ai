import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "15 Best Games to Play Over Video Call with Friends (2026)";
const DESCRIPTION =
  "Stuck on Zoom? Here are 15 games that work perfectly over video call — from AI party games and trivia to social deduction and drawing. All free, browser-based.";
const CANONICAL = "/blog/games-to-play-over-video-call";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "games to play over video call",
    "zoom games with friends",
    "video call party games",
    "online games for zoom",
    "games to play on facetime",
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
    tags: ["Use Case", "Video Call"],
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

export default function GamesToPlayOverVideoCallPage() {
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
          <span className="text-zinc-400">Games for Video Calls</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Use Case
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Video Call
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Video calls don&apos;t have to be boring. Whether it&apos;s a Friday night with
            friends or a remote hangout with family, these 15 browser-based games turn any Zoom,
            FaceTime, or Discord call into a party.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span>
            <span>·</span>
            <span>9 min read</span>
          </div>
        </header>

        {/* Table of Contents */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <ol className="space-y-1.5">
            {[
              { id: "why-tricky", label: "Why Video Call Games Are Tricky" },
              { id: "social-deduction", label: "Social Deduction Games" },
              { id: "word-strategy", label: "Word & Strategy Games" },
              { id: "trivia-quiz", label: "Trivia & Quiz Games" },
              { id: "creative-games", label: "Creative & Drawing Games" },
              { id: "quick-picks", label: "Quick Picks (Under 10 Min)" },
              { id: "tips", label: "Tips for Smooth Video Call Gaming" },
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

        {/* ── Why Video Call Games Are Tricky ─────────────────────────────── */}
        <H2 id="why-tricky">Why Video Call Games Are Tricky</H2>

        <P>
          Not every game translates to a grid of faces on a screen. Latency makes real-time
          drawing awkward, screen sharing kills the surprise, and someone always has mic issues.
          The best video call games are <strong className="text-white">browser-based</strong>{" "}
          (everyone plays on their own device), <strong className="text-white">turn-based or
          async</strong> (latency doesn&apos;t ruin the experience), and{" "}
          <strong className="text-white">text-friendly</strong> (you can type if your mic is off).
        </P>

        {/* ── Social Deduction ───────────────────────────────────────────── */}
        <H2 id="social-deduction">Social Deduction Games</H2>

        <P>
          Social deduction thrives on video calls — reading faces, hearing voices, and arguing
          in real time makes lying (and catching liars) even more fun.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>1. Werewolf</H3>
            <P>
              The gold standard. Hidden werewolves pick off villagers at night; by day, everyone
              debates and votes. The AI assigns roles, runs night phases, and narrates kills —
              so nobody has to sit out as moderator.
            </P>
            <Link href="/games/werewolf" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Werewolf →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>2. Mafia</H3>
            <P>
              The OG social deduction game. Simpler roles than Werewolf, making it ideal for
              groups with first-timers. The AI handles accusations, voting, and reveals.
            </P>
            <Link href="/games/mafia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Mafia →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>3. Spyfall</H3>
            <P>
              Everyone gets a secret location except the spy. Ask each other questions to find
              the spy — but don&apos;t give the location away. Quick rounds, tons of laughs.
            </P>
            <Link href="/games/spyfall" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Spyfall →
            </Link>
          </div>
        </div>

        {/* ── Word & Strategy ────────────────────────────────────────────── */}
        <H2 id="word-strategy">Word &amp; Strategy Games</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>4. Codenames</H3>
            <P>
              Two teams, two spymasters, 25 words on the board. Spymasters give one-word clues
              to help their team guess the right words. Brilliant over video call because
              discussion happens naturally.
            </P>
            <Link href="/games/codenames" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Codenames →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>5. Wavelength</H3>
            <P>
              One player places a concept on a spectrum (e.g., &quot;hot to cold&quot;) and the
              team guesses where. Sparks hilarious debates about whether pizza is &quot;a little
              hot&quot; or &quot;very hot.&quot;
            </P>
          </div>
        </div>

        {/* ── Trivia & Quiz ──────────────────────────────────────────────── */}
        <H2 id="trivia-quiz">Trivia &amp; Quiz Games</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>6. AI Trivia</H3>
            <P>
              The AI generates fresh questions every round — no repeated question packs. Pick a
              theme or go random. Leaderboards keep it competitive without being stressful.
            </P>
            <Link href="/games/trivia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play AI Trivia →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>7. Kahoot</H3>
            <P>
              The classroom favorite works great socially too. One person shares the question
              screen, everyone answers on their phone. Fast-paced and energetic.
            </P>
          </div>
        </div>

        {/* ── Creative & Drawing ─────────────────────────────────────────── */}
        <H2 id="creative-games">Creative &amp; Drawing Games</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>8. Improv Comedy</H3>
            <P>
              The AI serves scenes and prompts; players riff in character. Think &quot;Whose Line
              Is It Anyway?&quot; — on your couch. No drawing skills required, just willingness
              to be silly.
            </P>
            <Link href="/games/improv-comedy" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Improv Comedy →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>9. Gartic Phone</H3>
            <P>
              Draw a prompt, pass it on, guess what the next person drew. The telephone effect
              produces absurd results every time. Works in the browser alongside your video call.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>10. Skribbl.io</H3>
            <P>
              One player draws, everyone guesses. Simple, chaotic, and endlessly replayable.
              Great for groups that love visual humor.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>11. AI Storytelling</H3>
            <P>
              Players take turns adding to a story guided by the AI. The narrative twists in
              unexpected ways, creating a collaborative masterpiece (or hilarious disaster).
            </P>
          </div>
        </div>

        {/* ── Quick Picks ────────────────────────────────────────────────── */}
        <H2 id="quick-picks">Quick Picks (Under 10 Min)</H2>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>12. Among Us</H3>
            <P>
              Complete tasks on a spaceship while impostors sabotage and kill. Short rounds,
              intense discussions during emergency meetings. Best with 6–10 players.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>13. Two Truths and a Lie</H3>
            <P>
              No setup needed. Each person shares three statements, the group votes on the lie.
              Perfect as a warm-up before longer games.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>14. Would You Rather</H3>
            <P>
              The AI generates dilemmas, players vote and debate. Zero learning curve, works
              with any group size, and conversations flow naturally from the choices.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>15. 20 Questions</H3>
            <P>
              One player thinks of something, the group asks yes/no questions. The AI can
              moderate and keep count. A timeless classic that&apos;s perfect for casual calls.
            </P>
          </div>
        </div>

        {/* ── Tips ────────────────────────────────────────────────────────── */}
        <H2 id="tips">Tips for Smooth Video Call Gaming</H2>

        <ol className="space-y-4 mb-8 list-decimal list-inside text-zinc-300">
          <li>
            <strong className="text-white">Everyone opens the game in their own browser.</strong>{" "}
            Don&apos;t screen share the game — let each person interact on their own device.
          </li>
          <li>
            <strong className="text-white">Use push-to-talk or mute etiquette.</strong>{" "}
            Background noise from 10 people kills the vibe fast.
          </li>
          <li>
            <strong className="text-white">Start simple, escalate.</strong> Open with trivia or
            Would You Rather, then graduate to Werewolf or Codenames.
          </li>
          <li>
            <strong className="text-white">Cap sessions at 60–90 minutes.</strong> Energy
            fades past that point. End while people are still having fun.
          </li>
        </ol>

        <P>
          For more party game ideas, see our{" "}
          <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">
            best online party games
          </Link>{" "}
          roundup.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Do these games work on FaceTime and Discord too?</H3>
            <P>
              Absolutely. The games run in a browser tab — your video call app doesn&apos;t
              matter. Zoom, Google Meet, FaceTime, Discord, Teams — all work.
            </P>
          </div>
          <div>
            <H3>What&apos;s the ideal group size?</H3>
            <P>
              4–8 is the sweet spot for most games. Social deduction games like Werewolf need at
              least 5. Trivia and drawing games scale well up to 15+.
            </P>
          </div>
          <div>
            <H3>Do players need to download anything?</H3>
            <P>
              No. All games on {SITE_NAME} are browser-based. Players click a link and
              they&apos;re in. No app downloads, no accounts required for guests.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Find Your Video Call Game
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Browse AI-hosted games that work perfectly alongside Zoom, Discord, or any video
            call. No downloads, no awkward screen sharing.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Games
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
