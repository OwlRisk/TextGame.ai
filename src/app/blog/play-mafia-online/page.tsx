import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Mafia Online: Free AI-Powered Game for 3-15 Players";
const DESCRIPTION =
  "Learn the rules of Mafia, every role explained, winning strategies, and how to play online for free with an AI Game Master. No moderator needed.";
const CANONICAL = "/blog/play-mafia-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play mafia online",
    "mafia game online",
    "mafia party game",
    "online mafia game free",
    "mafia rules",
    "mafia roles",
    "ai mafia game",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-mafia-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-mafia-online.png"],
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
  const teamColor = team === "Town" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10";
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

export default function PlayMafiaOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Mafia Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Mafia</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Mafia (also known as Werewolf) is the classic social deduction game where a secret mafia
            hides among innocent townspeople. Now you can play it online with AI — no physical cards,
            no human moderator, no minimum player count. Here&apos;s everything you need to know.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-mafia-online.png"
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
              { id: "what-is", label: "What is the Mafia Game?" },
              { id: "roles", label: "Mafia Roles Explained" },
              { id: "rules", label: "How to Play Mafia — Rules" },
              { id: "vs-werewolf", label: "Mafia vs Werewolf — What's the Difference?" },
              { id: "online", label: "How to Play Mafia Online with AI" },
              { id: "strategy", label: "Strategy Tips" },
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

        {/* ── What is the Mafia Game ───────────────────────────────── */}
        <H2 id="what-is">What is the Mafia Game?</H2>
        <P>
          Mafia is a <strong className="text-white">social deduction party game</strong> invented in
          the 1980s by psychology student Dmitry Davidoff. A small group of mafia members hides among
          innocent townspeople. During the day, everyone debates and votes to eliminate one suspect.
          At night, the mafia secretly chooses a victim. The town wins by eliminating all mafia; the
          mafia wins by outnumbering the town.
        </P>
        <P>
          It&apos;s a game of <strong className="text-white">lying, reading people, and persuasion</strong>.
          The mafia must bluff their way through accusations, while the townspeople try to piece
          together clues to find the killers before it&apos;s too late.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">3–15 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30–45 min</p></div>
            <div><p className="text-2xl mb-1">🎯</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Strategic</p></div>
          </div>
        </div>

        {/* ── Roles ────────────────────────────────────────────────── */}
        <H2 id="roles">Mafia Roles Explained</H2>
        <P>A standard Mafia game includes these roles:</P>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <RoleCard emoji="👤" name="Townsperson" team="Town" description="No special ability. Your power is observation and persuasion. Spot the mafia through their behavior and vote them out." />
          <RoleCard emoji="🔫" name="Mafia" team="Mafia" description="Each night, choose a townsperson to eliminate. During the day, blend in and deflect suspicion. You know who the other mafia members are." />
          <RoleCard emoji="🔍" name="Detective" team="Town" description="Each night, investigate one player to learn their true role. Use this knowledge carefully — if the mafia figures out who you are, you're the next target." />
          <RoleCard emoji="💊" name="Doctor" team="Town" description="Each night, protect one player from elimination. You can save yourself once. A well-timed save can turn the game around." />
          <RoleCard emoji="🎩" name="Godfather" team="Mafia" description="The mafia leader. Appears innocent when investigated by the Detective. Must coordinate with other mafia to eliminate key town roles." />
        </div>
        <P>
          On {SITE_NAME}, the <Link href="/games/mafia" className="text-violet-400 hover:underline">AI Game Master assigns roles
          secretly</Link> at the start — you don&apos;t need to deal cards or have a moderator.
        </P>

        {/* ── Rules ────────────────────────────────────────────────── */}
        <H2 id="rules">How to Play Mafia — Rules</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Setup", desc: "Roles are assigned secretly. Each player sees only their own role. Mafia members learn who the other mafia are." },
            { phase: "Night Phase", desc: "Everyone 'closes their eyes.' The Mafia chooses a victim. The Detective investigates one player. The Doctor protects one player. All choices are secret." },
            { phase: "Day Phase", desc: "The victim is announced (unless saved by the Doctor). All living players discuss — who's acting suspicious? Who defended the victim? Who's been too quiet?" },
            { phase: "Vote", desc: "Players vote to eliminate one suspect. The eliminated player's role is revealed. Was the town right, or did they just lose an ally?" },
            { phase: "Repeat", desc: "Night and day alternate until either all Mafia are eliminated (Town wins) or Mafia equal or outnumber Townspeople (Mafia wins)." },
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

        {/* ── Mafia vs Werewolf ────────────────────────────────────── */}
        <H2 id="vs-werewolf">Mafia vs Werewolf — What&apos;s the Difference?</H2>
        <P>
          Mafia and <Link href="/blog/play-werewolf-online" className="text-violet-400 hover:underline">Werewolf</Link> are
          essentially the same game with different themes. Mafia uses a city/crime setting (townspeople vs mafia);
          Werewolf uses a village setting (villagers vs werewolves). The core mechanics — hidden roles,
          night kills, day votes, special roles like Detective/Seer and Doctor — are identical.
        </P>
        <P>
          If you know how to play one, you know how to play the other. On {SITE_NAME}, you can try both:{" "}
          <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link> and{" "}
          <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>. Browse more{" "}
          <Link href="/discover" className="text-violet-400 hover:underline">social deduction games</Link> or see our{" "}
          <Link href="/blog/best-social-deduction-games" className="text-violet-400 hover:underline">best social deduction games</Link> list.
        </P>

        {/* ── Online ───────────────────────────────────────────────── */}
        <H2 id="online">How to Play Mafia Online with AI</H2>
        <P>
          Traditionally, Mafia needs 6+ people in the same room with a human moderator. That&apos;s hard
          to organize. With <Link href="/games/mafia" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>,
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

        {/* ── Strategy ─────────────────────────────────────────────── */}
        <H2 id="strategy">Strategy Tips</H2>
        <H3>As a Townsperson</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Watch voting patterns.</strong> Mafia often vote together or avoid voting for each other.</li>
          <li><strong className="text-white">Note who accuses whom.</strong> Mafia sometimes throw early suspicion on townspeople to divert attention.</li>
          <li><strong className="text-white">Pay attention to silence.</strong> A player who says very little might be mafia trying not to draw attention.</li>
          <li><strong className="text-white">Protect the Detective.</strong> If someone claims Detective, think about whether mafia would take that risk before dismissing them.</li>
        </ul>

        <H3>As Mafia</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Participate actively.</strong> Silent mafia get caught. Accuse others, ask questions, look engaged.</li>
          <li><strong className="text-white">Don&apos;t defend your partner.</strong> If another mafia is accused, don&apos;t jump to their defense too quickly.</li>
          <li><strong className="text-white">Create confusion.</strong> Suggest multiple suspects. Make the town split their votes.</li>
          <li><strong className="text-white">Eliminate the Detective early.</strong> If you suspect someone is the Detective, target them at night before they expose you.</li>
        </ul>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many people do you need to play Mafia?</H3>
            <P>
              Traditionally 6–12. On {SITE_NAME}, you can start with just 1–2 humans — AI characters
              fill the rest of the seats. Games support 3–15 players.
            </P>
          </div>
          <div>
            <H3>Can I play Mafia alone?</H3>
            <P>
              Yes! On {SITE_NAME}, the AI fills every other seat with unique characters that have their own
              strategies. It&apos;s a full game even with just you.
            </P>
          </div>
          <div>
            <H3>Is Mafia the same as Werewolf?</H3>
            <P>
              They&apos;re extremely similar — both are social deduction games with hidden roles and day/night
              cycles. Mafia uses a city theme while Werewolf uses a village theme. The core mechanics
              are the same. We have both:{" "}
              <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link> and{" "}
              <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>.
            </P>
          </div>
          <div>
            <H3>Is Mafia free to play online?</H3>
            <P>
              Yes. On {SITE_NAME}, you can <Link href="/games/mafia" className="text-violet-400 hover:underline">play Mafia online for free</Link> with
              an AI Game Master and AI players. No subscription required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎩 Play Mafia Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. No moderator needed. Start a game in 30 seconds.
          </p>
          <Link
            href="/games/mafia"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Mafia Free
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
