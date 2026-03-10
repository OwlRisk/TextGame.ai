import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "The Resistance vs Avalon — Rules, Differences & How to Play Online";
const DESCRIPTION =
  "Compare The Resistance and Avalon: rules, roles like Merlin, key differences, which to choose for your group, and how to play both online for free with AI.";
const CANONICAL = "/blog/resistance-vs-avalon";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "resistance vs avalon",
    "the resistance game",
    "avalon vs resistance",
    "resistance board game rules",
    "the resistance online",
    "avalon board game",
    "avalon roles",
    "play resistance online",
    "avalon merlin",
    "social deduction games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-resistance-vs-avalon.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-resistance-vs-avalon.png"],
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
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

export default function ResistanceVsAvalonPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Resistance vs Avalon</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Social Deduction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            The Resistance and Avalon are two of the most beloved social deduction games — and they&apos;re
            made by the same designer. But which one should you play? This guide breaks down the rules,
            differences, and how to play both online with AI on {SITE_NAME}.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-resistance-vs-avalon.png"
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
              { id: "overview", label: "Overview — Two Games, One Family" },
              { id: "resistance-rules", label: "The Resistance: Rules & Gameplay" },
              { id: "avalon-rules", label: "Avalon: Rules & Roles" },
              { id: "differences", label: "Key Differences Compared" },
              { id: "which-to-play", label: "Which Should You Play?" },
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

        {/* ── Overview ─────────────────────────────────────────────── */}
        <H2 id="overview">Overview — Two Games, One Family</H2>
        <P>
          Both <strong className="text-white">The Resistance</strong> and <strong className="text-white">Avalon</strong> (full
          name: <em>The Resistance: Avalon</em>) were designed by Don Eskridge. They share the same core
          mechanic — a group of players must complete missions, but hidden spies (or minions) sabotage
          from within. The key difference? Avalon adds special roles like Merlin and the Assassin.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">5–10 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30 min</p></div>
            <div><p className="text-2xl mb-1">🎯</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">🗳️</p><p className="font-semibold text-white">Team Voting</p></div>
          </div>
        </div>

        {/* ── Resistance Rules ─────────────────────────────────────── */}
        <H2 id="resistance-rules">The Resistance: Rules &amp; Gameplay</H2>
        <P>
          In The Resistance, players are secretly divided into <strong className="text-white">Resistance members</strong> (loyal)
          and <strong className="text-white">Spies</strong>. Spies know each other; Resistance members don&apos;t know
          who anyone is.
        </P>
        <ol className="space-y-4 mb-8">
          {[
            { phase: "Team Selection", desc: "A rotating leader proposes a team of players to go on a mission. The group size depends on the mission number and total players." },
            { phase: "Team Vote", desc: "Everyone votes approve or reject. If the majority rejects, leadership passes to the next player. Five consecutive rejections means spies win." },
            { phase: "Mission", desc: "Approved team members secretly play Success or Fail cards. Resistance members must play Success. Spies can play either." },
            { phase: "Result", desc: "Cards are shuffled and revealed. One Fail card (two in large groups for Mission 4) means the mission fails. Three successful missions wins for Resistance; three failed missions wins for Spies." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.phase}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Avalon Rules ─────────────────────────────────────────── */}
        <H2 id="avalon-rules">Avalon: Rules &amp; Roles</H2>
        <P>
          Avalon uses the same mission-based structure but adds <strong className="text-white">named roles</strong> with
          special abilities, creating deeper strategy and more dramatic moments.
        </P>
        <H3>Key Roles in Avalon</H3>
        <div className="space-y-3 mb-6">
          {[
            { emoji: "🧙", name: "Merlin", desc: "Knows who the evil players are, but must stay hidden — if the Assassin identifies Merlin at the end, evil wins." },
            { emoji: "🗡️", name: "Assassin", desc: "If good completes three missions, the Assassin gets one chance to guess Merlin. A correct guess steals victory for evil." },
            { emoji: "👁️", name: "Percival", desc: "Knows who Merlin is and can help protect them, but Morgana may appear as a false Merlin." },
            { emoji: "🐍", name: "Morgana", desc: "Appears as Merlin to Percival. Creates confusion about who the real Merlin is." },
            { emoji: "❓", name: "Oberon", desc: "Evil, but unknown to the other evil players (and doesn&apos;t know them). A wildcard for both sides." },
          ].map((role) => (
            <div key={role.name} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">{role.emoji}</span>
              <div>
                <p className="font-bold text-white">{role.name}</p>
                <p className="text-sm text-zinc-400">{role.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <P>
          These roles make Avalon a game of <strong className="text-white">information management</strong> — Merlin must
          subtly guide the team without revealing their identity, while the Assassin watches for clues.
        </P>

        {/* ── Differences ──────────────────────────────────────────── */}
        <H2 id="differences">Key Differences Compared</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">The Resistance</th>
                <th className="py-3 text-zinc-400 font-semibold">Avalon</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Theme</td><td className="py-3 pr-4">Dystopian rebels vs spies</td><td className="py-3">Arthurian knights vs evil</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Special Roles</td><td className="py-3 pr-4">None (pure deduction)</td><td className="py-3">Merlin, Assassin, Percival, Morgana, Oberon</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">Information</td><td className="py-3 pr-4">Spies know each other only</td><td className="py-3">Multiple layers of partial info</td></tr>
              <tr className="border-b border-zinc-800/60"><td className="py-3 pr-4 font-semibold text-white">End-game twist</td><td className="py-3 pr-4">None</td><td className="py-3">Assassin guesses Merlin</td></tr>
              <tr><td className="py-3 pr-4 font-semibold text-white">Complexity</td><td className="py-3 pr-4">Lower — great for beginners</td><td className="py-3">Higher — more strategic depth</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── Which to Play ────────────────────────────────────────── */}
        <H2 id="which-to-play">Which Should You Play?</H2>
        <H3>Choose The Resistance if...</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Your group is new to social deduction.</strong> No roles to remember — just vote, discuss, and deduce.</li>
          <li><strong className="text-white">You have 5–6 players.</strong> The Resistance shines at smaller counts where every vote matters.</li>
          <li><strong className="text-white">You want pure bluffing.</strong> Without hidden information roles, the game is entirely about reading people.</li>
        </ul>
        <H3>Choose Avalon if...</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Your group loves strategy.</strong> The Merlin/Assassin dynamic adds a thrilling layer of cat-and-mouse.</li>
          <li><strong className="text-white">You have 7–10 players.</strong> More roles means more intrigue at higher player counts.</li>
          <li><strong className="text-white">You want dramatic endings.</strong> The Assassin&apos;s final guess can flip the entire game in seconds.</li>
        </ul>
        <P>
          On <TrackedGameLink href="/games/avalon" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          you can play both — the AI Game Master handles team selection, voting, mission resolution, and
          role reveals. AI players fill empty seats so you can start with any group size.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can you play Resistance and Avalon with the same group?</H3>
            <P>
              Absolutely. Many groups start with The Resistance to learn the core mechanics, then
              switch to Avalon once everyone is comfortable. The mission structure is identical.
            </P>
          </div>
          <div>
            <H3>How many players do you need for Avalon?</H3>
            <P>
              Avalon officially supports 5–10 players. On {SITE_NAME}, AI fills any empty seats,
              so you can play with as few as 1–2 humans and still get the full experience.
            </P>
          </div>
          <div>
            <H3>Is Avalon better than The Resistance?</H3>
            <P>
              Neither is strictly better. Avalon adds more complexity and memorable moments with
              Merlin and the Assassin, but The Resistance is more elegant and accessible. It depends
              on your group&apos;s preferences.
            </P>
          </div>
          <div>
            <H3>Can I play Resistance or Avalon online for free?</H3>
            <P>
              Yes! On {SITE_NAME}, both games are free to play with an AI Game Master. Create a room,
              invite friends with a link, and AI fills any remaining seats.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🏰 Play Resistance &amp; Avalon Online</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players fill empty seats. No moderator needed. Start in 30 seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <TrackedGameLink
              href="/games/avalon"
              className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Play Avalon
            </TrackedGameLink>
            <TrackedGameLink
              href="/games/resistance"
              className="inline-flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Play The Resistance
            </TrackedGameLink>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
