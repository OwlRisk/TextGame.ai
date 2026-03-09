import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "What is an AI Game Master? How AI Hosts Tabletop Games";
const DESCRIPTION =
  "Learn what an AI Game Master is, how it automates hosting tabletop games like Werewolf and D&D, assigns roles, manages phases, and narrates — plus how it compares to human GMs and AI Dungeon Masters.";
const CANONICAL = "/blog/ai-game-master-guide";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai game master",
    "ai dungeon master",
    "ai dm",
    "ai host game",
    "ai moderator game",
    "automated game master",
    "ai tabletop",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-ai-game-master-guide.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-ai-game-master-guide.png"],
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

export default function AiGameMasterGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI Game Master Guide</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">AI Game Master</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            An AI Game Master is an artificial intelligence that hosts tabletop games — assigning roles,
            managing phases, narrating the story, and keeping play fair. Here&apos;s what it is, what it
            can do, and how it compares to human GMs and AI Dungeon Masters.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-ai-game-master-guide.png"
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
              { id: "what-is-gm", label: "What is a Game Master?" },
              { id: "what-is-ai-gm", label: "What is an AI Game Master?" },
              { id: "what-can-do", label: "What Can an AI Game Master Do?" },
              { id: "ai-vs-human", label: "AI Game Master vs Human Game Master" },
              { id: "ai-gm-vs-dm", label: "AI Game Master vs AI Dungeon Master" },
              { id: "how-works", label: "How It Works on TextGame.ai" },
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

        {/* ── What is a Game Master ────────────────────────────────── */}
        <H2 id="what-is-gm">What is a Game Master?</H2>
        <P>
          A <strong className="text-white">Game Master</strong> (GM) is the person who runs a tabletop game.
          In games like <strong className="text-white">D&amp;D</strong>, they&apos;re called a Dungeon Master (DM).
          In <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink> or{" "}
          <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">Mafia</TrackedGameLink>, they&apos;re the
          moderator. In any structured tabletop game, the GM manages the rules, narrates the story, keeps
          play fair, and guides the experience.
        </P>
        <P>
          The GM explains the rules, assigns secret roles, runs day and night phases, tracks votes, announces
          outcomes, and makes sure everyone follows the game structure. Without a GM, most of these games
          can&apos;t be played — which is why finding a willing moderator has always been a bottleneck.
        </P>

        {/* ── What is an AI Game Master ─────────────────────────────── */}
        <H2 id="what-is-ai-gm">What is an AI Game Master?</H2>
        <P>
          An <strong className="text-white">AI Game Master</strong> is artificial intelligence that does the
          same job automatically. It assigns roles, runs phases, narrates the story, manages votes, and
          enforces rules — no human moderator needed.
        </P>
        <P>
          The AI understands the game structure, knows who has which role, tracks who voted for whom, and
          announces results in natural language. It can host Werewolf, Mafia, murder mysteries, RPGs, and
          custom games you describe in plain English. On platforms like{" "}
          <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>, the
          AI Game Master also controls AI players that fill empty seats, so you can play solo or with just
          a few friends.
        </P>

        {/* ── What Can an AI Game Master Do ─────────────────────────── */}
        <H2 id="what-can-do">What Can an AI Game Master Do?</H2>
        <P>Here&apos;s what a capable AI Game Master can handle:</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Assign secret roles</strong> — Werewolf, Villager, Seer, Doctor, etc., without anyone else seeing</li>
          <li><strong className="text-white">Manage day/night phases</strong> — run night actions, then day discussion, then voting, in the correct order</li>
          <li><strong className="text-white">Track votes</strong> — count votes, determine who is eliminated, and reveal roles when appropriate</li>
          <li><strong className="text-white">Narrate the story</strong> — describe what happens, set the scene, and keep the narrative flowing</li>
          <li><strong className="text-white">Enforce rules</strong> — prevent invalid moves, resolve conflicts, and declare winners</li>
          <li><strong className="text-white">Control AI players</strong> — fill empty seats with AI characters that have unique personalities and strategies</li>
          <li><strong className="text-white">Provide unique voices</strong> — each AI character can speak with a distinct style and personality</li>
        </ul>
        <P>
          On <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link>, the AI
          Game Master does all of this for structured games like Werewolf, Mafia, and custom variants you
          create.
        </P>

        {/* ── AI vs Human GM ────────────────────────────────────────── */}
        <H2 id="ai-vs-human">AI Game Master vs Human Game Master</H2>
        <P>How does an AI GM compare to a human?</P>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Aspect</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">AI Game Master</th>
                <th className="py-3 text-zinc-400 font-semibold">Human Game Master</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Availability</td>
                <td className="py-3 pr-4">24/7, anytime you want to play</td>
                <td className="py-3">Depends on schedules and willingness</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Fairness</td>
                <td className="py-3 pr-4">Consistent, no bias or fatigue</td>
                <td className="py-3">Can vary; may slip or favor players</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Speed</td>
                <td className="py-3 pr-4">Runs phases and votes quickly</td>
                <td className="py-3">Pace depends on the person</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Flexibility</td>
                <td className="py-3 pr-4">Can host any game you describe</td>
                <td className="py-3">Limited by GM knowledge and prep time</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Social aspect</td>
                <td className="py-3 pr-4">No human host; AI fills seats</td>
                <td className="py-3">Human connection, inside jokes, table talk</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          AI GMs excel at availability, consistency, and flexibility. Human GMs bring social warmth and
          improvisation. Many players use AI GMs when they can&apos;t gather a group or find a moderator —
          and still invite friends to play alongside the AI.
        </P>

        {/* ── AI GM vs AI DM ────────────────────────────────────────── */}
        <H2 id="ai-gm-vs-dm">AI Game Master vs AI Dungeon Master</H2>
        <P>
          <strong className="text-white">AI Game Master</strong> and <strong className="text-white">AI Dungeon
          Master</strong> are related but not identical:
        </P>
        <P>
          An <strong className="text-white">AI Game Master</strong> typically hosts <strong className="text-white">structured
          games</strong> with defined roles, phases, and victory conditions — like Werewolf, Mafia, or
          social deduction games. The GM enforces rules, manages turns, and keeps the game on track.
        </P>
        <P>
          An <strong className="text-white">AI Dungeon Master</strong> (or AI DM) usually refers to
          <strong className="text-white"> open-ended adventures</strong> — like solo D&amp;D campaigns where
          you describe actions and the AI narrates what happens. Think <Link href="/blog/ai-dungeon-vs-textgame"
          className="text-violet-400 hover:underline">AI Dungeon</Link>-style play: freeform storytelling
          without strict game rules.
        </P>
        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> does
          both. You can play structured games (Werewolf, Mafia, custom social deduction) with an AI Game
          Master, or describe open-ended RPG scenarios and the AI acts as a Dungeon Master — narrating,
          controlling NPCs, and responding to your choices. See our{" "}
          <Link href="/blog/roleplay-ai-guide" className="text-violet-400 hover:underline">roleplay AI guide</Link>{" "}
          for more on the different types.
        </P>

        {/* ── How It Works on TextGame.ai ────────────────────────────── */}
        <H2 id="how-works">How It Works on TextGame.ai</H2>
        <P>
          On {SITE_NAME}, the AI Game Master powers every game. Here&apos;s the flow:
        </P>
        <ol className="space-y-4 mb-8">
          {[
            { title: "Describe your game", desc: "Pick a template like Werewolf or Mafia, or describe your own rules in plain English. The AI Game Master understands and sets up the game." },
            { title: "GM sets up roles", desc: "The AI assigns secret roles to each player (human and AI), explains the rules, and prepares the first phase." },
            { title: "GM runs the session", desc: "Night phases, day discussion, voting, reveals — the AI manages everything. It narrates what happens and announces results." },
            { title: "AI players fill seats", desc: "Don't have enough humans? AI characters take the empty seats. Each has a unique personality, voice, and strategy." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.title}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <P>
          Want to try it? <Link href="/discover" className="text-violet-400 hover:underline">Browse games</Link>{" "}
          or <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">learn how to
          create your own game with AI</Link>.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can an AI Game Master replace a human moderator?</H3>
            <P>
              For structured games like Werewolf and Mafia, yes — the AI handles rules, phases, and
              narration. Many players prefer it when they can&apos;t find a human moderator or want to play
              solo. For social table talk and improvisation, a human GM still has an edge.
            </P>
          </div>
          <div>
            <H3>Does the AI Game Master know everyone&apos;s roles?</H3>
            <P>
              Yes. The AI assigns and tracks all roles. It knows who is a Werewolf, who is the Seer, etc.
              It uses this to run night actions and reveal information at the right time — but it never
              leaks secrets to players.
            </P>
          </div>
          <div>
            <H3>Can I create a custom game with an AI Game Master?</H3>
            <P>
              Yes. On {SITE_NAME}, you describe your game in plain English — roles, phases, win conditions.
              The AI Game Master builds and runs it. No coding required. See our{" "}
              <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">create game
              with AI guide</Link>.
            </P>
          </div>
          <div>
            <H3>What&apos;s the difference between an AI Game Master and AI Dungeon?</H3>
            <P>
              AI Dungeon is a solo, open-ended text adventure — you describe actions and the AI narrates.
              An AI Game Master hosts structured multiplayer games with rules, roles, and victory conditions.
              {SITE_NAME} supports both: structured games (Werewolf, Mafia, custom) and open-ended RPG-style
              play. <Link href="/blog/ai-dungeon-vs-textgame" className="text-violet-400 hover:underline">Compare
              AI Dungeon vs TextGame.ai</Link> for details.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Try an AI Game Master</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Play Werewolf, Mafia, or create your own game. The AI Game Master runs the session — assign
            roles, manage phases, narrate the story. AI players fill every seat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Browse Games
            </Link>
            <TrackedGameLink href="/games/werewolf" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Play Werewolf
            </TrackedGameLink>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
