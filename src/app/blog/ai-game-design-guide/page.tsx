import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "AI Game Design: How to Write Rules AI Can Follow";
const DESCRIPTION =
  "Want to create your own AI-hosted game? Learn how to write game rules that an AI Game Master can understand and run — roles, phases, win conditions, and more.";
const CANONICAL = "/blog/ai-game-design-guide";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["ai game design", "how to design ai games", "write game rules for ai", "custom ai game", "create your own party game", "ai game master rules"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Thought Leadership", "Game Design"], images: [{ url: "/hero.webp", width: 1200, height: 630, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/hero.webp"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }

export default function AiGameDesignGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">AI Game Design Guide</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Thought Leadership</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Game Design</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            AI Game Masters can run almost anything — but they need well-structured rules to do it well.
            Whether you&apos;re adapting a classic party game or inventing something entirely new,
            this guide walks you through writing game rules that an AI can understand, enforce, and
            bring to life.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>9 min read</span></div>
        </header>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "why-different", label: "Why AI Game Design is Different" },
              { id: "building-blocks", label: "Core Building Blocks" },
              { id: "writing-rules", label: "Writing Clear Rules" },
              { id: "common-mistakes", label: "Common Mistakes" },
              { id: "example-spy-game", label: "Example: Designing a Simple Spy Game" },
              { id: "advanced-techniques", label: "Advanced Techniques" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}><a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">{i + 1}. {item.label}</a></li>
            ))}
          </ol>
        </nav>

        {/* --- Section 1 --- */}
        <H2 id="why-different">Why AI Game Design is Different</H2>
        <P>
          Human game masters improvise. They fill gaps in the rules, interpret ambiguous situations, and
          adjust on the fly when something doesn&apos;t work. AI can do much of this too — but it
          performs dramatically better when the rules are explicit from the start.
        </P>
        <P>
          Think of it this way: a human host reads between the lines. An AI reads the lines. If your
          rules say &quot;players vote to eliminate someone,&quot; a human knows that means one vote per
          player, majority wins, ties require a revote. An AI needs you to spell that out.
        </P>
        <P>
          The upside is that AI handles creativity brilliantly. Give it clear structure — phases, roles,
          win conditions — and it&apos;ll generate compelling narration, manage complex state, and
          produce{" "}
          <Link href="/blog/how-ai-characters-think" className="text-violet-400 hover:underline">believable AI characters</Link>{" "}
          that bring the game to life. Your job is to build the skeleton. The AI adds the flesh.
        </P>

        {/* --- Section 2 --- */}
        <H2 id="building-blocks">Core Building Blocks</H2>
        <P>
          Every AI-compatible game needs four foundational elements. Get these right and the AI Game
          Master can handle the rest.
        </P>

        <H3>Roles</H3>
        <P>
          Define every role in the game: its name, its team alignment (if applicable), what information
          it starts with, and what abilities it has. Be specific. Instead of &quot;the Spy can
          investigate,&quot; write &quot;the Spy chooses one player each night and learns their team
          alignment (Loyal or Rebel).&quot;
        </P>

        <H3>Phases</H3>
        <P>
          Break the game into discrete phases with clear transitions. A typical structure might be:
          Setup → Night → Day Discussion → Day Vote → Resolution → repeat or end. For each phase,
          define what happens, who can act, and what triggers the transition to the next phase.
        </P>

        <H3>Win Conditions</H3>
        <P>
          State exactly how each team or player wins. Avoid vague conditions like &quot;the good guys
          win when they figure it out.&quot; Instead: &quot;The Loyalists win when all Rebels have been
          eliminated. The Rebels win when they equal or outnumber the Loyalists.&quot;
        </P>

        <H3>Information Asymmetry</H3>
        <P>
          Define what each role knows and doesn&apos;t know. This is the engine of most interesting
          games. Who knows the identities of their teammates? Who has access to investigation results?
          What is public versus private? The AI enforces these boundaries strictly, so you need to
          define them precisely.
        </P>

        {/* --- Section 3 --- */}
        <H2 id="writing-rules">Writing Clear Rules</H2>
        <P>
          The difference between a game that runs smoothly and one that confuses the AI often comes down
          to how the rules are written. Here are the principles that matter most.
        </P>

        <H3>Be Explicit About Phase Transitions</H3>
        <P>
          Don&apos;t assume the AI knows when one phase ends and another begins. State the trigger
          clearly: &quot;Day Discussion lasts 3 minutes or until a player calls for a vote. When a vote
          is called, transition to Day Vote immediately.&quot;
        </P>

        <H3>Define What Players Can Do</H3>
        <P>
          For each phase, list the actions available to players. During Night, can they send messages? To
          whom? During Day, can they whisper privately or only speak publicly? Can they abstain from
          voting? Spell it out.
        </P>

        <H3>Tell the AI What to Narrate</H3>
        <P>
          AI Game Masters excel at narration, but they need direction. Specify the tone and what
          information to reveal: &quot;At the start of each Day, the Game Master announces who was
          eliminated during Night and reveals their role. Use a dramatic tone.&quot; Read more about{" "}
          <Link href="/blog/how-textgame-ai-works" className="text-violet-400 hover:underline">how the AI engine works</Link>{" "}
          to understand what it can handle.
        </P>

        {/* --- Section 4 --- */}
        <H2 id="common-mistakes">Common Mistakes</H2>
        <P>
          After reviewing hundreds of custom game designs, certain patterns emerge. Here are the mistakes
          that trip up most first-time designers.
        </P>

        <H3>Ambiguous Win Conditions</H3>
        <P>
          &quot;The Detective wins by solving the mystery&quot; sounds clear but isn&apos;t. What counts
          as solving? Naming the killer? Naming the killer and the motive? Getting a majority vote on the
          correct suspect? Define the exact mechanism.
        </P>

        <H3>Too Many Special Cases</H3>
        <P>
          Every exception you add is a potential point of failure. If your game has a role that &quot;on
          the third night, if exactly two players have been eliminated, gains the ability to...&quot; —
          simplify. Great games have simple rules with emergent complexity, not complex rules with
          predictable outcomes.
        </P>

        <H3>Not Playtesting</H3>
        <P>
          The fastest way to find problems is to play the game. Run a session with AI filling every seat
          and watch what happens. Does the AI get confused at any point? Does the game end too quickly or
          drag on? Iterate based on what you observe, not what you imagine.
        </P>

        <H3>Forgetting Edge Cases</H3>
        <P>
          What happens if there&apos;s a tied vote? What if a player disconnects? What if a role&apos;s
          target is already eliminated? The AI needs instructions for these situations. If you don&apos;t
          provide them, it&apos;ll improvise — and improvisation is only as good as the context you&apos;ve
          given it.
        </P>

        {/* --- Section 5 --- */}
        <H2 id="example-spy-game">Example: Designing a Simple Spy Game</H2>
        <P>
          Let&apos;s walk through creating a custom game from scratch — a simple spy game for 5–8
          players.
        </P>

        <H3>Step 1: Define the Concept</H3>
        <P>
          A space station crew suspects infiltrators. Most players are Crew; one or two are Saboteurs.
          The Crew wins by identifying and ejecting all Saboteurs. The Saboteurs win by surviving until
          only two Crew remain.
        </P>

        <H3>Step 2: Define Roles</H3>
        <ul className="space-y-2 mb-6 ml-4">
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Crew (majority)</strong> — knows only their own role. Goal: eject all Saboteurs.</span></li>
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Saboteur (1–2)</strong> — knows all Saboteur identities. Goal: survive until Crew ≤ 2.</span></li>
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Engineer (1)</strong> — Crew-aligned. Each night, can scan one player to learn their role.</span></li>
        </ul>

        <H3>Step 3: Define Phases</H3>
        <P>
          <strong className="text-white">Night:</strong> Saboteurs privately choose one player to
          &quot;sabotage&quot; (eliminate). The Engineer chooses one player to scan. The Game Master
          reveals results privately.
        </P>
        <P>
          <strong className="text-white">Day Discussion:</strong> The Game Master announces who was
          sabotaged and reveals their role. All players discuss for 3 minutes. Public chat only.
        </P>
        <P>
          <strong className="text-white">Day Vote:</strong> Each player votes to eject one player or
          abstains. Majority ejects; ties result in no ejection. Ejected player&apos;s role is revealed.
        </P>

        <H3>Step 4: Test and Iterate</H3>
        <P>
          Start a session on {SITE_NAME} with AI players and observe. In our testing, we found that the
          Engineer is too powerful with nightly scans, so we changed it to every other night. Small
          adjustments like this make the difference between a broken game and a great one.
        </P>

        {/* --- Section 6 --- */}
        <H2 id="advanced-techniques">Advanced Techniques</H2>
        <P>
          Once you&apos;ve mastered the basics, these techniques can take your custom games to the next
          level.
        </P>

        <H3>Branching Narratives</H3>
        <P>
          Instead of a fixed phase loop, define conditional branches: &quot;If a Saboteur is ejected,
          the next Night phase includes a Saboteur recruitment attempt.&quot; This creates dynamic game
          arcs that feel different every time.
        </P>

        <H3>Dynamic Role Reveal</H3>
        <P>
          Not all roles need to be assigned at the start. You can define trigger conditions for new roles
          to emerge mid-game: &quot;When the first Crew member is eliminated, one surviving Crew member
          becomes the Captain and gains a double vote.&quot;
        </P>

        <H3>AI Personality per Game</H3>
        <P>
          You can specify the tone and personality of the AI Game Master itself. A horror game might call
          for ominous, terse narration. A comedy game might want exaggerated, playful commentary. Include
          a style directive in your rules: &quot;The Game Master narrates in the style of a noir detective
          novel.&quot;
        </P>
        <P>
          For more on how AI characters develop personality, see our deep dive on{" "}
          <Link href="/blog/how-ai-characters-think" className="text-violet-400 hover:underline">how AI characters think</Link>.
          And if you&apos;re curious about the broader trajectory of AI in gaming, read our take on the{" "}
          <Link href="/blog/future-of-ai-gaming" className="text-violet-400 hover:underline">future of AI gaming</Link>.
        </P>

        {/* --- FAQ --- */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Do I need coding skills to create a custom AI game?</H3>
            <P>
              No. You write game rules in plain language — roles, phases, win conditions — and the AI
              Game Master interprets and runs them. No programming required. If you can explain a board
              game to a friend, you can design an AI game.
            </P>
          </div>
          <div>
            <H3>How many roles should my game have?</H3>
            <P>
              Start simple. Two or three roles are enough for a compelling game. You can always add
              complexity later. The best designs have few roles with deep interactions, not many roles
              with shallow ones.
            </P>
          </div>
          <div>
            <H3>Can I share my custom game with others?</H3>
            <P>
              Yes. On {SITE_NAME}, custom games can be published to the{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">game library</Link>{" "}
              where other players can discover and play them. The best community-created games get
              featured on the homepage.
            </P>
          </div>
          <div>
            <H3>What if my game rules have a bug?</H3>
            <P>
              The AI will do its best to interpret ambiguous rules, but results may be unpredictable.
              The fix is simple: playtest with AI players, identify where the game breaks down, update
              your rules, and test again. Most designers get to a solid version within two or three
              iterations.
            </P>
          </div>
        </div>

        {/* --- CTA --- */}
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Create Your Own AI Game</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Ready to bring your game idea to life? Write your rules and let the AI Game Master handle
            the rest — no coding required.
          </p>
          <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Start Creating</Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
