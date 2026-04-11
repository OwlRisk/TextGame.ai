import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { isValidSEOLocale, DISCOVER_META, buildHreflangAlternates, type SEOLocale } from "@/lib/seo-locales";
import DiscoverView from "../../(pages)/discover/discover-view";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) return {};
  const meta = DISCOVER_META[locale as SEOLocale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/discover`,
      languages: buildHreflangAlternates("/discover"),
    },
    openGraph: {
      title: `${meta.title} · ${SITE_NAME}`,
      description: meta.description,
      type: "website",
      url: `${SITE_DOMAIN}/${locale}/discover`,
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

export default async function LocaleDiscoverPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) notFound();
  return <DiscoverView />;
}
