import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Play Kingdom Intrigue Online — Medieval Court Deduction Game";
const DESCRIPTION =
  "Scheme for the throne in Kingdom Intrigue — forge alliances, spread rumors, and outwit rivals in a medieval court. Learn rules and play online with AI.";
const CANONICAL = "/blog/play-kingdom-intrigue-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "kingdom intrigue game",
    "medieval court game online",
    "political intrigue game",
    "strategy roleplay game",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    modifiedTime: MODIFIED,
    authors: [SITE_NAME],
    images: [{ url: "/games/game-cover-kingdom-intrigue.webp", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/games/game-cover-kingdom-intrigue.webp"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
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

export default function PlayKingdomIntrigueOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Kingdom Intrigue Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Kingdom Intrigue</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            The king is dying. The court is fractured. In <strong className="text-white">Kingdom Intrigue</strong>,
            you play a noble vying for the throne — forging secret alliances, spreading rumors about rivals,
            and timing your betrayals for maximum impact. It&apos;s political deduction meets medieval drama,
            and an AI narrator keeps the story alive.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What Is Kingdom Intrigue?" },
              { id: "how-to-play", label: "How to Play" },
              { id: "strategy", label: "Strategy — Alliances, Betrayal & Timing" },
              { id: "features", label: "Unique Features" },
              { id: "online", label: "Play Online with AI" },
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

        {/* ── What Is It ─────────────────────────────────────────── */}
        <H2 id="what-is">What Is Kingdom Intrigue?</H2>
        <P>
          <strong className="text-white">Kingdom Intrigue</strong> is a social deduction and strategy game
          set in a medieval court. Each player takes the role of a noble with a secret agenda — some want
          the crown, some serve a hidden faction, and some simply want to survive the political
          bloodbath. Through negotiation, accusations, and strategic voting, the court decides who rises
          and who falls.
        </P>
        <P>
          Unlike straightforward deduction games, Kingdom Intrigue layers in{" "}
          <strong className="text-white">dynamic events</strong> — plagues, assassinations, royal decrees —
          driven by an AI narrator that keeps every session unpredictable. Alliances you forged in round
          one may crumble by round three when the stakes shift.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👑</p><p className="font-semibold text-white">4–12 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">20–30 min</p></div>
            <div><p className="text-2xl mb-1">🏰</p><p className="font-semibold text-white">Medieval Theme</p></div>
            <div><p className="text-2xl mb-1">🗡️</p><p className="font-semibold text-white">Political Intrigue</p></div>
          </div>
        </div>

        {/* ── How to Play ────────────────────────────────────────── */}
        <H2 id="how-to-play">How to Play</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Court Assembly", desc: "Players receive secret role cards assigning their noble house, hidden allegiance, and special ability. The AI narrator sets the stage with a dramatic opening scene." },
            { phase: "Negotiation Phase", desc: "Each round begins with open discussion. Players can form alliances, make promises, trade favors, or privately message each other. Information is currency — share wisely." },
            { phase: "Court Event", desc: "The AI narrator introduces a random court event — a poisoning attempt, a visiting dignitary, a grain shortage. These events force difficult choices and reveal character." },
            { phase: "Council Vote", desc: "Players vote to take a collective action: banish a noble, appoint a regent, or execute an accused traitor. Majority rules, but ties trigger chaotic tiebreaker events." },
            { phase: "Resolution", desc: "After a set number of rounds, surviving players reveal their allegiances. The faction that controls the throne — or has eliminated its rivals — wins the game." },
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

        {/* ── Strategy ───────────────────────────────────────────── */}
        <H2 id="strategy">Strategy — Alliances, Betrayal &amp; Timing</H2>
        <H3>Building Alliances</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Ally early, but stay flexible.</strong> You need friends to survive the first few votes, but permanent loyalty is a liability in a game where everyone has a hidden agenda.</li>
          <li><strong className="text-white">Prove your value.</strong> Share useful information with allies — a revealed role, a voting pattern you noticed — to earn trust before you need it.</li>
          <li><strong className="text-white">Watch the quiet players.</strong> The noble who says nothing is often the one scheming the hardest.</li>
        </ul>
        <H3>The Art of Betrayal</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Time your betrayal perfectly.</strong> Betray too early and you lose all allies. Betray too late and your target may already be eliminated.</li>
          <li><strong className="text-white">Make it look justified.</strong> Frame your betrayal as a reaction to &quot;new information&quot; rather than premeditated scheming. The court will forgive pragmatism but never naked ambition.</li>
          <li><strong className="text-white">Keep one genuine ally.</strong> Even the most Machiavellian player needs someone watching their back during chaotic council votes.</li>
        </ul>
        <H3>Surviving Court Events</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Adapt your plans.</strong> Court events can invalidate your strategy overnight. The best players pivot quickly when the AI narrator throws a curveball.</li>
          <li><strong className="text-white">Use events as cover.</strong> A plague outbreak is the perfect time to eliminate a rival and blame the chaos.</li>
        </ul>

        {/* ── Features ───────────────────────────────────────────── */}
        <H2 id="features">Unique Features</H2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">📖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Narration</strong> — A dynamic narrator describes court events, sets atmospheric scenes, and reacts to player choices in real time, making every game feel like a unique story.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎲</span>
            <p className="text-zinc-300"><strong className="text-white">Random Court Events</strong> — Assassinations, plagues, royal weddings, and betrayals shake up the political landscape every round. No two games play the same.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🏰</span>
            <p className="text-zinc-300"><strong className="text-white">Deep Role System</strong> — Each noble house has unique abilities and win conditions, creating layered strategy beyond simple team deduction.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⚔️</span>
            <p className="text-zinc-300"><strong className="text-white">Private Messaging</strong> — Whisper to allies, make secret deals, or feed misinformation to rivals. The court is full of shadows.</p>
          </div>
        </div>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">Play Online with AI</H2>
        <P>
          Experience the full medieval court experience on{" "}
          <Link href="/games/kingdom-intrigue" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>.
          The AI narrator runs the story while AI nobles fill empty seats with cunning, believable opponents.
        </P>
        <P>
          If you enjoy political intrigue, also check out{" "}
          <Link href="/games/avalon" className="text-violet-400 hover:underline">Avalon</Link> for Arthurian
          deduction or{" "}
          <Link href="/games/vampire-court" className="text-violet-400 hover:underline">Vampire Court</Link>{" "}
          for a gothic twist on court politics.
        </P>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How is Kingdom Intrigue different from Werewolf?</H3>
            <P>
              Werewolf focuses on elimination voting with minimal negotiation. Kingdom Intrigue adds{" "}
              <strong className="text-white">dynamic events, private messaging, faction politics, and AI
              narration</strong> — it&apos;s closer to a political RPG than a simple deduction game.
            </P>
          </div>
          <div>
            <H3>How long does a game take?</H3>
            <P>
              A typical game runs <strong className="text-white">20–30 minutes</strong> depending on player
              count and how much negotiation happens. The AI narrator keeps the pace moving so games
              rarely drag.
            </P>
          </div>
          <div>
            <H3>Can I play solo against AI?</H3>
            <P>
              Yes. AI nobles have distinct personalities — some are trustworthy, some are
              backstabbers. Solo games are a great way to practice strategy before playing with friends.
            </P>
          </div>
          <div>
            <H3>Is Kingdom Intrigue free to play?</H3>
            <P>
              Yes. <Link href="/games/kingdom-intrigue" className="text-violet-400 hover:underline">Play Kingdom Intrigue online for free</Link> on {SITE_NAME} with
              full AI narration and AI opponents. No download needed.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">👑 Claim the Throne</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Forge alliances, betray rivals, and scheme your way to the crown. AI narrator included.
          </p>
          <Link
            href="/games/kingdom-intrigue"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Kingdom Intrigue Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
