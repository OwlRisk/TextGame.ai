import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "How to Play D&D with AI — Solo or Multiplayer (2026 Guide)";
const DESCRIPTION =
  "Learn how to play Dungeons & Dragons with an AI Dungeon Master. This guide covers solo D&D, multiplayer AI campaigns, character creation, and how TextGame.ai handles AI-powered tabletop RPGs.";
const CANONICAL = "/blog/play-dnd-with-ai";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play dnd with ai",
    "ai dungeon master",
    "ai dm",
    "solo dnd",
    "dnd ai game",
    "ai tabletop rpg",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-dnd-with-ai.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-dnd-with-ai.png"],
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

export default function PlayDndWithAiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play D&amp;D with AI</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">D&amp;D</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">RPG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            No DM? No problem. AI can now run full D&amp;D-style campaigns — narrating the world,
            controlling NPCs, managing combat, and adapting to every choice you make. Here&apos;s how
            to play D&amp;D with AI, whether you&apos;re going solo or bringing friends.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-dnd-with-ai.png"
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
              { id: "how-ai-dm-works", label: "How an AI Dungeon Master Works" },
              { id: "solo-vs-group", label: "Solo Play vs Group Play" },
              { id: "character-creation", label: "Character Creation with AI" },
              { id: "campaign-types", label: "Campaign Types You Can Run" },
              { id: "textgame-approach", label: "How TextGame.ai Handles It" },
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

        {/* ── How an AI DM Works ─────────────────────────────────────── */}
        <H2 id="how-ai-dm-works">How an AI Dungeon Master Works</H2>
        <P>
          An AI Dungeon Master uses a large language model to fill the role a human DM normally plays.
          It describes locations, voices NPCs, adjudicates rules, runs encounters, and pushes the
          story forward based on what players do.
        </P>
        <P>
          Unlike a choose-your-own-adventure book, an AI DM accepts <strong className="text-white">
          freeform input</strong>. You can say &quot;I pickpocket the merchant while my friend distracts
          the guard&quot; and the AI will narrate the outcome, including skill checks, consequences, and
          NPC reactions.
        </P>
        <P>
          The best AI DMs also maintain <strong className="text-white">persistent memory</strong> — they
          remember your character&apos;s backstory, inventory, relationships, and past decisions across
          sessions. This is what separates a good AI D&amp;D experience from a random text generator.
        </P>

        {/* ── Solo vs Group ──────────────────────────────────────────── */}
        <H2 id="solo-vs-group">Solo Play vs Group Play</H2>
        <H3>Solo D&amp;D with AI</H3>
        <P>
          Solo play is the most common way to use an AI DM. You create a character, choose a setting,
          and the AI runs the entire campaign just for you. It&apos;s perfect for practicing roleplay,
          testing character builds, or just enjoying a story when your group can&apos;t meet.
        </P>
        <P>
          The AI controls all NPCs and party companions. On {SITE_NAME}, AI characters have distinct
          personalities — a grumpy dwarf cleric acts differently from an enthusiastic halfling rogue.
        </P>

        <H3>Multiplayer D&amp;D with AI</H3>
        <P>
          Multiplayer AI D&amp;D is where things get exciting. Each human player controls their own
          character, and the AI DM manages the world. You get the collaborative storytelling of tabletop
          D&amp;D without needing a human DM.
        </P>
        <P>
          On <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
          you share a link and friends join instantly. The AI handles turn order, combat resolution,
          and narrative pacing. AI players can fill empty party slots so your group always has a full
          adventuring party.
        </P>

        {/* ── Character Creation ─────────────────────────────────────── */}
        <H2 id="character-creation">Character Creation with AI</H2>
        <P>
          You don&apos;t need a character sheet to start. Most AI D&amp;D platforms let you describe
          your character in natural language: &quot;a tiefling warlock who made a pact with a sea god&quot;
          or &quot;a retired soldier turned tavern owner.&quot;
        </P>
        <P>
          The AI fills in the mechanical details — stats, abilities, equipment — or you can specify
          them yourself. On {SITE_NAME}, you can set custom rules for your campaign that define how
          character progression, magic systems, and combat work.
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Quick start</strong> — describe a concept, the AI generates the rest</li>
          <li><strong className="text-white">Detailed build</strong> — specify race, class, backstory, stats, and gear</li>
          <li><strong className="text-white">Custom systems</strong> — define your own rules; not limited to 5e</li>
        </ul>

        {/* ── Campaign Types ─────────────────────────────────────────── */}
        <H2 id="campaign-types">Campaign Types You Can Run</H2>
        <P>
          AI DMs aren&apos;t limited to classic dungeon crawls. Here are popular campaign types players
          run with AI:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Classic dungeon crawl</strong> — explore ruins, fight monsters, find treasure</li>
          <li><strong className="text-white">Political intrigue</strong> — navigate courtly politics, alliances, and betrayals</li>
          <li><strong className="text-white">Mystery investigation</strong> — solve crimes, uncover conspiracies</li>
          <li><strong className="text-white">Survival sandbox</strong> — shipwrecked, stranded, or post-apocalyptic scenarios</li>
          <li><strong className="text-white">Heist</strong> — plan and execute a daring theft with your party</li>
          <li><strong className="text-white">Horror</strong> — cosmic horror, haunted locations, survival against the unknown</li>
        </ul>
        <P>
          On {SITE_NAME}, you can describe any of these in plain English when creating a game. The AI
          adapts its narration style, encounter design, and NPC behavior to match the genre.
        </P>

        {/* ── How TextGame.ai Handles It ─────────────────────────────── */}
        <H2 id="textgame-approach">How TextGame.ai Handles It</H2>
        <P>
          {SITE_NAME} takes a different approach from most AI D&amp;D tools. Instead of dropping you
          into a generic fantasy world, you define the rules:
        </P>
        <ol className="space-y-4 mb-8">
          {[
            { title: "Describe your campaign", desc: "Set the world, tone, and rules. Use a template or write your own — \"dark fantasy with permadeath and a sanity mechanic.\"" },
            { title: "Create characters", desc: "Each player describes their character. The AI assigns stats and abilities based on your rule system." },
            { title: "Play together", desc: "The AI DM runs the session in real time. Type actions, have conversations in character, and make group decisions." },
            { title: "AI fills the party", desc: "Need a healer? An NPC guide? AI characters join with their own personalities, goals, and combat tactics." },
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
          The key difference: you&apos;re not locked into D&amp;D 5e. You can run Pathfinder-style
          games, homebrew systems, or completely original rule sets. The AI adapts to whatever you describe.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is AI D&amp;D as good as playing with a human DM?</H3>
            <P>
              It&apos;s different. An AI DM is always available, infinitely patient, and never
              under-prepared. A human DM brings emotional depth, improvisation, and social connection.
              Many players use AI D&amp;D for solo practice or when their group can&apos;t meet, and
              switch to a human DM for in-person sessions.
            </P>
          </div>
          <div>
            <H3>Can I use my existing D&amp;D character?</H3>
            <P>
              Yes. Describe your character&apos;s race, class, level, backstory, and gear. The AI will
              incorporate them into the campaign. On {SITE_NAME}, you can paste detailed character
              descriptions and the AI will respect your build.
            </P>
          </div>
          <div>
            <H3>Does the AI handle combat properly?</H3>
            <P>
              AI DMs can run turn-based combat with initiative, attacks, spells, and hit points. The
              level of mechanical detail depends on the platform and rules you set. {SITE_NAME} lets
              you define exactly how granular you want combat to be.
            </P>
          </div>
          <div>
            <H3>Can I play other RPG systems besides D&amp;D?</H3>
            <P>
              Absolutely. On {SITE_NAME}, you describe any rule system in plain English — Pathfinder,
              Call of Cthulhu, Shadowrun, or your own homebrew. The AI DM adapts to whatever system
              you specify.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Start a D&amp;D Campaign with AI</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Create your character, set the rules, and let the AI Dungeon Master run your adventure.
            Play solo or invite your party — no prep needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Create a Campaign
            </Link>
            <Link href="/discover" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Browse RPG Games
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
