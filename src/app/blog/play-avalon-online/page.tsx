import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import { ChatPreviewWidget } from "@/app/components/blog/ChatPreviewWidget";

const TITLE = "Play Avalon Online with AI — Rules, Roles & Strategy Guide";
const DESCRIPTION =
  "Master The Resistance: Avalon with our complete guide. Learn every role from Merlin to Mordred, quest mechanics, winning strategies, and how to play free online with an AI Game Master.";
const CANONICAL = "/blog/play-avalon-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "play avalon online",
    "avalon board game rules",
    "avalon roles",
    "resistance avalon online",
    "avalon strategy",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-avalon-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-avalon-online.png"],
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

export default function PlayAvalonOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Avalon Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Avalon</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            The Resistance: Avalon is a beloved social deduction game set in the world of King Arthur.
            Good servants try to complete quests while hidden evil agents sabotage from within. Now you
            can play it online with AI — no large group required. Here&apos;s your complete guide.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>8 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-avalon-online.png"
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
              { id: "what-is", label: "What is Avalon?" },
              { id: "roles", label: "All Avalon Roles Explained" },
              { id: "rules", label: "How to Play — Quest Mechanics & Rules" },
              { id: "strategy", label: "Strategy Tips for Good & Evil" },
              { id: "online", label: "How to Play Avalon Online with AI" },
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

        {/* ── What is Avalon ─────────────────────────────────────── */}
        <ChatPreviewWidget gameSlug="avalon" />

        <H2 id="what-is">What is Avalon?</H2>
        <P>
          <strong className="text-white">The Resistance: Avalon</strong> is a social deduction board game
          for 5–10 players designed by Don Eskridge. Set in the Arthurian legend, loyal servants of Arthur
          must complete three quests before the forces of Mordred can sabotage them. Unlike Werewolf or Mafia,
          there&apos;s no player elimination — everyone stays in the game until the end.
        </P>
        <P>
          The beauty of Avalon lies in its <strong className="text-white">information asymmetry</strong>.
          Evil players know each other, but good players are in the dark. Special roles like Merlin and
          Percival add layers of hidden knowledge that create intense bluffing and deduction opportunities.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">5–10 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">30 min</p></div>
            <div><p className="text-2xl mb-1">🏰</p><p className="font-semibold text-white">Social Deduction</p></div>
            <div><p className="text-2xl mb-1">⚔️</p><p className="font-semibold text-white">No Elimination</p></div>
          </div>
        </div>

        {/* ── Roles ──────────────────────────────────────────────── */}
        <H2 id="roles">All Avalon Roles Explained</H2>
        <H3>Good Team (Loyal Servants of Arthur)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Loyal Servant of Arthur</strong> — The base good role. No special information; rely on discussion and deduction to identify evil players.</li>
          <li><strong className="text-white">Merlin</strong> — Knows who the evil players are (except Mordred). Must guide the good team subtly without revealing identity, because the Assassin can kill Merlin at the end to steal a win.</li>
          <li><strong className="text-white">Percival</strong> — Knows who Merlin is (and sees Morgana as a potential Merlin). Acts as Merlin&apos;s bodyguard by drawing the Assassin&apos;s attention away.</li>
        </ul>
        <H3>Evil Team (Minions of Mordred)</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Minion of Mordred</strong> — The base evil role. Knows other evil players and works to fail quests or create confusion.</li>
          <li><strong className="text-white">Assassin</strong> — If three quests succeed, gets one chance to assassinate Merlin. A correct guess wins the game for evil even after three successful quests.</li>
          <li><strong className="text-white">Morgana</strong> — Appears as Merlin to Percival. Creates doubt about who the real Merlin is, making it harder for good to coordinate.</li>
          <li><strong className="text-white">Mordred</strong> — Hidden from Merlin&apos;s sight. The most dangerous evil role because Merlin cannot identify Mordred, making deduction harder for the good team.</li>
        </ul>

        {/* ── Rules ──────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Quest Mechanics &amp; Rules</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Role Assignment", desc: "Each player is secretly dealt a role. Evil players learn who each other are. Merlin sees the evil players (except Mordred). Percival sees Merlin (and Morgana)." },
            { phase: "Team Proposal", desc: "The current leader proposes a team of players to go on the quest. The required team size varies by quest number and total player count." },
            { phase: "Team Vote", desc: "All players publicly vote to approve or reject the proposed team. If rejected, leadership passes clockwise. Five consecutive rejections automatically fails the quest." },
            { phase: "Quest Phase", desc: "Approved team members secretly play Success or Fail cards. Good players must play Success. Evil players can choose either. One Fail card (two in some quests) fails the quest." },
            { phase: "Assassination", desc: "If good completes three quests, the Assassin gets one final shot — correctly identify Merlin to steal the victory for evil. This is why Merlin must stay hidden." },
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
        <H2 id="strategy">Strategy Tips for Good &amp; Evil</H2>
        <H3>Playing as Good</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Watch team proposals carefully.</strong> Evil players often try to include themselves or other evil members on quests.</li>
          <li><strong className="text-white">Track voting patterns.</strong> Players who consistently approve suspicious teams may be evil.</li>
          <li><strong className="text-white">If you&apos;re Merlin, be subtle.</strong> Drop indirect hints rather than openly accusing evil players — the Assassin is watching.</li>
          <li><strong className="text-white">Protect Merlin at all costs.</strong> If you&apos;re Percival, act as a decoy and draw attention to yourself.</li>
        </ul>
        <H3>Playing as Evil</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Don&apos;t always fail quests.</strong> Passing a quest you&apos;re on builds trust and makes you harder to detect.</li>
          <li><strong className="text-white">Accuse other good players.</strong> Create confusion and split the good team&apos;s trust.</li>
          <li><strong className="text-white">As Assassin, watch who guides the team.</strong> The player subtly steering good decisions is likely Merlin.</li>
          <li><strong className="text-white">As Morgana, claim to be Merlin.</strong> If Percival is in the game, sow doubt about the real Merlin&apos;s identity.</li>
        </ul>

        {/* ── Online ─────────────────────────────────────────────── */}
        <H2 id="online">How to Play Avalon Online with AI</H2>
        <P>
          Gathering 5–10 friends for Avalon can be tough. With{" "}
          <TrackedGameLink href="/games/avalon" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          you can jump into a game anytime:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> handles role assignment, quest phases, voting, and the assassination round. No moderator needed.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI fills empty seats.</strong> Play with just one friend and AI takes the remaining roles with unique personalities and strategies.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Share a link to invite friends.</strong> No app download, no sign-up required for guests.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎭</span>
            <p className="text-zinc-300"><strong className="text-white">Full role support.</strong> Merlin, Percival, Morgana, Mordred, Assassin — all implemented with proper hidden information.</p>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many players do you need for Avalon?</H3>
            <P>
              The physical board game requires 5–10 players. On {SITE_NAME}, you can start with as few
              as 1–2 humans — AI characters fill the remaining seats with realistic strategies and personalities.
            </P>
          </div>
          <div>
            <H3>What&apos;s the difference between Avalon and The Resistance?</H3>
            <P>
              The Resistance is the base game with no special roles — just generic resistance fighters vs spies.
              Avalon adds character roles like Merlin, Percival, Morgana, and Mordred, which create much
              deeper strategic gameplay and more dramatic moments.
            </P>
          </div>
          <div>
            <H3>Can Merlin talk openly about who is evil?</H3>
            <P>
              Technically yes, but it&apos;s a terrible idea. If the Assassin figures out you&apos;re Merlin, evil
              wins even after three successful quests. The best Merlin players guide the team through
              subtle suggestions and indirect reasoning.
            </P>
          </div>
          <div>
            <H3>Is Avalon free to play online?</H3>
            <P>
              Yes. You can <TrackedGameLink href="/games/avalon" className="text-violet-400 hover:underline">play Avalon online for free</TrackedGameLink> on {SITE_NAME} with
              an AI Game Master and AI players. No subscription or purchase required.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">⚔️ Play Avalon Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. All roles included. Start a quest in 30 seconds.
          </p>
          <TrackedGameLink
            href="/games/avalon"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Avalon Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
