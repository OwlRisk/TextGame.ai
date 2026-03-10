import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import { ChatPreviewWidget } from "@/app/components/blog/ChatPreviewWidget";

const TITLE = "Play Who's the Spy (Undercover) Online — Rules & Strategy";
const DESCRIPTION =
  "Learn the rules of Who's the Spy (Undercover / 谁是卧底), understand every role, master blending-in strategy, and play online for free with AI on TextGame.ai.";
const CANONICAL = "/blog/play-undercover-online";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "who is the spy game",
    "undercover game online",
    "play undercover online",
    "who is the spy rules",
    "谁是卧底",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-play-undercover-online.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-play-undercover-online.png"],
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

function RoleCard({ emoji, name, team, description }: { emoji: string; name: string; team: string; description: string }) {
  const colors: Record<string, string> = {
    Civilian: "text-emerald-400 bg-emerald-500/10",
    Undercover: "text-red-400 bg-red-500/10",
    "Mr. White": "text-zinc-300 bg-zinc-500/10",
  };
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-bold text-white">{name}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[team] ?? "text-zinc-400 bg-zinc-500/10"}`}>{team}</span>
        </div>
      </div>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}

export default function PlayUndercoverOnlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">Play Undercover Online</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-red-500/10 text-red-400 rounded-full">Undercover</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">How to Play</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Who&apos;s the Spy — also called Undercover or 谁是卧底 — is a wildly popular word-based
            social deduction game. Everyone receives a secret word, but <strong className="text-white">one
            player&apos;s word is slightly different</strong>. Through vague descriptions and careful
            listening, you must figure out who has the odd word — without revealing your own.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-play-undercover-online.png"
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
              { id: "what-is", label: "What is Who's the Spy?" },
              { id: "roles", label: "Roles — Civilian, Undercover & Mr. White" },
              { id: "rules", label: "How to Play — Rules" },
              { id: "description-strategy", label: "Description Strategy" },
              { id: "online", label: "Play Undercover Online on TextGame.ai" },
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

        {/* ── What is Who's the Spy ─────────────────────────────────── */}
        <ChatPreviewWidget gameSlug="undercover" />

        <H2 id="what-is">What is Who&apos;s the Spy?</H2>
        <P>
          Born as a Chinese party game (谁是卧底) and popularized by TV shows, Who&apos;s the Spy
          is a <strong className="text-white">word-guessing social deduction game</strong> for 4–10 players.
          Two similar but different words are distributed — for example, &quot;coffee&quot; and
          &quot;hot chocolate.&quot; Most players (Civilians) get one word; the Undercover player gets
          the other. Nobody knows which word is which or who has what.
        </P>
        <P>
          Each round, every player gives a one-sentence description of their word. Then everyone votes
          to eliminate the player they think is the spy. The <strong className="text-white">Civilians
          win</strong> by voting out the Undercover; the <strong className="text-white">Undercover
          wins</strong> by surviving until only two players remain.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">👥</p><p className="font-semibold text-white">4–10 players</p></div>
            <div><p className="text-2xl mb-1">⏱️</p><p className="font-semibold text-white">10–20 min</p></div>
            <div><p className="text-2xl mb-1">🗣️</p><p className="font-semibold text-white">Word-based</p></div>
            <div><p className="text-2xl mb-1">🕵️</p><p className="font-semibold text-white">Social Deduction</p></div>
          </div>
        </div>

        {/* ── Roles ─────────────────────────────────────────────────── */}
        <H2 id="roles">Roles — Civilian, Undercover &amp; Mr. White</H2>
        <P>A standard game includes up to three distinct roles:</P>
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <RoleCard emoji="👤" name="Civilian" team="Civilian" description="You receive the majority word. Describe it vaguely enough so the Undercover can't figure it out, but clearly enough for fellow Civilians to recognize you." />
          <RoleCard emoji="🕵️" name="Undercover" team="Undercover" description="You receive a similar but different word. Blend in with the Civilians by listening carefully to their descriptions and mimicking their language." />
          <RoleCard emoji="👻" name="Mr. White" team="Mr. White" description="You receive NO word at all. Survive purely by reading the room and imitating others. If voted out, you get one chance to guess the Civilian word to win." />
        </div>
        <P>
          Not every game includes Mr. White — it&apos;s an optional role that adds an extra layer of chaos.
          On {SITE_NAME}, the AI Game Master can include or exclude Mr. White based on your preference.
        </P>

        {/* ── Rules ─────────────────────────────────────────────────── */}
        <H2 id="rules">How to Play — Rules</H2>
        <ol className="space-y-5 mb-8">
          {[
            { phase: "Word Distribution", desc: "The Game Master secretly assigns two similar words. Most players get the Civilian word; one or two get the Undercover word. Mr. White (if included) gets nothing." },
            { phase: "Describe", desc: "Going around the table, each player gives a brief, vague description of their word. You want to confirm allies without tipping off the spy." },
            { phase: "Discuss & Vote", desc: "After all descriptions, players discuss who sounded off. Everyone votes to eliminate one player. The eliminated player's role is revealed." },
            { phase: "Repeat", desc: "Surviving players describe again in the next round. Each round, descriptions should shift — repeating the same clue looks suspicious." },
            { phase: "End", desc: "Civilians win when the Undercover is eliminated. Undercover wins by surviving to the final two. Mr. White wins by guessing the Civilian word when voted out." },
          ].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.phase}</p>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── Description Strategy ──────────────────────────────────── */}
        <H2 id="description-strategy">Description Strategy</H2>
        <H3>As a Civilian</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Be vague but accurate.</strong> Describe a feature that fits your word but could also fit similar words. Don&apos;t be too specific or the Undercover will adapt.</li>
          <li><strong className="text-white">Use sensory details.</strong> Instead of naming the object, describe how it feels, looks, or is used.</li>
          <li><strong className="text-white">Listen before you speak.</strong> If you go later in the round, pay attention to what others say — their descriptions help you gauge who&apos;s on your team.</li>
          <li><strong className="text-white">Switch angles each round.</strong> Describe a different aspect of the word each time so the Undercover can&apos;t just parrot you.</li>
        </ul>

        <H3>As the Undercover</H3>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Listen more than you talk.</strong> Let Civilians speak first when possible. Mirror their phrasing and confidence level.</li>
          <li><strong className="text-white">Stay in the middle.</strong> Descriptions that are too precise or too vague both draw suspicion.</li>
          <li><strong className="text-white">Accuse strategically.</strong> Point suspicion at a Civilian who gave an unusual description to divert attention from yourself.</li>
          <li><strong className="text-white">Adapt round by round.</strong> As more descriptions come in, adjust your mental model of the Civilian word and refine your cover.</li>
        </ul>

        {/* ── Online ────────────────────────────────────────────────── */}
        <H2 id="online">Play Undercover Online on {SITE_NAME}</H2>
        <P>
          Undercover is perfect for parties, but gathering enough people can be tricky. On{" "}
          <TrackedGameLink href="/games/undercover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</TrackedGameLink>,
          the AI makes it effortless:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🤖</span>
            <p className="text-zinc-300"><strong className="text-white">AI Game Master</strong> picks word pairs, assigns roles, manages voting, and reveals results — no human host needed.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300"><strong className="text-white">AI players join automatically.</strong> Play with 1 friend or solo — AI characters describe, vote, and try to blend in just like real players.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🗣️</span>
            <p className="text-zinc-300"><strong className="text-white">Unique AI personalities.</strong> Each AI player has a distinct style — some are cautious, some aggressive, some hilariously off-base.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔗</span>
            <p className="text-zinc-300"><strong className="text-white">Share a link to invite friends.</strong> No download, no sign-up for guests. Works in any browser.</p>
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>How many players do you need for Undercover?</H3>
            <P>
              The game works best with 5–8, but on {SITE_NAME} you can start with just 1 human player.
              AI fills the remaining seats for a complete game of 4–10.
            </P>
          </div>
          <div>
            <H3>What kind of word pairs are used?</H3>
            <P>
              Word pairs are always related but distinct — like &quot;guitar / ukulele,&quot;
              &quot;sushi / sashimi,&quot; or &quot;email / text message.&quot; The AI Game Master
              draws from hundreds of curated pairs.
            </P>
          </div>
          <div>
            <H3>What happens if Mr. White is voted out?</H3>
            <P>
              When Mr. White is eliminated, they get one final chance to guess the Civilian word. If
              they guess correctly, Mr. White wins the game outright — even though they were caught.
            </P>
          </div>
          <div>
            <H3>Is Undercover free to play online?</H3>
            <P>
              Yes! <TrackedGameLink href="/games/undercover" className="text-violet-400 hover:underline">Play Undercover for
              free</TrackedGameLink> on {SITE_NAME} with AI players and an AI Game Master.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-red-600/20 to-violet-600/20 border border-red-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🕵️ Play Undercover Online Now</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            AI Game Master. AI players. Hundreds of word pairs. Blend in or get caught.
          </p>
          <TrackedGameLink
            href="/games/undercover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Play Undercover Free
          </TrackedGameLink>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
