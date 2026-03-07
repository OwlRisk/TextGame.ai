import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "10 Best Among Us Alternatives — Social Deduction Games Online (2026)";
const DESCRIPTION =
  "Love Among Us? Here are 10 similar social deduction games you can play online — Werewolf, Mafia, Secret Hitler, Avalon, and more. Free options included.";
const CANONICAL = "/blog/among-us-alternatives";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "among us alternative",
    "games like among us",
    "among us alternatives online",
    "social deduction games like among us",
    "impostor games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-among-us-alternatives.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-among-us-alternatives.png"],
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

function GameCard({ rank, emoji, name, players, platform, description, link }: {
  rank: number; emoji: string; name: string; players: string; platform: string; description: string; link?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-4">
      <div className="flex items-start gap-4 mb-3">
        <span className="shrink-0 w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
          {rank}
        </span>
        <div>
          <h4 className="text-lg font-bold text-white">{emoji} {name}</h4>
          <div className="flex gap-3 mt-1 text-xs text-zinc-500">
            <span>👥 {players}</span>
            <span>📱 {platform}</span>
          </div>
        </div>
      </div>
      <P>{description}</P>
      {link && <p className="text-sm text-zinc-300">{link}</p>}
    </div>
  );
}

export default function AmongUsAlternativesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Among Us Alternatives</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">Listicle</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Social Deduction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Among Us made social deduction mainstream — but it&apos;s far from the only impostor game
            out there. Whether you want deeper strategy, different themes, or a text-based experience
            with AI players, these 10 alternatives deliver the same thrill of lying to your friends&apos;
            faces.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-among-us-alternatives.png"
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
              { id: "why-alternatives", label: "Why Look Beyond Among Us?" },
              { id: "the-list", label: "The 10 Best Alternatives" },
              { id: "comparison", label: "Quick Comparison Table" },
              { id: "how-to-pick", label: "How to Pick the Right Game" },
              { id: "ai-advantage", label: "The AI Advantage" },
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

        {/* ── Why Alternatives ─────────────────────────────────────── */}
        <H2 id="why-alternatives">Why Look Beyond Among Us?</H2>
        <P>
          Among Us is a great entry point into social deduction, but it has limitations. Games can feel
          repetitive after hundreds of rounds. The tasks are simple button presses. Discussions happen
          in short text-chat bursts. And you need at least 4 players to get a decent game going.
        </P>
        <P>
          The alternatives on this list offer <strong className="text-white">deeper roles</strong>,{" "}
          <strong className="text-white">richer discussions</strong>, and{" "}
          <strong className="text-white">different social dynamics</strong>. Some work with smaller
          groups. Some add AI players so you can play anytime. All of them scratch the same itch:
          figure out who&apos;s lying before it&apos;s too late.
        </P>

        {/* ── The List ─────────────────────────────────────────────── */}
        <H2 id="the-list">The 10 Best Among Us Alternatives</H2>

        <GameCard rank={1} emoji="🐺" name="Werewolf" players="5–15" platform="Browser, mobile"
          description="The original social deduction game. Werewolves secretly eliminate villagers at night while the village tries to identify and vote them out during the day. More roles and deeper strategy than Among Us."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf on {SITE_NAME}</Link> — AI Game Master, AI players, no minimum player count.</>}
        />
        <GameCard rank={2} emoji="🎭" name="Mafia" players="6–15" platform="Browser, mobile"
          description="Werewolf&apos;s urban cousin. The Mafia eliminates townspeople at night. Roles like Detective and Doctor add investigative layers. Extended discussion phases make for more intense debates."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia on {SITE_NAME}</Link> — full game with AI characters that bluff and accuse.</>}
        />
        <GameCard rank={3} emoji="📜" name="Secret Hitler" players="5–10" platform="Browser"
          description="Players are secretly Liberals or Fascists. The government passes policies each round — but Fascists want to enact their agenda or elect Hitler as Chancellor. Trust no one."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/secret-hitler" className="text-violet-400 hover:underline">Secret Hitler on {SITE_NAME}</Link></>}
        />
        <GameCard rank={4} emoji="⚔️" name="The Resistance / Avalon" players="5–10" platform="Browser"
          description="Teams go on missions. Loyal servants want missions to succeed; spies secretly sabotage them. Avalon adds Merlin — who knows the spies but must stay hidden. No player elimination, so everyone stays in the game."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/avalon" className="text-violet-400 hover:underline">Avalon on {SITE_NAME}</Link></>}
        />
        <GameCard rank={5} emoji="🌍" name="Spyfall" players="3–8" platform="Browser"
          description="Everyone is at a secret location — except the spy, who doesn&apos;t know where they are. Ask each other questions to find the spy without revealing the location. Quick 10-minute rounds."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/spyfall" className="text-violet-400 hover:underline">Spyfall on {SITE_NAME}</Link></>}
        />
        <GameCard rank={6} emoji="🕵️" name="Town of Salem" players="7–15" platform="PC, browser"
          description="A deeper take on Mafia with dozens of unique roles across three factions: Town, Mafia, and Neutrals. Games last longer and require careful record-keeping. Great for players who want more complexity."
        />
        <GameCard rank={7} emoji="🦆" name="Goose Goose Duck" players="4–16" platform="PC, mobile"
          description="The most direct Among Us clone — with more roles, maps, and game modes. Free to play with cosmetic microtransactions. If you want Among Us but more, this is it."
        />
        <GameCard rank={8} emoji="❄️" name="Project Winter" players="6–8" platform="PC, console"
          description="Survival meets social deduction. Players gather resources and try to escape a frozen wilderness — but traitors sabotage from within. Combines gameplay mechanics with the core lying dynamic."
        />
        <GameCard rank={9} emoji="🕵️‍♂️" name="Who&apos;s the Spy (Undercover)" players="4–10" platform="Browser"
          description="Everyone receives a secret word except the spy, who gets a similar but different word. Describe your word vaguely enough to not reveal it, but specifically enough to identify the odd one out."
          link={<><strong className="text-white">Play free:</strong> <Link href="/games/undercover" className="text-violet-400 hover:underline">Undercover on {SITE_NAME}</Link></>}
        />
        <GameCard rank={10} emoji="🤖" name={`${SITE_NAME} (AI Social Deduction)`} players="1+" platform="Browser"
          description={`Play any social deduction game with an AI Game Master and AI characters. Werewolf, Mafia, Avalon, Spyfall, and more — all in one platform. AI fills empty seats so you never need to wait for enough players.`}
          link={<><strong className="text-white">Try it:</strong> <Link href="/discover" className="text-violet-400 hover:underline">Browse all games on {SITE_NAME}</Link></>}
        />

        {/* ── Comparison ───────────────────────────────────────────── */}
        <H2 id="comparison">Quick Comparison Table</H2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-zinc-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-zinc-900/80 text-left">
                <th className="px-4 py-3 text-zinc-400 font-semibold">Game</th>
                <th className="px-4 py-3 text-zinc-400 font-semibold">Players</th>
                <th className="px-4 py-3 text-zinc-400 font-semibold">Time</th>
                <th className="px-4 py-3 text-zinc-400 font-semibold">Free?</th>
                <th className="px-4 py-3 text-zinc-400 font-semibold">AI support</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Among Us</td><td className="px-4 py-2">4–15</td><td className="px-4 py-2">15–30 min</td><td className="px-4 py-2">Free (mobile)</td><td className="px-4 py-2">No</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Werewolf</td><td className="px-4 py-2">5–15</td><td className="px-4 py-2">30–45 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2 text-violet-400">Yes ({SITE_NAME})</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Mafia</td><td className="px-4 py-2">6–15</td><td className="px-4 py-2">30–60 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2 text-violet-400">Yes ({SITE_NAME})</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Secret Hitler</td><td className="px-4 py-2">5–10</td><td className="px-4 py-2">30–45 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2 text-violet-400">Yes ({SITE_NAME})</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Avalon</td><td className="px-4 py-2">5–10</td><td className="px-4 py-2">30–40 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2 text-violet-400">Yes ({SITE_NAME})</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Spyfall</td><td className="px-4 py-2">3–8</td><td className="px-4 py-2">10–15 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2 text-violet-400">Yes ({SITE_NAME})</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Goose Goose Duck</td><td className="px-4 py-2">4–16</td><td className="px-4 py-2">15–30 min</td><td className="px-4 py-2">Free</td><td className="px-4 py-2">No</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-2">Town of Salem</td><td className="px-4 py-2">7–15</td><td className="px-4 py-2">30–60 min</td><td className="px-4 py-2">Paid</td><td className="px-4 py-2">No</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── How to Pick ──────────────────────────────────────────── */}
        <H2 id="how-to-pick">How to Pick the Right Game</H2>
        <P>
          The best choice depends on your group size, how much time you have, and what kind of experience you want:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Small group (3–5):</strong> Spyfall, Undercover, or Coup work well with fewer players.</li>
          <li><strong className="text-white">Medium group (5–10):</strong> Avalon and Secret Hitler hit the sweet spot of strategy and chaos.</li>
          <li><strong className="text-white">Large group (10+):</strong> Werewolf and Mafia scale to bigger groups with more roles and longer discussions.</li>
          <li><strong className="text-white">Solo or 2 players:</strong> Use {SITE_NAME} — AI fills the rest of the seats with characters that bluff, vote, and strategize.</li>
          <li><strong className="text-white">Quick rounds:</strong> Spyfall (10 min) and Undercover (15 min) are the fastest options.</li>
        </ul>

        {/* ── AI Advantage ─────────────────────────────────────────── */}
        <H2 id="ai-advantage">The AI Advantage</H2>
        <P>
          The biggest problem with social deduction games is <strong className="text-white">getting enough
          players together</strong>. Among Us needs at least 4. Werewolf is best with 8+. Secret Hitler
          needs exactly 5–10. Finding that many people online at the same time is the real challenge.
        </P>
        <P>
          AI-powered platforms like {SITE_NAME} solve this by letting you play with any number of humans.
          AI characters fill the remaining seats — and they&apos;re not passive bots. They accuse, defend,
          form alliances, bluff, and vote strategically. The AI Game Master runs every phase so no one has
          to sit out as moderator.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>What&apos;s the closest game to Among Us?</H3>
            <P>
              Goose Goose Duck is the most similar in gameplay (tasks + impostors + voting). For a
              text-based alternative with deeper discussion, try{" "}
              <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link> or{" "}
              <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link> on {SITE_NAME}.
            </P>
          </div>
          <div>
            <H3>Can I play social deduction games with just 2 people?</H3>
            <P>
              Not traditionally — most require 5+. But on {SITE_NAME}, AI players fill the remaining
              seats. You can start a full Werewolf game with just yourself and one friend.
            </P>
          </div>
          <div>
            <H3>Are these games free?</H3>
            <P>
              Most of the games on this list have free versions. Every game on{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link> is
              free to play — no download, no subscription required to start.
            </P>
          </div>
          <div>
            <H3>Which social deduction game has the most strategy?</H3>
            <P>
              Avalon and Secret Hitler are the most strategically deep. Avalon&apos;s Merlin mechanic
              and Secret Hitler&apos;s policy-passing create layers of deduction that go beyond simple
              voting rounds.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎭 Try These Games Free</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Werewolf, Mafia, Avalon, Spyfall, and more — all with AI Game Master and AI players. No download needed.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse All Games
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
