import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Vampire Court Online — Gothic Social Deduction with AI";
const DESCRIPTION =
  "One vampire hides among nobles. Learn the rules of Vampire Court, role strategies, and how to play this gothic social deduction game online for free.";
const CANONICAL = "/blog/play-vampire-court-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "vampire court game",
    "vampire social deduction",
    "gothic party game online",
    "vampire werewolf game",
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
    images: [{ url: "/blog/blog-play-vampire-court-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-vampire-court-online.png"],
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

export default function PlayVampireCourtOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Vampire Court Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Vampire Court</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Moonlight floods the great hall. The nobles have gathered — but one among them is no noble
            at all. In <strong className="text-white">Vampire Court</strong>, a hidden vampire feeds on
            the court while the nobles race to identify and stake the creature before dawn. It&apos;s gothic,
            dramatic, and deeply strategic.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-vampire-court-online.png"
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
              { id: "what-is", label: "What Is Vampire Court?" },
              { id: "roles", label: "Roles — Noble & Vampire" },
              { id: "rules", label: "Rules & Gameplay" },
              { id: "strategy", label: "Strategy for Both Sides" },
              { id: "vs-werewolf", label: "Vampire Court vs Werewolf" },
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
        <H2 id="what-is">What Is Vampire Court?</H2>
        <P>
          <strong className="text-white">Vampire Court</strong> is a gothic social deduction game for
          5 or more players. Set in a candlelit aristocratic court, one or more players are secretly vampires
          hiding among human nobles. Each night the vampire feeds, and each day the court debates who to
          stake. The atmosphere is thick with suspicion, dramatic accusations, and last-second revelations.
        </P>
        <P>
          The game blends the deduction of <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink> with
          a unique <strong className="text-white">gothic narrative layer</strong> — an AI narrator describes the
          midnight feedings, the rising paranoia, and the court&apos;s descent into chaos. It&apos;s
          social deduction with atmosphere turned up to eleven.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">🧛</p><p className="font-semibold text-white">5+ players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">15–25 min</p></div>
            <div><p className="text-2xl mb-1">🌙</p><p className="font-semibold text-white">Gothic Theme</p></div>
            <div><p className="text-2xl mb-1">🔍</p><p className="font-semibold text-white">Social Deduction</p></div>
          </div>
        </div>

        {/* ── Roles ──────────────────────────────────────────────── */}
        <H2 id="roles">Roles — Noble &amp; Vampire</H2>
        <H3>The Nobles (Town)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Noble</strong> — A standard court member. Your goal is to identify and stake the vampire before they drain the court dry.</li>
          <li><strong className="text-white">Inquisitor</strong> — Can investigate one player each night to learn if they are human or vampire. The court&apos;s most valuable (and most targeted) role.</li>
          <li><strong className="text-white">Guardian</strong> — Protects one player from being fed upon each night. Cannot protect the same player two nights in a row.</li>
          <li><strong className="text-white">Seer</strong> — Receives cryptic visions from the AI narrator, hinting at the vampire&apos;s identity without revealing it outright.</li>
        </ul>
        <H3>The Vampire(s)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Vampire</strong> — Feeds on one noble each night. Must avoid suspicion during the day. Wins when vampires equal or outnumber the surviving nobles.</li>
          <li><strong className="text-white">Thrall</strong> — A human servant of the vampire. Knows the vampire&apos;s identity and provides cover during daytime votes.</li>
        </ul>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">Rules &amp; Gameplay</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Nightfall", desc: "The court sleeps. The vampire chooses a victim to feed on. Special roles (Inquisitor, Guardian) perform their night actions simultaneously." },
            { phase: "Dawn", desc: "The AI narrator announces the victim — dramatically. The court awakens to find a noble drained. Their role is revealed, fueling the day's debate." },
            { phase: "Deliberation", desc: "Players discuss, accuse, and defend. Who was acting strangely? Who deflected suspicion? The Inquisitor may share findings — or keep them secret for safety." },
            { phase: "The Staking", desc: "Players vote on who to stake. A majority vote means the accused is eliminated and their role revealed. If the vampire is staked, the nobles win." },
            { phase: "Repeat", desc: "Night falls again. The cycle continues until either the vampire is staked (nobles win) or vampires outnumber the living nobles (vampires win)." },
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
        <H2 id="strategy">Strategy for Both Sides</H2>
        <H3>As a Noble</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Watch voting patterns.</strong> Vampires often vote to protect each other or push suspicion onto loud but innocent nobles.</li>
          <li><strong className="text-white">Protect the Inquisitor.</strong> If you&apos;re the Guardian, prioritize shielding the Inquisitor — they&apos;re the vampire&apos;s biggest threat.</li>
          <li><strong className="text-white">Share information carefully.</strong> Revealing too much makes you a target. Revealing too little makes you suspicious.</li>
          <li><strong className="text-white">Track who was fed on and when.</strong> Elimination patterns often reveal the vampire&apos;s strategy.</li>
        </ul>
        <H3>As the Vampire</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Eliminate the Inquisitor early.</strong> They will eventually identify you — remove the threat before it matures.</li>
          <li><strong className="text-white">Participate actively in debates.</strong> Silent players get staked. Be vocal, point fingers, and appear to be a committed noble.</li>
          <li><strong className="text-white">Use your Thrall strategically.</strong> Have your Thrall vouch for you — but not too eagerly, or the alliance becomes obvious.</li>
          <li><strong className="text-white">Feed on loud players.</strong> Removing vocal innocents creates information vacuums that benefit you.</li>
        </ul>

        {/* ── VS Werewolf ────────────────────────────────────────── */}
        <H2 id="vs-werewolf">Vampire Court vs Werewolf</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-3 pr-4 text-zinc-400 font-medium">Feature</th>
                <th className="py-3 px-4 text-zinc-400 font-medium">Vampire Court</th>
                <th className="py-3 pl-4 text-zinc-400 font-medium">Werewolf</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Theme</td><td className="py-3 px-4">Gothic aristocratic court</td><td className="py-3 pl-4">Medieval village</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Narrative</td><td className="py-3 px-4">AI narrator with dramatic flair</td><td className="py-3 pl-4">Human moderator or basic AI</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Atmosphere</td><td className="py-3 px-4">Dark, dramatic, immersive</td><td className="py-3 pl-4">Classic, casual</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Unique Roles</td><td className="py-3 px-4">Seer visions, Thrall mechanic</td><td className="py-3 pl-4">Hunter, Cupid, Witch</td></tr>
              <tr><td className="py-3 pr-4 font-semibold text-white">Best For</td><td className="py-3 px-4">Players who love story &amp; theme</td><td className="py-3 pl-4">Quick, no-frills deduction</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">Play Online with AI</H2>
        <P>
          Step into the gothic court on{" "}
          <TrackedGameLink href="/games/vampire-court" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>.
          An AI narrator sets the mood with atmospheric descriptions while AI nobles fill empty seats
          with sharp, believable play.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🧛</span>
            <p className="text-zinc-300"><strong className="text-white">Immersive AI Narration</strong> — Every feeding, every accusation, every staking is described in vivid gothic prose.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI nobles with personality.</strong> They accuse, defend, and deceive with surprising cunning.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Invite friends instantly.</strong> Share a link — no app, no signup, just browser-based gothic deduction.</p>
          </div>
        </div>
        <P>
          Love hidden-role games? Try{" "}
          <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink> for the
          classic or{" "}
          <TrackedGameLink href="/games/mafia" className="text-violet-400 hover:underline">Mafia</TrackedGameLink>{" "}
          for the original social deduction experience.
        </P>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many players does Vampire Court need?</H3>
            <P>
              The game supports 5 or more players with no upper limit. On {SITE_NAME}, AI fills empty slots so you can play
              with just 1–2 humans. The AI plays both nobles and vampires convincingly.
            </P>
          </div>
          <div>
            <H3>Is Vampire Court just reskinned Werewolf?</H3>
            <P>
              No. While it shares the day/night cycle, Vampire Court adds{" "}
              <strong className="text-white">AI narration, the Thrall mechanic, Seer visions, and a richer
              gothic atmosphere</strong> that changes how the game feels and plays.
            </P>
          </div>
          <div>
            <H3>Can the Vampire win alone?</H3>
            <P>
              The Vampire wins when vampires equal or outnumber nobles. With a Thrall providing cover
              during votes and strategic feeding, a solo Vampire can absolutely dominate the court.
            </P>
          </div>
          <div>
            <H3>Is Vampire Court free?</H3>
            <P>
              Yes. <TrackedGameLink href="/games/vampire-court" className="text-violet-400 hover:underline">Play Vampire Court online for free</TrackedGameLink> on {SITE_NAME} — full
              AI narration, AI opponents, no download required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🧛 Enter the Vampire Court</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Gothic narration. Hidden vampires. Stake your suspect or become the next victim.
          </p>
          <TrackedGameLink
            href="/games/vampire-court"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Vampire Court Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
