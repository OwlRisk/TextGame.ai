import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "20 Best Free Online Games to Play with Friends — No Download (2026)";
const DESCRIPTION =
  "The ultimate list of free online games you can play with friends in 2026 — no download required. Social deduction, word games, party games, trivia, escape rooms, and AI-powered storytelling.";
const CANONICAL = "/blog/free-online-games-with-friends";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "free online games with friends",
    "games to play with friends online",
    "online multiplayer games free",
    "party games online",
    "no download games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-free-online-games-with-friends.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-free-online-games-with-friends.png"],
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

export default function FreeOnlineGamesWithFriendsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Free Online Games with Friends</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Listicle</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Multiplayer</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Free Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Looking for games you can jump into with friends right now — no download, no install, just
            a browser? We&apos;ve rounded up 20 of the best free online multiplayer games for 2026,
            from social deduction to trivia to AI-powered storytelling.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>10 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-free-online-games-with-friends.png"
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
              { id: "social-deduction", label: "Social Deduction Games" },
              { id: "word-party", label: "Word & Party Games" },
              { id: "trivia-quiz", label: "Trivia & Quiz Games" },
              { id: "escape-puzzle", label: "Escape Rooms & Puzzles" },
              { id: "ai-storytelling", label: "AI Storytelling & RPG Games" },
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

        {/* ── Social Deduction Games ─────────────────────────────────── */}
        <H2 id="social-deduction">Social Deduction Games</H2>
        <P>
          Social deduction games are the ultimate test of trust and deception. Someone in your group
          is secretly working against you — figure out who before it&apos;s too late.
        </P>

        <H3>1. Werewolf (on TextGame.ai)</H3>
        <P>
          The classic hidden-role game where villagers try to identify werewolves before they&apos;re
          all eliminated.{" "}
          <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Play Werewolf on {SITE_NAME}</TrackedGameLink>{" "}
          with an AI Game Master that assigns roles, runs night/day phases, and controls AI villagers. Works with 1–20 players.
        </P>

        <H3>2. Mafia (on TextGame.ai)</H3>
        <P>
          Mafia follows similar rules to Werewolf with a crime-family theme. The AI moderator manages
          accusations, votes, and reveals.{" "}
          <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">Play Mafia online</TrackedGameLink> — free, no download.
        </P>

        <H3>3. Secret Hitler (on TextGame.ai)</H3>
        <P>
          A political deduction game where liberals and fascists clash over policy. Hidden roles,
          government elections, and escalating tension.{" "}
          <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">Play Secret Hitler</TrackedGameLink>{" "}
          with AI players filling any empty seats.
        </P>

        <H3>4. Among Us</H3>
        <P>
          The massively popular game where crewmates complete tasks while impostors sabotage and
          eliminate. Free on mobile, browser-playable via web versions. Best with 6–10 players.
        </P>

        {/* ── Word & Party Games ─────────────────────────────────────── */}
        <H2 id="word-party">Word &amp; Party Games</H2>

        <H3>5. Codenames Online</H3>
        <P>
          Two teams compete to identify their agents using one-word clues. The free browser version
          at codenames.game works perfectly for remote groups. Great for 4–8 players.
        </P>

        <H3>6. Gartic Phone</H3>
        <P>
          A hilarious telephone-meets-drawing game. Write a sentence, someone draws it, the next
          person guesses what the drawing is, and so on. Results are always chaotic. Free at
          garticphone.com.
        </P>

        <H3>7. Skribbl.io</H3>
        <P>
          One player draws a word while others guess. Simple, addictive, and endlessly fun. No
          account needed — just share the room link.
        </P>

        <H3>8. Boggle / WordHunt Clones</H3>
        <P>
          Several free browser sites offer real-time multiplayer word-search grids. Compete to find
          the most words in a time limit. Great for quick rounds between bigger games.
        </P>

        {/* ── Trivia & Quiz Games ────────────────────────────────────── */}
        <H2 id="trivia-quiz">Trivia &amp; Quiz Games</H2>

        <H3>9. Kahoot!</H3>
        <P>
          Create or play community trivia quizzes in real time. One person hosts, everyone joins on
          their phone or browser. Free for basic use — fantastic for groups of any size.
        </P>

        <H3>10. Trivia Crack</H3>
        <P>
          Challenge friends to category-based trivia duels. Available in-browser and on mobile. The
          competitive ranking system keeps things intense.
        </P>

        <H3>11. JackBox Party Packs (free alternatives)</H3>
        <P>
          While JackBox itself costs money, several free alternatives like BombParty and Quiplash
          clones offer the same energy — prompt-based humor games where players vote on the funniest
          answers.
        </P>

        <H3>12. Quiz Party (on TextGame.ai)</H3>
        <P>
          AI-generated trivia on any topic you choose. The AI Game Master creates questions, tracks
          scores, and adapts difficulty.{" "}
          <Link href="/discover" className="text-violet-400 hover:underline">Try it on {SITE_NAME}</Link>.
        </P>

        {/* ── Escape Rooms & Puzzles ─────────────────────────────────── */}
        <H2 id="escape-puzzle">Escape Rooms &amp; Puzzles</H2>

        <H3>13. Online Escape Rooms</H3>
        <P>
          Sites like Enchambered and The Escape Game offer free virtual escape rooms. You solve
          puzzles collaboratively over video chat or shared screens. Great for team building.
        </P>

        <H3>14. Puzzle Together</H3>
        <P>
          Collaborative online jigsaw puzzles. Relaxing, surprisingly addictive, and you can do
          them with friends in real time. No account required.
        </P>

        <H3>15. AI Mystery Rooms (on TextGame.ai)</H3>
        <P>
          Text-based escape rooms where the AI generates puzzles, clues, and red herrings. Work
          together to solve the mystery before time runs out.{" "}
          <Link href="/discover" className="text-violet-400 hover:underline">Find mystery games on {SITE_NAME}</Link>.
        </P>

        <H3>16. GeoGuessr (free mode)</H3>
        <P>
          Dropped into a random Google Street View location, you guess where you are. The free mode
          offers daily challenges you can compete on with friends.
        </P>

        {/* ── AI Storytelling & RPG ──────────────────────────────────── */}
        <H2 id="ai-storytelling">AI Storytelling &amp; RPG Games</H2>

        <H3>17. AI Text Adventures (on TextGame.ai)</H3>
        <P>
          Create or join AI-powered text adventures in any genre — fantasy, sci-fi, horror, romance.
          Play solo or with friends. The AI narrates, controls NPCs, and adapts to your choices.{" "}
          <Link href="/blog/ai-text-adventure-games" className="text-violet-400 hover:underline">See
          our full guide to AI text adventures</Link>.
        </P>

        <H3>18. AI D&amp;D Campaigns (on TextGame.ai)</H3>
        <P>
          Full D&amp;D-style RPG campaigns with an AI Dungeon Master. Create characters, explore
          worlds, fight monsters, and make choices that matter — all in your browser.{" "}
          <Link href="/blog/play-dnd-with-ai" className="text-violet-400 hover:underline">Learn how
          to play D&amp;D with AI</Link>.
        </P>

        <H3>19. Murder Mystery Games (on TextGame.ai)</H3>
        <P>
          AI-hosted whodunit games where each player gets a character with secrets and motives.
          Investigate, interrogate, and deduce who the killer is.{" "}
          <Link href="/blog/ai-murder-mystery-games" className="text-violet-400 hover:underline">Read
          our murder mystery guide</Link>.
        </P>

        <H3>20. Custom AI Games</H3>
        <P>
          On {SITE_NAME}, you can describe any game in plain English and the AI builds it. Debate
          tournaments, courtroom dramas, reality TV simulations — if you can describe it, the AI can
          host it.{" "}
          <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">Learn
          how to create your own game</Link>.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Do these games really require no download?</H3>
            <P>
              Every game on this list runs in a web browser. Some (like Among Us) also have mobile apps,
              but all can be played without downloading anything. Just share a link and go.
            </P>
          </div>
          <div>
            <H3>How many players do I need?</H3>
            <P>
              It varies by game. Social deduction games work best with 5–10 players. Word games and
              trivia are great with 3+. On {SITE_NAME}, AI players fill empty seats, so you can play
              most games with as few as 1–2 humans.
            </P>
          </div>
          <div>
            <H3>Are these games really free?</H3>
            <P>
              Yes. Every game listed here has a free tier or is completely free. Some platforms offer
              premium features or subscriptions, but you can play without paying.
            </P>
          </div>
          <div>
            <H3>What&apos;s the best game for a large group?</H3>
            <P>
              For 10+ players, try Kahoot! for trivia, Gartic Phone for laughs, or{" "}
              <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf on
              {SITE_NAME}</TrackedGameLink> for intense social deduction. All handle large groups well.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Play Free Games with Friends Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Browse AI-powered multiplayer games — social deduction, RPGs, mysteries, and more. No
            download needed. AI players fill every seat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Discover Games
            </Link>
            <Link href="/create" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Create Your Own
            </Link>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
