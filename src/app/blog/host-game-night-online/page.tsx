import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "How to Host a Virtual Game Night — Complete Guide (2026)";
const DESCRIPTION =
  "Everything you need to host an amazing virtual game night — choosing games, inviting friends, tech setup, icebreakers, and how AI simplifies hosting for any group size.";
const CANONICAL = "/blog/host-game-night-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "virtual game night",
    "online game night ideas",
    "how to host game night online",
    "game night with friends online",
    "remote game night",
    "virtual game night for adults",
    "online game night games",
    "zoom game night",
    "game night ideas",
    "host game night",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-host-game-night-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-host-game-night-online.png"],
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

export default function HostGameNightOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Host a Virtual Game Night</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-pink-500/10 text-pink-400 rounded-full">Game Night</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Whether it&apos;s a weekly tradition with friends or a one-off team event, virtual game nights
            are one of the best ways to connect online. This guide covers everything from picking the
            right games to keeping everyone engaged — plus how AI can handle the hosting for you.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-host-game-night-online.png"
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
              { id: "planning", label: "Planning Your Game Night" },
              { id: "games-by-size", label: "Best Games by Group Size" },
              { id: "tech-setup", label: "Tech Setup Checklist" },
              { id: "icebreakers", label: "Icebreakers & Warm-ups" },
              { id: "ai-hosting", label: "How AI Makes Hosting Effortless" },
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

        {/* ── Planning ─────────────────────────────────────────────── */}
        <H2 id="planning">Planning Your Game Night</H2>
        <P>
          A great game night doesn&apos;t happen by accident. A little planning goes a long way — but
          it doesn&apos;t need to be complicated. Here&apos;s a simple checklist:
        </P>
        <ol className="space-y-4 mb-8">
          {[
            { step: "Pick a Date & Time", desc: "Use a poll (When2meet, Doodle) if coordinating across time zones. Evenings work best — aim for 90 minutes to 2 hours." },
            { step: "Choose Your Games", desc: "Pick 2-3 games of different types (social deduction, trivia, storytelling). Variety keeps energy high." },
            { step: "Send Invites Early", desc: "Share a link at least 3-5 days ahead. Include the time, platform, and a one-line description of what you'll play." },
            { step: "Test Your Setup", desc: "Make sure audio, video, and game links work before guests arrive. Nothing kills momentum like 15 minutes of troubleshooting." },
            { step: "Prepare a Backup", desc: "Have an extra game ready in case one doesn't land. Flexibility is key to a fun night." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.step}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Games by Size ────────────────────────────────────────── */}
        <H2 id="games-by-size">Best Games by Group Size</H2>
        <H3>Small Groups (3–5 people)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Avalon / The Resistance</strong> — Tight deduction with every vote mattering</li>
          <li><strong className="text-white">Codenames (online)</strong> — Classic word association game, great for pairs</li>
          <li><strong className="text-white">Custom AI RPG</strong> — Create a short adventure on {SITE_NAME} for your group</li>
        </ul>
        <H3>Medium Groups (6–10 people)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Werewolf / Mafia</strong> — The gold standard of social deduction</li>
          <li><strong className="text-white">Secret Hitler</strong> — Political intrigue with team-based deduction</li>
          <li><strong className="text-white">Trivia</strong> — Use Kahoot or an AI-generated trivia game on {SITE_NAME}</li>
        </ul>
        <H3>Large Groups (10+ people)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Murder Mystery</strong> — AI assigns characters and clues on {SITE_NAME}</li>
          <li><strong className="text-white">Jackbox Games</strong> — Party packs with drawing, trivia, and bluffing</li>
          <li><strong className="text-white">Among Us</strong> — Visual social deduction, easy for large groups</li>
        </ul>

        {/* ── Tech Setup ───────────────────────────────────────────── */}
        <H2 id="tech-setup">Tech Setup Checklist</H2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          {[
            { emoji: "🎙️", label: "Voice/Video", desc: "Discord, Zoom, or Google Meet for voice chat. Screen share if needed." },
            { emoji: "🎮", label: "Game Platform", desc: `${SITE_NAME} for AI-hosted games — just share a link. No downloads.` },
            { emoji: "📱", label: "Device Check", desc: "Make sure the game works on mobile — some guests won't have a laptop." },
            { emoji: "🔇", label: "Audio Tips", desc: "Ask everyone to use headphones to avoid echo. Mute when not speaking in large groups." },
            { emoji: "📋", label: "Rules Doc", desc: "Share a quick rules summary before you start. Don't assume everyone knows the game." },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="text-lg">{item.emoji}</span>
              <p className="text-zinc-300"><strong className="text-white">{item.label}:</strong> {item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Icebreakers ──────────────────────────────────────────── */}
        <H2 id="icebreakers">Icebreakers &amp; Warm-ups</H2>
        <P>
          Jumping straight into a complex game can be awkward, especially if not everyone knows each
          other. Start with a quick warm-up to get people talking:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Two Truths and a Lie</strong> — Classic. Everyone shares three facts; the group guesses the lie.</li>
          <li><strong className="text-white">Would You Rather</strong> — Quick-fire questions that spark debate and laughter.</li>
          <li><strong className="text-white">One-Word Story</strong> — Go around the group, each person adds one word to a growing story.</li>
          <li><strong className="text-white">Quick Trivia Round</strong> — 5 easy questions to get competitive energy flowing.</li>
        </ul>
        <P>
          On {SITE_NAME}, you can even create a <strong className="text-white">custom AI icebreaker game</strong> —
          just describe what you want and the AI builds it. &quot;A 5-minute warm-up game where everyone
          answers silly hypothetical questions&quot; is all it takes.
        </P>

        {/* ── AI Hosting ───────────────────────────────────────────── */}
        <H2 id="ai-hosting">How AI Makes Hosting Effortless</H2>
        <P>
          The hardest part of hosting a game night is <strong className="text-white">being the host</strong>.
          You have to explain rules, moderate gameplay, track scores, and manage turns — all while
          trying to play yourself. AI changes that completely.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> explains rules, assigns roles, runs phases, and narrates — so you can just play.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">Flexible player count.</strong> AI fills empty seats. 3 friends show up instead of 8? No problem.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">One-click invites.</strong> Share a link — no accounts, no downloads, no app installs for guests.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎲</span>
            <p className="text-zinc-300"><strong className="text-white">Dozens of games.</strong> Switch between Werewolf, trivia, RPGs, and custom games without setup.</p>
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many games should I plan for a 2-hour game night?</H3>
            <P>
              Plan 2–3 games. A short icebreaker (10 min), a main game (30–45 min), and a second
              game or replay. Leave buffer time for chatting — the social part matters most.
            </P>
          </div>
          <div>
            <H3>What if some people don&apos;t know the games?</H3>
            <P>
              Pick games with simple rules or use an AI host that explains everything. On {SITE_NAME},
              the AI Game Master walks new players through rules in real time.
            </P>
          </div>
          <div>
            <H3>Do I need Zoom for a virtual game night?</H3>
            <P>
              Not necessarily. If your game is text-based (like on {SITE_NAME}), the game itself
              has built-in chat. For social deduction games, voice chat on Discord or a call adds
              to the fun but isn&apos;t required.
            </P>
          </div>
          <div>
            <H3>Can I host a game night for a work team?</H3>
            <P>
              Absolutely. Virtual game nights are one of the top remote team-building activities.
              Choose games that are inclusive and don&apos;t require prior gaming knowledge — Werewolf,
              trivia, and storytelling games work great for mixed groups.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-amber-600/20 to-violet-600/20 border border-amber-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎉 Host Your Game Night in 30 Seconds</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, share a link, and let the AI handle the rest. No setup, no moderator, no stress.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Games
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
