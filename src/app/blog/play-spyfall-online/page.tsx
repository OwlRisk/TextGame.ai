import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Play Spyfall Online Free — Rules, Tips & AI-Hosted Game";
const DESCRIPTION =
  "Learn how to play Spyfall online for free with an AI host. Complete rules, location list, question strategies, and tips for both the Spy and regular players.";
const CANONICAL = "/blog/play-spyfall-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play spyfall online",
    "spyfall rules",
    "spyfall online free",
    "spyfall game",
    "spyfall locations",
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

export default function PlaySpyfallOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Spyfall Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Spyfall</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Spyfall is the hilarious party game where everyone knows the secret location — except the
            Spy. Through clever questions and careful answers, players try to expose the Spy while the
            Spy scrambles to figure out where they are. Now you can play online with AI — here&apos;s how.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What is Spyfall?" },
              { id: "rules", label: "How to Play — Rules & Mechanics" },
              { id: "locations", label: "How Locations Work" },
              { id: "strategy", label: "Strategy Tips for Spy & Players" },
              { id: "online", label: "How to Play Spyfall Online with AI" },
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

        {/* ── What is Spyfall ────────────────────────────────────── */}
        <H2 id="what-is">What is Spyfall?</H2>
        <P>
          <strong className="text-white">Spyfall</strong> is a social deduction party game designed by
          Alexandr Ushan for 3–8 players. Each round, a secret location is chosen — a submarine, a
          casino, a space station, a pirate ship — and every player receives a card telling them the
          location, except for one player: the <strong className="text-white">Spy</strong>.
        </P>
        <P>
          Players take turns asking each other questions to figure out who the Spy is, while the Spy
          tries to <strong className="text-white">blend in</strong> by answering vaguely enough to
          avoid suspicion but specifically enough to seem like they know the location. It&apos;s a
          game of reading people, crafting questions, and thinking on your feet.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">3–8 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">10–15 min</p></div>
            <div><p className="text-2xl mb-1">🕵️</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">😂</p><p className="font-semibold text-white">Party Game</p></div>
          </div>
        </div>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Rules &amp; Mechanics</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "A random location is selected from the deck. Every player receives a card showing the location — except the Spy, who gets a blank Spy card. The Spy doesn't know where they are." },
            { phase: "Questioning", desc: "Players take turns asking any other player a question. Questions should be specific enough to verify the person knows the location, but vague enough not to give the location away to the Spy." },
            { phase: "Answering", desc: "The questioned player answers. Regular players walk a fine line — too specific and the Spy learns the location; too vague and other players suspect you're the Spy." },
            { phase: "Accusation", desc: "At any point, a player can accuse someone of being the Spy. If a majority agrees, that player is revealed. If correct, the non-Spy players win. If wrong, the Spy wins." },
            { phase: "Spy Guesses", desc: "Alternatively, the Spy can stop the game at any time and guess the location. A correct guess means the Spy wins. A wrong guess means the other players win." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.phase}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Locations ──────────────────────────────────────────── */}
        <H2 id="locations">How Locations Work</H2>
        <P>
          Spyfall includes a wide variety of locations that range from everyday places to exotic settings.
          The original game features locations like a <strong className="text-white">bank, hospital,
          pirate ship, space station, submarine, university, casino, supermarket, movie studio,</strong> and
          many more. Each location creates unique dynamics for questions and answers.
        </P>
        <P>
          The key to locations is that they&apos;re <strong className="text-white">specific enough to
          test knowledge but broad enough to allow creative questions</strong>. For example, at a
          &quot;Beach&quot; location, a player might ask &quot;How&apos;s the weather where we are?&quot;
          — a regular player can answer naturally, but the Spy has to improvise without knowing if
          they&apos;re at a beach, a ski resort, or a desert.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
            {["🏦 Bank", "🏥 Hospital", "🏴‍☠️ Pirate Ship", "🚀 Space Station", "🎰 Casino", "🏖️ Beach", "🎬 Movie Studio", "🏫 University", "🚢 Cruise Ship", "🎪 Circus"].map((loc) => (
              <div key={loc} className="bg-zinc-800/50 rounded-lg p-2">
                <p className="text-zinc-300">{loc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Strategy ───────────────────────────────────────────── */}
        <H2 id="strategy">Strategy Tips for Spy &amp; Players</H2>
        <H3>As a Regular Player</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Ask questions only insiders would understand.</strong> Reference specific details about the location without naming it directly — &quot;Is there water nearby?&quot; works at a beach.</li>
          <li><strong className="text-white">Watch for vague or deflecting answers.</strong> The Spy often redirects questions or gives overly generic responses that could fit any location.</li>
          <li><strong className="text-white">Don&apos;t reveal too much.</strong> Your questions and answers give information to the Spy too. Be specific enough to test others, but don&apos;t hand the location away.</li>
          <li><strong className="text-white">Pay attention to body language and hesitation.</strong> The Spy often pauses before answering because they&apos;re constructing a safe response.</li>
        </ul>
        <H3>As the Spy</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Listen more than you talk.</strong> Every question and answer gives you clues about the location. Piece them together before guessing.</li>
          <li><strong className="text-white">Give confident, mid-range answers.</strong> Don&apos;t be too specific (you might be wrong) or too vague (you&apos;ll seem suspicious). Aim for plausible generality.</li>
          <li><strong className="text-white">Ask questions that work for many locations.</strong> &quot;Do you come here often?&quot; or &quot;Is it busy today?&quot; are safe questions that don&apos;t reveal ignorance.</li>
          <li><strong className="text-white">Guess the location early if confident.</strong> Don&apos;t wait until you&apos;re accused — if you&apos;ve figured it out, guess immediately for the win.</li>
        </ul>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">How to Play Spyfall Online with AI</H2>
        <P>
          Spyfall is best with a group, but finding 3–8 players isn&apos;t always easy. With{" "}
          <Link href="/games/spyfall" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
          you can play anytime:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Host</strong> manages rounds, location selection, card dealing, and timing. No setup required.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI players with unique personalities.</strong> They ask clever questions, give convincing answers, and make surprisingly good spies.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Share a link to invite friends.</strong> Guests join in-browser with no sign-up or download needed.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📍</span>
            <p className="text-zinc-300"><strong className="text-white">Dozens of locations.</strong> Every game features a randomized location from a huge pool, keeping rounds fresh and unpredictable.</p>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many players do you need for Spyfall?</H3>
            <P>
              The original game supports 3–8 players. On {SITE_NAME}, you can play with just 1–2 humans
              and AI fills the rest. AI players ask real questions and give believable answers, making
              solo play genuinely challenging and fun.
            </P>
          </div>
          <div>
            <H3>How long does a round of Spyfall take?</H3>
            <P>
              A typical round lasts <strong className="text-white">8–10 minutes</strong>. The game uses
              a timer — when it runs out, players must vote. This keeps rounds snappy and prevents
              overthinking. Most groups play 3–5 rounds per session.
            </P>
          </div>
          <div>
            <H3>Can the Spy win without guessing the location?</H3>
            <P>
              Yes. If the timer runs out and players haven&apos;t successfully identified the Spy through
              a majority vote, the Spy wins automatically. The Spy also wins if players accuse the
              wrong person.
            </P>
          </div>
          <div>
            <H3>Is Spyfall free to play online?</H3>
            <P>
              Yes. You can <Link href="/games/spyfall" className="text-violet-400 hover:underline">play Spyfall online for free</Link> on {SITE_NAME} with
              an AI host and AI players. No subscription, no app install required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🕵️ Play Spyfall Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI host. AI players. Dozens of locations. Find the Spy in 30 seconds.
          </p>
          <Link
            href="/games/spyfall"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Spyfall Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
