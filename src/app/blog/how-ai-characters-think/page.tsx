import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "How AI Characters Think — The Tech Behind Smart Game NPCs";
const DESCRIPTION =
  "Ever wonder how AI characters in TextGame.ai make decisions, form strategies, and develop unique personalities? Here's how the technology works.";
const CANONICAL = "/blog/how-ai-characters-think";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["ai characters", "ai npc technology", "how ai characters work", "ai game characters", "smart npc", "ai personality in games"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Product", "AI Characters"], images: [{ url: "/blog/blog-how-ai-characters-think.png", width: 1792, height: 1024, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/blog-how-ai-characters-think.png"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }

export default function HowAiCharactersThinkPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">How AI Characters Think</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Product</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">AI Characters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            In most online games, NPCs follow scripts. They repeat the same lines, make the same moves,
            and break immersion the moment you look too closely. On {SITE_NAME}, AI characters are
            different — they reason, strategize, and develop personalities that feel genuinely unique.
            Here&apos;s how that works.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>7 min read</span></div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-how-ai-characters-think.png"
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
              { id: "traditional-npcs", label: "The Problem with Traditional NPCs" },
              { id: "ai-difference", label: "How AI Characters Are Different" },
              { id: "personality", label: "The Personality System" },
              { id: "decision-making", label: "Decision Making" },
              { id: "memory", label: "Memory and Consistency" },
              { id: "ai-vs-humans", label: "Playing Against AI vs. Humans" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}><a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">{i + 1}. {item.label}</a></li>
            ))}
          </ol>
        </nav>

        {/* --- Section 1 --- */}
        <H2 id="traditional-npcs">The Problem with Traditional NPCs</H2>
        <P>
          Traditional game NPCs operate on decision trees and state machines. A villager in a Werewolf
          app might always vote for the most-accused player. A guard in an RPG repeats the same patrol.
          The moment a player tries something unexpected, the illusion falls apart.
        </P>
        <P>
          In social deduction games especially, this is a dealbreaker. The whole point is reading
          people — spotting lies, forming alliances, making judgment calls. If the &quot;people&quot; you&apos;re
          reading are just executing <code className="text-violet-400 text-sm">if-else</code> logic,
          there&apos;s no real game.
        </P>

        {/* --- Section 2 --- */}
        <H2 id="ai-difference">How AI Characters Are Different</H2>
        <P>
          AI characters on {SITE_NAME} are powered by large language models — the same technology behind
          modern chatbots, but constrained to act within the rules of the game they&apos;re playing.
        </P>
        <P>
          Instead of following a script, each AI character receives its role, the current game state, and
          its own personality profile. It then generates responses, votes, and actions the way a thoughtful
          human player might — by weighing evidence, considering social dynamics, and pursuing its win
          condition.
        </P>
        <P>
          This means AI characters can do things scripted NPCs never could: change their mind mid-debate,
          form temporary alliances, call out contradictions in another player&apos;s story, or even
          sacrifice themselves strategically.
        </P>

        {/* --- Section 3 --- */}
        <H2 id="personality">The Personality System</H2>
        <P>
          Not every AI character plays the same way. When the AI Game Master sets up a session, it
          generates a distinct personality profile for each AI character. This profile includes:
        </P>
        <ul className="space-y-2 mb-6 ml-4">
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Name and backstory</strong> — a short identity that informs how the character speaks and acts.</span></li>
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Communication style</strong> — some characters are verbose and dramatic; others are terse and analytical.</span></li>
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Strategic tendencies</strong> — aggressive accusers, cautious observers, coalition builders, lone wolves.</span></li>
          <li className="flex items-start gap-2 text-zinc-300"><span className="text-violet-400 mt-1">•</span><span><strong className="text-white">Trust threshold</strong> — how quickly the character trusts or suspects other players.</span></li>
        </ul>
        <P>
          These profiles create natural variety. In a{" "}
          <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink> game
          with four AI characters, you might face a loud accuser, a quiet analyst, a friendly mediator,
          and a paranoid loner — each playing the same role differently.
        </P>

        {/* --- Section 4 --- */}
        <H2 id="decision-making">Decision Making</H2>
        <P>
          Every time an AI character needs to act — speak in discussion, cast a vote, use a night
          ability — it evaluates the current game state through its personality lens.
        </P>

        <H3>Voting</H3>
        <P>
          AI characters don&apos;t just vote randomly or always follow the majority. They weigh who has
          been suspicious, who has defended whom, and what their own role needs. A Werewolf AI might
          strategically vote with the majority to avoid suspicion; a Villager AI might push hard against
          someone whose story doesn&apos;t add up.
        </P>

        <H3>Accusations and Defense</H3>
        <P>
          When accused, AI characters defend themselves with context-specific arguments — referencing
          things they actually said or did earlier in the game. When accusing others, they build cases
          based on observed behavior, not random selection.
        </P>

        <H3>Bluffing</H3>
        <P>
          Evil-role AI characters can bluff. A Werewolf AI might claim to be the Seer, provide a fake
          investigation result that&apos;s consistent with what&apos;s happened so far, and maintain
          that lie across multiple rounds. If caught in a contradiction, it pivots — just like a human
          would.
        </P>

        {/* --- Section 5 --- */}
        <H2 id="memory">Memory and Consistency</H2>
        <P>
          AI characters maintain awareness of the full game history within a session. They remember who
          accused whom in Round 1, what claims were made during Day 2, and which players were eliminated
          and what their roles turned out to be.
        </P>
        <P>
          This memory is critical for consistency. A character that defended Player A in Round 2
          won&apos;t randomly turn on them in Round 3 without cause. If new evidence emerges — say,
          a player they trusted is revealed as a Werewolf — the AI character updates its reasoning and
          adjusts its strategy accordingly.
        </P>
        <P>
          Persona consistency is maintained too. A character that speaks in short, clipped sentences at
          the start of the game won&apos;t suddenly become flowery and verbose later. The personality
          holds throughout the session.
        </P>

        {/* --- Section 6 --- */}
        <H2 id="ai-vs-humans">Playing Against AI vs. Humans</H2>
        <P>
          In blind tests, players often can&apos;t tell which participants are AI and which are human —
          especially in text-based games where there are no voice or visual cues. That said, there are
          real differences worth understanding.
        </P>

        <H3>Where AI Excels</H3>
        <P>
          AI characters are always available — no waiting for a full lobby. They never go AFK, never
          rage-quit, and never grief. They play their role seriously every time, which means games are
          consistently high-quality even at off-peak hours or with small friend groups.
        </P>

        <H3>Where Humans Shine</H3>
        <P>
          Human players bring unpredictability, humor, and genuine social pressure that AI can approximate
          but not fully replicate. The best {SITE_NAME} sessions often mix human and AI players — you get
          the reliability of AI filling seats with the chaos of real human deception.
        </P>

        <H3>The Sweet Spot</H3>
        <P>
          Most players find that a mix of 3–4 humans and 2–3 AI characters hits the ideal balance. You
          have enough real social dynamics to keep things exciting, and enough AI to ensure every role is
          filled and the game runs smoothly.
        </P>

        {/* --- FAQ --- */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can AI characters cheat by using hidden information?</H3>
            <P>
              No. AI characters only act on information their role would logically have access to. A
              Villager AI doesn&apos;t know who the Werewolves are. The system enforces strict information
              boundaries, the same way a fair human moderator would.
            </P>
          </div>
          <div>
            <H3>Do AI characters get better over time?</H3>
            <P>
              Each game session generates fresh AI characters. They don&apos;t carry memory between
              games, but the underlying model is continuously improved to produce more natural and
              strategically interesting play.
            </P>
          </div>
          <div>
            <H3>Can I tell which players are AI?</H3>
            <P>
              The game shows which seats are filled by AI before the session starts. During gameplay,
              AI characters participate in the same chat as human players, and it&apos;s often
              surprisingly hard to tell them apart.
            </P>
          </div>
          <div>
            <H3>Can I play a game with only AI characters?</H3>
            <P>
              Yes. You can start a solo session and let AI fill every other seat. It&apos;s a great way
              to practice strategies, learn new games, or just enjoy a quick round when friends
              aren&apos;t available. Head to the{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">game library</Link> to
              try it.
            </P>
          </div>
        </div>

        {/* --- CTA --- */}
        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Play with AI Characters</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Jump into a game of Werewolf, Mafia, or any social deduction game — smart AI characters fill every empty seat.
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
