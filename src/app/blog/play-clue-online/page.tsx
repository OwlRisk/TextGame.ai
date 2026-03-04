import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "Play Clue (Cluedo) Online with AI — Rules, Characters & Free Game";
const DESCRIPTION =
  "Master the rules of Clue (Cluedo), learn every character and weapon, sharpen your deduction strategy, and play online for free with an AI Game Master on textgame.ai.";
const CANONICAL = "/blog/play-clue-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play clue online",
    "cluedo online",
    "clue board game rules",
    "clue characters",
    "cluedo game online free",
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

function SuspectCard({ emoji, name, description }: { emoji: string; name: string; description: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{emoji}</span>
        <p className="font-bold text-white">{name}</p>
      </div>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

export default function PlayClueOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Clue Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Clue</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Clue (known as Cluedo outside North America) is the classic murder-mystery board game
            where players use deduction to figure out <strong className="text-white">who committed the crime,
            with what weapon, and in which room</strong>. Now you can play it online with an AI Game
            Master — no board required.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What is Clue (Cluedo)?" },
              { id: "characters", label: "Characters & Suspects" },
              { id: "weapons-rooms", label: "Weapons & Rooms" },
              { id: "rules", label: "How to Play — Rules & Deduction" },
              { id: "strategy", label: "Strategy Tips" },
              { id: "online", label: "Play Clue Online on textgame.ai" },
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

        {/* ── What is Clue ──────────────────────────────────────────── */}
        <H2 id="what-is">What is Clue (Cluedo)?</H2>
        <P>
          First published in 1949 by Waddingtons in the UK, Clue is a <strong className="text-white">deduction
          board game</strong> where a murder has been committed in a mansion. One suspect, one weapon,
          and one room card are secretly placed in an envelope. Players move around the board, make
          suggestions, and eliminate possibilities until someone is confident enough to make a final accusation.
        </P>
        <P>
          Unlike social deduction games where you bluff, Clue is a <strong className="text-white">logic
          puzzle</strong>. Every time another player shows you a card to disprove your suggestion,
          you gain information. The first player to correctly identify all three mystery cards wins.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">🔍</p><p className="font-semibold text-white">2–6 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30–60 min</p></div>
            <div><p className="text-2xl mb-1">🧩</p><p className="font-semibold text-white">Deduction</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Logic</p></div>
          </div>
        </div>

        {/* ── Characters ────────────────────────────────────────────── */}
        <H2 id="characters">Characters &amp; Suspects</H2>
        <P>The classic Clue roster features six colorful suspects, each a potential murderer:</P>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <SuspectCard emoji="🟥" name="Miss Scarlet" description="The cunning socialite. Always moves first in the classic game. Confident, sharp, and never without an alibi." />
          <SuspectCard emoji="🟨" name="Colonel Mustard" description="The distinguished military man. Blunt, assertive, and used to giving orders — but does he have something to hide?" />
          <SuspectCard emoji="⬜" name="Mrs. White" description="The loyal housekeeper who knows every secret in the mansion. Quiet on the surface, dangerous underneath." />
          <SuspectCard emoji="🟩" name="Reverend Green" description="The pious clergyman with a mysterious past. His moral façade may conceal darker motives." />
          <SuspectCard emoji="🟦" name="Mrs. Peacock" description="The aristocratic politician. Wealthy, well-connected, and accustomed to getting away with things." />
          <SuspectCard emoji="🟪" name="Professor Plum" description="The absent-minded academic. Brilliant but unpredictable — genius and madness are close neighbors." />
        </div>

        {/* ── Weapons & Rooms ───────────────────────────────────────── */}
        <H2 id="weapons-rooms">Weapons &amp; Rooms</H2>
        <H3>The Six Weapons</H3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {["🔪 Knife", "🔫 Revolver", "🕯️ Candlestick", "🧪 Poison", "🔧 Wrench", "🪢 Rope"].map((w) => (
            <div key={w} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-center text-sm text-zinc-300">{w}</div>
          ))}
        </div>
        <H3>The Nine Rooms</H3>
        <P>
          The mansion contains nine rooms: <strong className="text-white">Kitchen, Ballroom, Conservatory,
          Billiard Room, Library, Study, Hall, Lounge, and Dining Room</strong>. Each room is a potential
          crime scene. Secret passages connect the Kitchen to the Study and the Conservatory to the Lounge,
          allowing quick movement across the board.
        </P>

        {/* ── Rules ─────────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Rules &amp; Deduction</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "Shuffle suspects, weapons, and rooms separately. Place one of each into the confidential envelope. Deal the remaining cards evenly among players." },
            { phase: "Move", desc: "On your turn, roll the dice and move your token toward a room. You can also use secret passages if available." },
            { phase: "Suggest", desc: "Once inside a room, make a suggestion: 'I suggest it was Colonel Mustard, with the Knife, in the Library.' The named suspect and weapon tokens are moved to that room." },
            { phase: "Disprove", desc: "Starting left of the suggester, each player checks if they hold any of the three named cards. The first player who can must privately show ONE card to the suggester." },
            { phase: "Deduce", desc: "Record every piece of information on your detective notepad. Cross off cards you've seen — the remaining possibilities narrow the solution." },
            { phase: "Accuse", desc: "When you're certain, make a formal accusation. Check the envelope. Correct? You win! Wrong? You're eliminated from the game." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.phase}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Strategy ──────────────────────────────────────────────── */}
        <H2 id="strategy">Strategy Tips</H2>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Keep a meticulous notepad.</strong> Track every suggestion, who showed a card, and who couldn&apos;t. Even negative information is valuable.</li>
          <li><strong className="text-white">Suggest cards you already hold.</strong> This lets you learn about the other two cards without revealing new info to opponents.</li>
          <li><strong className="text-white">Watch opponents&apos; reactions.</strong> If a player can&apos;t disprove a suggestion, you know they don&apos;t hold any of those three cards.</li>
          <li><strong className="text-white">Use secret passages.</strong> They save turns and let you reach distant rooms without rolling the dice.</li>
          <li><strong className="text-white">Bluff your suggestions.</strong> Occasionally suggest cards you&apos;ve already ruled out to mislead other players about your progress.</li>
          <li><strong className="text-white">Don&apos;t accuse too early.</strong> A wrong accusation eliminates you. Wait until you&apos;ve confirmed all three cards through deduction.</li>
        </ul>

        {/* ── Online ────────────────────────────────────────────────── */}
        <H2 id="online">Play Clue Online on {SITE_NAME}</H2>
        <P>
          Setting up a physical Clue game takes time — the board, tokens, cards, and notepad. On{" "}
          <Link href="/games/clue" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
          the AI handles everything:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> shuffles cards, manages the envelope, tracks all suggestions, and enforces rules perfectly every time.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI suspects fill empty seats.</strong> Play with friends or solo — AI characters make suggestions, show cards, and try to solve the mystery themselves.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📋</span>
            <p className="text-zinc-300"><strong className="text-white">Automatic detective notepad.</strong> Every card shown is tracked for you, so you can focus on deduction instead of bookkeeping.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite friends with a link.</strong> No app download, no account required for guests. Just share and play.</p>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I play Clue with just 2 people?</H3>
            <P>
              The classic board game works best with 3–6. On {SITE_NAME}, AI players fill remaining
              seats, so even a solo player gets the full Clue experience with realistic opponents.
            </P>
          </div>
          <div>
            <H3>What&apos;s the difference between Clue and Cluedo?</H3>
            <P>
              They&apos;re the same game. &quot;Cluedo&quot; is the original name used in the UK and most of
              the world; &quot;Clue&quot; is the North American version. The rules, characters, and gameplay
              are identical.
            </P>
          </div>
          <div>
            <H3>How do suggestions and accusations differ?</H3>
            <P>
              A <strong className="text-white">suggestion</strong> is a safe guess you make when entering a room —
              other players can disprove it by showing a card. An <strong className="text-white">accusation</strong> is
              your final answer — you check the envelope, and if you&apos;re wrong, you&apos;re out of the game.
            </P>
          </div>
          <div>
            <H3>Is Clue free to play online?</H3>
            <P>
              Yes! You can <Link href="/games/clue" className="text-violet-400 hover:underline">play Clue online for
              free</Link> on {SITE_NAME} with an AI Game Master. No subscription needed.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-amber-600/20 to-violet-600/20 border border-amber-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🔍 Play Clue Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI suspects. Full deduction gameplay. Solve the mystery in minutes.
          </p>
          <Link
            href="/games/clue"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Clue Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
