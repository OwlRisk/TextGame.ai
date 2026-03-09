import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Two Rooms and a Boom Online — Rules & Strategy Guide";
const DESCRIPTION =
  "Learn the rules of Two Rooms and a Boom, key roles (President, Bomber), negotiation strategy, and how to play online with an AI host. Free, no download.";
const CANONICAL = "/blog/play-two-rooms-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "two rooms and a boom online",
    "two rooms boom rules",
    "large group party game",
    "hidden role negotiation game",
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
    images: [{ url: "/blog/blog-play-two-rooms-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-two-rooms-online.png"],
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

export default function PlayTwoRoomsOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Two Rooms Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Two Rooms</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Two Rooms and a Boom is the ultimate large-group hidden-role game. Split into two rooms,
            players negotiate, bluff, and swap hostages under time pressure — all while the Blue team
            tries to protect the <strong className="text-white">President</strong> and the Red team plots
            to get the <strong className="text-white">Bomber</strong> into the same room. Here&apos;s
            everything you need to know.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-two-rooms-online.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is", label: "What Is Two Rooms and a Boom?" },
              { id: "roles", label: "Key Roles Explained" },
              { id: "rules", label: "Rules — Step by Step" },
              { id: "strategy", label: "Strategy Tips" },
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
        <H2 id="what-is">What Is Two Rooms and a Boom?</H2>
        <P>
          <strong className="text-white">Two Rooms and a Boom</strong> is a social deduction party game
          for 6–30+ players. The group is divided into two separate rooms, each with a leader. Over
          several timed rounds, leaders negotiate hostage exchanges between the rooms. At the end of the
          final round, if the Bomber is in the same room as the President, the Red team wins. Otherwise,
          the Blue team wins.
        </P>
        <P>
          What makes it special is the sheer <strong className="text-white">scale and chaos</strong>.
          Unlike most social deduction games limited to 10 players, Two Rooms thrives with 15, 20, or
          even 30 people — making it perfect for parties, conferences, and game nights that have outgrown
          Werewolf.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">6–30+ players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">15–20 min</p></div>
            <div><p className="text-2xl mb-1">🤝</p><p className="font-semibold text-white">Negotiation</p></div>
            <div><p className="text-2xl mb-1">💣</p><p className="font-semibold text-white">Hidden Roles</p></div>
          </div>
        </div>

        {/* ── Roles ──────────────────────────────────────────────── */}
        <H2 id="roles">Key Roles Explained</H2>
        <H3>Core Roles</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">President (Blue Team)</strong> — The Blue team&apos;s VIP. If the President is <em>not</em> in the same room as the Bomber at the end, Blue wins.</li>
          <li><strong className="text-white">Bomber (Red Team)</strong> — The Red team&apos;s weapon. Red wins if the Bomber ends up in the same room as the President.</li>
        </ul>
        <H3>Supporting Roles</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Blue Agent</strong> — A regular Blue team member. Knows the President&apos;s identity and works to keep them safe.</li>
          <li><strong className="text-white">Red Agent</strong> — A regular Red team member. Tries to identify the President and maneuver the Bomber into their room.</li>
          <li><strong className="text-white">Gambler</strong> — A Grey (neutral) role that picks a winning team at the start. Wins only if their chosen team wins.</li>
          <li><strong className="text-white">Spy</strong> — Appears as one team but secretly works for the other. Spreads misinformation to tilt hostage swaps.</li>
          <li><strong className="text-white">Doctor / Engineer</strong> — Special abilities like forcing card reveals or swapping roles mid-game, adding unpredictable twists.</li>
        </ul>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">Rules — Step by Step</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Divide into Rooms", desc: "Players are randomly split into two groups and sent to separate rooms (or chat channels online). Each room elects or is assigned a leader." },
            { phase: "Role Cards", desc: "Every player receives a secret role card. Each card shows the player's team color (Red, Blue, or Grey) and their specific role." },
            { phase: "Timed Rounds", desc: "The game plays over 3 rounds (typically 5, 3, and 1 minutes). During each round, players discuss, reveal (or lie about) their roles, and persuade the leader to send specific hostages." },
            { phase: "Hostage Exchange", desc: "At the end of each round, room leaders select 1–3 hostages to swap between rooms. Hostages are sent simultaneously. Choosing who to send — and who to keep — is the core strategic decision." },
            { phase: "The Boom", desc: "After the final round ends and the last swap is complete, roles are revealed. If the Bomber and President are in the same room, the Red team wins. If they're apart, the Blue team wins." },
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
        <H2 id="strategy">Strategy Tips</H2>
        <H3>For the Blue Team</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Protect the President&apos;s identity.</strong> The less the Red team knows, the harder it is for them to maneuver the Bomber into the right room.</li>
          <li><strong className="text-white">Use trusted reveals.</strong> Privately show your card to allies — but never in front of suspected Red players.</li>
          <li><strong className="text-white">Control the leader position.</strong> A Blue leader can ensure the President stays put and suspicious players get swapped out.</li>
        </ul>
        <H3>For the Red Team</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Find the President by process of elimination.</strong> Get people to reveal their cards. The person who won&apos;t show is often the President.</li>
          <li><strong className="text-white">Coordinate the Bomber&apos;s movement.</strong> In the final round, you need a Red leader — or a persuasive enough argument — to swap the Bomber into the President&apos;s room.</li>
          <li><strong className="text-white">Spread chaos.</strong> Accuse Blue players of being Red and vice versa. The more confusion, the easier it is to slip the Bomber through.</li>
        </ul>
        <H3>General Tips</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">The last round is everything.</strong> Earlier rounds are about gathering information and positioning. The final 1-minute round is where the magic happens.</li>
          <li><strong className="text-white">Grey roles play kingmaker.</strong> Neutral roles like the Gambler can swing the outcome — negotiate with them for their support.</li>
        </ul>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">Play Online with AI</H2>
        <P>
          Gathering 10+ people is hard. With{" "}
          <TrackedGameLink href="/games/two-rooms" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          you can play Two Rooms and a Boom anytime — even with a small group:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> manages the timer, room assignments, hostage swaps, and role distribution automatically.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI players fill empty seats.</strong> They negotiate, bluff, reveal cards, and make strategic hostage choices just like real players.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite friends with a link.</strong> No app download or signup needed — everything runs in the browser.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎭</span>
            <p className="text-zinc-300"><strong className="text-white">All roles included.</strong> Play with the full role set including Grey neutrals, Spies, Doctors, and more.</p>
          </div>
        </div>
        <P>
          Love social deduction? Try{" "}
          <TrackedGameLink href="/games/resistance" className="text-violet-400 hover:underline">The Resistance</TrackedGameLink> or{" "}
          <TrackedGameLink href="/games/secret-hitler" className="text-violet-400 hover:underline">Secret Hitler</TrackedGameLink>{" "}
          for smaller groups with the same tense bluffing energy.
        </P>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many players do you need for Two Rooms and a Boom?</H3>
            <P>
              The original game supports 6–30+ players. On {SITE_NAME}, AI fills empty seats so you can
              play with as few as 1–2 humans. The AI negotiates, bluffs, and makes genuine strategic
              choices — you&apos;ll forget they&apos;re not real people.
            </P>
          </div>
          <div>
            <H3>Is Two Rooms and a Boom hard to learn?</H3>
            <P>
              Not at all. The core concept — Bomber meets President, Red wins; they don&apos;t, Blue wins — takes
              30 seconds to explain. Advanced roles add depth, but the AI host introduces them
              gradually so new players never feel lost.
            </P>
          </div>
          <div>
            <H3>What makes it different from Werewolf or Mafia?</H3>
            <P>
              Two Rooms is <strong className="text-white">simultaneous, not turn-based</strong>. Everyone
              talks at once across two rooms, and the core mechanic is negotiation and hostage swapping
              rather than voting to eliminate. It&apos;s faster, louder, and supports far more players.
            </P>
          </div>
          <div>
            <H3>Can I play Two Rooms and a Boom for free?</H3>
            <P>
              Yes. <TrackedGameLink href="/games/two-rooms" className="text-violet-400 hover:underline">Play Two Rooms and a Boom online for free</TrackedGameLink> on {SITE_NAME} with
              an AI host and AI players. No subscription or app install required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">💣 Play Two Rooms and a Boom Online</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI host. AI players. Negotiate, bluff, and boom — start a game in 30 seconds.
          </p>
          <TrackedGameLink
            href="/games/two-rooms"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Two Rooms and a Boom Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
