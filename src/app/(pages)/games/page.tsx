import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Users, Clock } from "lucide-react";
import { GAME_SEO_DATA } from "@/lib/game-seo-data";

export const metadata: Metadata = {
  title: "Murder Mystery Case Library",
  description:
    "Browse AI murder mystery cases. Interrogate suspects, collect evidence, and solve the case. 8 unique cases — each with different suspects, motives, and secrets.",
  keywords: [
    "AI murder mystery",
    "detective game",
    "script kill cases",
    "murder mystery online",
    "AI interrogation game",
  ],
  alternates: { canonical: "/games" },
  openGraph: {
    title: "Murder Mystery Cases · TextGame.ai",
    description: "Browse AI murder mystery cases. Interrogate suspects, collect evidence, solve the case.",
    type: "website",
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: "Murder Mystery Cases · TextGame.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Murder Mystery Cases · TextGame.ai",
    description: "Browse AI murder mystery cases. Interrogate suspects, collect evidence, solve the case.",
    images: ["/hero.webp"],
  },
};

const CATEGORY_ORDER = [
  "Social Deduction",
  "Party",
  "Mystery",
  "Puzzle",
  "Knowledge",
  "Solo / Reflective",
];

export default function GamesPage() {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    games: GAME_SEO_DATA.filter((g) => g.category === cat),
  })).filter((c) => c.games.length > 0);

  // Games that don't match the ordered categories
  const uncategorized = GAME_SEO_DATA.filter(
    (g) => !CATEGORY_ORDER.includes(g.category)
  );

  return (
    <div className="h-full overflow-auto scrollbar-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200">
      {/* Nav */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-white">
            TextGame.ai
          </Link>
          <Link
            href="/discover"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Browse all →
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {/* Hero */}
        <section className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Murder Mystery Cases
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Each case features unique AI suspects with real personalities. Interrogate them,
            collect evidence, and solve the mystery.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            Browse All Cases
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Games by category */}
        {byCategory.map(({ category, games }) => (
          <section key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
              {category}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="group rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-700/50 overflow-hidden transition-all"
                >
                  {game.coverImage ? (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={game.coverImage}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-zinc-300 backdrop-blur-sm">
                        {game.style}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/9] bg-zinc-800 flex items-center justify-center text-4xl">
                      {game.icon}
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors leading-snug">
                      {game.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {game.metaDescription}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {game.players}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {game.duration}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-white border-b border-zinc-800 pb-2">
              More Games
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uncategorized.map((game) => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="group rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-700/50 overflow-hidden transition-all"
                >
                  {game.coverImage ? (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <Image
                        src={game.coverImage}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/9] bg-zinc-800 flex items-center justify-center text-4xl">
                      {game.icon}
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2">{game.metaDescription}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-800/30 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">More cases coming soon</h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            New murder mystery cases are added regularly. Each with unique suspects, evidence, and solutions.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
          >
            Browse Cases
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-zinc-800/50 mt-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-4 items-center justify-between text-xs text-zinc-600">
          <span>© 2026 TextGame.ai</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/discover" className="hover:text-zinc-400 transition-colors">Discover</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
