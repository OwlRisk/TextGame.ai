import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import { BlogCTAButton } from "@/app/components/blog/BlogCTAButton";

const TITLE = "Best Single Player Games with AI Companions (2026)";
const DESCRIPTION =
  "Play games alone with AI — solo Werewolf, Murder Mystery, AI Dungeon, and more. No friends online? AI fills every seat. Available 24/7, adapts to you.";
const CANONICAL = "/blog/best-single-player-ai-games";
const PUBLISHED = "2026-03-04T00:00:00Z";
const MODIFIED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "single player ai games",
    "play games alone with ai",
    "solo ai games",
    "ai companion games",
    "games to play alone online",
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
    tags: ["Listicle", "Solo Gaming"],
    images: [{ url: "/blog/blog-best-single-player-ai-games.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-best-single-player-ai-games.png"],
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

export default function BestSinglePlayerAiGamesPage() {
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
          <span className="text-zinc-400">Best Single Player AI Games</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Listicle
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Solo Gaming
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            Want to play games but no one&apos;s around? AI companions fill the table. Solo mode
            lets you play Werewolf, Murder Mystery, and more — entirely by yourself, with AI
            characters as opponents and allies. Here are the best options for playing alone.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-best-single-player-ai-games.png"
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
              { id: "why-play-ai", label: "Why Play Games with AI?" },
              { id: "best-solo-games", label: "Best Solo AI Games" },
              { id: "solo-vs-multiplayer", label: "Solo vs Multiplayer — You Choose" },
              { id: "tips-solo", label: "Tips for Solo AI Gaming" },
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

        {/* ── Why Play Games with AI? ───────────────────────────────────── */}
        <H2 id="why-play-ai">Why Play Games with AI?</H2>

        <P>
          AI gaming companions solve the &quot;no one to play with&quot; problem. They&apos;re{" "}
          <strong className="text-white">available 24/7</strong> — no scheduling, no time zones,
          no waiting for friends to be free. You can start a game at 2 AM if you want.
        </P>

        <P>
          AI also <strong className="text-white">adapts to you</strong>. It plays at your pace,
          responds to your moves, and can scale difficulty. Whether you want a chill practice round
          or a challenging match, solo AI games deliver.
        </P>

        {/* ── Best Solo AI Games ─────────────────────────────────────────── */}
        <H2 id="best-solo-games">Best Solo AI Games</H2>

        <P>
          Six options for playing alone with AI:
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>{SITE_NAME} Solo Mode</H3>
            <P>
              AI fills every seat. Play Werewolf, Murder Mystery, Who&apos;s the Spy, and more —
              you&apos;re the only human. Each AI character has a unique personality and strategy.
              Full game experience, no friends required.
            </P>
            <Link href="/discover" className="text-violet-400 hover:underline text-sm font-semibold">
              Browse Solo Games →
            </Link>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>AI Dungeon</H3>
            <P>
              Freeform text adventures where you type actions and the AI narrates. No rules, no
              turns — pure open-ended storytelling. Great for solo creative play when you want
              something unstructured.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>{SITE_NAME} Werewolf Solo</H3>
            <P>
              Practice social deduction against AI. The AI plays werewolves and villagers with
              distinct strategies. Learn to read bluffs and improve before playing with friends.
            </P>
            <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Werewolf Solo →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>{SITE_NAME} Murder Mystery Solo</H3>
            <P>
              Solve a unique murder case generated by the AI. Interrogate suspects, gather clues,
              and accuse the culprit. The AI plays every character — a full detective experience
              alone.
            </P>
            <TrackedGameLink href="/games/detective-mystery" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Murder Mystery Solo →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Tarot AI Reading</H3>
            <P>
              Reflective, introspective experience. Draw cards, get AI interpretations, and explore
              themes. Not competitive — more like a guided solo reflection.
            </P>
            <TrackedGameLink href="/games/tarot" className="text-violet-400 hover:underline text-sm font-semibold">
              Try Tarot AI →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Custom Solo Scenarios</H3>
            <P>
              Describe any game or scenario — the AI builds it. Solo RPG, puzzle, or custom rules.
              Endless possibilities for personalized solo play.
            </P>
            <Link href="/discover" className="text-violet-400 hover:underline text-sm font-semibold">
              Create Custom Game →
            </Link>
          </div>
        </div>

        {/* ── Solo vs Multiplayer — You Choose ─────────────────────────── */}
        <H2 id="solo-vs-multiplayer">Solo vs Multiplayer — You Choose</H2>

        <P>
          On {SITE_NAME}, you can <strong className="text-white">switch seamlessly</strong>. Start
          a game solo to learn the rules, then invite friends later. Or play solo when no one&apos;s
          available and multiplayer when your group is online. Same games, same AI host — you choose
          the mode.
        </P>

        {/* ── Tips for Solo AI Gaming ───────────────────────────────────── */}
        <H2 id="tips-solo">Tips for Solo AI Gaming</H2>

        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li>
            <strong className="text-white">Engage with AI characters.</strong> Treat them like real
            players — respond to their arguments, form alliances, call bluffs.
          </li>
          <li>
            <strong className="text-white">Try different strategies.</strong> Solo is perfect for
            experimenting. Test new tactics without pressure.
          </li>
          <li>
            <strong className="text-white">Experiment with custom games.</strong> Describe your
            ideal solo experience and let the AI build it.
          </li>
        </ul>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>Is solo mode the same as multiplayer?</H3>
            <P>
              Yes — same rules, same AI host, same game flow. The only difference is that AI
              characters fill all non-human seats. You get the full experience.
            </P>
          </div>
          <div>
            <H3>How does {SITE_NAME} compare to AI Dungeon for solo play?</H3>
            <P>
              AI Dungeon is open-ended storytelling with no rules. {SITE_NAME} offers structured
              games (Werewolf, Murder Mystery, etc.) with defined roles and win conditions. For
              more, see our{" "}
              <Link href="/blog/ai-dungeon-vs-textgame" className="text-violet-400 hover:underline">
                AI Dungeon vs TextGame.ai comparison
              </Link>
              .
            </P>
          </div>
          <div>
            <H3>Can I add friends to a solo game later?</H3>
            <P>
              Games are session-based. Start a new game and invite friends when they&apos;re
              available. You can always play solo first to learn, then run a multiplayer session.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Play Solo — Anytime
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI fills every seat. Werewolf, Murder Mystery, Tarot, and more. No waiting, no group needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BlogCTAButton href="/" source="best-single-player-ai-games">
              Play Free Now
            </BlogCTAButton>
            <BlogCTAButton href="/create?preset=werewolf" source="best-single-player-ai-games-werewolf" variant="secondary">
              Try Werewolf Solo
            </BlogCTAButton>
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
