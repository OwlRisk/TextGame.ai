import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { BlogCTAButton } from "@/app/components/blog/BlogCTAButton";

const TITLE = "10 Best Social Deduction Games You Can Play Online in 2026";
const DESCRIPTION =
  "From Werewolf to Secret Hitler — the best social deduction games you can play online with friends or AI. Includes free options and AI-powered alternatives.";
const CANONICAL = "/blog/best-social-deduction-games";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "social deduction games",
    "best social deduction games",
    "social deduction games online",
    "online deduction games",
    "games like werewolf",
    "games like among us",
    "hidden role games",
    "party games online",
    "mafia game online",
    "secret hitler online",
    "avalon online",
    "ai social deduction",
    "best party games for groups",
    "free social deduction games online",
    "browser social deduction games",
    "digital social deduction games",
    "2026 social deduction games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-best-social-deduction-games.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-best-social-deduction-games.png"],
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
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

interface GameEntry {
  rank: number;
  emoji: string;
  name: string;
  players: string;
  time: string;
  description: string;
  whyGreat: string;
  playOnline: string;
  link?: string;
}

function GameCard({ game }: { game: GameEntry }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-500/15 text-3xl flex items-center justify-center">
          {game.emoji}
        </span>
        <div>
          <h3 className="text-xl font-bold text-white">
            {game.rank}. {game.name}
          </h3>
          <div className="flex gap-3 mt-1 text-xs text-zinc-500">
            <span>👥 {game.players}</span>
            <span>⏱ {game.time}</span>
          </div>
        </div>
      </div>
      <P>{game.description}</P>
      <p className="text-sm text-zinc-300 mb-2">
        <strong className="text-white">Why it&apos;s great:</strong> {game.whyGreat}
      </p>
      <p className="text-sm text-zinc-300">
        <strong className="text-white">Play online:</strong>{" "}
        {game.link ? (
          <TrackedGameLink href={game.link} className="text-violet-400 hover:underline">{game.playOnline}</TrackedGameLink>
        ) : (
          game.playOnline
        )}
      </p>
    </div>
  );
}

const GAMES: GameEntry[] = [
  {
    rank: 1,
    emoji: "🐺",
    name: "Werewolf",
    players: "6–12",
    time: "30–45 min",
    description: "The classic. Werewolves hide among villagers. By day, debate and vote. By night, the wolves hunt. Special roles like Seer and Doctor add strategic depth.",
    whyGreat: "The perfect balance of social skills and deduction. Easy to learn, endlessly replayable. Every group develops different meta-strategies.",
    playOnline: `Free on ${SITE_NAME} with AI Game Master and AI players`,
    link: "/games/werewolf",
  },
  {
    rank: 2,
    emoji: "🎭",
    name: "Mafia",
    players: "6–15",
    time: "45–60 min",
    description: "The game that started social deduction. The Mafia eliminates townspeople at night. The town tries to identify and vote out the Mafia during the day.",
    whyGreat: "Larger player count than Werewolf. The city theme and Detective role add a noir atmosphere. Great for bigger groups.",
    playOnline: `Free on ${SITE_NAME} with AI host`,
    link: "/games/mafia",
  },
  {
    rank: 3,
    emoji: "🕵️",
    name: "Who's the Spy (Undercover)",
    players: "4–10",
    time: "15–20 min",
    description: "Everyone receives a secret word — except the spy, who gets a different (but similar) word. Go around the table describing your word without being too specific. Figure out who has the odd word out.",
    whyGreat: "Fast-paced and hilarious. The word-guessing mechanic is unique among social deduction games. Perfect for quick rounds.",
    playOnline: `Free on ${SITE_NAME}`,
    link: "/games/undercover",
  },
  {
    rank: 4,
    emoji: "⚔️",
    name: "Avalon (The Resistance)",
    players: "5–10",
    time: "30–40 min",
    description: "Players are loyal servants of Arthur or minions of Mordred. Teams go on quests — but the evil players can secretly sabotage missions. Merlin knows who's evil but must stay hidden.",
    whyGreat: "No player elimination — everyone stays in the game. The quest mechanic adds a layer of strategy beyond just voting. Merlin's dilemma is brilliantly designed.",
    playOnline: `Free on ${SITE_NAME} with AI players`,
    link: "/games/avalon",
  },
  {
    rank: 5,
    emoji: "🏛️",
    name: "Secret Hitler",
    players: "5–10",
    time: "30–45 min",
    description: "Players are secretly Liberals or Fascists. The government enacts policies — but Fascists try to pass their agenda or elect Hitler as Chancellor. Liberals must stop them.",
    whyGreat: "The policy-passing mechanic creates information you can analyze. The escalating tension as Fascist policies pile up is unmatched. Great strategic depth.",
    playOnline: `Free on ${SITE_NAME}`,
    link: "/games/secret-hitler",
  },
  {
    rank: 6,
    emoji: "🔍",
    name: "Murder Mystery",
    players: "4–8",
    time: "30–60 min",
    description: "One player is the killer. Everyone has alibis, motives, and secrets. Gather clues, question suspects, and piece together who committed the crime.",
    whyGreat: "More narrative-driven than pure deduction games. Each game tells a unique story. Great for players who love detective fiction.",
    playOnline: `AI-hosted on ${SITE_NAME}`,
    link: "/games/murder-mystery",
  },
  {
    rank: 7,
    emoji: "🚀",
    name: "Among Us",
    players: "4–15",
    time: "15–30 min",
    description: "Crew members complete tasks on a spaceship while Impostors sabotage and eliminate them. When a body is found, everyone debates and votes.",
    whyGreat: "The task-completion mechanic gives everyone something to do between meetings. Visual gameplay adds physicality to social deduction. Massive community.",
    playOnline: "Available on Steam, mobile, and consoles",
  },
  {
    rank: 8,
    emoji: "🌍",
    name: "Spyfall",
    players: "3–8",
    time: "10–15 min",
    description: "Everyone is at the same location — except the spy, who doesn't know where they are. Ask each other questions to find the spy, but don't reveal the location!",
    whyGreat: "Incredibly simple to learn. The question-asking dynamic is unique and leads to hilarious moments. Very quick rounds.",
    playOnline: `Available on ${SITE_NAME}`,
    link: "/games/spyfall",
  },
  {
    rank: 9,
    emoji: "💀",
    name: "Blood on the Clocktower",
    players: "5–20",
    time: "60–90 min",
    description: "A complex social deduction game with a Storyteller (host), dead players who still participate, and dozens of unique character abilities that create emergent gameplay.",
    whyGreat: "Dead players keep playing. The Storyteller mechanic allows for dynamic, adaptive games. Extremely deep for experienced groups.",
    playOnline: "Official online app available; or create a custom version on " + SITE_NAME,
  },
  {
    rank: 10,
    emoji: "🃏",
    name: "Coup",
    players: "3–6",
    time: "15 min",
    description: "Each player has two hidden character cards with special abilities. On your turn, claim any ability — even if you don't have it. Other players can challenge your bluff.",
    whyGreat: "Pure bluffing distilled into 15 minutes. Every decision matters. The elimination mechanic keeps games short and intense.",
    playOnline: "Various web implementations; create a custom version on " + SITE_NAME,
  },
];

export default function BestSocialDeductionGamesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Best Social Deduction Games</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">Listicle</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Social Deduction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Social deduction games are the best way to test your ability to read people, bluff, and
            think on your feet. Whether you prefer classic Werewolf or complex political intrigue, this
            list covers the best games you can play online — many of them free and playable with AI.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>10 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-best-social-deduction-games.png"
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
              { id: "what-is", label: "What is Social Deduction?" },
              { id: "list", label: "The 10 Best Games" },
              { id: "how-to-choose", label: "How to Choose" },
              { id: "play-with-ai", label: "Playing with AI" },
            ].map((item, i) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── What is social deduction ─────────────────────────────── */}
        <H2 id="what-is">What is Social Deduction?</H2>
        <P>
          Social deduction games are a genre where players have <strong className="text-white">hidden roles
          or information</strong>. Some players are secretly working against the group. The challenge is
          figuring out who to trust — through conversation, observation, and reasoning.
        </P>
        <P>
          What makes them special is that the &ldquo;game board&rdquo; is the <strong className="text-white">conversation
          itself</strong>. You win by reading people, building arguments, forming alliances, and sometimes
          lying convincingly. No two games play the same way because the dynamics depend on the people
          (or AI) at the table.
        </P>

        <div className="my-8 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center">
          <p className="text-sm text-zinc-300 mb-3">Want to try social deduction with AI right now?</p>
          <BlogCTAButton href="/create?preset=werewolf-classic" source="best-social-deduction-games-mid" variant="primary">
            Play Werewolf Free — No Download
          </BlogCTAButton>
        </div>

        {/* ── The List ─────────────────────────────────────────────── */}
        <H2 id="list">The 10 Best Social Deduction Games Online</H2>
        {GAMES.map((game) => (
          <GameCard key={game.rank} game={game} />
        ))}

        {/* ── How to choose ────────────────────────────────────────── */}
        <H2 id="how-to-choose">How to Choose the Right Game</H2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4 mb-8 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚡</span>
            <p className="text-zinc-300"><strong className="text-white">Quick rounds (10–15 min):</strong> Who&apos;s the Spy, Spyfall, Coup</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎯</span>
            <p className="text-zinc-300"><strong className="text-white">Classic experience (30–45 min):</strong> Werewolf, Mafia, Avalon, Secret Hitler</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🧠</span>
            <p className="text-zinc-300"><strong className="text-white">Deep strategy (45+ min):</strong> Blood on the Clocktower, Murder Mystery</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">Large groups (10+):</strong> Mafia, Among Us, Blood on the Clocktower</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300">
              <strong className="text-white">Play with AI (any group size):</strong>{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link> —
              Werewolf, Mafia, Avalon, Secret Hitler, Who&apos;s the Spy, and more
            </p>
          </div>
        </div>

        {/* ── AI ───────────────────────────────────────────────────── */}
        <H2 id="play-with-ai">Playing Social Deduction Games with AI</H2>
        <P>
          The biggest problem with social deduction games is logistics: you need enough people, at the
          same time, and someone to moderate. AI solves all three problems.
        </P>
        <P>
          On <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
          an AI Game Master runs the session while AI characters fill empty seats. Each AI player has a
          unique personality — some are aggressive accusers, others are quiet observers, some are
          skilled bluffers. They react to what you say and adapt their strategies.
        </P>
        <P>
          You can play solo for practice, with a couple of friends and AI filling the rest, or with a full
          group of humans. The AI host handles all the rules so nobody needs to be the moderator.
        </P>
        <P>
          For more on how AI roleplay games work, see our{" "}
          <Link href="/blog/roleplay-ai-guide" className="text-violet-400 hover:underline">
            complete guide to roleplay AI
          </Link>.
        </P>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Play Social Deduction Games with AI</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            10+ games. AI Game Master. AI players that bluff and strategize. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BlogCTAButton href="/discover" source="best-social-deduction-games">
              Browse All Games
            </BlogCTAButton>
            <BlogCTAButton href="/create?preset=werewolf-classic" source="best-social-deduction-games-werewolf" variant="secondary">
              Try Werewolf Free
            </BlogCTAButton>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
