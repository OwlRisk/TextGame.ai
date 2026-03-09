import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Codenames Online with AI — Rules, Tips & Free Game";
const DESCRIPTION =
  "Learn how to play Codenames online for free with AI teammates. Complete rules for Spymasters and Operatives, clue-giving strategies, and tips to dominate every round.";
const CANONICAL = "/blog/play-codenames-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play codenames online",
    "codenames rules",
    "codenames online free",
    "codenames game",
    "codenames strategy",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-codenames-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-codenames-online.png"],
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

export default function PlayCodenamesOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Codenames Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Codenames</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Codenames is the award-winning word association game that&apos;s taken game nights by storm.
            Two teams compete to identify their secret agents using one-word clues. Now you can play
            online with AI teammates — no group required. Here&apos;s everything you need to know.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-codenames-online.png"
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
              { id: "what-is", label: "What is Codenames?" },
              { id: "roles", label: "Spymaster vs Operative — Roles Explained" },
              { id: "rules", label: "How to Play Codenames — Step by Step" },
              { id: "strategy", label: "Strategy & Clue-Giving Tips" },
              { id: "online", label: "How to Play Codenames Online with AI" },
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

        {/* ── What is Codenames ──────────────────────────────────── */}
        <H2 id="what-is">What is Codenames?</H2>
        <P>
          <strong className="text-white">Codenames</strong> is a word game designed by Vlaada Chvátil,
          published by Czech Games Edition. It won the prestigious Spiel des Jahres (Game of the Year)
          award in 2016 and has become one of the most popular party games worldwide. Two teams compete
          to make contact with their secret agents hidden behind a 5×5 grid of word cards.
        </P>
        <P>
          The twist? Only the <strong className="text-white">Spymaster</strong> on each team knows which
          words belong to their team. They must give creative one-word clues to guide their teammates
          — called <strong className="text-white">Operatives</strong> — to the right words while
          avoiding the opposing team&apos;s words and the deadly Assassin card.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">2–8+ players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">15–25 min</p></div>
            <div><p className="text-2xl mb-1">💬</p><p className="font-semibold text-white">Word Association</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Team Strategy</p></div>
          </div>
        </div>

        {/* ── Roles ──────────────────────────────────────────────── */}
        <H2 id="roles">Spymaster vs Operative — Roles Explained</H2>
        <H3>Spymaster</H3>
        <P>
          Each team has one Spymaster who sees the secret <strong className="text-white">key card</strong> — a
          color-coded map showing which words belong to which team, which are neutral bystanders, and
          which is the Assassin. The Spymaster gives a one-word clue followed by a number (e.g.,
          &quot;Animal 3&quot;), indicating how many words on the board relate to that clue. Spymasters
          cannot gesture, make facial expressions, or say anything beyond their clue.
        </P>
        <H3>Operative</H3>
        <P>
          Operatives see only the 25 word cards on the board — no color coding. After hearing the
          Spymaster&apos;s clue, they discuss amongst themselves and tap words they believe belong to
          their team. They can guess up to the Spymaster&apos;s number plus one. A wrong guess ends
          their turn immediately. Touching the Assassin card loses the game instantly.
        </P>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">How to Play Codenames — Step by Step</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "Lay out 25 word cards in a 5×5 grid. Place the key card so only the two Spymasters can see it. The key card determines word ownership: 9 for the starting team, 8 for the other, 7 neutral bystanders, and 1 Assassin." },
            { phase: "Give a Clue", desc: "The active Spymaster says one word and one number. The word must relate to their team's cards; the number tells operatives how many cards connect to that clue. Creative, multi-card clues are the key to winning." },
            { phase: "Guess", desc: "Operatives discuss and tap a word card. If it's their team's color, they can keep guessing (up to the clue number + 1). If it's neutral, their turn ends. If it's the opponent's color, it helps the other team. If it's the Assassin — game over." },
            { phase: "Alternate Turns", desc: "Teams take turns giving clues and guessing. The first team to identify all their agents wins. Or a team instantly loses if their Operative touches the Assassin card." },
            { phase: "Win Condition", desc: "Contact all of your team's agents first to win. Alternatively, you win instantly if the opposing team accidentally reveals the Assassin on their turn." },
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
        <H2 id="strategy">Strategy &amp; Clue-Giving Tips</H2>
        <H3>For Spymasters</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Think in categories.</strong> Look for groups — animals, colors, professions — and craft clues that link multiple cards at once.</li>
          <li><strong className="text-white">Avoid ambiguity near the Assassin.</strong> If your clue could lead to the Assassin card, pick a safer word even if it covers fewer cards.</li>
          <li><strong className="text-white">Use &quot;0&quot; clues defensively.</strong> Saying &quot;River 0&quot; tells your team to avoid anything related to &quot;River&quot; — useful for steering away from the Assassin.</li>
          <li><strong className="text-white">Build on previous rounds.</strong> If operatives missed a word last turn, your next clue can implicitly reference it without wasting a new clue.</li>
        </ul>
        <H3>For Operatives</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Start with the most obvious connection.</strong> Secure easy picks first before attempting stretch guesses.</li>
          <li><strong className="text-white">Consider the Spymaster&apos;s perspective.</strong> Think about which words the Spymaster would want you to avoid.</li>
          <li><strong className="text-white">Don&apos;t over-guess.</strong> If you&apos;re unsure, stop. A conservative play beats hitting the Assassin.</li>
          <li><strong className="text-white">Remember past clues.</strong> Combine information from multiple rounds to identify remaining words.</li>
        </ul>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">How to Play Codenames Online with AI</H2>
        <P>
          Codenames traditionally needs 4+ players split into teams. With{" "}
          <TrackedGameLink href="/games/codenames" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          you can play anytime with AI filling any role:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Spymaster</strong> gives clever, multi-word clues that challenge you as an Operative. Or play as Spymaster and let AI guess.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI teammates and opponents.</strong> Solo or with one friend — AI fills every empty seat with distinct play styles.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite friends with a link.</strong> No app to install, no account needed for guests. Works in any browser.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎲</span>
            <p className="text-zinc-300"><strong className="text-white">Fresh word grids every game.</strong> Randomized boards ensure no two games feel the same.</p>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can I play Codenames with just 2 people?</H3>
            <P>
              Yes! On {SITE_NAME}, AI fills the remaining roles. You can play as a two-player cooperative
              team or on opposing sides with AI teammates. The game adapts to any player count.
            </P>
          </div>
          <div>
            <H3>What makes a good Codenames clue?</H3>
            <P>
              The best clues connect multiple words on the board while being unambiguous enough to avoid
              the Assassin and opponent&apos;s words. Think about shared categories, themes, or word
              roots that link your team&apos;s cards together.
            </P>
          </div>
          <div>
            <H3>What happens if you guess the Assassin word?</H3>
            <P>
              Your team <strong className="text-white">instantly loses</strong> the game. The Assassin is
              the most dangerous card on the board. Good Spymasters always consider Assassin proximity
              when crafting clues, and smart Operatives avoid risky guesses.
            </P>
          </div>
          <div>
            <H3>Is Codenames free to play online?</H3>
            <P>
              Yes. You can <TrackedGameLink href="/games/codenames" className="text-violet-400 hover:underline">play Codenames online for free</TrackedGameLink> on {SITE_NAME} with
              AI teammates, AI opponents, or a mix of human and AI players.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-amber-600/20 to-violet-600/20 border border-amber-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🕵️ Play Codenames Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Spymaster. AI teammates. Fresh boards every game. Start playing in 30 seconds.
          </p>
          <TrackedGameLink
            href="/games/codenames"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Codenames Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
