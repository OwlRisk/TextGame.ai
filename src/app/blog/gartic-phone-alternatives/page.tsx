import type { Metadata } from "next";
import Link from "next/link";
import { TrackedGameLink } from "@/app/components/blog/TrackedGameLink";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "7 Best Gartic Phone Alternatives — Free Drawing Party Games (2026)";
const DESCRIPTION = "Looking for games like Gartic Phone? Here are 7 free alternatives for drawing, guessing, and party games you can play in the browser with friends.";
const CANONICAL = "/blog/gartic-phone-alternatives";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["gartic phone alternatives", "games like gartic phone", "free drawing games online", "drawing party games", "browser drawing games", "pictionary online free", "telephone game online"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Comparison", "Party Games", "Drawing"], images: [{ url: "/blog/blog-gartic-phone-alternatives.png", width: 1792, height: 1024, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/blog-gartic-phone-alternatives.png"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }
function Pros({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-emerald-400"><span className="mt-0.5">✓</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }
function Cons({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-red-400"><span className="mt-0.5">✗</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }

export default function GarticPhoneAlternativesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">Gartic Phone Alternatives</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-pink-500/10 text-pink-400 rounded-full">Drawing Games</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Gartic Phone is one of the most popular free party games on the internet — a drawing telephone
            game where messages get hilariously distorted. But if your group wants more variety or different
            types of party games, here are 7 great alternatives.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>7 min read</span></div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-gartic-phone-alternatives.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        <H2 id="alternatives">The 7 Best Gartic Phone Alternatives</H2>

        <H3>1. Skribbl.io — Classic Pictionary</H3>
        <P>The most popular free Pictionary game online. One player draws, everyone guesses. Custom word lists make it endlessly personalizable.</P>
        <Pros items={["Free, no account needed", "Custom word lists", "Fast rounds, instantly fun"]} />
        <Cons items={["Simple — one game mode", "Drawing tools are basic"]} />

        <H3>2. Drawize — Polished Drawing Games</H3>
        <P>A more polished drawing game platform with multiple modes: classic draw-and-guess, team play, speed draw, and more.</P>
        <Pros items={["Multiple game modes", "Better drawing tools than Skribbl", "Free with no download"]} />
        <Cons items={["Ad-supported", "Smaller community"]} />

        <H3>3. TextGame.ai — AI Party Games (Non-Drawing)</H3>
        <P>
          If your group loves Gartic Phone for the laughs and social dynamics — but wants a break from
          drawing — <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> offers
          20+ text-based party games with an AI host.{" "}
          <TrackedGameLink href="/games/improv-comedy" className="text-violet-400 hover:underline">Improv Comedy</TrackedGameLink> and{" "}
          <TrackedGameLink href="/games/storyteller" className="text-violet-400 hover:underline">Epic Storyteller</TrackedGameLink> generate
          similar laugh-out-loud moments through creative prompts instead of drawings.
        </P>
        <Pros items={["AI generates unlimited unique scenarios", "20+ games beyond drawing", "AI fills empty seats", "Free browser play"]} />
        <Cons items={["Text-based — no drawing mechanics", "Different experience than visual games"]} />

        <H3>4. Drawful 2 (Jackbox)</H3>
        <P>Jackbox&apos;s drawing party game where players draw ridiculous prompts and others write fake titles. Often goes free on Steam sales.</P>
        <Pros items={["Hilarious prompt-based drawing", "Polished production quality"]} />
        <Cons items={["Usually paid ($10)", "Requires screen sharing setup", "Limited to 8 players"]} />

        <H3>5. A Fake Artist Goes to New York (Web)</H3>
        <P>Everyone draws on the same canvas, but one player is the fake artist who doesn&apos;t know the prompt. Social deduction meets drawing.</P>
        <Pros items={["Combines drawing with deduction", "Free web versions available", "Unique twist on drawing games"]} />
        <Cons items={["Needs 5+ players", "Web implementations vary in quality"]} />

        <H3>6. Guess My Sketch (Mobile)</H3>
        <P>A mobile drawing game with AI recognition — the app guesses what you&apos;re drawing in real time. Great for solo or casual play.</P>
        <Pros items={["AI-powered drawing recognition", "Works solo", "Quick casual fun"]} />
        <Cons items={["Mobile only", "Not multiplayer-focused"]} />

        <H3>7. Aggie.io + Custom Rules</H3>
        <P>A collaborative drawing canvas that can be used for free-form drawing games with your own rules — exquisite corpse, collaborative comics, and more.</P>
        <Pros items={["Fully free collaborative canvas", "Make your own drawing game rules", "No player limit"]} />
        <Cons items={["No built-in game structure", "Requires self-hosting the game rules"]} />

        <H2 id="comparison">Quick Comparison</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-zinc-700 text-left">
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Game</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Type</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Free</th>
              <th className="py-3 text-zinc-400 font-semibold">Players</th>
            </tr></thead>
            <tbody className="text-zinc-300">
              {[["Gartic Phone", "Drawing telephone", "✓", "3–30"], ["Skribbl.io", "Pictionary", "✓", "2–12"], ["Drawize", "Drawing modes", "✓", "2–10"], [SITE_NAME, "AI party games", "✓", "1+"], ["Drawful 2", "Prompt drawing", "Paid", "3–8"], ["Fake Artist", "Drawing + deduction", "✓", "5–10"], ["Aggie.io", "Collab canvas", "✓", "Unlimited"]].map(([n, t, f, p]) => (
                <tr key={n} className="border-b border-zinc-800/60">
                  <td className={`py-3 pr-4 font-semibold ${n === SITE_NAME ? "text-violet-400" : "text-white"}`}>{n}</td>
                  <td className="py-3 pr-4">{t}</td><td className="py-3 pr-4">{f}</td><td className="py-3">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="faq">FAQ</H2>
        <div className="space-y-6 mb-12">
          <div><H3>Is Gartic Phone free?</H3><P>Yes — Gartic Phone is completely free and works in any browser. No account needed.</P></div>
          <div><H3>What if my group is tired of drawing games?</H3><P>Try text-based party games on <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link> — social deduction, improv, trivia, and storytelling offer variety without needing artistic skills.</P></div>
          <div><H3>What is the best drawing game for large groups?</H3><P>Gartic Phone supports up to 30 players. For non-drawing games, {SITE_NAME} supports groups of any size with AI filling seats.</P></div>
        </div>

        <div className="bg-gradient-to-br from-pink-600/20 to-violet-600/20 border border-pink-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Want party games beyond drawing?</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">20+ AI-hosted games — social deduction, trivia, improv, and more. Free in your browser.</p>
          <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Browse All Games</Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
