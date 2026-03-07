import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "Best Town of Salem Alternatives — Play Social Deduction Online (2026)";
const DESCRIPTION =
  "Town of Salem shut down its free version. Here are the best alternatives for playing social deduction games online — Werewolf, Mafia, Secret Hitler, and more.";
const CANONICAL = "/blog/town-of-salem-alternative";
const PUBLISHED = "2026-03-06T00:00:00Z";
const MODIFIED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE, description: DESCRIPTION,
  keywords: ["town of salem alternative", "games like town of salem", "town of salem free alternative", "social deduction games online", "werewolf game online free", "mafia game online", "town of salem replacement"],
  alternates: { canonical: CANONICAL },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: `${SITE_DOMAIN}${CANONICAL}`, publishedTime: PUBLISHED, modifiedTime: MODIFIED, authors: [SITE_NAME], tags: ["Comparison", "Social Deduction"], images: [{ url: "/blog/blog-town-of-salem-alternative.png", width: 1792, height: 1024, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/blog/blog-town-of-salem-alternative.png"] },
};

const articleJsonLd = { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: MODIFIED, author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN }, publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN, logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` } }, mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` } };

function H2({ id, children }: { id: string; children: React.ReactNode }) { return <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">{children}</h2>; }
function H3({ children }: { children: React.ReactNode }) { return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>; }
function P({ children }: { children: React.ReactNode }) { return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>; }
function Pros({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-emerald-400"><span className="mt-0.5">✓</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }
function Cons({ items }: { items: string[] }) { return <ul className="space-y-1.5 mb-3">{items.map(i => <li key={i} className="flex items-start gap-2 text-sm text-red-400"><span className="mt-0.5">✗</span><span className="text-zinc-300">{i}</span></li>)}</ul>; }

export default function TownOfSalemAlternativePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link><span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link><span>/</span>
          <span className="text-zinc-400">Town of Salem Alternatives</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Social Deduction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Town of Salem was the go-to browser social deduction game for years. But with its move to
            paid-only on Steam, many players are looking for free alternatives. Here are the best options
            for playing social deduction games online in 2026.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500"><span>March 6, 2026</span><span>·</span><span>8 min read</span></div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-town-of-salem-alternative.png"
            alt={TITLE}
            fill
            className="object-cover"
            priority
          />
        </div>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[{ id: "what-happened", label: "What Happened to Town of Salem?" }, { id: "textgame", label: "1. TextGame.ai" }, { id: "wolvesville", label: "2. Wolvesville" }, { id: "among-us", label: "3. Among Us" }, { id: "epicmafia", label: "4. EpicMafia" }, { id: "blood-on-clocktower", label: "5. Blood on the Clocktower" }, { id: "comparison", label: "Comparison Table" }, { id: "faq", label: "FAQ" }].map((item, i) => (
              <li key={item.id}><a href={`#${item.id}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">{i + 1}. {item.label}</a></li>
            ))}
          </ol>
        </nav>

        <H2 id="what-happened">What Happened to Town of Salem?</H2>
        <P>
          Town of Salem was one of the first popular browser-based social deduction games. Players were
          assigned roles in a Salem village and had to identify and eliminate the evil faction through
          discussion, voting, and night actions. In 2024, the developers removed the free browser version
          and moved exclusively to a paid Steam release (Town of Salem 2).
        </P>
        <P>
          For players who loved the free browser experience — or who want better AI features, modern
          interfaces, and more game variety — here are the top alternatives.
        </P>

        <H2 id="textgame">1. TextGame.ai — Best Overall Alternative</H2>
        <P>
          <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> offers
          the closest experience to Town of Salem&apos;s social deduction gameplay, but with a modern AI
          Game Master that runs everything. Play{" "}
          <Link href="/games/werewolf" className="text-violet-400 hover:underline">Werewolf</Link>,{" "}
          <Link href="/games/mafia" className="text-violet-400 hover:underline">Mafia</Link>,{" "}
          <Link href="/games/secret-hitler" className="text-violet-400 hover:underline">Secret Hitler</Link>,{" "}
          <Link href="/games/avalon" className="text-violet-400 hover:underline">Avalon</Link>, and more — all free in the browser.
        </P>
        <Pros items={["Free browser-based play — like old Town of Salem", "AI Game Master handles all game logic", "AI fills empty seats — no waiting for players", "20+ social deduction and party games", "Play with friends via invite link", "Custom game creation"]} />
        <Cons items={["Text-based (no visual avatars)", "Smaller community than Town of Salem at its peak"]} />

        <H2 id="wolvesville">2. Wolvesville</H2>
        <P>
          The most popular mobile Werewolf app with 50+ roles and competitive ranked play. Closest to
          Town of Salem&apos;s role variety but limited to mobile.
        </P>
        <Pros items={["50+ unique roles", "Large active player base", "Ranked competitive mode"]} />
        <Cons items={["Mobile only — no browser version", "Random matchmaking, hard to play with friends", "Roles locked behind progression/payment"]} />

        <H2 id="among-us">3. Among Us</H2>
        <P>
          The viral social deduction game set on a spaceship. Simpler roles than Town of Salem but with
          visual gameplay and tasks.
        </P>
        <Pros items={["Huge player base", "Cross-platform", "Visual gameplay with tasks"]} />
        <Cons items={["Fewer roles and less depth than Town of Salem", "Requires download", "Public lobbies can be chaotic"]} />

        <H2 id="epicmafia">4. EpicMafia</H2>
        <P>
          A long-running browser-based Mafia game with hundreds of role setups. Community-driven with
          custom game creation. The closest in format to old Town of Salem.
        </P>
        <Pros items={["Browser-based and free", "Massive role variety", "Active community"]} />
        <Cons items={["Dated interface", "Steep learning curve for new players", "Smaller player base than peak years"]} />

        <H2 id="blood-on-clocktower">5. Blood on the Clocktower</H2>
        <P>
          A premium social deduction game with deep mechanics and a storyteller role. Available online
          through community tools and the official app.
        </P>
        <Pros items={["Deep, strategic gameplay", "Eliminated players stay involved", "Strong community"]} />
        <Cons items={["Paid game", "Requires a dedicated Storyteller (human host)", "Long games (60–90 minutes)"]} />

        <H2 id="comparison">Comparison Table</H2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-zinc-700 text-left">
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Platform</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Browser</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">Free</th>
              <th className="py-3 pr-4 text-zinc-400 font-semibold">AI Host</th>
              <th className="py-3 text-zinc-400 font-semibold">Games</th>
            </tr></thead>
            <tbody className="text-zinc-300">
              {[
                [SITE_NAME, "✓", "✓", "✓", "20+"], ["Wolvesville", "✗", "✓", "✗", "1"], ["Among Us", "✗", "Free/Paid", "✗", "1"],
                ["EpicMafia", "✓", "✓", "✗", "1"], ["Blood on Clocktower", "✗", "Paid", "✗", "1"],
              ].map(([n, b, f, ai, g]) => (
                <tr key={n} className="border-b border-zinc-800/60">
                  <td className={`py-3 pr-4 font-semibold ${n === SITE_NAME ? "text-violet-400" : "text-white"}`}>{n}</td>
                  <td className="py-3 pr-4">{b}</td><td className="py-3 pr-4">{f}</td><td className="py-3 pr-4">{ai}</td><td className="py-3">{g}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div><H3>Is Town of Salem still free?</H3><P>No. The original free browser version was shut down. Town of Salem 2 is available on Steam for a one-time purchase.</P></div>
          <div><H3>What is the closest free alternative to Town of Salem?</H3><P>{SITE_NAME} offers the most similar experience — browser-based social deduction with roles, night/day phases, and discussion-based gameplay. Unlike Town of Salem, it includes an AI Game Master and 20+ games.</P></div>
          <div><H3>Can I play social deduction games without downloading anything?</H3><P>Yes. Both {SITE_NAME} and EpicMafia work entirely in the browser with no downloads needed.</P></div>
        </div>

        <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Play Social Deduction Games Free</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">Werewolf, Mafia, Secret Hitler, Avalon — all with an AI Game Master. No download, no purchase.</p>
          <Link href="/discover" className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Browse All Games</Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
