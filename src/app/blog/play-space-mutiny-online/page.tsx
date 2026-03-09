import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Play Space Mutiny Online — Sci-Fi Traitor Game Like Among Us";
const DESCRIPTION =
  "One crew member has been compromised. Learn the rules of Space Mutiny, sabotage mechanics, and how to play this Among Us-style text game with AI.";
const CANONICAL = "/blog/play-space-mutiny-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "space mutiny game",
    "sci-fi social deduction",
    "among us alternative text",
    "spaceship traitor game",
    "among us online free",
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
    images: [{ url: "/blog/blog-play-space-mutiny-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-space-mutiny-online.png"],
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

export default function PlaySpaceMutinyOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Space Mutiny Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Space Mutiny</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            The ship is drifting. The reactor is failing. And someone on the crew did this on purpose.{" "}
            <strong className="text-white">Space Mutiny</strong> is a text-based social deduction game
            that captures the paranoia and tension of Among Us — but powered by AI narration and
            deep strategic discussion instead of reflex-based tasks.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-space-mutiny-online.png"
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
              { id: "what-is", label: "What Is Space Mutiny?" },
              { id: "vs-among-us", label: "Space Mutiny vs Among Us" },
              { id: "roles", label: "Roles — Crew & Saboteur" },
              { id: "rules", label: "Rules & Gameplay" },
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

        {/* ── What Is It ─────────────────────────────────────────── */}
        <H2 id="what-is">What Is Space Mutiny?</H2>
        <P>
          <strong className="text-white">Space Mutiny</strong> is a sci-fi social deduction game for
          4–12 players set aboard a deep-space vessel. The crew must complete critical repairs to save
          the ship, but one or more <strong className="text-white">Saboteurs</strong> are working to
          destroy it from within. Through discussion, accusations, and emergency votes, the crew tries
          to identify the traitors before it&apos;s too late.
        </P>
        <P>
          Think of it as <strong className="text-white">Among Us meets a text adventure</strong>. Instead
          of running around a 2D map, you navigate ship systems through narrative choices, report
          anomalies in crew meetings, and argue about who tampered with the oxygen supply. The AI
          narrator describes sabotage events, system failures, and the growing tension as trust
          erodes.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">🚀</p><p className="font-semibold text-white">4–12 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">15–25 min</p></div>
            <div><p className="text-2xl mb-1">🛸</p><p className="font-semibold text-white">Sci-Fi Theme</p></div>
            <div><p className="text-2xl mb-1">🔧</p><p className="font-semibold text-white">Sabotage &amp; Deduction</p></div>
          </div>
        </div>

        {/* ── VS Among Us ────────────────────────────────────────── */}
        <H2 id="vs-among-us">Space Mutiny vs Among Us</H2>
        <P>
          If you love Among Us but wish the meetings were deeper and the accusations more strategic,
          Space Mutiny is your game. Here&apos;s how they compare:
        </P>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-3 pr-4 text-zinc-400 font-medium">Feature</th>
                <th className="py-3 px-4 text-zinc-400 font-medium">Space Mutiny</th>
                <th className="py-3 pl-4 text-zinc-400 font-medium">Among Us</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Format</td><td className="py-3 px-4">Text-based with AI narrator</td><td className="py-3 pl-4">2D top-down movement</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Focus</td><td className="py-3 px-4">Deep discussion &amp; deduction</td><td className="py-3 pl-4">Task completion &amp; quick votes</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">Sabotage</td><td className="py-3 px-4">Narrative choices with consequences</td><td className="py-3 pl-4">Button press to trigger events</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-3 pr-4 font-semibold text-white">AI Support</td><td className="py-3 px-4">AI fills seats with smart players</td><td className="py-3 pl-4">No AI players</td></tr>
              <tr><td className="py-3 pr-4 font-semibold text-white">Platform</td><td className="py-3 px-4">Browser — no download</td><td className="py-3 pl-4">App required</td></tr>
            </tbody>
          </table>
        </div>

        {/* ── Roles ──────────────────────────────────────────────── */}
        <H2 id="roles">Roles — Crew &amp; Saboteur</H2>
        <H3>Crew Members</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Engineer</strong> — Can repair sabotaged systems faster and scan ship logs for anomalies.</li>
          <li><strong className="text-white">Medic</strong> — Heals one injured crew member per round. A lifeline when the Saboteur strikes.</li>
          <li><strong className="text-white">Navigator</strong> — Tracks crew movements and can verify where players were when sabotage occurred.</li>
          <li><strong className="text-white">Comms Officer</strong> — Intercepts partial messages that hint at the Saboteur&apos;s next target.</li>
        </ul>
        <H3>Saboteur(s)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Saboteur</strong> — Secretly damages ship systems each round. Wins by destroying the ship (3 critical failures) or eliminating enough crew to prevent repairs.</li>
          <li><strong className="text-white">Sleeper Agent</strong> — Starts as crew but is &quot;activated&quot; after a specific trigger event. Even they don&apos;t know they&apos;re a traitor at first.</li>
        </ul>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">Rules &amp; Gameplay</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Briefing", desc: "Players receive role assignments and ship status. The AI narrator sets the scene: deep space, failing reactor, rising paranoia." },
            { phase: "Duty Phase", desc: "Each player chooses a ship section to work in. Crew members complete repair tasks; the Saboteur secretly selects a system to damage." },
            { phase: "Incident Report", desc: "The AI narrator describes what happened — which system failed, who was nearby, and any clues left behind. Tension builds as failures stack up." },
            { phase: "Emergency Meeting", desc: "Players discuss the incident. Who was in engineering when the reactor glitched? Why was the Medic in the cargo bay? Accusations fly." },
            { phase: "Airlock Vote", desc: "Players vote to eject a suspect into space. Majority wins. If the Saboteur is ejected, the crew wins. If an innocent is spaced, the ship gets closer to destruction." },
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
        <H3>As Crew</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Coordinate section assignments.</strong> If two people are in the same section, they can verify each other&apos;s innocence — or catch the Saboteur red-handed.</li>
          <li><strong className="text-white">Track sabotage patterns.</strong> If the reactor fails whenever a specific player is in engineering, that&apos;s not coincidence.</li>
          <li><strong className="text-white">Protect the Medic.</strong> The Medic keeps the crew alive through sabotage. Losing them early is devastating.</li>
          <li><strong className="text-white">Don&apos;t eject on thin evidence.</strong> Ejecting an innocent crew member is as bad as a successful sabotage. Be sure before you vote.</li>
        </ul>
        <H3>As the Saboteur</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Vary your targets.</strong> Sabotaging the same system repeatedly creates a pattern that leads back to you.</li>
          <li><strong className="text-white">Create alibis.</strong> Sabotage a section you weren&apos;t assigned to — if anyone asks, you were busy fixing comms.</li>
          <li><strong className="text-white">Accuse early and often.</strong> The most vocal accusers are rarely suspected. Point fingers before anyone points at you.</li>
          <li><strong className="text-white">Time your kills.</strong> Wait until trust is fraying, then strike hard — two rapid sabotages can end the game before the crew regroups.</li>
        </ul>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is Space Mutiny free to play?</H3>
            <P>
              Yes. <TrackedGameLink href="/games/space-mutiny" className="text-violet-400 hover:underline">Play Space Mutiny online for free</TrackedGameLink> on {SITE_NAME} with
              an AI host and AI crew members. No download, no subscription.
            </P>
          </div>
          <div>
            <H3>How is this different from Among Us?</H3>
            <P>
              Space Mutiny is <strong className="text-white">text-based and discussion-focused</strong>.
              There&apos;s no running around a map — all the action happens through narrative choices and
              crew meetings. It&apos;s deeper strategically and works entirely in your browser.
            </P>
          </div>
          <div>
            <H3>Can I play with just 2 people?</H3>
            <P>
              Yes. AI crew members fill empty seats with distinct personalities. They report findings,
              cast suspicion, and vote — you&apos;ll quickly forget they&apos;re not human.
            </P>
          </div>
          <div>
            <H3>How long does a game take?</H3>
            <P>
              A typical game runs <strong className="text-white">15–25 minutes</strong>. Quick saboteur
              wins can end sooner; drawn-out investigations with multiple close votes can push toward
              30 minutes.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🚀 Launch Space Mutiny</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            One traitor. Failing systems. Can you find the Saboteur before the ship is lost?
          </p>
          <TrackedGameLink
            href="/games/space-mutiny"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Space Mutiny Free
          </TrackedGameLink>
        </div>

        <P>
          Looking for more sci-fi deduction? Check out{" "}
          <TrackedGameLink href="/games/resistance" className="text-violet-400 hover:underline">The Resistance</TrackedGameLink> for
          mission-based traitor hunting, or browse our{" "}
          <Link href="/blog/among-us-alternatives" className="text-violet-400 hover:underline">Among Us alternatives</Link> guide.
        </P>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
