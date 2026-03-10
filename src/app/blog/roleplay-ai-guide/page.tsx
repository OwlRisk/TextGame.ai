import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "What is Roleplay AI? The Complete Guide to AI Role-Playing Games (2026)";
const DESCRIPTION =
  "Learn what roleplay AI is, how it works, and the best platforms for AI-powered role-playing games — from social deduction to custom RPGs with AI characters.";
const CANONICAL = "/blog/roleplay-ai-guide";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "roleplay ai",
    "ai roleplay",
    "ai role playing game",
    "roleplay ai game",
    "ai rp",
    "ai roleplay chat",
    "ai characters roleplay",
    "best roleplay ai",
    "ai rpg online",
    "text based rpg ai",
    "ai npc roleplay",
    "multiplayer roleplay ai",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-roleplay-ai-guide.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-roleplay-ai-guide.png"],
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

export default function RoleplayAiGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Roleplay AI Guide</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">AI Characters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Roleplay AI is one of the fastest-growing categories in gaming and entertainment. But what
            exactly is it, how does it work, and which platforms let you do more than just chat? This
            guide covers everything.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-roleplay-ai-guide.png"
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
              { id: "what-is", label: "What is Roleplay AI?" },
              { id: "how-it-works", label: "How Does Roleplay AI Work?" },
              { id: "types", label: "Types of AI Roleplay Experiences" },
              { id: "platforms", label: "Best Roleplay AI Platforms Compared" },
              { id: "multiplayer", label: "Multiplayer Roleplay AI — The Next Level" },
              { id: "getting-started", label: "How to Get Started" },
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

        {/* ── What is Roleplay AI ──────────────────────────────────── */}
        <H2 id="what-is">What is Roleplay AI?</H2>
        <P>
          <strong className="text-white">Roleplay AI</strong> refers to artificial intelligence systems
          that take on characters, personas, or roles and interact with you in a narrative context. Instead
          of a generic chatbot, you&apos;re talking to (or playing with) an AI that has a defined personality,
          backstory, motivations, and behavior patterns.
        </P>
        <P>
          The simplest form is <strong className="text-white">one-on-one character chat</strong> — platforms
          like Character.AI let you talk to AI personas. But roleplay AI has evolved far beyond that into
          structured games, multiplayer experiences, and AI-hosted tabletop sessions where multiple AI
          characters interact with each other and with human players.
        </P>

        {/* ── How it works ─────────────────────────────────────────── */}
        <H2 id="how-it-works">How Does Roleplay AI Work?</H2>
        <P>At its core, roleplay AI combines several technologies:</P>
        <div className="space-y-4 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="font-bold text-white mb-1">Large Language Models (LLMs)</h4>
            <p className="text-sm text-zinc-400">Models like GPT-4, Claude, and others generate natural dialogue that stays in character. They understand context, remember what happened earlier, and adapt to your actions.</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="font-bold text-white mb-1">Character Prompting</h4>
            <p className="text-sm text-zinc-400">Each AI character has a system prompt that defines their personality, knowledge, goals, and speech style. This makes a detective talk differently from a wizard or a suspicious villager.</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="font-bold text-white mb-1">Game Engines (for structured RP)</h4>
            <p className="text-sm text-zinc-400">Advanced platforms add rules, turns, victory conditions, and phase management on top of the AI. This turns freeform chat into an actual game with stakes.</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="font-bold text-white mb-1">Text-to-Speech</h4>
            <p className="text-sm text-zinc-400">Some platforms give each character a unique voice, adding immersion. You hear the AI characters speak their lines rather than just reading text.</p>
          </div>
        </div>

        {/* ── Types ────────────────────────────────────────────────── */}
        <H2 id="types">Types of AI Roleplay Experiences</H2>
        <P>Not all roleplay AI is the same. Here are the main categories:</P>

        <H3>1. One-on-One Character Chat</H3>
        <P>
          The most common type. You chat with a single AI character — a fictional persona, a historical
          figure, or a custom character you create. Platforms: <strong className="text-white">Character.AI,
          Chai AI, Janitor AI</strong>.
        </P>
        <P>
          Limitation: no game structure, no multiplayer, and the AI doesn&apos;t interact with other characters.
        </P>

        <H3>2. Solo Text Adventures</H3>
        <P>
          You describe actions and the AI narrates what happens — like a solo D&amp;D campaign. The AI
          acts as both narrator and world.
          Platform: <strong className="text-white">AI Dungeon</strong>.
        </P>
        <P>
          Limitation: no real game rules. The AI won&apos;t enforce turns, track health, or declare a winner.
        </P>

        <H3>3. Multiplayer AI Games (Structured Roleplay)</H3>
        <P>
          The newest and most advanced category. An AI Game Master hosts structured sessions with rules,
          roles, turns, and victory conditions. Multiple AI characters play alongside human players.
          Platform: <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>.
        </P>
        <P>
          This is where roleplay AI meets actual gaming — you get the narrative richness of AI characters
          combined with the structure and stakes of a real game.
        </P>

        {/* ── Platforms ────────────────────────────────────────────── */}
        <H2 id="platforms">Best Roleplay AI Platforms Compared</H2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Platform</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Type</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Multiplayer</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Game Rules</th>
                <th className="py-3 text-zinc-400 font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-violet-400">{SITE_NAME}</td>
                <td className="py-3 pr-4">Multiplayer games</td>
                <td className="py-3 pr-4">✓</td>
                <td className="py-3 pr-4">✓</td>
                <td className="py-3">Social deduction, RPGs, custom games</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Character.AI</td>
                <td className="py-3 pr-4">1-on-1 chat</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3">Casual character conversations</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">AI Dungeon</td>
                <td className="py-3 pr-4">Solo adventure</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3">Open-ended storytelling</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Chai AI</td>
                <td className="py-3 pr-4">1-on-1 chat</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3">Mobile character chat</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">SillyTavern</td>
                <td className="py-3 pr-4">Self-hosted chat</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3 pr-4">✗</td>
                <td className="py-3">Technical users, full control</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          For a deeper dive, see our{" "}
          <Link href="/blog/character-ai-alternatives" className="text-violet-400 hover:underline">
            full comparison of Character.AI alternatives
          </Link>.
        </P>

        {/* ── Multiplayer ──────────────────────────────────────────── */}
        <H2 id="multiplayer">Multiplayer Roleplay AI — The Next Level</H2>
        <P>
          Most roleplay AI platforms are single-player. You talk to one AI, alone. But the most exciting
          development in roleplay AI is <strong className="text-white">multiplayer</strong>: multiple AI
          characters interacting with multiple human players in a structured game.
        </P>
        <P>Here&apos;s what this looks like in practice:</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li>An <strong className="text-white">AI Game Master</strong> hosts the session — explains rules, manages turns, narrates events</li>
          <li>Multiple <strong className="text-white">AI characters</strong> sit at the table — each with their own personality, role, and strategy</li>
          <li>You and your friends <strong className="text-white">play alongside the AI</strong> — talk, vote, accuse, defend, bluff</li>
          <li>The game has <strong className="text-white">real structure</strong> — roles, phases, victory conditions, elimination</li>
        </ul>
        <P>
          This is what <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> does.
          You can play{" "}
          <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink>,{" "}
          <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">Mafia</TrackedGameLink>,{" "}
          <TrackedGameLink href="/games/undercover" className="text-violet-400 hover:underline">Who&apos;s the Spy</TrackedGameLink>,
          or create entirely custom games — all with AI characters that think, react, and try to win.
        </P>

        {/* ── Getting Started ──────────────────────────────────────── */}
        <H2 id="getting-started">How to Get Started with Roleplay AI</H2>
        <P>If you want to try roleplay AI for gaming, here&apos;s the fastest path:</P>
        <ol className="space-y-4 mb-8">
          {[
            { title: "Pick a game template", desc: "Browse 20+ templates like Werewolf, Mafia, Murder Mystery, or Trivia." },
            { title: "Or describe your own game", desc: "Tell the AI Game Master your rules in plain English — it builds the game for you." },
            { title: "Invite friends (optional)", desc: "Share a link. Friends join instantly — no sign-up needed for guests." },
            { title: "Play", desc: "The AI Game Master runs the session. AI characters fill every seat. Just focus on playing." },
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

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is roleplay AI safe?</H3>
            <P>
              Reputable platforms have content guidelines and moderation. {SITE_NAME} focuses on game-based
              roleplay with structured rules, which naturally keeps interactions within the game context.
            </P>
          </div>
          <div>
            <H3>Can I use roleplay AI for D&amp;D?</H3>
            <P>
              Yes — you can describe D&amp;D-style scenarios to the AI Game Master and it will run the
              session. While it&apos;s text-based rather than using a full D&amp;D ruleset, the AI handles
              narration, NPCs, and game flow. It works great as an AI dungeon master for casual sessions.
            </P>
          </div>
          <div>
            <H3>Is roleplay AI free?</H3>
            <P>
              Most platforms offer free tiers. {SITE_NAME} gives new users free credits to try the platform.
              Character.AI and Chai AI also have free tiers with usage limits.
            </P>
          </div>
          <div>
            <H3>What&apos;s the difference between roleplay AI and chatbots?</H3>
            <P>
              Regular chatbots answer questions. Roleplay AI stays in character — it has a persona,
              goals, and behavior patterns. In a game context, it also follows rules, makes strategic
              decisions, and interacts with other characters.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Try Multiplayer Roleplay AI</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Play structured games with AI characters that think, bluff, and strategize. Pick a template
            or create your own rules.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Browse Games
            </Link>
            <Link href="/signin" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Start Free
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
