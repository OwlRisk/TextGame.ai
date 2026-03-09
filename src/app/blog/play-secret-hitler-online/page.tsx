import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import { ChatPreviewWidget } from "@/app/components/blog/ChatPreviewWidget";

const TITLE = "Play Secret Hitler Online with AI — Rules, Strategy & Free Game";
const DESCRIPTION =
  "Learn the rules of Secret Hitler, every role explained, winning strategies, and how to play online for free with an AI Game Master. Liberals vs Fascists — no moderator needed.";
const CANONICAL = "/blog/play-secret-hitler-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "secret hitler online",
    "play secret hitler online",
    "secret hitler rules",
    "secret hitler strategy",
    "secret hitler game online free",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-secret-hitler-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-secret-hitler-online.png"],
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
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } },
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

export default function PlaySecretHitlerOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Secret Hitler Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Secret Hitler</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Secret Hitler is a social deduction game where Liberals and Fascists battle over policy cards —
            but Fascists are hidden among the players, and Hitler lurks in the shadows. Now you can play
            it online with AI — no physical board, no human moderator. Here&apos;s everything you need to know.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-secret-hitler-online.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* TOC */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What is Secret Hitler?" },
              { id: "roles", label: "Roles Explained" },
              { id: "rules", label: "How to Play — Rules Step by Step" },
              { id: "win-conditions", label: "Win Conditions" },
              { id: "strategy", label: "Strategy Tips" },
              { id: "online", label: "Play Secret Hitler Online" },
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

        {/* ── What is Secret Hitler ─────────────────────────────────── */}
        <ChatPreviewWidget gameSlug="secret-hitler" />

        <H2 id="what-is">What is Secret Hitler?</H2>
        <P>
          Secret Hitler is a <strong className="text-white">social deduction party game</strong> set in
          1930s Germany. Players are divided into two teams: <strong className="text-white">Liberals</strong> (the
          majority) and <strong className="text-white">Fascists</strong> (the minority). One Fascist is
          secretly <strong className="text-white">Hitler</strong> — and nobody knows who.
        </P>
        <P>
          Each round, players elect a President and Chancellor who draw policy cards and must enact one.
          Liberals want to pass Liberal policies and identify Hitler before it&apos;s too late. Fascists want
          to pass Fascist policies — or get Hitler elected Chancellor after enough Fascist policies are
          enacted. It&apos;s a game of <strong className="text-white">trust, betrayal, and political deception</strong>.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">5–10 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30–45 min</p></div>
            <div><p className="text-2xl mb-1">🎯</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Strategic</p></div>
          </div>
        </div>

        {/* ── Roles ────────────────────────────────────────────────── */}
        <H2 id="roles">Roles Explained</H2>
        <P>Secret Hitler has three roles:</P>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🗳️</span>
              <div>
                <p className="font-bold text-white">Liberal</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-blue-400 bg-blue-500/10">Liberal</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400">You have no information about other players. Work to pass Liberal policies and identify who&apos;s secretly Fascist — or Hitler.</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎭</span>
              <div>
                <p className="font-bold text-white">Fascist</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-red-400 bg-red-500/10">Fascist</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400">You know your fellow Fascists and Hitler. Manipulate elections, enact Fascist policies, and protect Hitler until they can be elected Chancellor.</p>
          </div>
          <div className="sm:col-span-2 bg-zinc-900/60 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎩</span>
              <div>
                <p className="font-bold text-white">Hitler</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-zinc-300 bg-zinc-600/30">Fascist</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400">You don&apos;t know who the other Fascists are. Blend in with Liberals and try to be elected Chancellor after 3+ Fascist policies have been enacted — that&apos;s an instant Fascist win.</p>
          </div>
        </div>
        <P>
          On {SITE_NAME}, the <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">AI Game Master assigns roles
          secretly</TrackedGameLink> at the start — you don&apos;t need to deal cards or have a moderator.
        </P>

        {/* ── Rules ────────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Rules Step by Step</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "Roles are assigned secretly. Liberals don't know who anyone is. Fascists know each other and Hitler. Hitler doesn't know who the other Fascists are." },
            { phase: "Nominate Government", desc: "The President (rotates each round) nominates a Chancellor. The previous President and Chancellor cannot be Chancellor again." },
            { phase: "Vote", desc: "All players vote Ja (approve) or Nein (reject) on the proposed government. If rejected, the next player becomes President and nominates again. Three rejections in a row enacts a random policy." },
            { phase: "Enact Policy", desc: "If approved, the President draws 3 policy cards, discards 1 secretly, and passes 2 to the Chancellor. The Chancellor discards 1 and enacts the other — adding it to the board." },
            { phase: "Special Powers", desc: "After certain Fascist policies are enacted, the President gains powers: peek at 3 policies, investigate a player's loyalty, choose the next President, or assassinate a player (revealing their role)." },
            { phase: "Repeat", desc: "A new President is chosen and the cycle continues until a team wins." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.phase}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Win Conditions ───────────────────────────────────────── */}
        <H2 id="win-conditions">Win Conditions</H2>
        <div className="space-y-4 mb-8">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <H3>Liberals Win</H3>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
              <li><strong className="text-white">5 Liberal policies enacted</strong> — the board shows 5 blue policies.</li>
              <li><strong className="text-white">Assassinate Hitler</strong> — use the assassination power (unlocked after enough Fascist policies) to kill the player who is Hitler.</li>
            </ul>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <H3>Fascists Win</H3>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
              <li><strong className="text-white">6 Fascist policies enacted</strong> — the board shows 6 red policies.</li>
              <li><strong className="text-white">Elect Hitler as Chancellor</strong> — after 3+ Fascist policies are already on the board, if Hitler is elected Chancellor, Fascists win immediately.</li>
            </ul>
          </div>
        </div>

        {/* ── Strategy ─────────────────────────────────────────────── */}
        <H2 id="strategy">Strategy Tips</H2>
        <H3>As a Liberal</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Track policies.</strong> Count how many Liberal vs Fascist policies have been enacted. If a President-Chancellor pair keeps enacting Fascist policies, one or both may be Fascist.</li>
          <li><strong className="text-white">Test with nominations.</strong> Nominate suspected Liberals as Chancellor to see if they enact Liberal policies. Fascists may be forced to pass Fascist policies when they have no choice.</li>
          <li><strong className="text-white">Watch voting patterns.</strong> Fascists often vote Nein on Liberal governments to stall. Liberals voting Ja on suspicious governments may be Fascists trying to look innocent.</li>
          <li><strong className="text-white">Use investigation wisely.</strong> If you get the investigate power, share (or strategically withhold) what you learn to help the team.</li>
        </ul>

        <H3>As a Fascist</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Blend in.</strong> Act like a Liberal. Accuse others, express concern about Fascist policies, and vote Ja on some Liberal governments to build trust.</li>
          <li><strong className="text-white">Support Hitler subtly.</strong> Don&apos;t make it obvious. Vote for Hitler when it seems natural. Help them get elected Chancellor after 3 Fascist policies.</li>
          <li><strong className="text-white">Create chaos.</strong> Vote Nein on Liberal governments. Spread doubt about who the real Fascists are. Get Liberals to suspect each other.</li>
          <li><strong className="text-white">Protect Hitler.</strong> If you have the assassination power, don&apos;t kill Hitler. Eliminate confirmed Liberals or key investigators.</li>
        </ul>

        {/* ── Online ───────────────────────────────────────────────── */}
        <H2 id="online">Play Secret Hitler Online</H2>
        <P>
          Traditionally, Secret Hitler needs 5–10 people and a physical board. With{" "}
          <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          you can play anytime:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> runs all phases — nominations, voting, policy enactment, special powers. No human moderator needed.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI players fill empty seats.</strong> Play with 2 friends and AI fills the rest. Or play solo against a full table of AI.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite with a link.</strong> Friends join in their browser — no app, no sign-up for guests.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🗣️</span>
            <p className="text-zinc-300"><strong className="text-white">AI characters have voices</strong> and unique personalities. They argue, accuse, defend, and bluff — just like real players.</p>
          </div>
        </div>
        <P>
          Browse more <Link href="/discover" className="text-violet-400 hover:underline">social deduction games</Link> or see our{" "}
          <Link href="/blog/best-social-deduction-games" className="text-violet-400 hover:underline">best social deduction games</Link> list.
          If you enjoy Werewolf, try <Link href="/blog/play-werewolf-online" className="text-violet-400 hover:underline">playing Werewolf online</Link> too.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many people do you need to play Secret Hitler?</H3>
            <P>
              Secret Hitler is designed for 5–10 players. On {SITE_NAME}, you can start with just 1–2 humans —
              AI characters fill the rest of the seats. Games support 5–10 players.
            </P>
          </div>
          <div>
            <H3>Can I play Secret Hitler alone?</H3>
            <P>
              Yes! On {SITE_NAME}, the AI fills every other seat with unique characters that have their own
              strategies. It&apos;s a full game even with just you.
            </P>
          </div>
          <div>
            <H3>How does Hitler win in Secret Hitler?</H3>
            <P>
              Hitler wins for the Fascist team if elected as Chancellor after three or more Fascist policies
              have already been enacted. At that moment, the game ends immediately and Fascists win.
            </P>
          </div>
          <div>
            <H3>Is Secret Hitler free to play online?</H3>
            <P>
              Yes. On {SITE_NAME}, you can <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">play Secret Hitler online for free</TrackedGameLink> with
              an AI Game Master and AI players. No subscription required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎩 Play Secret Hitler Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. No moderator needed. Start a game in 30 seconds.
          </p>
          <TrackedGameLink
            href="/games/secret-hitler"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Secret Hitler Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
