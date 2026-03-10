import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "15 Best Online Party Games for Groups — Free, No Download (2026)";
const DESCRIPTION =
  "The best online party games you can play with friends — social deduction, word games, trivia, bluffing, and storytelling. Free, no download, many with AI hosts.";
const CANONICAL = "/blog/best-online-party-games";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "online party games",
    "party games online",
    "group games online",
    "free online party games",
    "virtual party games",
    "games to play with friends online",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-best-online-party-games.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-best-online-party-games.png"],
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
  return <h3 className="text-xl font-bold text-white mt-10 mb-3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

interface GameEntry {
  emoji: string;
  name: string;
  players: string;
  time: string;
  description: string;
  playOnline: React.ReactNode;
}

function GameCard({ game }: { game: GameEntry }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-5">
      <div className="flex items-start gap-4 mb-3">
        <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/15 text-2xl flex items-center justify-center">
          {game.emoji}
        </span>
        <div>
          <h4 className="text-lg font-bold text-white">{game.name}</h4>
          <div className="flex gap-3 mt-1 text-xs text-zinc-500">
            <span>👥 {game.players}</span>
            <span>⏱ {game.time}</span>
          </div>
        </div>
      </div>
      <P>{game.description}</P>
      <p className="text-sm text-zinc-300">
        <strong className="text-white">Play online:</strong> {game.playOnline}
      </p>
    </div>
  );
}

const SOCIAL_DEDUCTION: GameEntry[] = [
  {
    emoji: "🐺",
    name: "Werewolf",
    players: "6–12",
    time: "30–45 min",
    description: "The classic. Werewolves hide among villagers. By day, debate and vote. By night, the wolves hunt. Special roles like Seer and Doctor add strategic depth.",
    playOnline: <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Free on {SITE_NAME} with AI Game Master and AI players</TrackedGameLink>,
  },
  {
    emoji: "🎭",
    name: "Mafia",
    players: "6–15",
    time: "45–60 min",
    description: "The game that started social deduction. The Mafia eliminates townspeople at night. The town tries to identify and vote out the Mafia during the day.",
    playOnline: <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">Free on {SITE_NAME} with AI host</TrackedGameLink>,
  },
  {
    emoji: "🎩",
    name: "Secret Hitler",
    players: "5–10",
    time: "30–45 min",
    description: "Players are secretly Liberals or Fascists. The government enacts policies — but Fascists try to pass their agenda or elect Hitler as Chancellor. Liberals must stop them.",
    playOnline: <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">Free on {SITE_NAME}</TrackedGameLink>,
  },
  {
    emoji: "⚔️",
    name: "Avalon",
    players: "5–10",
    time: "30–40 min",
    description: "Players are loyal servants of Arthur or minions of Mordred. Teams go on quests — but the evil players can secretly sabotage missions. Merlin knows who's evil but must stay hidden.",
    playOnline: <TrackedGameLink href="/games/avalon" className="text-violet-400 hover:underline">Free on {SITE_NAME} with AI players</TrackedGameLink>,
  },
  {
    emoji: "🕵️",
    name: "Who's the Spy (Undercover)",
    players: "4–10",
    time: "15–20 min",
    description: "Everyone receives a secret word — except the spy, who gets a different (but similar) word. Go around describing your word without being too specific. Figure out who has the odd word out.",
    playOnline: <TrackedGameLink href="/games/undercover" className="text-violet-400 hover:underline">Free on {SITE_NAME}</TrackedGameLink>,
  },
];

const WORD_TRIVIA: GameEntry[] = [
  {
    emoji: "🔍",
    name: "Codenames",
    players: "4–12",
    time: "15–25 min",
    description: "Two teams compete to contact all their secret agents using one-word clues. The Spymaster knows which words belong to their team — and must give clever clues without accidentally guiding opponents to the Assassin.",
    playOnline: <TrackedGameLink href="/games/codenames" className="text-violet-400 hover:underline">Free on {SITE_NAME} with AI host</TrackedGameLink>,
  },
  {
    emoji: "💡",
    name: "Trivia",
    players: "2–10",
    time: "20–30 min",
    description: "Go head-to-head on history, science, pop culture, sports, and more. The AI host generates questions on any topic you choose, keeps score in real time, and adjusts difficulty to keep every round exciting.",
    playOnline: <TrackedGameLink href="/games/trivia" className="text-violet-400 hover:underline">Free on {SITE_NAME} with AI-generated questions</TrackedGameLink>,
  },
  {
    emoji: "📝",
    name: "Scattergories",
    players: "2–6",
    time: "15–20 min",
    description: "Roll a letter, set a timer, and race to fill categories with words that start with that letter. Unique answers score points. The pressure of the clock makes it hilarious and competitive.",
    playOnline: <>Various online versions available; or create a custom game on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link></>,
  },
  {
    emoji: "🎨",
    name: "Pictionary",
    players: "4–16",
    time: "20–30 min",
    description: "One player draws a word while teammates guess. Use screen sharing or drawing tools in video calls. Timed rounds and creative chaos make it a party classic.",
    playOnline: <>Various online versions available; or create a custom drawing-guessing game on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link></>,
  },
];

const STRATEGY_BLUFFING: GameEntry[] = [
  {
    emoji: "🃏",
    name: "Coup",
    players: "3–6",
    time: "15 min",
    description: "Each player has two hidden character cards with special abilities. On your turn, claim any ability — even if you don't have it. Other players can challenge your bluff.",
    playOnline: <>Various web implementations; create a custom version on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link></>,
  },
  {
    emoji: "🌍",
    name: "Spyfall",
    players: "3–8",
    time: "10–15 min",
    description: "Everyone is at the same location — except the spy, who doesn't know where they are. Ask each other questions to find the spy, but don't reveal the location!",
    playOnline: <TrackedGameLink href="/games/spyfall" className="text-violet-400 hover:underline">Free on {SITE_NAME}</TrackedGameLink>,
  },
  {
    emoji: "💌",
    name: "Love Letter",
    players: "2–4",
    time: "15–20 min",
    description: "A quick card game of deduction and luck. Each round you hold one card and draw another. Use your card's ability to eliminate opponents or protect yourself. Last player standing wins.",
    playOnline: <>Various online versions; create a custom bluffing game on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link></>,
  },
];

const CREATIVE_STORYTELLING: GameEntry[] = [
  {
    emoji: "🔎",
    name: "Murder Mystery",
    players: "4–8",
    time: "30–60 min",
    description: "One player is the killer. Everyone has alibis, motives, and secrets. Gather clues, question suspects, and piece together who committed the crime.",
    playOnline: <TrackedGameLink href="/games/detective-mystery" className="text-violet-400 hover:underline">AI-hosted on {SITE_NAME} with unique cases</TrackedGameLink>,
  },
  {
    emoji: "📖",
    name: "AI Storytelling",
    players: "3–8",
    time: "30–50 min",
    description: "Players collaborate to build an evolving story — each person adding a sentence or two. The AI host suggests themes, introduces unexpected plot twists, and keeps the adventure moving.",
    playOnline: <TrackedGameLink href="/games/storyteller" className="text-violet-400 hover:underline">Epic Storyteller on {SITE_NAME}</TrackedGameLink>,
  },
  {
    emoji: "🕵️‍♂️",
    name: "Dixit",
    players: "3–6",
    time: "30 min",
    description: "One player gives a clue for a surreal image. Others guess which image matches. The clue must be specific enough for some to guess, but vague enough for others to miss.",
    playOnline: <>Various online versions available; or create a custom storytelling game on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link></>,
  },
];

export default function BestOnlinePartyGamesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Best Online Party Games</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">Listicle</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Party Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Whether you&apos;re hosting a virtual game night or just want a quick round with friends online,
            these 15 party games are free, require no download, and work great over video or chat. From social
            deduction to word games to storytelling — there&apos;s something for every group.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-best-online-party-games.png"
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
              { id: "social-deduction", label: "Social Deduction (5 games)" },
              { id: "word-trivia", label: "Word & Trivia (4 games)" },
              { id: "strategy-bluffing", label: "Strategy & Bluffing (3 games)" },
              { id: "creative-storytelling", label: "Creative & Storytelling (3 games)" },
              { id: "host-game-night", label: "How to Host an Online Game Night" },
              { id: "ai-why", label: "Why AI Makes Party Games Better" },
              { id: "cta", label: "Try These Games" },
            ].map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Social Deduction ─────────────────────────────────────── */}
        <H2 id="social-deduction">Social Deduction</H2>
        <P>
          Hidden roles, bluffing, and deduction — these games are the best for groups that love reading people
          and lying convincingly. No two rounds play the same.
        </P>
        {SOCIAL_DEDUCTION.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}

        {/* ── Word & Trivia ─────────────────────────────────────────── */}
        <H2 id="word-trivia">Word & Trivia</H2>
        <P>
          Test your vocabulary, quick thinking, or general knowledge. These games work great for mixed groups
          and don&apos;t require a moderator to run.
        </P>
        {WORD_TRIVIA.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}

        {/* ── Strategy & Bluffing ────────────────────────────────────── */}
        <H2 id="strategy-bluffing">Strategy & Bluffing</H2>
        <P>
          Short rounds, high stakes. Players bluff, challenge, and outthink each other. Perfect for quick
          sessions when you want intensity without a long commitment.
        </P>
        {STRATEGY_BLUFFING.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}

        {/* ── Creative & Storytelling ────────────────────────────────── */}
        <H2 id="creative-storytelling">Creative & Storytelling</H2>
        <P>
          Build stories together, solve mysteries, or interpret surreal images. These games reward creativity
          and collaboration over competition.
        </P>
        {CREATIVE_STORYTELLING.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}

        {/* ── How to Host ───────────────────────────────────────────── */}
        <H2 id="host-game-night">How to Host an Online Game Night</H2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4 mb-8 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">📅</span>
            <p className="text-zinc-300"><strong className="text-white">Pick a time and send a link.</strong> Use a video call (Zoom, Meet, Discord) and share the game link in chat. Most players can join in under a minute.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎮</span>
            <p className="text-zinc-300"><strong className="text-white">Choose games that work for your group size.</strong> Social deduction (Werewolf, Mafia) needs 6+; Spyfall and Undercover work with 4–8. AI can fill empty seats on platforms like {SITE_NAME}.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎯</span>
            <p className="text-zinc-300"><strong className="text-white">Mix short and long games.</strong> Start with a quick round (Spyfall, Coup) to warm up, then move to something longer (Werewolf, Murder Mystery) if the group stays.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">Use AI when you&apos;re short on players.</strong> Platforms that offer AI hosts and AI players let you play even with 2–3 humans — no moderator needed.</p>
          </div>
        </div>

        {/* ── Why AI ─────────────────────────────────────────────────── */}
        <H2 id="ai-why">Why AI Makes Party Games Better</H2>
        <P>
          The biggest friction with online party games is logistics: you need enough people, someone to moderate,
          and setup time. AI solves all three.
        </P>
        <P>
          <strong className="text-white">No moderator.</strong> An AI Game Master runs every phase — assigns roles, manages night actions,
          keeps score, and announces results. No one has to sit out to host.
        </P>
        <P>
          <strong className="text-white">Fill empty seats.</strong> AI characters fill any open spots. They bluff, debate, and make
          strategic decisions. You can play solo for practice, with a couple of friends and AI filling the rest,
          or with a full human group.
        </P>
        <P>
          <strong className="text-white">Instant setup.</strong> No cards to shuffle, no boards to set up. Share a link, pick a game,
          and start. The AI handles everything in the background.
        </P>
        <P>
          For more on social deduction specifically, see our{" "}
          <Link href="/blog/best-social-deduction-games" className="text-violet-400 hover:underline">
            best social deduction games
          </Link>{" "}
          guide.
        </P>

        {/* CTA */}
        <div id="cta" className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12 scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-3">Play Party Games Online with AI</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Werewolf, Mafia, Spyfall, Trivia, Murder Mystery, and more. AI Game Master. AI players. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Browse All Games
            </Link>
            <Link href="/signin" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 border border-zinc-700 rounded-xl transition-colors">
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
