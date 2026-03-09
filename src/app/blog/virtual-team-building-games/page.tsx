import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Virtual Team Building Games with AI — Fun Ideas for Remote Teams";
const DESCRIPTION =
  "Discover AI-powered team building games for remote teams — Werewolf, Murder Mystery, Trivia, and more. No moderator needed. Build connection and morale from anywhere.";
const CANONICAL = "/blog/virtual-team-building-games";
const PUBLISHED = "2026-03-04T00:00:00Z";
const MODIFIED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "virtual team building games",
    "remote team games",
    "online team building activities",
    "ai team building",
    "team games online",
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
    tags: ["Team Building", "Remote Work"],
    images: [{ url: "/blog/blog-virtual-team-building-games.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-virtual-team-building-games.png"],
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

export default function VirtualTeamBuildingGamesPage() {
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
          <span className="text-zinc-400">Virtual Team Building Games</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Team Building
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Remote Work
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Remote work doesn&apos;t have to mean disconnected teams. AI-powered virtual games bring
            your distributed team together — no moderator, no scheduling headaches, just fun. Here&apos;s
            how to run engaging team building sessions online.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-virtual-team-building-games.png"
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
              { id: "why-virtual", label: "Why Virtual Team Building Matters" },
              { id: "best-games", label: "Best AI-Powered Team Building Games" },
              { id: "run-game-night", label: "How to Run a Virtual Game Night" },
              { id: "why-ai-hosting", label: "Why AI Hosting Works for Teams" },
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

        {/* ── Why Virtual Team Building Matters ───────────────────────────── */}
        <H2 id="why-virtual">Why Virtual Team Building Matters</H2>

        <P>
          Remote work has many benefits, but it can leave teams feeling isolated. Without casual
          hallway chats or lunch breaks together, connection and morale can suffer.{" "}
          <strong className="text-white">Virtual team building games</strong> create shared
          experiences that build trust, improve communication, and remind everyone they&apos;re part
          of a team — even when they&apos;re miles apart.
        </P>

        <P>
          The key is choosing activities that feel natural online. AI-powered games work especially
          well because they don&apos;t require a human host, everyone can participate equally, and
          they run in the browser — no downloads or complex setup.
        </P>

        {/* ── Best AI-Powered Team Building Games ──────────────────────── */}
        <H2 id="best-games">Best AI-Powered Team Building Games</H2>

        <P>
          Here are six games that work great for remote teams, all available on{" "}
          <Link href="/" className="text-violet-400 hover:underline font-semibold">
            {SITE_NAME}
          </Link>
          :
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Werewolf</H3>
            <P>
              The classic social deduction game. Hidden werewolves try to blend in while villagers
              debate and vote. Great for <strong className="text-white">trust and deduction</strong> —
              teams learn to read each other, spot lies, and collaborate under pressure.
            </P>
            <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Werewolf →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Murder Mystery</H3>
            <P>
              A detective-style game where the AI generates a unique case. Players gather clues,
              interrogate suspects, and work together to solve the crime. Builds{" "}
              <strong className="text-white">collaboration and critical thinking</strong>.
            </P>
            <TrackedGameLink href="/games/detective-mystery" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Murder Mystery →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Trivia</H3>
            <P>
              AI-generated trivia questions on any topic. Light, competitive, and easy to jump into.
              Good for <strong className="text-white">knowledge sharing</strong> and friendly rivalry.
            </P>
            <Link href="/discover" className="text-violet-400 hover:underline text-sm font-semibold">
              Browse Trivia →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Who&apos;s the Spy</H3>
            <P>
              A word-guessing game where one player has a different word. Everyone describes their
              word without revealing it — the spy must blend in. Sharpens{" "}
              <strong className="text-white">word skills and observation</strong>.
            </P>
            <TrackedGameLink href="/games/undercover" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Who&apos;s the Spy →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Custom Games</H3>
            <P>
              Describe any game concept in plain English — the AI builds the rules. Themed for your
              team, your industry, or your inside jokes. Perfect for{" "}
              <strong className="text-white">personalized experiences</strong>.
            </P>
            <Link href="/discover" className="text-violet-400 hover:underline text-sm font-semibold">
              Create Custom Game →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Escape Room</H3>
            <P>
              AI-generated puzzles and clues. Teams work together to solve riddles and escape before
              time runs out. Builds <strong className="text-white">problem solving and teamwork</strong>.
            </P>
            <TrackedGameLink href="/games/escape-room" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Escape Room →
            </TrackedGameLink>
          </div>
        </div>

        {/* ── How to Run a Virtual Game Night ───────────────────────────── */}
        <H2 id="run-game-night">How to Run a Virtual Game Night</H2>

        <P>
          Running a virtual game night is simple. Four steps:
        </P>

        <ol className="space-y-4 mb-8 list-decimal list-inside text-zinc-300">
          <li>
            <strong className="text-white">Pick a game.</strong> Browse{" "}
            <Link href="/discover" className="text-violet-400 hover:underline">game templates</Link>{" "}
            or create a custom one. Werewolf and Murder Mystery are popular for teams.
          </li>
          <li>
            <strong className="text-white">Share the invite link.</strong> Send the game link to
            your team. They join in their browser — no sign-up required for guests.
          </li>
          <li>
            <strong className="text-white">Let the AI host.</strong> The AI Game Master assigns
            roles, runs phases, and narrates. You just play.
          </li>
          <li>
            <strong className="text-white">Debrief after.</strong> A quick 5-minute chat about what
            happened reinforces the team building effect.
          </li>
        </ol>

        {/* ── Why AI Hosting Works for Teams ─────────────────────────────── */}
        <H2 id="why-ai-hosting">Why AI Hosting Works for Teams</H2>

        <P>
          Traditional team games often need a moderator — someone who knows the rules, keeps score,
          and keeps things fair. That person can&apos;t fully participate. With{" "}
          <strong className="text-white">AI hosting</strong>, everyone plays. No one has to sit out to
          run the game.
        </P>

        <P>
          The AI is neutral and consistent. It doesn&apos;t favor anyone, forget rules, or get
          tired. Teams get a fair, focused experience — and managers can join in the fun instead of
          facilitating.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>How many people do we need for virtual team building games?</H3>
            <P>
              Most games work with 3 or more players — there's no upper limit. AI fills empty seats, so even a small team of 3–4
              can play Werewolf or Murder Mystery. For larger teams, split into multiple games or
              rotate who plays.
            </P>
          </div>
          <div>
            <H3>Do team members need to create accounts?</H3>
            <P>
              The host creates the game and shares a link. Guests can join without signing up — they
              just open the link in their browser. Accounts are optional for returning players.
            </P>
          </div>
          <div>
            <H3>What if our team is in different time zones?</H3>
            <P>
              Pick a time that works for most people, or run shorter games (e.g., 20–30 min) that
              fit into overlapping hours. Trivia and Who&apos;s the Spy are quick; Werewolf and Murder
              Mystery take 30–45 minutes.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Build Your Remote Team?
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, share the link, and let the AI host. No moderator needed. See more ideas in
            our{" "}
            <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">
              best online party games
            </Link>{" "}
            guide.
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
