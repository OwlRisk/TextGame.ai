import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import Image from "next/image";

const TITLE = "AI NPCs Explained: How AI Characters Make Games Better";
const DESCRIPTION =
  "What are AI NPCs? Learn how AI-powered characters differ from scripted NPCs, the technology behind them, and how they create richer gaming experiences.";
const CANONICAL = "/blog/ai-npc-explained";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai npc",
    "ai characters in games",
    "ai game characters",
    "npc ai",
    "ai powered npc",
    "artificial intelligence in games",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
    images: [{ url: "/blog/blog-ai-npc-explained.png", width: 1792, height: 1024, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/blog/blog-ai-npc-explained.png"],
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

export default function AINpcExplainedPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI NPCs Explained</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Guide</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">AI Characters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            For decades, NPCs (non-player characters) have followed scripts — repeating the same lines no
            matter what you do. AI is changing that. Modern AI NPCs can hold conversations, remember context,
            adapt their behavior, and feel genuinely alive. Here&apos;s how the technology works and why it
            matters.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>7 min read</span>
          </div>
        </header>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
          <Image
            src="/blog/blog-ai-npc-explained.png"
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
              { id: "what-are", label: "What Are AI NPCs?" },
              { id: "scripted-vs-ai", label: "Scripted NPCs vs AI NPCs" },
              { id: "technology", label: "The Technology Behind AI NPCs" },
              { id: "examples", label: "AI NPCs in Modern Games" },
              { id: "textgame", label: `How ${SITE_NAME} Uses AI Characters` },
              { id: "future", label: "The Future of AI in Gaming" },
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

        {/* ── What Are AI NPCs ─────────────────────────────────────── */}
        <H2 id="what-are">What Are AI NPCs?</H2>
        <P>
          An AI NPC is a <strong className="text-white">non-player character powered by artificial
          intelligence</strong> — typically a large language model (LLM) — rather than pre-written
          dialogue trees. Instead of selecting from a fixed set of responses, AI NPCs generate their
          words and actions dynamically based on the conversation, their personality, and the game state.
        </P>
        <P>
          Think of the difference between a phone tree (&quot;Press 1 for sales, press 2 for support&quot;)
          and an actual conversation with a person. Scripted NPCs are the phone tree. AI NPCs are the
          conversation.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">💬</p><p className="font-semibold text-white">Natural dialogue</p></div>
            <div><p className="text-2xl mb-1">🧠</p><p className="font-semibold text-white">Context memory</p></div>
            <div><p className="text-2xl mb-1">🎭</p><p className="font-semibold text-white">Unique personality</p></div>
            <div><p className="text-2xl mb-1">🔄</p><p className="font-semibold text-white">Adaptive behavior</p></div>
          </div>
        </div>

        {/* ── Scripted vs AI ───────────────────────────────────────── */}
        <H2 id="scripted-vs-ai">Scripted NPCs vs AI NPCs</H2>
        <P>
          The gap between scripted and AI-powered NPCs is enormous. Here&apos;s how they compare:
        </P>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-zinc-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-zinc-900/80 text-left">
                <th className="px-4 py-3 text-zinc-400 font-semibold">Aspect</th>
                <th className="px-4 py-3 text-zinc-400 font-semibold">Scripted NPC</th>
                <th className="px-4 py-3 text-violet-400 font-semibold">AI NPC</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Dialogue</td><td className="px-4 py-3">Fixed lines, branching trees</td><td className="px-4 py-3 text-white">Generated dynamically per interaction</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Memory</td><td className="px-4 py-3">None or flag-based</td><td className="px-4 py-3 text-white">Remembers conversation history</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Personality</td><td className="px-4 py-3">Surface-level, static</td><td className="px-4 py-3 text-white">Deep, consistent, emergent</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Replayability</td><td className="px-4 py-3">Same every time</td><td className="px-4 py-3 text-white">Different every playthrough</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Player agency</td><td className="px-4 py-3">Choose from options</td><td className="px-4 py-3 text-white">Say anything, get a real response</td></tr>
              <tr className="border-t border-zinc-800"><td className="px-4 py-3">Development cost</td><td className="px-4 py-3">High (write every branch)</td><td className="px-4 py-3 text-white">Lower (define personality, AI handles rest)</td></tr>
            </tbody>
          </table>
        </div>
        <P>
          Scripted NPCs break immersion the moment you see the same line twice. AI NPCs maintain the
          illusion because every interaction is unique — even if you replay the same scenario.
        </P>

        {/* ── Technology ───────────────────────────────────────────── */}
        <H2 id="technology">The Technology Behind AI NPCs</H2>
        <P>
          AI NPCs rely on several layers of technology working together:
        </P>
        <H3>Large Language Models (LLMs)</H3>
        <P>
          The core engine. Models like GPT-4, Claude, and Gemini understand natural language and generate
          coherent responses. They&apos;re the reason an AI NPC can understand &quot;Hey, do you know where
          the blacksmith is?&quot; and respond in character rather than with a keyword match.
        </P>
        <H3>Personality Systems</H3>
        <P>
          Raw LLMs are general-purpose. To create a convincing character, developers define a{" "}
          <strong className="text-white">personality prompt</strong> — the character&apos;s background,
          speech patterns, knowledge, motivations, and emotional range. A grumpy dwarf blacksmith and a
          cheerful elven healer both use the same underlying model, but their personality prompts make them
          feel completely different.
        </P>
        <H3>Memory and Context</H3>
        <P>
          AI NPCs track <strong className="text-white">conversation history</strong> and{" "}
          <strong className="text-white">game state</strong>. If you told the tavern keeper your name is
          Marcus three turns ago, they&apos;ll address you as Marcus going forward. If you completed a quest,
          they know about it. This contextual awareness is what makes interactions feel real.
        </P>
        <H3>Voice Synthesis</H3>
        <P>
          Text-to-speech technology gives AI NPCs actual voices. Modern voice synthesis produces natural,
          expressive speech — not the robotic monotone of older systems. Each character can have a distinct
          voice that matches their personality.
        </P>

        {/* ── Examples ─────────────────────────────────────────────── */}
        <H2 id="examples">AI NPCs in Modern Games</H2>
        <P>
          The gaming industry is rapidly adopting AI NPCs. Here are some notable examples:
        </P>
        <div className="space-y-4 mb-6">
          {[
            { name: "Inworld AI + NVIDIA ACE", desc: "NVIDIA partnered with Inworld AI to create AI-driven NPCs for AAA games. Their demos show characters that remember past conversations and react emotionally to player behavior." },
            { name: "AI Dungeon / Text Adventures", desc: "Pioneered the concept of AI-driven storytelling where every NPC interaction is generated by a language model. No two playthroughs are the same." },
            { name: "Modding Communities", desc: "Skyrim and Fallout 4 modders have integrated LLMs into NPCs, replacing static dialogue trees with dynamic AI conversations. The results are impressive even as retrofits." },
            { name: `${SITE_NAME}`, desc: "Every character in a game on TextGame.ai is an AI NPC — with unique personalities, voice, memory, and strategic reasoning. They argue, bluff, form alliances, and make decisions that shape the game." },
          ].map((item) => (
            <div key={item.name} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="font-bold text-white mb-1">{item.name}</p>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── How TextGame.ai Uses AI Characters ───────────────────── */}
        <H2 id="textgame">How {SITE_NAME} Uses AI Characters</H2>
        <P>
          On {SITE_NAME}, AI NPCs aren&apos;t background decoration — they&apos;re{" "}
          <strong className="text-white">active participants</strong> in every game. Here&apos;s what
          makes them different:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎭</span>
            <p className="text-zinc-300"><strong className="text-white">Unique personalities.</strong> Each AI character has a distinct backstory, speech style, and decision-making pattern. A cautious analyst plays Werewolf very differently from an impulsive risk-taker.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🗣️</span>
            <p className="text-zinc-300"><strong className="text-white">Real voices.</strong> AI characters speak with synthesized voices that match their personality. A gruff detective sounds different from a nervous newcomer.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🧠</span>
            <p className="text-zinc-300"><strong className="text-white">Strategic reasoning.</strong> In social deduction games, AI characters analyze voting patterns, form suspicions, and execute strategies. They&apos;re not random — they&apos;re trying to win.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <p className="text-zinc-300"><strong className="text-white">Natural conversation.</strong> AI characters respond to what you say in context. Accuse them and they&apos;ll defend themselves. Ally with them and they&apos;ll back you up — unless they&apos;re the impostor.</p>
          </div>
        </div>
        <P>
          The result is a game that feels like playing with real people, even when you&apos;re the only
          human at the table. Explore the full library of AI-powered games on the{" "}
          <Link href="/discover" className="text-violet-400 hover:underline">discover page</Link>.
        </P>

        {/* ── Future ───────────────────────────────────────────────── */}
        <H2 id="future">The Future of AI in Gaming</H2>
        <P>
          AI NPCs are still in their early stages. Here&apos;s where things are heading:
        </P>
        <ul className="list-disc list-inside space-y-2 text-zinc-300 text-sm mb-6 ml-2">
          <li><strong className="text-white">Persistent memory across sessions.</strong> NPCs that remember you weeks later and reference past adventures.</li>
          <li><strong className="text-white">Emotional modeling.</strong> Characters that build trust or resentment over time based on how you treat them.</li>
          <li><strong className="text-white">Procedural storylines.</strong> AI NPCs that create quests and story arcs dynamically, rather than following a developer&apos;s script.</li>
          <li><strong className="text-white">Multimodal interaction.</strong> NPCs that read your facial expressions, tone of voice, and gestures to respond more naturally.</li>
          <li><strong className="text-white">Cooperative AI.</strong> Groups of AI characters that coordinate, form factions, and create emergent social dynamics without scripting.</li>
        </ul>
        <P>
          The end goal is NPCs that are indistinguishable from human players — characters you form genuine
          attachments to because they respond to you as individuals, not as quest-givers with a predetermined
          dialogue tree.
        </P>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Do AI NPCs use a lot of computing power?</H3>
            <P>
              Running LLMs does require server-side processing, but modern inference infrastructure
              has made it fast and affordable. On {SITE_NAME}, AI character responses typically arrive
              in under a second — fast enough to feel like a live conversation.
            </P>
          </div>
          <div>
            <H3>Can AI NPCs go off-script in a bad way?</H3>
            <P>
              This is a real concern. Good implementations use guardrails — personality constraints,
              content filters, and game-state awareness — to keep AI characters on track. On {SITE_NAME},
              characters are bound to their role and the game rules, so they stay in character and on topic.
            </P>
          </div>
          <div>
            <H3>Are AI NPCs better than scripted NPCs?</H3>
            <P>
              It depends on the game. For tightly crafted story moments, scripted dialogue can be more
              precise. For open-ended interactions, social games, and replayability, AI NPCs are
              significantly better. The ideal future likely combines both approaches.
            </P>
          </div>
          <div>
            <H3>Can I play games with AI characters on {SITE_NAME}?</H3>
            <P>
              Yes — every game on {SITE_NAME} features AI characters with unique personalities and
              voices. Browse the full library on the{" "}
              <Link href="/discover" className="text-violet-400 hover:underline">discover page</Link> and
              start playing for free.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600/20 to-violet-600/20 border border-emerald-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🤖 Experience AI Characters in Action</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Play social deduction, trivia, mystery, and more — every character is an AI NPC with a unique personality and voice.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Explore AI Games
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
