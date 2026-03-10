import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Fun Games to Play with Coworkers — Remote and In-Office (2026)";
const DESCRIPTION =
  "From quick 5-minute icebreakers to full team game nights — here are the best games to play with coworkers. AI-hosted, browser-based, no prep needed.";
const CANONICAL = "/blog/games-to-play-with-coworkers";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "games to play with coworkers",
    "office party games",
    "team games for work",
    "fun work games online",
    "remote team games",
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
    tags: ["Use Case", "Workplace"],
    images: [{ url: "/blog/blog-games-to-play-with-coworkers.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-games-to-play-with-coworkers.png"],
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
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
};

/* ────────────────────────────────────────────────────────────────────────── */

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function GamesToPlayWithCoworkersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            {SITE_NAME}
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Games for Coworkers</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">
              Use Case
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">
              Workplace
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {TITLE}
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed mb-5">
            The best workplace games don&apos;t feel forced. They fit into a 5-minute break or
            expand into a full game night — and nobody has to spend an hour setting them up.
            Here&apos;s how to pick the right game for every work occasion.
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 6, 2026</span>
            <span>·</span>
            <span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-games-to-play-with-coworkers.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Table of Contents */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Table of Contents
          </p>
          <ol className="space-y-1.5">
            {[
              { id: "why-play", label: "Why Workplace Games Matter" },
              { id: "five-min", label: "5-Minute Break Games" },
              { id: "fifteen-min", label: "15-Minute Session Games" },
              { id: "game-night", label: "Full Game Night Picks" },
              { id: "games-to-avoid", label: "Games to Avoid at Work" },
              { id: "faq", label: "FAQ" },
            ].map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                >
                  {i + 1}. {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Why Workplace Games Matter ──────────────────────────────────── */}
        <H2 id="why-play">Why Workplace Games Matter</H2>

        <P>
          Research consistently shows that teams who share non-work experiences communicate
          better, resolve conflicts faster, and report higher job satisfaction. But most
          &quot;team building activities&quot; feel like homework. The secret is choosing games
          people would actually play outside of work — then making them easy to start.
        </P>

        <P>
          AI-hosted games solve the logistics problem. No one needs to learn rules, moderate, or
          prepare materials. The host picks a game, shares a link, and the AI handles everything.
          That&apos;s the difference between &quot;mandatory fun&quot; and actual fun.
        </P>

        {/* ── 5-Minute Break Games ───────────────────────────────────────── */}
        <H2 id="five-min">5-Minute Break Games</H2>

        <P>
          Perfect for a quick energy boost between meetings or at the end of a standup.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Quick Trivia Round</H3>
            <P>
              Five AI-generated questions on a random topic. Takes 3–4 minutes, creates instant
              debate, and the leaderboard adds just enough competition. Try themed rounds like
              &quot;company trivia&quot; or &quot;90s pop culture.&quot;
            </P>
            <TrackedGameLink href="/games/trivia" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Trivia →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Two Truths and a Lie</H3>
            <P>
              Each person shares three statements — the team guesses the lie. No app needed,
              works in Slack or on a video call. Great for new hires joining the team.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Would You Rather</H3>
            <P>
              AI-generated dilemmas keep it fresh. &quot;Would you rather have unlimited
              vacation or a 4-day work week?&quot; Simple, fun, and sparks real conversation.
            </P>
          </div>
        </div>

        {/* ── 15-Minute Session Games ────────────────────────────────────── */}
        <H2 id="fifteen-min">15-Minute Session Games</H2>

        <P>
          Ideal for team meetings with 10 minutes to spare, or a scheduled mid-week break.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Codenames</H3>
            <P>
              Split into two teams and give one-word clues to identify secret agents on the
              board. Strategic, collaborative, and workplace-appropriate. One round takes about
              10–15 minutes.
            </P>
            <TrackedGameLink href="/games/codenames" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Codenames →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Improv Comedy</H3>
            <P>
              The AI serves short improv prompts — &quot;You&apos;re a customer returning an
              invisible product.&quot; Players respond in character. Breaks down hierarchy and
              gets people laughing together.
            </P>
            <TrackedGameLink href="/games/improv-comedy" className="text-violet-400 hover:underline text-sm font-semibold">
              Play Improv Comedy →
            </TrackedGameLink>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Spyfall</H3>
            <P>
              Everyone knows the location except the spy. Ask and answer questions without
              giving it away. Rounds are fast, and the interrogation phase is always entertaining.
            </P>
          </div>
        </div>

        {/* ── Full Game Night Picks ──────────────────────────────────────── */}
        <H2 id="game-night">Full Game Night Picks (30–60 Min)</H2>

        <P>
          For monthly team events, Friday wind-downs, or virtual offsites.
        </P>

        <div className="space-y-6 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Werewolf</H3>
            <P>
              The ultimate social deduction game. Hidden roles, heated debates, surprise
              betrayals. AI-hosted means no one sits out as moderator — even the manager plays.
              Best with 6–12 people.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Murder Mystery</H3>
            <P>
              The AI generates a unique case with suspects, clues, and motives. The team
              collaborates to solve it. Less confrontational than Werewolf — great for teams
              that prefer cooperation over competition.
            </P>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <H3>Custom Themed Game</H3>
            <P>
              Describe any concept to the AI and it builds a game. &quot;Office trivia about our
              company history&quot; or &quot;A mystery set in our office building.&quot; Personalized
              games create inside jokes that last.
            </P>
            <Link href="/discover" className="text-violet-400 hover:underline text-sm font-semibold">
              Create Custom Game →
            </Link>
          </div>
        </div>

        <P>
          Need more team building inspiration? See our{" "}
          <Link href="/blog/virtual-team-building-games" className="text-violet-400 hover:underline">
            virtual team building games
          </Link>{" "}
          and{" "}
          <Link href="/blog/best-icebreaker-games-online" className="text-violet-400 hover:underline">
            best icebreaker games online
          </Link>{" "}
          guides.
        </P>

        {/* ── Games to Avoid at Work ─────────────────────────────────────── */}
        <H2 id="games-to-avoid">Games to Avoid at Work</H2>

        <P>
          Not every game belongs in a professional setting. Here&apos;s what to skip:
        </P>

        <ul className="space-y-2 mb-6 list-disc list-inside text-zinc-300">
          <li>
            <strong className="text-white">Overly competitive games</strong> with elimination
            — nobody wants to be voted out in front of their boss.
          </li>
          <li>
            <strong className="text-white">Games requiring personal disclosure</strong> like
            &quot;Never Have I Ever&quot; — boundaries matter at work.
          </li>
          <li>
            <strong className="text-white">Complex strategy games</strong> that take 30
            minutes to explain — you&apos;ll lose people before you start.
          </li>
          <li>
            <strong className="text-white">Games with mature themes</strong> — keep it clean
            and HR-friendly.
          </li>
        </ul>

        <P>
          Stick to games where everyone participates the whole time, nobody feels singled out,
          and the humor comes from the gameplay — not from embarrassing anyone.
        </P>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>

        <div className="space-y-6 mb-12">
          <div>
            <H3>How do I get reluctant coworkers to play?</H3>
            <P>
              Start with low-commitment games like trivia or Would You Rather during an existing
              meeting. Once people see it&apos;s fun (not forced), they&apos;ll ask for more.
              Never make participation mandatory.
            </P>
          </div>
          <div>
            <H3>Do these games work for hybrid teams?</H3>
            <P>
              Yes. Since everyone plays in their browser, it doesn&apos;t matter who&apos;s in
              the office and who&apos;s remote. The AI host treats all players equally.
            </P>
          </div>
          <div>
            <H3>How often should teams play?</H3>
            <P>
              A 5-minute game weekly and a 30-minute game night monthly is a good rhythm.
              Consistency matters more than frequency — make it a ritual, not a one-off.
            </P>
          </div>
          <div>
            <H3>Can I customize games for our company?</H3>
            <P>
              Absolutely. On {SITE_NAME}, describe any game concept and the AI builds it.
              &quot;Trivia about our product roadmap&quot; or &quot;Werewolf set in our
              marketing department&quot; — the possibilities are endless.
            </P>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            Plan Your Team Game Night
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Pick a game, share the link, and let the AI host. No prep, no moderator, no
            downloads. Your coworkers will thank you.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Workplace Games
          </Link>
        </div>

        {/* ── Back ────────────────────────────────────────────────────── */}
        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </>
  );
}
