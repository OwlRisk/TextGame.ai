import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";

const TITLE = "AI Tarot Reading — Get a Free Online Tarot Card Reading";
const DESCRIPTION =
  "Get a free AI tarot card reading online. Learn how AI interprets tarot cards, explore major arcana meanings, reading types, and try an interactive AI tarot experience.";
const CANONICAL = "/blog/ai-tarot-reading";
const PUBLISHED = "2026-03-04T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ai tarot reading",
    "free tarot reading online",
    "tarot card reading ai",
    "ai tarot",
    "online tarot reading",
    "tarot card meanings",
    "free tarot",
    "ai fortune telling",
    "tarot spread online",
    "major arcana",
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

export default function AiTarotReadingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">{SITE_NAME}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-zinc-400">AI Tarot Reading</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">Tarot</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{TITLE}</h1>
          <P>
            Tarot readings have fascinated people for centuries. Now, AI can draw cards, interpret their
            meanings, and deliver personalized readings in seconds. Here&apos;s how AI tarot works, what
            the cards mean, and how to get a free reading on {SITE_NAME}.
          </P>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>March 4, 2026</span><span>·</span><span>6 min read</span>
          </div>
        </header>

        <nav className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Table of Contents</p>
          <ol className="space-y-1.5">
            {[
              { id: "what-is-tarot", label: "What is Tarot?" },
              { id: "how-ai-reads", label: "How AI Interprets Tarot Cards" },
              { id: "major-arcana", label: "Major Arcana — Key Cards Explained" },
              { id: "reading-types", label: "Types of Tarot Readings" },
              { id: "try-it", label: "Try AI Tarot on textgame.ai" },
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

        {/* ── What is Tarot ────────────────────────────────────────── */}
        <H2 id="what-is-tarot">What is Tarot?</H2>
        <P>
          Tarot is a deck of <strong className="text-white">78 cards</strong> divided into two groups: the
          <strong className="text-white"> Major Arcana</strong> (22 cards representing life&apos;s big themes) and
          the <strong className="text-white">Minor Arcana</strong> (56 cards covering day-to-day experiences).
          In a reading, cards are drawn and arranged in a spread — their positions and combinations create
          a narrative.
        </P>
        <P>
          Tarot isn&apos;t about predicting the future with certainty. It&apos;s a tool for
          <strong className="text-white"> reflection and perspective</strong> — each card acts as a mirror
          that prompts you to think about your situation from a new angle.
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
            <div><p className="text-2xl mb-1">🃏</p><p className="font-semibold text-white">78 cards</p></div>
            <div><p className="text-2xl mb-1">✨</p><p className="font-semibold text-white">22 Major Arcana</p></div>
            <div><p className="text-2xl mb-1">🔮</p><p className="font-semibold text-white">Reflection tool</p></div>
            <div><p className="text-2xl mb-1">🤖</p><p className="font-semibold text-white">AI-powered</p></div>
          </div>
        </div>

        {/* ── How AI Reads ─────────────────────────────────────────── */}
        <H2 id="how-ai-reads">How AI Interprets Tarot Cards</H2>
        <P>
          An AI tarot reader works by combining <strong className="text-white">randomized card selection</strong> with
          <strong className="text-white"> deep knowledge of tarot symbolism</strong>. Here&apos;s the process:
        </P>
        <ol className="space-y-4 mb-8">
          {[
            { step: "You ask a question", desc: "Focus your reading by asking about a specific area — love, career, personal growth, or a general check-in." },
            { step: "Cards are drawn randomly", desc: "The AI randomly selects cards and determines their orientation (upright or reversed), just like shuffling a physical deck." },
            { step: "AI interprets the spread", desc: "Using its training on tarot traditions, symbolism, and thousands of reading examples, the AI weaves the cards into a cohesive narrative." },
            { step: "You receive your reading", desc: "The AI delivers a personalized interpretation that connects each card's meaning to your question and life context." },
          ].map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{s.step}</p>
                <p className="text-sm text-zinc-400">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <P>
          The advantage of AI is <strong className="text-white">consistency and accessibility</strong> — you
          get a thoughtful reading anytime, without booking an appointment or spending money on
          a session.
        </P>

        {/* ── Major Arcana ─────────────────────────────────────────── */}
        <H2 id="major-arcana">Major Arcana — Key Cards Explained</H2>
        <P>
          The Major Arcana represent life&apos;s big turning points and universal themes. Here are some of
          the most recognized cards:
        </P>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {[
            { emoji: "🃏", name: "The Fool (0)", meaning: "New beginnings, innocence, spontaneity. A leap of faith into the unknown." },
            { emoji: "🧙", name: "The Magician (I)", meaning: "Manifestation, resourcefulness, power. You have everything you need." },
            { emoji: "👑", name: "The Empress (III)", meaning: "Abundance, nurturing, creativity. A time of growth and fertility." },
            { emoji: "🏛️", name: "The Emperor (IV)", meaning: "Authority, structure, stability. Take control and build something lasting." },
            { emoji: "☸️", name: "Wheel of Fortune (X)", meaning: "Change, cycles, fate. Life is turning — embrace the shift." },
            { emoji: "⚖️", name: "Justice (XI)", meaning: "Truth, fairness, accountability. Decisions have consequences." },
            { emoji: "💀", name: "Death (XIII)", meaning: "Transformation, endings, transition. Not literal death — something old must end for the new to begin." },
            { emoji: "🌟", name: "The Star (XVII)", meaning: "Hope, inspiration, serenity. Healing after hardship. Trust the process." },
          ].map((card) => (
            <div key={card.name} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{card.emoji}</span>
                <p className="font-bold text-white">{card.name}</p>
              </div>
              <p className="text-sm text-zinc-400">{card.meaning}</p>
            </div>
          ))}
        </div>

        {/* ── Reading Types ────────────────────────────────────────── */}
        <H2 id="reading-types">Types of Tarot Readings</H2>
        <H3>Past–Present–Future (3-Card Spread)</H3>
        <P>
          The simplest and most popular spread. Three cards represent where you&apos;ve been, where you
          are now, and where you&apos;re headed. Perfect for quick daily check-ins.
        </P>
        <H3>Celtic Cross (10-Card Spread)</H3>
        <P>
          The most comprehensive traditional spread. Ten cards cover your current situation, challenges,
          subconscious influences, recent past, possible future, and the likely outcome. Best for deep,
          specific questions.
        </P>
        <H3>Yes/No (1-Card Draw)</H3>
        <P>
          Draw a single card for a quick answer. Upright generally leans &quot;yes,&quot; reversed leans
          &quot;no&quot; — but the card&apos;s specific meaning adds nuance.
        </P>
        <H3>Relationship Spread (5-Card)</H3>
        <P>
          Explores the dynamics between two people — your feelings, their feelings, the relationship&apos;s
          foundation, challenges, and potential. Popular for love and friendship questions.
        </P>

        {/* ── Try It ───────────────────────────────────────────────── */}
        <H2 id="try-it">Try AI Tarot on {SITE_NAME}</H2>
        <P>
          On {SITE_NAME}, the <Link href="/games/tarot" className="text-violet-400 hover:underline font-semibold">AI Tarot template</Link> gives
          you a fully interactive reading experience:
        </P>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎴</span>
            <p className="text-zinc-300"><strong className="text-white">Choose your spread</strong> — 1-card, 3-card, Celtic Cross, or let the AI suggest one based on your question.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <p className="text-zinc-300"><strong className="text-white">Ask any question</strong> — love, career, personal growth, or just &quot;what do I need to know today?&quot;</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔮</span>
            <p className="text-zinc-300"><strong className="text-white">Get a detailed reading</strong> — the AI interprets each card in context, connecting themes to your question.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔄</span>
            <p className="text-zinc-300"><strong className="text-white">Follow up</strong> — ask clarifying questions, request deeper interpretation, or draw additional cards.</p>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm">
          <p className="text-amber-300">
            <strong>Disclaimer:</strong> AI tarot readings are for <strong>entertainment and self-reflection</strong> only.
            They are not a substitute for professional advice — medical, financial, legal, or psychological. Think of it
            as a creative tool for introspection, not a prediction of the future.
          </p>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <H2 id="faq">Frequently Asked Questions</H2>
        <div className="space-y-6 mb-12">
          <div>
            <H3>Is AI tarot reading accurate?</H3>
            <P>
              AI tarot provides thoughtful, contextual interpretations based on traditional tarot
              symbolism. &quot;Accuracy&quot; depends on your perspective — many people find the readings
              surprisingly relevant because tarot themes are universal. It&apos;s best approached as
              a reflection tool, not a fortune-telling service.
            </P>
          </div>
          <div>
            <H3>Is it free?</H3>
            <P>
              Yes — the AI tarot reading on {SITE_NAME} is free to try. No sign-up required to
              get your first reading.
            </P>
          </div>
          <div>
            <H3>Can AI replace a real tarot reader?</H3>
            <P>
              AI can replicate the knowledge and structure of a tarot reading, but it lacks the
              human intuition and personal connection of a skilled reader. Think of it as a
              complementary tool — great for quick daily readings and exploration.
            </P>
          </div>
          <div>
            <H3>What should I ask in a tarot reading?</H3>
            <P>
              Open-ended questions work best. Instead of &quot;Will I get the job?&quot; try &quot;What
              should I focus on in my career right now?&quot; The more reflective the question, the
              more meaningful the reading.
            </P>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-purple-600/20 to-amber-600/20 border border-purple-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">🔮 Get Your Free AI Tarot Reading</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Ask a question, draw your cards, and receive a personalized interpretation — powered by AI.
          </p>
          <Link
            href="/games/tarot"
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Start Tarot Reading
          </Link>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link href="/blog" className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">← Back to Blog</Link>
        </div>
      </article>
    </>
  );
}
