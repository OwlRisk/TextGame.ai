import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "TextGame.ai vs Janitor AI — Which AI Roleplay Platform is Better?";
const DESCRIPTION =
  "A detailed comparison of TextGame.ai and Janitor AI. We cover features, multiplayer, game rules, voice, pricing, and which platform is best for different use cases.";
const CANONICAL = "/blog/textgame-vs-janitor-ai";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "janitor ai alternative",
    "textgame vs janitor ai",
    "janitor ai comparison",
    "ai roleplay platform",
    "best ai roleplay",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/hero.webp"],
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

export default function TextgameVsJanitorAiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">TextGame.ai vs Janitor AI</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-full">Comparison</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-full">AI Roleplay</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Both {SITE_NAME} and Janitor AI use large language models to power interactive experiences — but they&apos;re
            built for very different purposes. One is a structured multiplayer game platform; the other is an
            unrestricted character chat service. Here&apos;s how they compare.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        {/* TOC */}
        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is-janitor", label: "What is Janitor AI?" },
              { id: "what-is-textgame", label: "What is TextGame.ai?" },
              { id: "feature-comparison", label: "Feature-by-Feature Comparison" },
              { id: "use-cases", label: "Which Platform for Which Use Case?" },
              { id: "pricing", label: "Pricing Comparison" },
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

        {/* ── What is Janitor AI ─────────────────────────────────────── */}
        <H2 id="what-is-janitor">What is Janitor AI?</H2>
        <P>
          Janitor AI is a <strong className="text-white">character chat platform</strong> that lets you talk
          one-on-one with AI personas. Its main appeal is that it has almost no content restrictions — users
          can create and interact with characters without the filters found on Character.AI or similar services.
        </P>
        <P>
          You browse a library of community-created characters, pick one, and start chatting. The platform
          supports bringing your own API key (OpenAI, Claude, etc.) so you can choose which model powers
          the conversation. It&apos;s free-form roleplay with no rules, turns, or structure imposed.
        </P>

        {/* ── What is TextGame.ai ────────────────────────────────────── */}
        <H2 id="what-is-textgame">What is TextGame.ai?</H2>
        <P>
          <Link href="/" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link> is a{" "}
          <strong className="text-white">multiplayer game platform powered by AI</strong>. Instead of open-ended
          chat, it provides structured game sessions — with an AI Game Master that assigns roles, enforces rules,
          manages phases, and narrates the story.
        </P>
        <P>
          You can play social deduction games like{" "}
          <Link href="/blog/play-werewolf-online" className="text-violet-400 hover:underline">Werewolf</Link>,{" "}
          <Link href="/blog/play-mafia-online" className="text-violet-400 hover:underline">Mafia</Link>, and{" "}
          <Link href="/blog/play-secret-hitler-online" className="text-violet-400 hover:underline">Secret Hitler</Link>,
          or create any custom game by describing your rules in plain English. AI characters fill empty seats with
          unique personalities, voices, and strategies — and you can invite friends to join via a link.
        </P>

        {/* ── Feature Comparison ─────────────────────────────────────── */}
        <H2 id="feature-comparison">Feature-by-Feature Comparison</H2>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="py-3 pr-4 text-zinc-400 font-semibold">Feature</th>
                <th className="py-3 pr-4 text-zinc-400 font-semibold">{SITE_NAME}</th>
                <th className="py-3 text-zinc-400 font-semibold">Janitor AI</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Multiplayer</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Real-time with friends</td>
                <td className="py-3 text-red-400">✗ Solo only</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Game Rules Engine</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Roles, phases, win conditions</td>
                <td className="py-3 text-red-400">✗ Free-form chat</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">AI Game Master</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Dedicated host per session</td>
                <td className="py-3 text-red-400">✗ No host</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Multi-Character</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Multiple AI + human players</td>
                <td className="py-3 text-red-400">✗ One character at a time</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Voice / TTS</td>
                <td className="py-3 pr-4 text-emerald-400">✓ Per-character voices</td>
                <td className="py-3 text-red-400">✗ Text only</td>
              </tr>
              <tr className="border-b border-zinc-800/60">
                <td className="py-3 pr-4 font-semibold text-white">Content Freedom</td>
                <td className="py-3 pr-4 text-zinc-300">Moderate (game-focused)</td>
                <td className="py-3 text-emerald-400">✓ Unrestricted</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-white">Custom Characters</td>
                <td className="py-3 pr-4 text-zinc-300">AI-generated for each game</td>
                <td className="py-3 text-emerald-400">✓ Full character editor</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          The core difference is clear: <strong className="text-white">Janitor AI is built for open-ended character
          chat</strong>, while <strong className="text-white">{SITE_NAME} is built for structured games</strong>.
          Janitor AI gives you maximum freedom in one-on-one conversations. {SITE_NAME} gives you a full game
          room with rules, multiple players, and a host managing everything.
        </P>

        {/* ── Use Cases ──────────────────────────────────────────────── */}
        <H2 id="use-cases">Which Platform for Which Use Case?</H2>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎲</span>
            <p className="text-zinc-300">
              <strong className="text-white">&ldquo;I want to play social deduction games with AI&rdquo;</strong>
              {" "}→{" "}
              <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>.
              Werewolf, Mafia, Secret Hitler — all with enforced rules and an AI host.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">👥</span>
            <p className="text-zinc-300">
              <strong className="text-white">&ldquo;I want to play with friends + AI together&rdquo;</strong>
              {" "}→{" "}
              <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>.
              Share a link and friends join instantly alongside AI players.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <p className="text-zinc-300">
              <strong className="text-white">&ldquo;I want free-form one-on-one roleplay without filters&rdquo;</strong>
              {" "}→ Janitor AI. Maximum creative freedom with any character.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🛠️</span>
            <p className="text-zinc-300">
              <strong className="text-white">&ldquo;I want to build and share detailed character personas&rdquo;</strong>
              {" "}→ Janitor AI. Its character editor is purpose-built for persona creation.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎭</span>
            <p className="text-zinc-300">
              <strong className="text-white">&ldquo;I want AI characters with voices and personalities in a game&rdquo;</strong>
              {" "}→{" "}
              <Link href="/discover" className="text-violet-400 hover:underline font-semibold">{SITE_NAME}</Link>.
              Each character has a unique voice, strategy, and personality.
            </p>
          </div>
        </div>

        {/* ── Pricing ────────────────────────────────────────────────── */}
        <H2 id="pricing">Pricing Comparison</H2>
        <P>
          <strong className="text-white">Janitor AI</strong> is free to use — but you need to supply your own
          LLM API key (e.g. OpenAI or Claude). That means you pay per-token costs directly to the model provider.
          If you don&apos;t already have an API key, setup can be confusing.
        </P>
        <P>
          <strong className="text-white">{SITE_NAME}</strong> offers a free tier with starting credits. You don&apos;t
          need to bring your own API key — the platform handles model access. Additional credits can be purchased,
          and subscription plans unlock more usage. Guests joining your game don&apos;t need an account at all.
        </P>
        <P>
          In short: Janitor AI has a lower floor if you already have an API key. {SITE_NAME} is simpler to get
          started with and handles everything out of the box.
        </P>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Can Janitor AI run multiplayer games?</H3>
            <P>
              No. Janitor AI is designed for one-on-one character chat. There&apos;s no way to invite friends,
              have multiple characters interact in the same session, or enforce game rules. For multiplayer
              AI games, use{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">{SITE_NAME}</Link>.
            </P>
          </div>
          <div>
            <H3>Is TextGame.ai a Janitor AI alternative?</H3>
            <P>
              They serve different purposes. If you want structured games with AI — social deduction, RPGs,
              murder mysteries — {SITE_NAME} is the better choice. If you want unrestricted one-on-one character
              roleplay, Janitor AI fills that niche.
            </P>
          </div>
          <div>
            <H3>Do I need an API key for TextGame.ai?</H3>
            <P>
              No. {SITE_NAME} handles all the AI infrastructure. You sign up, pick a game, and start playing.
              Janitor AI requires you to bring your own API key from OpenAI, Claude, or another provider.
            </P>
          </div>
          <div>
            <H3>Which platform has better AI characters?</H3>
            <P>
              It depends on your definition. Janitor AI has a massive library of community-created personas
              for open-ended chat. {SITE_NAME} generates game-specific characters with distinct personalities,
              strategies, and voices — they&apos;re designed to play games, not just chat.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Play AI Games?</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Skip the API key setup. Pick a game, invite friends, and let the AI Game Master handle the rest.
            Free to start.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Games
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
