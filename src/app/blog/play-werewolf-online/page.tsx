import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "How to Play Werewolf Online with AI — Rules, Roles & Free Game";
const DESCRIPTION =
  "Learn the rules of Werewolf, every role explained, winning strategies, and how to play online for free with an AI Game Master. No moderator needed.";
const CANONICAL = "/blog/play-werewolf-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play werewolf online",
    "werewolf game online",
    "werewolf rules",
    "werewolf roles",
    "how to play werewolf",
    "online werewolf game free",
    "werewolf ai",
    "werewolf game no moderator",
    "one night ultimate werewolf online",
    "werewolf social deduction",
    "ai werewolf game",
    "werewolf strategy",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/games/game-cover-werewolf.webp", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/games/game-cover-werewolf.webp"],
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

function RoleCard({ emoji, name, team, description }: { emoji: string; name: string; team: string; description: string }) {
  const teamColor = team === "Village" ? "text-emerald-400 bg-emerald-500/10" : team === "Werewolf" ? "text-red-400 bg-red-500/10" : "text-yellow-400 bg-yellow-500/10";
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-bold text-white">{name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${teamColor}`}>{team}</span>
        </div>
      </div>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

export default function PlayWerewolfOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Werewolf Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Werewolf</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Werewolf (also known as Mafia) is one of the most popular social deduction games ever made.
            Now you can play it online with AI characters — no physical cards, no human moderator, no
            minimum player count. Here&apos;s everything you need to know.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>9 min read</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What is Werewolf?" },
              { id: "roles", label: "All Roles Explained" },
              { id: "rules", label: "How to Play — Step by Step" },
              { id: "strategy", label: "Winning Strategies" },
              { id: "online", label: "How to Play Werewolf Online with AI" },
              { id: "vs-others", label: "Compared: Online Werewolf Platforms" },
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

        {/* ── What is Werewolf ─────────────────────────────────────── */}
        <H2 id="what-is">What is Werewolf?</H2>
        <P>
          Werewolf is a <strong className="text-white">social deduction party game</strong> where a
          small group of werewolves hides among the villagers. During the day, everyone debates and
          votes to eliminate one suspect. At night, the werewolves secretly choose a victim. The
          villagers win by eliminating all werewolves; the werewolves win by outnumbering the villagers.
        </P>
        <P>
          It&apos;s a game of <strong className="text-white">lying, reading people, and persuasion</strong>.
          The werewolves must bluff their way through accusations, while the villagers try to piece
          together clues to find the wolves before it&apos;s too late.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">6–12 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30–45 min</p></div>
            <div><p className="text-2xl mb-1">🎯</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Strategic</p></div>
          </div>
        </div>

        {/* ── Roles ────────────────────────────────────────────────── */}
        <H2 id="roles">All Roles Explained</H2>
        <P>A standard Werewolf game includes these roles:</P>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <RoleCard emoji="🧑‍🌾" name="Villager" team="Village" description="No special ability. Your power is observation and persuasion. Spot the wolves through their behavior and vote them out." />
          <RoleCard emoji="🐺" name="Werewolf" team="Werewolf" description="Each night, choose a villager to eliminate. During the day, blend in and deflect suspicion. You know who the other wolves are." />
          <RoleCard emoji="🔮" name="Seer" team="Village" description="Each night, learn the true role of one player. Use this knowledge carefully — if the wolves figure out who you are, you're the next target." />
          <RoleCard emoji="💊" name="Doctor" team="Village" description="Each night, protect one player from elimination. You can save yourself once. A well-timed save can turn the game around." />
          <RoleCard emoji="🏹" name="Hunter" team="Village" description="When eliminated, you take one player down with you. A powerful last resort if you're confident you've spotted a wolf." />
          <RoleCard emoji="🧙" name="Witch" team="Village" description="Has two one-use potions: one to save a victim, one to poison a player. Powerful but limited — use them wisely." />
        </div>
        <P>
          On {SITE_NAME}, the <Link href="/games/werewolf" className="text-violet-400 hover:underline">AI Game Master assigns roles
          secretly</Link> at the start — you don&apos;t need to deal cards or have a moderator.
        </P>

        {/* ── Rules ────────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Step by Step</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "Roles are assigned secretly. Each player sees only their own role. Werewolves learn who the other wolves are." },
            { phase: "Night Phase", desc: "Everyone 'closes their eyes.' The Werewolves choose a victim. The Seer investigates one player. The Doctor protects one player. All choices are secret." },
            { phase: "Day Phase", desc: "The victim is announced (unless saved by the Doctor). All living players discuss — who's acting suspicious? Who defended the victim? Who's been too quiet?" },
            { phase: "Vote", desc: "Players vote to eliminate one suspect. The eliminated player's role is revealed. Was the village right, or did they just lose an ally?" },
            { phase: "Repeat", desc: "Night and day alternate until either all Werewolves are eliminated (Village wins) or Werewolves equal or outnumber Villagers (Wolves win)." },
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

        {/* ── Strategy ─────────────────────────────────────────────── */}
        <H2 id="strategy">Winning Strategies</H2>
        <H3>As a Villager</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Watch voting patterns.</strong> Wolves often vote together or avoid voting for each other.</li>
          <li><strong className="text-white">Note who accuses whom.</strong> Wolves sometimes throw early suspicion on villagers to divert attention.</li>
          <li><strong className="text-white">Pay attention to silence.</strong> A player who says very little might be a wolf trying not to draw attention.</li>
          <li><strong className="text-white">Protect the Seer.</strong> If someone claims Seer, think about whether wolves would take that risk before dismissing them.</li>
        </ul>

        <H3>As a Werewolf</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Participate actively.</strong> Silent wolves get caught. Accuse others, ask questions, look engaged.</li>
          <li><strong className="text-white">Don&apos;t defend your partner.</strong> If the other wolf is accused, don&apos;t jump to their defense too quickly.</li>
          <li><strong className="text-white">Create confusion.</strong> Suggest multiple suspects. Make the village split their votes.</li>
          <li><strong className="text-white">Eliminate the Seer early.</strong> If you suspect someone is the Seer, target them at night before they expose you.</li>
        </ul>

        {/* ── Online ───────────────────────────────────────────────── */}
        <H2 id="online">How to Play Werewolf Online with AI</H2>
        <P>
          Traditionally, Werewolf needs 6+ people in the same room with a human moderator. That&apos;s hard
          to organize. With <Link href="/games/werewolf" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
          you can play anytime:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> runs all phases — night actions, day discussion, voting, reveals. No human moderator needed.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI players fill empty seats.</strong> Play with 2 friends and AI fills the rest. Or play solo against a full table of AI.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite with a link.</strong> Friends join in their browser — no app, no sign-up for guests.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🗣️</span>
            <p className="text-zinc-300"><strong className="text-white">AI characters have voices</strong> and unique personalities. They argue, accuse, defend, and bluff — just like real players.</p>
          </div>
        </div>

        {/* ── vs Others ────────────────────────────────────────────── */}
        <H2 id="vs-others">Compared: Online Werewolf Platforms</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Platform</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">AI Host</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">AI Players</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Friends</th>
                <th className="py-3 text-zinc-400 font-semibold">Free</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-violet-400">{SITE_NAME}</td>
                <td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✓</td><td className="py-3 pr-4">✓ Invite link</td><td className="py-3">✓</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Wolvesville</td>
                <td className="py-3 pr-4">✗ (auto)</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗ (ranked)</td><td className="py-3">✓</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Town of Salem</td>
                <td className="py-3 pr-4">✗ (auto)</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">~ Limited</td><td className="py-3">Paid</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">netgames.io</td>
                <td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✗</td><td className="py-3 pr-4">✓</td><td className="py-3">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many people do you need to play Werewolf?</H3>
            <P>
              Traditionally 6–12. On {SITE_NAME}, you can start with just 1-2 humans — AI characters
              fill the rest of the seats.
            </P>
          </div>
          <div>
            <H3>Can I play Werewolf alone?</H3>
            <P>
              Yes! On {SITE_NAME}, the AI fills every other seat with unique characters that have their own
              strategies. It&apos;s a full game even with just you.
            </P>
          </div>
          <div>
            <H3>Is Werewolf the same as Mafia?</H3>
            <P>
              They&apos;re extremely similar — both are social deduction games with hidden roles and day/night
              cycles. Werewolf uses a village theme while Mafia uses a city theme. The core mechanics
              are the same. We have both:{" "}
              <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link> and{" "}
              <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link>.
            </P>
          </div>
          <div>
            <H3>What is One Night Ultimate Werewolf?</H3>
            <P>
              A faster variant where the entire game takes place in a single night and day cycle (about
              10 minutes). On {SITE_NAME}, you can create this variant by describing it to the AI Game Master.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🐺 Play Werewolf Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. No moderator needed. Start a game in 30 seconds.
          </p>
          <Link
            href="/games/werewolf"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Werewolf Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
