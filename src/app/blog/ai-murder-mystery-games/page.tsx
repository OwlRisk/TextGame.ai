import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "AI Murder Mystery Games — Host a Virtual Whodunit Online";
const DESCRIPTION =
  "Discover how AI murder mystery games work, how to host a virtual whodunit online, and how textgame.ai's detective mystery template lets you play free with friends or AI characters.";
const CANONICAL = "/blog/ai-murder-mystery-games";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai murder mystery",
    "online murder mystery game",
    "virtual murder mystery",
    "murder mystery game online free",
    "ai detective game",
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

export default function AiMurderMysteryGamesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI Murder Mystery Games</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Murder Mystery</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Murder mystery games are a classic party format — but organizing one usually means buying a
            kit, assigning roles by hand, and finding someone to host. AI changes all of that. Here&apos;s
            how AI murder mystery games work and how to host one for free online.
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
              { id: "what-are-they", label: "What Are AI Murder Mystery Games?" },
              { id: "how-ai-hosts", label: "How the AI Hosts the Mystery" },
              { id: "formats", label: "Types of Murder Mystery Formats" },
              { id: "hosting-tips", label: "Tips for Hosting a Great Game" },
              { id: "textgame-template", label: "The Detective Mystery on textgame.ai" },
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

        {/* ── What Are AI Murder Mystery Games ───────────────────────── */}
        <H2 id="what-are-they">What Are AI Murder Mystery Games?</H2>
        <P>
          A murder mystery game puts players into a story where someone has been killed. Each player
          takes on a character — complete with backstory, secrets, alibis, and motives. Through
          conversation, investigation, and deduction, the group works to uncover who did it.
        </P>
        <P>
          In an <strong className="text-white">AI murder mystery</strong>, the AI takes the role of
          host: it generates the scenario, assigns characters, plants clues, and reveals information
          at the right moments. No human organizer needed. The AI can also play suspect characters,
          so you don&apos;t need a large group to have a full cast.
        </P>
        <P>
          The result is a murder mystery you can start in minutes, replay infinitely (the AI generates
          a different mystery each time), and play with any number of people — even solo.
        </P>

        {/* ── How the AI Hosts the Mystery ────────────────────────────── */}
        <H2 id="how-ai-hosts">How the AI Hosts the Mystery</H2>
        <P>
          Here&apos;s what the AI handles behind the scenes:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Scenario generation</strong> — creates the setting, victim, and backstory</li>
          <li><strong className="text-white">Character assignment</strong> — gives each player a unique character with secrets and motives</li>
          <li><strong className="text-white">Clue distribution</strong> — plants evidence throughout the game, revealed as players investigate</li>
          <li><strong className="text-white">NPC suspects</strong> — AI-controlled characters that respond to interrogation with consistent personalities</li>
          <li><strong className="text-white">Pacing</strong> — introduces twists, new evidence, and time pressure at the right moments</li>
          <li><strong className="text-white">Resolution</strong> — manages the accusation phase and reveals the truth</li>
        </ul>
        <P>
          The AI knows who the killer is from the start but never reveals it prematurely. It responds
          to player questions, stays in character for NPCs, and adapts the story based on what players
          discover.
        </P>

        {/* ── Types of Murder Mystery Formats ────────────────────────── */}
        <H2 id="formats">Types of Murder Mystery Formats</H2>

        <H3>Classic Dinner Party</H3>
        <P>
          Everyone gathers (virtually or in person) and plays a character. Over multiple rounds, new
          clues are revealed, players question each other, and alliances form. This format works best
          with 6–12 players.
        </P>

        <H3>Detective Investigation</H3>
        <P>
          One or more players act as detectives investigating a crime scene. They interrogate AI
          suspects, examine evidence, and piece together the timeline. Great for solo or co-op play.
        </P>

        <H3>Escape-Room Hybrid</H3>
        <P>
          Combines puzzle-solving with mystery. Players must find physical clues (descriptions,
          codes, hidden messages) while also deducing the killer. Adds an extra layer of challenge.
        </P>

        <H3>Courtroom Drama</H3>
        <P>
          Players take roles as prosecution, defense, witnesses, and jury. The AI presents evidence,
          and players argue their case. A unique twist on the murder mystery format.
        </P>

        {/* ── Tips for Hosting ────────────────────────────────────────── */}
        <H2 id="hosting-tips">Tips for Hosting a Great Game</H2>
        <ol className="space-y-4 mb-8">
          {[
            { title: "Set the mood", desc: "Encourage players to stay in character. A brief intro message from the AI helps everyone get into the spirit." },
            { title: "Start with the right group size", desc: "4–8 players is ideal for a first game. The AI fills remaining character slots." },
            { title: "Don't rush the investigation", desc: "Give players time to question suspects and discuss theories. The best moments come from player-to-player debate." },
            { title: "Use the accusation phase wisely", desc: "When the AI calls for final accusations, have each player state who they think did it and why. Then enjoy the reveal." },
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

        {/* ── textgame.ai Template ───────────────────────────────────── */}
        <H2 id="textgame-template">The Detective Mystery on textgame.ai</H2>
        <P>
          {SITE_NAME} offers a dedicated{" "}
          <Link href="/games/detective-mystery" className="text-violet-400 hover:underline font-semibold">
          Detective Mystery template</Link> that makes hosting effortless:
        </P>
        <P>
          The AI generates a unique murder scenario every time — different victims, suspects, motives,
          and murder weapons. Each human player takes a detective role, and the AI controls the suspects.
          You interrogate characters, examine evidence, and build your case.
        </P>
        <P>
          What sets it apart from traditional murder mystery kits:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Infinite replayability</strong> — every game is procedurally generated</li>
          <li><strong className="text-white">No prep time</strong> — the AI sets everything up in seconds</li>
          <li><strong className="text-white">Any group size</strong> — play solo or with friends; AI fills the cast</li>
          <li><strong className="text-white">Dynamic suspects</strong> — AI characters respond naturally to any question, not just scripted answers</li>
          <li><strong className="text-white">Free to play</strong> — no kit to buy, no host to prepare</li>
        </ul>
        <P>
          You can also create custom mystery scenarios. Describe a setting — &quot;1920s speakeasy,&quot;
          &quot;space station lockdown,&quot; &quot;Victorian manor&quot; — and the AI builds a complete
          mystery around it.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I play an AI murder mystery solo?</H3>
            <P>
              Yes. On {SITE_NAME}, the AI controls all suspects and NPCs. You play as the detective,
              interrogate characters, and solve the case on your own. It&apos;s like an interactive
              detective novel.
            </P>
          </div>
          <div>
            <H3>How long does a game take?</H3>
            <P>
              Most AI murder mystery sessions last 30–60 minutes depending on the number of players
              and how thorough the investigation is. Quick games can wrap up in 20 minutes; elaborate
              ones can stretch longer.
            </P>
          </div>
          <div>
            <H3>Is it better than a murder mystery kit?</H3>
            <P>
              It depends on what you want. Kits offer polished, hand-crafted scenarios with physical
              props. AI murder mysteries offer infinite variety, zero prep, flexible group sizes, and
              dynamic NPC responses. Many players use both — kits for special occasions, AI for
              spontaneous game nights.
            </P>
          </div>
          <div>
            <H3>Can the AI be fooled or outsmarted?</H3>
            <P>
              The AI stays consistent with the established facts of the mystery. You can&apos;t trick
              it into revealing the killer early, but clever questioning can extract clues faster. The
              challenge is in deduction, not in gaming the AI.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Host a Murder Mystery Tonight</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            The AI generates a unique whodunit every time. Interrogate suspects, examine evidence, and
            crack the case — solo or with friends. No prep, no download, no cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/games/detective-mystery" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Play Detective Mystery
            </Link>
            <Link href="/discover" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl border border-zinc-700 transition-colors">
              Browse All Games
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
