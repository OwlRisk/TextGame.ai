import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users, Clock } from "lucide-react";
import { GAME_SEO_DATA } from "@/lib/game-seo-data";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { isValidSEOLocale, GAMES_META, buildHreflangAlternates, type SEOLocale } from "@/lib/seo-locales";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) return {};
  const meta = GAMES_META[locale as SEOLocale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/games`,
      languages: buildHreflangAlternates("/games"),
    },
    openGraph: {
      title: `${meta.title} · ${SITE_NAME}`,
      description: meta.description,
      type: "website",
      url: `${SITE_DOMAIN}/${locale}/games`,
      images: [{ url: "/hero.webp", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} · ${SITE_NAME}`,
      description: meta.description,
      images: ["/hero.webp"],
    },
  };
}

const CATEGORY_ORDER = [
  "Social Deduction",
  "Party",
  "Mystery",
  "Puzzle",
  "Knowledge",
  "Solo / Reflective",
];

export default async function LocaleGamesPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) notFound();

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    games: GAME_SEO_DATA.filter((g) => g.category === cat),
  })).filter((c) => c.games.length > 0);

  const uncategorized = GAME_SEO_DATA.filter(
    (g) => !CATEGORY_ORDER.includes(g.category)
  );

  return (
    <div className="h-full overflow-auto scrollbar-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-sm font-semibold text-white">
            TextGame.ai
          </Link>
          <Link
            href={`/${locale}/discover`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Browse all →
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        <section className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            {GAMES_META[locale as SEOLocale].title}
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            {GAMES_META[locale as SEOLocale].description}
          </p>
        </section>

        {[...byCategory, ...(uncategorized.length > 0 ? [{ category: "Other", games: uncategorized }] : [])].map(
          ({ category, games }) => (
            <section key={category} className="space-y-4">
              <h2 className="text-xl font-semibold text-white">{category}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {games.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 transition hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    {g.coverImage ? (
                      <Image
                        src={g.coverImage}
                        alt={g.name}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
                        {g.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white group-hover:text-violet-300 transition-colors truncate">
                          {g.name}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{g.tagline}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.players}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{g.duration}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}
      </main>
    </div>
  );
}
