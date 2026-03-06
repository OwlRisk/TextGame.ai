import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "How TextGame.ai Works — Inside the AI Game Master";
const DESCRIPTION =
  "A look inside TextGame.ai's AI Game Master — how it assigns roles, manages game phases, narrates stories, and creates unique AI characters for every session.";
const CANONICAL = "/blog/how-textgame-ai-works";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["how textgame ai works", "ai game master", "ai game host", "how ai runs games", "ai dungeon master technology"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Product", "AI Game Master"], images: [{ url: "/hero.webp", width: 1200, height: 630, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/hero.webp"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }

export default function HowTextgameAiWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">How TextGame.ai Works</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Product</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">AI Game Master</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Most online social deduction games rely on rigid automation or a human host to manage the action.
            {SITE_NAME} takes a different approach: an AI Game Master that understands the rules, reacts to
            player choices, and keeps every session feeling fresh. Here&apos;s how it actually works under the hood.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>7 min read</span></div>
        </header>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is-ai-gm", label: "What Is an AI Game Master?" },
              { id: "session-flow", label: "How a Game Session Works" },
              { id: "ai-characters", label: "The AI Characters" },
              { id: "custom-creation", label: "Custom Game Creation" },
              { id: "what-makes-different", label: "What Makes It Different" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}><a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">{i + 1}. {item.label}</a></li>
            ))}
          </ol>
        </nav>

        {/* --- Section 1 --- */}
        <H2 id="what-is-ai-gm">What Is an AI Game Master?</H2>
        <P>
          In tabletop games like Werewolf or Mafia, someone usually has to sit out and moderate: dealing
          roles, announcing phases, counting votes, and resolving actions. That person is the Game Master.
        </P>
        <P>
          On {SITE_NAME}, a large-language-model–powered AI takes on that role entirely. It assigns every
          player a secret role at the start, manages day and night phases, narrates what happens between
          rounds, and enforces the rules — all in real time, through natural-language messages in the chat.
        </P>
        <P>
          Because the AI understands the game&apos;s rules rather than following a static script, it can
          handle edge cases, adapt narration to what players actually do, and even fill empty seats with
          believable AI characters so games can start without waiting for a full lobby.
        </P>

        {/* --- Section 2 --- */}
        <H2 id="session-flow">How a Game Session Works</H2>
        <P>
          Every game on {SITE_NAME} follows a consistent flow, whether you&apos;re playing{" "}
          <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>,{" "}
          <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link>, or a
          completely custom game.
        </P>

        <H3>1. Choose a Template</H3>
        <P>
          Browse the <Link href="/discover" className="text-violet-400 hover:underline">game library</Link> and
          pick a template — or create your own. Each template defines the roles, phases, and win conditions
          the AI will enforce.
        </P>

        <H3>2. The AI Sets Up the Game</H3>
        <P>
          Once you start a session, the AI reads the template, generates a unique opening narration, and
          secretly assigns roles to every player (and any AI characters filling empty seats).
        </P>

        <H3>3. Players Join</H3>
        <P>
          Share the invite link with friends. They join instantly in the browser — no download, no account
          required. If there aren&apos;t enough humans, the AI fills remaining spots automatically.
        </P>

        <H3>4. The AI Runs Phases</H3>
        <P>
          Day discussion, voting, night actions — the AI announces each phase, sets timers, collects player
          inputs, and narrates results. It tallies votes, resolves kills, and checks win conditions after
          every round.
        </P>

        <H3>5. The AI Adapts</H3>
        <P>
          If a player makes a surprising accusation or an unexpected alliance forms, the AI adjusts its
          narration. It references earlier events, highlights contradictions, and keeps the story coherent
          from start to finish.
        </P>

        {/* --- Section 3 --- */}
        <H2 id="ai-characters">The AI Characters</H2>
        <P>
          One of the most common problems in online social deduction is not having enough players. On
          {" "}{SITE_NAME}, AI characters solve that problem — and they&apos;re far more than placeholders.
        </P>
        <P>
          Each AI character is generated with a unique name, personality, and strategic style. Some are
          aggressive accusers; others play quiet and gather information. They argue with each other, cast
          suspicion, defend themselves when accused, and vote independently based on what they&apos;ve
          observed during the game.
        </P>
        <P>
          Because they&apos;re powered by the same language model as the Game Master, they can hold
          natural conversations, bluff convincingly, and react to context — not just follow a decision
          tree. Learn more in our deep dive on{" "}
          <Link href="/blog/how-ai-characters-think" className="text-violet-400 hover:underline">how AI characters think</Link>.
        </P>

        {/* --- Section 4 --- */}
        <H2 id="custom-creation">Custom Game Creation</H2>
        <P>
          You don&apos;t have to pick from existing templates. On {SITE_NAME}, you can describe a new game
          in plain English — the roles, the phases, the win conditions — and the AI will build a fully
          playable game from your description.
        </P>
        <P>
          Want a murder-mystery dinner party with five suspects and a detective? A space-station mutiny with
          two traitors? Just describe it. The AI parses your rules, creates the role assignments, and hosts
          the game exactly as you designed it. Read our{" "}
          <Link href="/blog/create-game-with-ai" className="text-violet-400 hover:underline">guide to creating games with AI</Link>{" "}
          for tips on writing effective game descriptions.
        </P>

        {/* --- Section 5 --- */}
        <H2 id="what-makes-different">What Makes It Different</H2>

        <H3>vs. Automated Game Engines</H3>
        <P>
          Platforms like Wolvesville or the original Town of Salem use hard-coded game logic: fixed role
          interactions, canned announcement text, and no flexibility if something unexpected happens. The
          AI Game Master on {SITE_NAME} generates narration dynamically, handles ambiguous situations
          gracefully, and can run games the developers never explicitly programmed.
        </P>

        <H3>vs. Human Game Masters</H3>
        <P>
          A skilled human GM can improvise brilliantly — but they need to learn the rules, stay impartial,
          and sacrifice their own turn to moderate. The AI Game Master knows every rule instantly, never
          gets tired, and is always perfectly neutral. It also means you never need to convince a friend to
          sit out and host.
        </P>

        <H3>vs. AI Dungeon-Style Generators</H3>
        <P>
          Open-ended AI story generators are fun, but they lack structure. {SITE_NAME}&apos;s AI is
          constrained by actual game rules — it enforces win conditions, tracks hidden information, and
          maintains fairness. It&apos;s creative narration within a competitive framework.
        </P>

        {/* --- FAQ --- */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Does the AI know everyone&apos;s roles?</H3>
            <P>
              Yes — the AI Game Master has full information about every role, just like a human moderator
              would. It uses this to resolve night actions, check win conditions, and narrate accurately.
              Individual players only see their own role and public information.
            </P>
          </div>
          <div>
            <H3>Is the AI biased toward certain players?</H3>
            <P>
              No. The AI follows the game rules neutrally. It doesn&apos;t favor any player or role. AI
              characters make their own decisions based on observable game events, not insider knowledge.
            </P>
          </div>
          <div>
            <H3>Can the AI handle rule disputes?</H3>
            <P>
              Because the AI understands the game rules as written, it resolves ambiguous situations
              consistently. If a custom game has contradictory rules, the AI will interpret them as
              logically as possible and keep the game moving.
            </P>
          </div>
          <div>
            <H3>Is my game data private?</H3>
            <P>
              Game sessions are private to the players in the room. Chat logs are not shared publicly,
              and the AI does not use your game data to train models. See our privacy policy for details.
            </P>
          </div>
        </div>

        {/* --- CTA --- */}
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Try the AI Game Master</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, invite friends, and let the AI handle everything. No download, no sign-up required.
          </p>
          <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Browse All Games</Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
