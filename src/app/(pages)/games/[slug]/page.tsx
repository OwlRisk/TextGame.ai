import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Clock, BarChart2, Star, ChevronRight, BookOpen } from "lucide-react";
import { getGameSEOData, ALL_GAME_SLUGS, GAME_SEO_DATA } from "@/lib/game-seo-data";
import { SITE_DOMAIN } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_GAME_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameSEOData(slug);
  if (!game) return {};
  const title = `Play ${game.name} Online Free with AI`;
  return {
    title,
    description: game.metaDescription,
    keywords: game.keywords,
    alternates: { canonical: `/games/${slug}` },
    openGraph: {
      title: `${title} · TextGame.ai`,
      description: game.metaDescription,
      type: "website",
      url: `${SITE_DOMAIN}/games/${slug}`,
      ...(game.coverImage
        ? { images: [{ url: game.coverImage, width: 1200, height: 630, alt: game.name }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · TextGame.ai`,
      description: game.metaDescription,
      ...(game.coverImage ? { images: [game.coverImage] } : {}),
    },
  };
}

const STYLE_COLOR: Record<string, string> = {
  Casual:      "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Strategic:   "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  Competitive: "bg-red-500/15 text-red-300 border border-red-500/30",
};

const GAME_BLOG_MAP: Record<string, { title: string; href: string }[]> = {
  werewolf: [
    { title: "How to Play Werewolf Online with AI", href: "/blog/play-werewolf-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  mafia: [
    { title: "How to Play Mafia Online with AI", href: "/blog/play-mafia-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  undercover: [
    { title: "How to Play Undercover / Who's the Spy Online", href: "/blog/play-undercover-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  avalon: [
    { title: "How to Play Avalon Online with AI", href: "/blog/play-avalon-online" },
    { title: "Resistance vs Avalon – Which Should You Play?", href: "/blog/resistance-vs-avalon" },
  ],
  "detective-mystery": [
    { title: "Best AI Murder Mystery Games", href: "/blog/ai-murder-mystery-games" },
  ],
  "escape-room": [
    { title: "How to Play Escape Room Online", href: "/blog/play-escape-room-online" },
  ],
  trivia: [
    { title: "Best AI Trivia Games to Play", href: "/blog/ai-trivia-games" },
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
  ],
  tarot: [
    { title: "AI Tarot Reading – How It Works", href: "/blog/ai-tarot-reading" },
  ],
  codenames: [
    { title: "How to Play Codenames Online with AI", href: "/blog/play-codenames-online" },
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
  ],
  spyfall: [
    { title: "How to Play Spyfall Online with AI", href: "/blog/play-spyfall-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  resistance: [
    { title: "Resistance vs Avalon – Which Should You Play?", href: "/blog/resistance-vs-avalon" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  clue: [
    { title: "How to Play Clue Online with AI", href: "/blog/play-clue-online" },
  ],
  "secret-hitler": [
    { title: "How to Play Secret Hitler Online with AI", href: "/blog/play-secret-hitler-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  "kingdom-intrigue": [
    { title: "Play Kingdom Intrigue Online — Medieval Court Deduction", href: "/blog/play-kingdom-intrigue-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  "vampire-court": [
    { title: "Play Vampire Court Online — Gothic Social Deduction", href: "/blog/play-vampire-court-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
  "space-mutiny": [
    { title: "Play Space Mutiny Online — Sci-Fi Traitor Game", href: "/blog/play-space-mutiny-online" },
    { title: "Among Us Alternatives – Best Games Like Among Us", href: "/blog/among-us-alternatives" },
  ],
  storyteller: [
    { title: "AI Storytelling Games – A Complete Guide", href: "/blog/ai-storytelling-games" },
  ],
  "improv-comedy": [
    { title: "AI Improv Comedy Game Online — Play Free", href: "/blog/play-improv-comedy-online" },
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
    { title: "How to Host Game Night Online", href: "/blog/host-game-night-online" },
  ],
  debate: [
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
  ],
  "who-most-likely": [
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
    { title: "Free Online Games to Play with Friends", href: "/blog/free-online-games-with-friends" },
  ],
  "20-questions": [
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
  ],
  "two-truths-lie": [
    { title: "Best Online Party Games with Friends", href: "/blog/best-online-party-games" },
    { title: "Virtual Team Building Games", href: "/blog/virtual-team-building-games" },
  ],
  "two-rooms": [
    { title: "Play Two Rooms and a Boom Online — Rules & Strategy", href: "/blog/play-two-rooms-online" },
    { title: "Best Social Deduction Games to Play Online", href: "/blog/best-social-deduction-games" },
  ],
};

export default async function GameLandingPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameSEOData(slug);
  if (!game) notFound();

  const relatedGames = GAME_SEO_DATA.filter((g) => game.related.includes(g.slug));
  const blogLinks = GAME_BLOG_MAP[slug] ?? [];

  // JSON-LD: Game
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: game.name,
    description: game.description,
    url: `${SITE_DOMAIN}/games/${slug}`,
    numberOfPlayers: { "@type": "QuantitativeValue", description: game.players },
    ...(game.coverImage ? { image: `${SITE_DOMAIN}${game.coverImage}` } : {}),
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_DOMAIN },
      { "@type": "ListItem", position: 2, name: "Games", item: `${SITE_DOMAIN}/games` },
      { "@type": "ListItem", position: 3, name: game.name, item: `${SITE_DOMAIN}/games/${slug}` },
    ],
  };

  // JSON-LD: FAQPage
  const faqJsonLd = game.faq && game.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: game.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  // JSON-LD: HowTo
  const howToJsonLd = game.howToPlay.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to Play ${game.name} Online`,
        description: `Step-by-step guide to playing ${game.name} with an AI game master on TextGame.ai.`,
        step: game.howToPlay.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text,
        })),
      }
    : null;

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

      {/* Nav */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/games"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Games
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-300">{game.name}</span>
          <div className="ml-auto">
            <Link
              href={`/create?preset=${game.presetId}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              Play Now
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-14">

        {/* Hero */}
        <section className="space-y-5">
          {game.coverImage && (
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden">
              <Image
                src={game.coverImage}
                alt={game.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            </div>
          )}

          <div className="flex items-start gap-4">
            <span className="text-5xl leading-none" role="img" aria-label={game.name}>
              {game.icon}
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {game.category}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STYLE_COLOR[game.style]}`}>
                  {game.style}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Play {game.name} Online with AI
              </h1>
              <p className="text-lg text-zinc-400">{game.tagline}</p>
            </div>
          </div>

          <p className="text-zinc-300 text-base leading-relaxed max-w-3xl">
            {game.description}
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-violet-400" />
              {game.players} players
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-violet-400" />
              {game.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-violet-400" />
              {game.style}
            </span>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/create?preset=${game.presetId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-colors shadow-lg shadow-violet-900/30"
            >
              <span>Play {game.name} Free</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-base transition-colors"
            >
              Browse All Games
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Features</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {game.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Star className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* How to Play */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">How to Play {game.name}</h2>
          <ol className="space-y-3">
            {game.howToPlay.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-zinc-300 text-sm leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Roles */}
        {game.roles && game.roles.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Roles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {game.roles.map((role) => (
                <div
                  key={role.name}
                  className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 p-4 space-y-1"
                >
                  <h3 className="text-sm font-semibold text-white">{role.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{role.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {game.faq && game.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {game.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-5 py-4 cursor-pointer"
                >
                  <summary className="text-sm font-medium text-zinc-200 list-none flex items-center justify-between gap-3 select-none">
                    {item.question}
                    <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Blog Cross-links */}
        {blogLinks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Related Articles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {blogLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-start gap-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-700/50 p-4 transition-all"
                >
                  <BookOpen className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-violet-300 transition-colors">
                    {link.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Games */}
        {relatedGames.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Similar Games</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {relatedGames.map((related) => (
                <Link
                  key={related.slug}
                  href={`/games/${related.slug}`}
                  className="group rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 p-4 transition-all space-y-1"
                >
                  <span className="text-2xl">{related.icon}</span>
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                    {related.name}
                  </p>
                  <p className="text-xs text-zinc-500">{related.players} players · {related.duration}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-800/30 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Ready to play {game.name}?
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            The AI game master sets everything up in seconds. No moderator, no prep — just play.
          </p>
          <Link
            href={`/create?preset=${game.presetId}`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-colors shadow-lg shadow-violet-900/40"
          >
            Start a Game Free
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-4 items-center justify-between text-xs text-zinc-600">
          <span>© 2026 TextGame.ai</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/discover" className="hover:text-zinc-400 transition-colors">All Games</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
