import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "AI Improv Comedy Game Online — Play Free with Friends";
const DESCRIPTION =
  "Play improv comedy online with an AI host that generates scenes and throws curveballs. No experience needed — just jump in and make your friends laugh.";
const CANONICAL = "/blog/play-improv-comedy-online";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "improv comedy game online",
    "online improv game",
    "creative party game",
    "roleplay comedy game",
    "ai improv game",
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
    images: [{ url: "/blog/blog-play-improv-comedy-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-improv-comedy-online.png"],
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

export default function PlayImprovComedyOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI Improv Comedy Game</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Improv Comedy</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            No stage. No audience. No experience required. With{" "}
            <strong className="text-white">AI Improv Comedy</strong>, an AI host generates wild scenes,
            throws curveballs mid-skit, and your group improvises the funniest responses. It&apos;s
            Whose Line Is It Anyway meets a party game — and everyone gets to play.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-improv-comedy-online.png"
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
              { id: "what-is", label: "What Is AI Improv Comedy?" },
              { id: "how-it-works", label: "How It Works" },
              { id: "tips", label: "Tips for Beginners" },
              { id: "why-ai", label: "Why AI Hosting Works" },
              { id: "team-building", label: "Improv for Team Building" },
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
        <H2 id="what-is">What Is AI Improv Comedy?</H2>
        <P>
          <strong className="text-white">AI Improv Comedy</strong> is an online party game where an AI
          host generates improv comedy scenes and players respond with their funniest, most creative
          performances. The AI sets the scene (&quot;You&apos;re a medieval knight ordering at a drive-through&quot;),
          assigns roles, and throws in unexpected twists mid-skit. Players vote on the funniest responses.
        </P>
        <P>
          Unlike traditional improv that requires training and a stage, this game is designed for{" "}
          <strong className="text-white">anyone</strong>. The AI host guides every round, provides
          prompts when you&apos;re stuck, and ensures the energy stays high. Whether you&apos;re a comedy
          veteran or someone who has never improvised in their life, the AI meets you where you are.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">🎭</p><p className="font-semibold text-white">3–10 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">15–30 min</p></div>
            <div><p className="text-2xl mb-1">😂</p><p className="font-semibold text-white">Comedy</p></div>
            <div><p className="text-2xl mb-1">🤖</p><p className="font-semibold text-white">AI-Hosted</p></div>
          </div>
        </div>

        {/* ── How It Works ───────────────────────────────────────── */}
        <H2 id="how-it-works">How It Works</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Scene Generation", desc: "The AI host generates a unique scene prompt — a setting, characters, and a situation. Examples: \"Two pirates writing a Yelp review\" or \"A therapist for supervillains.\"" },
            { phase: "Role Assignment", desc: "Players are assigned characters (or choose their own). Each character has a personality quirk the AI suggests — \"speaks only in questions\" or \"dramatically overreacts to everything.\"" },
            { phase: "Yes, And!", desc: "Players improvise dialogue in text, building on each other's contributions. The core improv rule — \"yes, and\" — means you accept what others say and add to it." },
            { phase: "AI Curveball", desc: "Mid-scene, the AI throws in a twist: a new character arrives, the setting changes, or a ridiculous constraint is added (\"now everyone rhymes\"). Adapt and keep going." },
            { phase: "Voting & Scoring", desc: "After the scene ends, players vote on the funniest moments. The AI also picks an MVP. Points are tallied across multiple rounds to crown a comedy champion." },
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

        {/* ── Tips ────────────────────────────────────────────────── */}
        <H2 id="tips">Tips for Beginners</H2>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Say &quot;yes, and&quot; to everything.</strong> The golden rule of improv. Accept whatever your scene partner says and build on it, no matter how absurd.</li>
          <li><strong className="text-white">Don&apos;t try to be funny — be specific.</strong> &quot;I brought a sandwich&quot; isn&apos;t funny. &quot;I brought my grandmother&apos;s cursed tuna casserole&quot; is. Specificity creates comedy.</li>
          <li><strong className="text-white">Commit to your character.</strong> If you&apos;re playing a dramatic medieval knight, go all-in. Half-hearted characters aren&apos;t fun for anyone.</li>
          <li><strong className="text-white">Embrace failure.</strong> The funniest moments often come from things going wrong. A botched response can be funnier than a polished one.</li>
          <li><strong className="text-white">React to the AI curveballs.</strong> When the AI changes the scene, don&apos;t fight it — the twist is where the magic happens. Lean into the chaos.</li>
          <li><strong className="text-white">Keep contributions short.</strong> One or two sentences per turn keeps the pace snappy and gives everyone space to contribute.</li>
        </ul>

        {/* ── Why AI Hosting ─────────────────────────────────────── */}
        <H2 id="why-ai">Why AI Hosting Works</H2>
        <P>
          Traditional improv needs a skilled host to set scenes, manage energy, and keep things moving.
          An AI host does all of that — and more:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎲</span>
            <p className="text-zinc-300"><strong className="text-white">Infinite Scene Variety</strong> — The AI generates fresh, unpredictable scenes every round. You&apos;ll never play the same game twice.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⚡</span>
            <p className="text-zinc-300"><strong className="text-white">Perfect Pacing</strong> — The AI knows when a scene is dragging and throws in a curveball, or when it&apos;s peaking and lets it ride.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🤝</span>
            <p className="text-zinc-300"><strong className="text-white">Inclusive by Design</strong> — No one is put on the spot. Shy players get gentle prompts; bold players get bigger challenges.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📊</span>
            <p className="text-zinc-300"><strong className="text-white">Fair Judging</strong> — The AI picks highlights and MVPs based on creativity, commitment, and collaboration — not just the loudest person.</p>
          </div>
        </div>

        {/* ── Team Building ──────────────────────────────────────── */}
        <H2 id="team-building">Improv for Team Building</H2>
        <P>
          AI Improv Comedy isn&apos;t just for game night — it&apos;s a powerful{" "}
          <strong className="text-white">team building tool</strong>. Improv exercises are used by companies
          like Google and Pixar to build trust, improve communication, and encourage creative thinking.
          The AI-hosted format makes it accessible for remote teams.
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Builds psychological safety.</strong> In improv, there are no wrong answers. This mindset carries over into brainstorming sessions and team meetings.</li>
          <li><strong className="text-white">Improves active listening.</strong> You can&apos;t &quot;yes, and&quot; if you&apos;re not paying attention. Improv trains focused, collaborative listening.</li>
          <li><strong className="text-white">Breaks down hierarchies.</strong> When the CEO is playing a dramatic space pirate, titles disappear and genuine connection takes over.</li>
          <li><strong className="text-white">Works for remote teams.</strong> Text-based improv is ideal for distributed teams in different time zones. Everyone types at their own pace.</li>
        </ul>
        <P>
          For more ideas, check out our{" "}
          <Link href="/blog/virtual-team-building-games" className="text-violet-400 hover:underline">virtual team building games</Link> guide
          or browse the{" "}
          <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">best online party games</Link> roundup.
        </P>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Do I need improv experience to play?</H3>
            <P>
              Not at all. The AI host provides prompts, suggestions, and character descriptions that
              guide you through every scene. First-timers often end up being the funniest players
              because they&apos;re less self-conscious.
            </P>
          </div>
          <div>
            <H3>How many players do I need?</H3>
            <P>
              The game works with <strong className="text-white">3–10 players</strong>. Smaller groups
              (3–4) feel intimate and collaborative. Larger groups (7–10) are chaotic and hilarious.
              AI players can fill empty seats if needed.
            </P>
          </div>
          <div>
            <H3>Is the AI actually funny?</H3>
            <P>
              The AI is great at <em>setting up</em> comedy — generating absurd scenes, well-timed
              twists, and character prompts that spark creativity. The real humor comes from you and
              your friends responding to those setups.
            </P>
          </div>
          <div>
            <H3>Can I use this for a work event?</H3>
            <P>
              Absolutely. AI Improv Comedy is popular for remote team building, icebreakers, and
              company offsites. The AI keeps content workplace-appropriate by default, and games can
              be customized for different comfort levels.
            </P>
          </div>
          <div>
            <H3>Is it free to play?</H3>
            <P>
              Yes. <TrackedGameLink href="/games/improv-comedy" className="text-violet-400 hover:underline">Play AI Improv Comedy online for free</TrackedGameLink> on {SITE_NAME}.
              No signup, no download — just share a link and start improvising.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🎭 Start Improvising</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI-generated scenes. Unexpected twists. Guaranteed laughs. Jump in — no experience needed.
          </p>
          <TrackedGameLink
            href="/games/improv-comedy"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Improv Comedy Free
          </TrackedGameLink>
        </div>

        <P>
          Love creative games? Try{" "}
          <TrackedGameLink href="/games/storyteller" className="text-violet-400 hover:underline">Storyteller</TrackedGameLink> for
          collaborative fiction or explore all our{" "}
          <Link href="/blog/best-online-party-games" className="text-violet-400 hover:underline">online party games</Link>.
        </P>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
