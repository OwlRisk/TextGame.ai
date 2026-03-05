import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "TextGame.ai vs Novel AI — AI Gaming vs AI Writing (2026)";
const DESCRIPTION =
  "Compare TextGame.ai and Novel AI: multiplayer AI games with an AI Game Master vs creative writing and image generation. Find the best novel ai alternative for games or prose.";
const CANONICAL = "/blog/textgame-vs-novel-ai";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "novel ai alternative",
    "novel ai vs",
    "ai writing game",
    "novelai alternative for games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
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
  dateModified: PUBLISHED,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` },
  },
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

export default function TextgameVsNovelAiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">TextGame.ai vs Novel AI</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">AI Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Both {SITE_NAME} and Novel AI use AI to power creative experiences — but they&apos;re built for
            different goals. One is a multiplayer game platform with an AI Game Master; the other excels at
            creative writing and image generation. Here&apos;s how they compare and when to choose each.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "overview", label: "Overview of Both Platforms" },
              { id: "key-differences", label: "Key Differences" },
              { id: "when-textgame", label: "When to Choose TextGame.ai" },
              { id: "when-novel", label: "When to Choose Novel AI" },
              { id: "use-both", label: "Can You Use Both?" },
              { id: "feature-table", label: "Feature Comparison Table" },
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

        {/* ── Overview ───────────────────────────────────────────────── */}
        <H2 id="overview">Overview of Both Platforms</H2>
        <P>
          <strong className="text-white">Novel AI</strong> is a creative writing and image generation
          platform. It focuses on high-quality prose, story generation, and AI-generated artwork. Writers
          use it for fiction, roleplay scenarios, and visual storytelling. It&apos;s known for strong
          privacy controls and uncensored creative freedom.
        </P>
        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> is a{" "}
          <strong className="text-white">multiplayer game platform</strong> with an AI Game Master. Instead
          of open-ended writing, it provides structured games — Werewolf, Mafia, RPGs — with rules, roles,
          phases, and win conditions. AI characters fill empty seats and play alongside you and your friends.
        </P>

        {/* ── Key Differences ──────────────────────────────────────── */}
        <H2 id="key-differences">Key Differences</H2>
        <P>
          The core distinction: Novel AI is an <strong className="text-white">ai writing game</strong> tool
          for prose and images; {SITE_NAME} is for <strong className="text-white">playing games</strong> with
          structure and multiplayer. Novel AI has no game mechanics — no roles, voting, or phases. {SITE_NAME}
          has no image generation or long-form story editor. Each excels in its domain.
        </P>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Aspect</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">{SITE_NAME}</th>
                <th className="py-3 text-zinc-400 font-semibold">Novel AI</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Primary Use</td>
                <td className="py-3 pr-4">Multiplayer games</td>
                <td className="py-3">Creative writing &amp; images</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Game Mechanics</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Rules, roles, phases</td>
                <td className="py-3 text-red-400">✗ None</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">AI Game Master</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Dedicated host per session</td>
                <td className="py-3 text-red-400">✗ No host</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Multiplayer</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Real-time with friends</td>
                <td className="py-3 text-red-400">✗ Solo only</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Prose Quality</td>
                <td className="py-3 pr-4 text-zinc-300">Game-focused narration</td>
                <td className="py-3 text-emerald-400">✓ Optimized for writing</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Image Generation</td>
                <td className="py-3 pr-4 text-red-400">✗</td>
                <td className="py-3 text-emerald-400">✓ Built-in</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Privacy</td>
                <td className="py-3 pr-4 text-zinc-300">Standard</td>
                <td className="py-3 text-emerald-400">✓ Strong controls</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── When to Choose TextGame.ai ────────────────────────────── */}
        <H2 id="when-textgame">When to Choose TextGame.ai</H2>
        <P>
          Choose {SITE_NAME} when you want <strong className="text-white">structured multiplayer games</strong>.
          It&apos;s the best novelai alternative for games if you&apos;re looking for:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Multiplayer</strong> — Play with friends and AI in real time</li>
          <li><strong className="text-white">Game mechanics</strong> — Roles, voting, phases, win conditions</li>
          <li><strong className="text-white">AI Game Master</strong> — A host that runs the session and enforces rules</li>
          <li><strong className="text-white">Structured games</strong> — Werewolf, Mafia, Secret Hitler, custom RPGs</li>
        </ul>
        <P>
          <Link href="/discover" className="text-violet-400 hover:underline font-semibold">Browse games</Link>{" "}
          or describe your own rules in plain English. No API key needed — start playing in minutes.
        </P>

        {/* ── When to Choose Novel AI ───────────────────────────────── */}
        <H2 id="when-novel">When to Choose Novel AI</H2>
        <P>
          Choose Novel AI when you want <strong className="text-white">creative writing and imagery</strong>.
          It excels at:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Prose quality</strong> — Models tuned for fiction and narrative</li>
          <li><strong className="text-white">Image generation</strong> — AI art for characters and scenes</li>
          <li><strong className="text-white">Privacy</strong> — Strong data controls and uncensored output</li>
          <li><strong className="text-white">Creative writing</strong> — Long-form stories, roleplay scenarios</li>
        </ul>
        <P>
          Novel AI is built for writers who want to co-create stories and visuals with AI, not play
          structured games with rules and other players.
        </P>

        {/* ── Can You Use Both? ─────────────────────────────────────── */}
        <H2 id="use-both">Can You Use Both?</H2>
        <P>
          Yes. They serve different needs. Use Novel AI when you want to write stories or generate images
          in a private, creative space. Use {SITE_NAME} when you want to play games with friends or AI
          characters. Many users enjoy both — writing with Novel AI and gaming with {SITE_NAME} — depending
          on their mood.
        </P>

        {/* ── Feature Comparison Table ──────────────────────────────── */}
        <H2 id="feature-table">Feature Comparison Table</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">{SITE_NAME}</th>
                <th className="py-3 text-zinc-400 font-semibold">Novel AI</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Multiplayer</td>
                <td className="py-3 pr-4 text-emerald-400">✓</td>
                <td className="py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Game Rules Engine</td>
                <td className="py-3 pr-4 text-emerald-400">✓</td>
                <td className="py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">AI Game Master</td>
                <td className="py-3 pr-4 text-emerald-400">✓</td>
                <td className="py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Voice / TTS</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Per-character</td>
                <td className="py-3 text-red-400">✗</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Prose / Writing</td>
                <td className="py-3 pr-4 text-zinc-300">Game narration</td>
                <td className="py-3 text-emerald-400">✓ Optimized</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Image Generation</td>
                <td className="py-3 pr-4 text-red-400">✗</td>
                <td className="py-3 text-emerald-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Best For</td>
                <td className="py-3 pr-4">Multiplayer games, social deduction</td>
                <td className="py-3">Creative writing, fiction, images</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is TextGame.ai a Novel AI alternative?</H3>
            <P>
              For <strong className="text-white">games</strong>, yes. If you want an ai writing game that
              plays like Werewolf or Mafia with rules and multiplayer, {SITE_NAME} is the novel ai alternative
              for games. Novel AI doesn&apos;t support game mechanics or multiplayer — it&apos;s for writing
              and images.
            </P>
          </div>
          <div>
            <H3>Can Novel AI run multiplayer games?</H3>
            <P>
              No. Novel AI is designed for solo creative writing and image generation. There&apos;s no game
              rules engine, AI Game Master, or multiplayer support. For structured games with friends or AI
              players, use{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link>.
            </P>
          </div>
          <div>
            <H3>Which is better for creative writing?</H3>
            <P>
              Novel AI. Its models are tuned for prose quality, long-form fiction, and uncensored creative
              output. {SITE_NAME} focuses on game narration — short, punchy descriptions for game events.
              For serious writing, Novel AI wins.
            </P>
          </div>
          <div>
            <H3>Can I use both for different purposes?</H3>
            <P>
              Absolutely. Use Novel AI for writing stories and generating images; use {SITE_NAME} for playing
              social deduction games, RPGs, and custom games with an AI Game Master. They complement each
              other rather than compete.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Play AI Games?</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, invite friends, and let the AI Game Master handle the rest. Free to start.
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
