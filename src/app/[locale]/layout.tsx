import { notFound } from "next/navigation";
import { SITE_DOMAIN, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { isValidSEOLocale, LOCALE_HTML_LANG, HOME_META, type SEOLocale } from "@/lib/seo-locales";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidSEOLocale(locale)) notFound();

  const htmlLang = LOCALE_HTML_LANG[locale];
  const i18nCode = locale === "zh" ? "zh-CN" : locale;
  const meta = HOME_META[locale as SEOLocale];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_DOMAIN}/${locale}`,
    description: meta.description,
    inLanguage: htmlLang,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_DOMAIN}/games?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${htmlLang}";try{localStorage.setItem("textgame_ui_lang","${i18nCode}")}catch(e){}`,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {children}
    </>
  );
}
