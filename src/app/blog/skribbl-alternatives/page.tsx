import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "7 Best Skribbl.io Alternatives — Free Browser Games (2026)";
const DESCRIPTION = "Tired of Skribbl.io? Here are 7 free alternatives — drawing games, word games, and AI-powered party games you can play in your browser with friends.";
const CANONICAL = "/blog/skribbl-alternatives";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["skribbl alternative", "games like skribbl", "skribbl.io alternatives", "free drawing games online", "pictionary online free", "browser games with friends", "multiplayer browser games free"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Comparison", "Browser Games"], images: [{ url: "/blog/blog-skribbl-alternatives.png", width: 1792, height: 1024, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/blog-skribbl-alternatives.png"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }
function Pros({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-emerald-400"><span className="mt-0.5">✓</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }
function Cons({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-red-400"><span className="mt-0.5">✗</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }

export default function SkribblAlternativesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">Skribbl.io Alternatives</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">Browser Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Skribbl.io is the king of free online Pictionary — but after hundreds of rounds, even the best
            game gets stale. Whether you want better drawing tools, different game mechanics, or a completely
            new type of party game, here are 7 alternatives worth trying.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>7 min read</span></div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-skribbl-alternatives.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        <H2 id="drawing">Drawing Game Alternatives</H2>

        <H3>1. Gartic Phone — Drawing Telephone</H3>
        <P>Instead of guessing drawings, Gartic Phone plays like telephone: draw, describe, draw, describe. The chain of misinterpretations creates hilarious results. Supports up to 30 players.</P>
        <Pros items={["Unique telephone mechanic", "Up to 30 players", "Multiple modes (secret, animation, speedrun)"]} />
        <Cons items={["Longer rounds than Skribbl", "Less competitive"]} />

        <H3>2. Drawize — Multi-Mode Drawing</H3>
        <P>Drawize offers classic Pictionary plus team modes, speed draw, and custom lobbies. Better drawing tools and a cleaner interface than Skribbl.</P>
        <Pros items={["Multiple game modes", "Better drawing canvas", "Team play option"]} />
        <Cons items={["Ads in free version", "Smaller player pool"]} />

        <H3>3. Drawasaurus — Retro Pictionary</H3>
        <P>A dinosaur-themed Pictionary game with a retro aesthetic. Simple, fast, and charming. Great for casual groups who want something light.</P>
        <Pros items={["Cute retro style", "Fast rounds", "No account needed"]} />
        <Cons items={["Very similar to Skribbl", "Smaller community"]} />

        <H2 id="beyond-drawing">Beyond Drawing — Other Party Games</H2>

        <H3>4. TextGame.ai — AI-Powered Party Games</H3>
        <P>
          If you&apos;re looking for a Skribbl alternative because you want <em>variety</em>, not just
          another drawing game, <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> offers
          10+ text-based party games. Try{" "}
          <TrackedGameLink href="/games/codenames" className="text-violet-400 hover:underline">Codenames</TrackedGameLink> for word puzzles,{" "}
          <TrackedGameLink href="/games/spyfall" className="text-violet-400 hover:underline">Spyfall</TrackedGameLink> for social deduction, or{" "}
          <TrackedGameLink href="/games/trivia" className="text-violet-400 hover:underline">AI Trivia</TrackedGameLink> for quiz nights.
        </P>
        <Pros items={["10+ game types — not just drawing", "AI Game Master and AI players", "Free, browser-based, no download", "Every game unique thanks to AI"]} />
        <Cons items={["Text-based — no drawing", "Different experience than visual games"]} />

        <H3>5. Codenames Online — Word-Based Deduction</H3>
        <P>A strategic word game where spymasters give one-word clues to help their team find agents. Deep, replayable, and free in the browser.</P>
        <Pros items={["Free official web version", "Deep strategic gameplay", "Great for word game fans"]} />
        <Cons items={["Needs 4+ players", "No AI players for small groups"]} />

        <H3>6. Wavelength — Spectrum Guessing</H3>
        <P>One player gives a clue on a spectrum (hot/cold, easy/hard) and teammates guess where the target falls. Simple concept, surprisingly deep group discussions.</P>
        <Pros items={["Free, browser-based", "Sparks great debates", "Easy to learn"]} />
        <Cons items={["Best with 6+ players", "Single game mode"]} />

        <H3>7. Sporcle — Trivia Quizzes</H3>
        <P>Thousands of free trivia quizzes across every topic. Great for competitive quiz nights with friends. Multiplayer modes available.</P>
        <Pros items={["Massive quiz library", "Competitive multiplayer", "Free access"]} />
        <Cons items={["Quiz-only — no other game types", "Some quizzes behind paywall"]} />

        <H2 id="comparison">Quick Comparison</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-zinc-700 text-left">
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Game</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Type</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Players</th>
              <th className="py-3 text-zinc-400 font-semibold">Free</th>
            </tr></thead>
            <tbody className="text-zinc-300">
              {[["Skribbl.io", "Pictionary", "2–12", "✓"], ["Gartic Phone", "Drawing telephone", "3–30", "✓"], ["Drawize", "Drawing modes", "2–10", "✓"], ["Drawasaurus", "Pictionary", "2–16", "✓"], [SITE_NAME, "AI party games", "1+", "✓"], ["Codenames", "Word deduction", "4–8", "✓"], ["Wavelength", "Spectrum", "2–12", "✓"], ["Sporcle", "Trivia", "1–8", "✓"]].map(([n, t, p, f]) => (
                <tr key={n} className="border-b border-zinc-800/60">
                  <td className={`py-3 pr-4 font-semibold ${n === SITE_NAME ? "text-violet-400" : "text-white"}`}>{n}</td>
                  <td className="py-3 pr-4">{t}</td><td className="py-3 pr-4">{p}</td><td className="py-3">{f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="faq">FAQ</H2>
        <div className="space-y-6 mb-12">
          <div><H3>Is Skribbl.io still the best free drawing game?</H3><P>For pure Pictionary, yes. But Gartic Phone offers a more social experience, and Drawize has more game modes. For non-drawing party games, {SITE_NAME} has the most variety.</P></div>
          <div><H3>What browser games can I play with friends besides drawing?</H3><P>Social deduction ({SITE_NAME}&apos;s <TrackedGameLink href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</TrackedGameLink>, <TrackedGameLink href="/games/spyfall" className="text-violet-400 hover:underline">Spyfall</TrackedGameLink>), word games (Codenames), trivia (Sporcle, <TrackedGameLink href="/games/trivia" className="text-violet-400 hover:underline">AI Trivia</TrackedGameLink>), and creative games (<TrackedGameLink href="/games/improv-comedy" className="text-violet-400 hover:underline">Improv Comedy</TrackedGameLink>).</P></div>
        </div>

        <div className="bg-gradient-to-br from-cyan-600/20 to-violet-600/20 border border-cyan-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Ready for something new?</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">10+ free browser games with an AI host. Social deduction, trivia, improv, and more.</p>
          <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Browse All Games</Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
