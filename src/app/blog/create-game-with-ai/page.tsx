import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "How to Create Your Own AI Game — No Coding Required";
const DESCRIPTION =
  "Learn how to create custom AI games without coding. Describe your idea to an AI Game Master, set player count, invite friends, and play. Social deduction, RPGs, mystery, trivia, and more.";
const CANONICAL = "/blog/create-game-with-ai";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai game generator",
    "ai game maker",
    "create game with ai",
    "make your own game ai",
    "ai game creator",
    "custom ai game",
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

export default function CreateGameWithAiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Create Game with AI</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Tutorial</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Game Design</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            You don&apos;t need to write code to create your own AI game. Just describe your idea in plain
            English — the AI Game Master handles rules, roles, narration, and hosting. Here&apos;s how it works.
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
              { id: "what-means", label: "What Does It Mean to Create a Game with AI?" },
              { id: "step-by-step", label: "Step-by-Step: Create Your First AI Game" },
              { id: "what-create", label: "What Can You Create?" },
              { id: "examples", label: "Examples of Custom Games" },
              { id: "templates-vs-custom", label: "Templates vs Custom Games" },
              { id: "tips", label: "Tips for Better Game Design" },
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

        {/* ── What Does It Mean ─────────────────────────────────────── */}
        <H2 id="what-means">What Does It Mean to Create a Game with AI?</H2>
        <P>
          When you <strong className="text-white">create a game with AI</strong>, you describe what you want —
          the theme, roles, rules, and how players win. The AI does the heavy lifting: it enforces rules,
          assigns roles, narrates the story, manages turns, and keeps the game flowing.
        </P>
        <P>
          You don&apos;t need to program logic, write scripts, or understand game engines. You just talk
          to the AI Game Master in plain language. &ldquo;I want a space station game where one person is a
          traitor and the crew has to find them&rdquo; — that&apos;s enough to get started. The AI builds the
          game structure around your idea.
        </P>
        <P>
          Platforms like <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> let
          you either pick from templates (e.g. <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>,{" "}
          <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link>) or describe a completely custom game.
          Either way, the AI hosts the session and fills empty seats with AI players if needed.
        </P>

        {/* ── Step-by-Step ─────────────────────────────────────────── */}
        <H2 id="step-by-step">Step-by-Step: Create Your First AI Game</H2>
        <P>Creating your first AI game takes four simple steps:</P>
        <ol className="space-y-4 mb-8">
          {[
            { title: "Sign in", desc: "Create a free account on the platform. No credit card required to start." },
            { title: "Describe your idea to the AI Game Master", desc: "Tell the AI what kind of game you want — theme, roles, win conditions. Be as specific or as loose as you like. The AI will ask clarifying questions if needed." },
            { title: "Set player count", desc: "Choose how many players (including yourself). AI characters will fill any empty seats so you can play solo or with a small group." },
            { title: "Invite friends & play", desc: "Share a link. Friends join instantly — no sign-up needed for guests. The AI Game Master runs the session from start to finish." },
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
          Ready to try? <Link href="/signin" className="text-violet-400 hover:underline">Sign in</Link> and start describing your game.
        </P>

        {/* ── What Can You Create ──────────────────────────────────── */}
        <H2 id="what-create">What Can You Create?</H2>
        <P>
          AI game creators support a wide range of genres. Here&apos;s what you can build:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6 ml-2">
          <li><strong className="text-white">Social deduction</strong> — hidden roles, voting, bluffing (Werewolf, Mafia, custom variants)</li>
          <li><strong className="text-white">RPGs</strong> — narrative adventures, quests, character progression</li>
          <li><strong className="text-white">Mystery</strong> — whodunnit, clue-gathering, detective work</li>
          <li><strong className="text-white">Trivia</strong> — quiz games, knowledge challenges</li>
          <li><strong className="text-white">Party games</strong> — word games, guessing games, icebreakers</li>
          <li><strong className="text-white">Completely custom</strong> — mix genres, invent new mechanics, experiment</li>
        </ul>
        <P>
          Browse <Link href="/discover" className="text-violet-400 hover:underline">existing templates</Link> for inspiration, or go straight to a custom game if you have a unique idea.
        </P>

        {/* ── Examples ─────────────────────────────────────────────── */}
        <H2 id="examples">Examples of Custom Games</H2>
        <P>Here are a few creative examples you could describe to an AI Game Master:</P>

        <H3>Space Station Traitor</H3>
        <P>
          One player is secretly sabotaging the station. Crew members debate, vote, and try to identify
          the traitor before critical systems fail. The traitor tries to blend in and eliminate key
          crew members one by one.
        </P>

        <H3>Courtroom Drama</H3>
        <P>
          Players take on roles: judge, lawyers, witnesses, jury. One case, multiple perspectives.
          The AI presents evidence and manages the trial flow. Players argue, cross-examine, and
          deliver closing statements.
        </P>

        <H3>Zombie Survival</H3>
        <P>
          A group of survivors must reach a safe zone. Some players might be secretly infected.
          Resource scarcity, voting on who to trust, and narrative events drive the tension.
        </P>

        <H3>Cooking Competition</H3>
        <P>
          Players are chefs competing in rounds. The AI describes challenges, ingredients, and
          judges&apos; feedback. Hidden strengths and weaknesses add a social deduction twist.
        </P>
        <P>
          The key is to describe the core idea — roles, conflict, and how someone wins. The AI fills in
          the rest.
        </P>

        {/* ── Templates vs Custom ─────────────────────────────────── */}
        <H2 id="templates-vs-custom">Templates vs Custom Games</H2>
        <P>
          <strong className="text-white">Templates</strong> are pre-built games you can start immediately.
          Use them when you want a quick game with proven rules — e.g. Werewolf, Mafia, Murder Mystery.
          No setup required; just pick a template and play.
        </P>
        <P>
          <strong className="text-white">Custom games</strong> are for when you have a unique idea that
          doesn&apos;t fit a template. Describe your concept in plain English and the AI builds it. Best for
          experimenting, themed parties, or games that don&apos;t exist yet.
        </P>
        <P>
          Many users start with templates to see how the AI Game Master works, then move to custom games
          once they&apos;re comfortable. You can always mix: take a template and ask the AI to tweak it
          (e.g. &ldquo;Werewolf but in a medieval castle&rdquo;).
        </P>

        {/* ── Tips ─────────────────────────────────────────────────── */}
        <H2 id="tips">Tips for Better Game Design</H2>
        <P>When describing a custom game, these tips help the AI create a better experience:</P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6 ml-2">
          <li><strong className="text-white">Be specific about roles.</strong> Name each role and what they can do. &ldquo;One traitor who can eliminate one player per night&rdquo; is clearer than &ldquo;someone bad.&rdquo;</li>
          <li><strong className="text-white">Set clear win conditions.</strong> How does the good team win? How does the bad team win? The AI needs this to run the game correctly.</li>
          <li><strong className="text-white">Start with fewer players.</strong> 4–6 players is easier to balance than 12. You can scale up once the core design works.</li>
        </ul>
        <P>
          For more on AI-powered gaming, see our{" "}
          <Link href="/blog/roleplay-ai-guide" className="text-violet-400 hover:underline">
            complete guide to roleplay AI
          </Link>.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Do I need to know how to code?</H3>
            <P>
              No. You describe your game in plain English. The AI Game Master interprets your description
              and builds the game structure. No programming, scripting, or technical setup required.
            </P>
          </div>
          <div>
            <H3>Can I play with friends who don&apos;t have an account?</H3>
            <P>
              Yes. On {SITE_NAME}, you share a link and friends join as guests. They can play without
              signing up. Only the host needs an account to create and start the game.
            </P>
          </div>
          <div>
            <H3>What if my game idea is really unusual?</H3>
            <P>
              That&apos;s fine. The AI is designed to handle creative and unusual concepts. If something
              is ambiguous, it may ask clarifying questions. Start with the core idea and refine from there.
            </P>
          </div>
          <div>
            <H3>Can I save and reuse my custom game?</H3>
            <P>
              On {SITE_NAME}, you can create custom games and play them multiple times. The AI remembers
              your game design so you don&apos;t have to re-describe it every session.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Create Your Own AI Game</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Describe your idea. The AI Game Master builds the game. Invite friends and play — no coding required.
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
