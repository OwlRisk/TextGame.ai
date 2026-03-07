import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Wolvesville vs TextGame.ai — Best Werewolf App (2026)";
const DESCRIPTION =
  "Comparing Wolvesville and TextGame.ai for playing Werewolf online. AI Game Master, custom roles, multiplayer — find the best werewolf platform for your group.";
const CANONICAL = "/blog/wolvesville-alternative";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "wolvesville alternative",
    "wolvesville vs textgame",
    "werewolf app",
    "online werewolf game",
    "werewolf game app",
    "best werewolf game online",
    "play werewolf online free",
    "werewolf multiplayer",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE, description: DESCRIPTION, type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED,
    authors: [SITE_NAME], tags: ["Comparison", "Werewolf"],
    images: [{ url: "/blog/blog-wolvesville-alternative.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/blog-wolvesville-alternative.png"] },
};

const articleJsonLd = {
  "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION,
  datePublished: PUBLISHED, dateModified: MODIFIED,
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

export default function WolvesvilleAlternativePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Wolvesville vs TextGame.ai</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Werewolf</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Wolvesville is the most popular Werewolf app on mobile. But if you want an AI Game Master,
            custom games, and the freedom to play with any group size, there&apos;s a strong alternative.
            Here&apos;s a head-to-head comparison.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-wolvesville-alternative.png"
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
              { id: "overview", label: "Quick Overview" },
              { id: "wolvesville", label: "What is Wolvesville?" },
              { id: "textgame", label: "What is TextGame.ai?" },
              { id: "comparison", label: "Feature Comparison" },
              { id: "which", label: "Which Should You Choose?" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">{i + 1}. {item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <H2 id="overview">Quick Overview</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Wolvesville</th>
                <th className="py-3 text-zinc-400 font-semibold">{SITE_NAME}</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {[
                ["Platform", "Mobile app (iOS/Android)", "Browser (any device)"],
                ["Game Master", "Automated system", "AI Game Master with personality"],
                ["AI Players", "No — real players only", "Yes — AI fills empty seats"],
                ["Play with friends", "Limited (ranked queues)", "Yes — invite link"],
                ["Custom games", "No", "Yes — design any game"],
                ["Game types", "Werewolf only", "20+ games (Werewolf, Mafia, Trivia, etc.)"],
                ["Free tier", "Yes (with ads)", "Yes"],
                ["Roles available", "50+ (many locked)", "All roles included"],
              ].map(([feature, wolv, tg]) => (
                <tr key={feature} className="border-b border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold text-white">{feature}</td>
                  <td className="py-3 pr-4">{wolv}</td>
                  <td className="py-3 text-violet-300">{tg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="wolvesville">What is Wolvesville?</H2>
        <P>
          Wolvesville is a mobile Werewolf game with over 50 roles, ranked matches, and a large player base.
          You queue into games with random players and play through night/day phases with an automated system
          managing the game flow.
        </P>
        <H3>Wolvesville Strengths</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Huge role variety</strong> — 50+ roles keep games fresh</li>
          <li><strong className="text-white">Large player base</strong> — quick matchmaking</li>
          <li><strong className="text-white">Ranked system</strong> — competitive progression</li>
          <li><strong className="text-white">Polished mobile app</strong> — smooth UI</li>
        </ul>
        <H3>Wolvesville Limitations</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Random players only</strong> — hard to play private games with friends</li>
          <li><strong className="text-white">Mobile only</strong> — no browser or desktop version</li>
          <li><strong className="text-white">Toxic lobbies</strong> — random matchmaking can be frustrating</li>
          <li><strong className="text-white">Werewolf only</strong> — no other game types</li>
          <li><strong className="text-white">Roles locked behind progression</strong> — grind or pay to unlock</li>
        </ul>

        <H2 id="textgame">What is TextGame.ai?</H2>
        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> is
          an AI-powered game platform with 20+ text-based games. An AI Game Master runs every session —
          assigning roles, narrating the story, managing phases, and filling empty seats with AI characters
          that have unique personalities and strategies.
        </P>
        <H3>TextGame.ai Strengths</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">AI Game Master</strong> — intelligent hosting, not just automated timers</li>
          <li><strong className="text-white">Play with friends</strong> — share a link, they join instantly</li>
          <li><strong className="text-white">AI players</strong> — play solo or with 1 friend and AI fills the rest</li>
          <li><strong className="text-white">20+ game types</strong> —{" "}
            <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>,{" "}
            <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link>,{" "}
            <Link href="/games/avalon" className="text-violet-400 hover:underline">Avalon</Link>,{" "}
            <Link href="/games/trivia" className="text-violet-400 hover:underline">Trivia</Link>, and more
          </li>
          <li><strong className="text-white">Custom game creation</strong> — describe any game and the AI builds it</li>
          <li><strong className="text-white">Browser-based</strong> — works on any device</li>
        </ul>
        <H3>TextGame.ai Limitations</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Text-based</strong> — no visual game elements</li>
          <li><strong className="text-white">Smaller community</strong> — no ranked matchmaking with strangers</li>
          <li><strong className="text-white">Fewer Werewolf roles</strong> than Wolvesville&apos;s 50+</li>
        </ul>

        <H2 id="comparison">Feature Comparison</H2>
        <H3>Playing with Friends</H3>
        <P>
          This is where the platforms diverge most. Wolvesville is built for random matchmaking — playing
          with a specific group of friends requires workarounds. {SITE_NAME} is built for private groups:
          share a link and everyone joins the same room.
        </P>
        <H3>Game Hosting</H3>
        <P>
          Wolvesville uses automated timers and a fixed game engine. {SITE_NAME}&apos;s AI Game Master
          adapts to the players — it narrates events, responds to player actions, and creates unique
          scenarios every game. It&apos;s the difference between a vending machine and a human bartender.
        </P>
        <H3>Game Variety</H3>
        <P>
          Wolvesville is Werewolf and only Werewolf. {SITE_NAME} has 20+ game types across social deduction,
          party games, trivia, roleplay, and creative categories. You can even{" "}
          <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">create your own game</Link> from scratch.
        </P>

        <H2 id="which">Which Should You Choose?</H2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h3 className="font-bold text-white mb-2">Choose Wolvesville if:</h3>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>• You want ranked competitive Werewolf</li>
              <li>• You prefer mobile apps</li>
              <li>• You enjoy playing with random strangers</li>
              <li>• You want 50+ specialized roles</li>
            </ul>
          </div>
          <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-5">
            <h3 className="font-bold text-violet-300 mb-2">Choose {SITE_NAME} if:</h3>
            <ul className="space-y-1.5 text-sm text-zinc-300">
              <li>• You want to play with friends</li>
              <li>• You want AI to fill empty seats</li>
              <li>• You want more than just Werewolf</li>
              <li>• You want to create custom games</li>
              <li>• You prefer browser over mobile app</li>
            </ul>
          </div>
        </div>

        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I play Wolvesville with friends?</H3>
            <P>Wolvesville has limited private game support. It&apos;s primarily designed for ranked matches with random players.</P>
          </div>
          <div>
            <H3>Is TextGame.ai free?</H3>
            <P>Yes — there&apos;s a free tier that lets you play all 20+ games. Premium plans offer more sessions and features.</P>
          </div>
          <div>
            <H3>Which has better AI?</H3>
            <P>
              Wolvesville doesn&apos;t use AI — it has automated game rules. {SITE_NAME} uses a large language
              model as the Game Master, creating dynamic narration and intelligent AI characters.
            </P>
          </div>
          <div>
            <H3>Can I play Werewolf alone on TextGame.ai?</H3>
            <P>
              Yes. AI characters fill every empty seat with unique personalities. You can play a full{" "}
              <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf game</Link> solo.
            </P>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🐺 Play Werewolf with AI</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. Invite your friends or play solo. No download needed.
          </p>
          <Link href="/games/werewolf" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Play Werewolf Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
