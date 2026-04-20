import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { FAQ_ITEMS } from "@/data/landing-content";
import { isValidSEOLocale, HOME_META, HERO_HEADLINE, buildHreflangAlternates, type SEOLocale } from "@/lib/seo-locales";
import HomeClient from "../home-client";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) return {};
  const meta = HOME_META[locale as SEOLocale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: buildHreflangAlternates("/"),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: `${SITE_DOMAIN}/${locale}`,
      siteName: SITE_NAME,
      images: [{ url: "/hero.webp", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/hero.webp"],
    },
  };
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) notFound();
  const headline = HERO_HEADLINE[locale as SEOLocale];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient
        urlLocale={locale}
        heroHeadline={
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
            {headline.prefix}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {headline.gradient}
            </span>
            {headline.suffix}
          </h2>
        }
      />
    </>
  );
}
