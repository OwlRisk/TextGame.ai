/**
 * Central SEO locale configuration.
 *
 * These locales get their own URL prefix (e.g. /zh/, /ja/) and
 * localized <title>, <meta description>, hreflang, and sitemap entries.
 */

import { SITE_DOMAIN } from "./site";

export const SEO_LOCALES = [
  "zh", "ja", "ko", "es", "fr", "de", "pt", "ru",
  "it", "ar", "hi", "tr", "id", "vi", "th", "pl", "nl", "uk",
] as const;

export type SEOLocale = (typeof SEO_LOCALES)[number];

export function isValidSEOLocale(v: string): v is SEOLocale {
  return (SEO_LOCALES as readonly string[]).includes(v);
}

export const LOCALE_HTML_LANG: Record<SEOLocale, string> = {
  zh: "zh-CN", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de",
  pt: "pt", ru: "ru", it: "it", ar: "ar", hi: "hi", tr: "tr",
  id: "id", vi: "vi", th: "th", pl: "pl", nl: "nl", uk: "uk",
};

export const LOCALE_TO_I18N_KEY: Record<SEOLocale, string> = {
  zh: "zh-CN", ja: "ja", ko: "ko", es: "es", fr: "fr", de: "de",
  pt: "pt", ru: "ru", it: "it", ar: "ar", hi: "hi", tr: "tr",
  id: "id", vi: "vi", th: "th", pl: "pl", nl: "nl", uk: "uk",
};

/** Build hreflang alternates object for Next.js `metadata.alternates.languages`. */
export function buildHreflangAlternates(path: string): Record<string, string> {
  const langs: Record<string, string> = {
    "x-default": `${SITE_DOMAIN}${path}`,
    en: `${SITE_DOMAIN}${path}`,
  };
  for (const locale of SEO_LOCALES) {
    langs[LOCALE_HTML_LANG[locale]] = `${SITE_DOMAIN}/${locale}${path}`;
  }
  return langs;
}

// ── Page metadata translations ──────────────────────────────────────────────

interface PageMeta {
  title: string;
  description: string;
}

type LocaleMetaMap = Record<SEOLocale, PageMeta>;

export const HOME_META: LocaleMetaMap = {
  zh: { title: "TextGame.ai — 在线玩AI文字游戏", description: "在浏览器中畅玩狼人杀、黑手党、RPG等10+款AI驱动的文字游戏。无需下载，AI主持每场游戏。" },
  ja: { title: "TextGame.ai — AIテキストゲームをオンラインでプレイ", description: "人狼、マフィア、RPGなど10以上のAIテキストゲームをブラウザでプレイ。ダウンロード不要。" },
  ko: { title: "TextGame.ai — AI 텍스트 게임 온라인 플레이", description: "마피아, 인랑, RPG 등 10개 이상의 AI 텍스트 게임을 브라우저에서 플레이하세요. 다운로드 필요 없음." },
  es: { title: "TextGame.ai — Juega juegos de texto con IA online", description: "Juega Hombre Lobo, Mafia, RPG y más de 10 juegos de texto con IA en tu navegador. Sin descargas." },
  fr: { title: "TextGame.ai — Jouez à des jeux textuels IA en ligne", description: "Jouez au Loup-Garou, Mafia, RPG et plus de 10 jeux textuels IA dans votre navigateur. Sans téléchargement." },
  de: { title: "TextGame.ai — KI-Textspiele online spielen", description: "Spiele Werwolf, Mafia, RPG und über 10 KI-gestützte Textspiele im Browser. Kein Download nötig." },
  pt: { title: "TextGame.ai — Jogue jogos de texto com IA online", description: "Jogue Lobisomem, Máfia, RPG e mais de 10 jogos de texto com IA no navegador. Sem download." },
  ru: { title: "TextGame.ai — Играйте в текстовые игры с ИИ онлайн", description: "Играйте в Мафию, Оборотня, RPG и более 10 текстовых игр с ИИ в браузере. Без скачивания." },
  it: { title: "TextGame.ai — Gioca ai giochi testuali con IA online", description: "Gioca a Lupus, Mafia, RPG e oltre 10 giochi testuali con IA nel browser. Senza download." },
  ar: { title: "TextGame.ai — العب ألعاب نصية بالذكاء الاصطناعي", description: "العب لعبة المستذئب والمافيا وألعاب تقمص الأدوار وأكثر من 10 ألعاب نصية بالذكاء الاصطناعي في متصفحك." },
  hi: { title: "TextGame.ai — AI टेक्स्ट गेम ऑनलाइन खेलें", description: "वेयरवुल्फ, माफिया, RPG और 10+ AI-संचालित टेक्स्ट गेम ब्राउज़र में खेलें। डाउनलोड की जरूरत नहीं।" },
  tr: { title: "TextGame.ai — Yapay Zekâ Metin Oyunlarını Çevrimiçi Oyna", description: "Kurt Adam, Mafya, RPG ve 10'dan fazla yapay zekâ metin oyununu tarayıcında oyna. İndirme gereksiz." },
  id: { title: "TextGame.ai — Main Game Teks AI Online", description: "Mainkan Werewolf, Mafia, RPG, dan 10+ game teks berbasis AI di browser. Tanpa unduhan." },
  vi: { title: "TextGame.ai — Chơi game văn bản AI trực tuyến", description: "Chơi Ma Sói, Mafia, RPG và hơn 10 game văn bản AI trên trình duyệt. Không cần tải xuống." },
  th: { title: "TextGame.ai — เล่นเกมข้อความ AI ออนไลน์", description: "เล่นเกมหมาป่า มาเฟีย RPG และเกมข้อความ AI อีกกว่า 10 เกมในเบราว์เซอร์ ไม่ต้องดาวน์โหลด" },
  pl: { title: "TextGame.ai — Graj w gry tekstowe z AI online", description: "Graj w Wilkołaka, Mafię, RPG i ponad 10 gier tekstowych z AI w przeglądarce. Bez pobierania." },
  nl: { title: "TextGame.ai — Speel AI-tekstspellen online", description: "Speel Weerwolf, Maffia, RPG en meer dan 10 AI-tekstspellen in je browser. Geen download nodig." },
  uk: { title: "TextGame.ai — Грайте в текстові ігри зі ШІ онлайн", description: "Грайте в Вовкулаку, Мафію, RPG та понад 10 текстових ігор зі ШІ у браузері. Без завантаження." },
};

export const DISCOVER_META: LocaleMetaMap = {
  zh: { title: "发现AI文字游戏", description: "浏览10+免费AI多人文字游戏模板。狼人杀、黑手党、RPG、推理等——或创建自己的游戏。" },
  ja: { title: "AIテキストゲームを探索", description: "10以上の無料AIテキストゲームテンプレートを閲覧。人狼、マフィア、RPG、ミステリーなど。" },
  ko: { title: "AI 텍스트 게임 탐색", description: "10개 이상의 무료 AI 멀티플레이어 텍스트 게임 템플릿을 탐색하세요. 마피아, 인랑, RPG 등." },
  es: { title: "Descubre juegos de texto con IA", description: "Explora más de 10 plantillas gratuitas de juegos de texto multijugador con IA. Hombre Lobo, Mafia, RPG y más." },
  fr: { title: "Découvrez les jeux textuels IA", description: "Parcourez plus de 10 modèles gratuits de jeux textuels multijoueurs avec IA. Loup-Garou, Mafia, RPG et plus." },
  de: { title: "KI-Textspiele entdecken", description: "Durchsuche 10+ kostenlose KI-Multiplayer-Textspiel-Vorlagen. Werwolf, Mafia, RPG, Mystery und mehr." },
  pt: { title: "Descubra jogos de texto com IA", description: "Explore mais de 10 modelos gratuitos de jogos de texto multijogador com IA. Lobisomem, Máfia, RPG e mais." },
  ru: { title: "Исследуйте текстовые игры с ИИ", description: "Просмотрите 10+ бесплатных шаблонов текстовых игр с ИИ. Мафия, Оборотень, RPG, Детектив и другие." },
  it: { title: "Scopri i giochi testuali con IA", description: "Esplora oltre 10 modelli gratuiti di giochi testuali multiplayer con IA. Lupus, Mafia, RPG e altro." },
  ar: { title: "اكتشف ألعاب نصية بالذكاء الاصطناعي", description: "تصفح أكثر من 10 قوالب ألعاب نصية مجانية متعددة اللاعبين بالذكاء الاصطناعي." },
  hi: { title: "AI टेक्स्ट गेम खोजें", description: "10+ मुफ्त AI मल्टीप्लेयर टेक्स्ट गेम टेम्पलेट ब्राउज़ करें। वेयरवुल्फ, माफिया, RPG और अधिक।" },
  tr: { title: "AI Metin Oyunlarını Keşfet", description: "10'dan fazla ücretsiz AI çok oyunculu metin oyunu şablonunu keşfedin. Kurt Adam, Mafya, RPG ve daha fazlası." },
  id: { title: "Jelajahi Game Teks AI", description: "Telusuri 10+ template game teks multiplayer AI gratis. Werewolf, Mafia, RPG, Misteri, dan lainnya." },
  vi: { title: "Khám phá game văn bản AI", description: "Duyệt qua hơn 10 mẫu game văn bản nhiều người chơi AI miễn phí. Ma Sói, Mafia, RPG và hơn thế nữa." },
  th: { title: "ค้นพบเกมข้อความ AI", description: "สำรวจเทมเพลตเกมข้อความหลายผู้เล่น AI ฟรีกว่า 10 แบบ หมาป่า มาเฟีย RPG และอื่นๆ" },
  pl: { title: "Odkryj gry tekstowe z AI", description: "Przeglądaj ponad 10 darmowych szablonów gier tekstowych z AI. Wilkołak, Mafia, RPG i więcej." },
  nl: { title: "Ontdek AI-tekstspellen", description: "Blader door 10+ gratis AI-multiplayer-tekstspelsjablonen. Weerwolf, Maffia, RPG en meer." },
  uk: { title: "Відкрийте текстові ігри зі ШІ", description: "Перегляньте 10+ безкоштовних шаблонів текстових ігор зі ШІ. Вовкулака, Мафія, RPG та інші." },
};

export const GAMES_META: LocaleMetaMap = {
  zh: { title: "AI游戏库", description: "浏览15+款AI主持的文字游戏——狼人杀、黑手党、密室逃脱、知识问答等。免费游玩，无需设置。" },
  ja: { title: "AIゲームライブラリ", description: "AIゲームマスター付きの15以上のテキストゲームを閲覧。人狼、マフィア、脱出ゲーム、トリビアなど。無料プレイ。" },
  ko: { title: "AI 게임 라이브러리", description: "AI 게임 마스터가 있는 15개 이상의 텍스트 게임을 탐색하세요. 마피아, 인랑, 방탈출, 퀴즈 등. 무료 플레이." },
  es: { title: "Biblioteca de juegos IA", description: "Explora más de 15 juegos de texto con un maestro de juegos IA. Hombre Lobo, Mafia, Escape Room, Trivia y más. Gratis." },
  fr: { title: "Bibliothèque de jeux IA", description: "Parcourez plus de 15 jeux textuels avec un maître de jeu IA. Loup-Garou, Mafia, Escape Room, Quiz et plus. Gratuit." },
  de: { title: "KI-Spielebibliothek", description: "Durchsuche 15+ Textspiele mit einem KI-Spielleiter. Werwolf, Mafia, Escape Room, Quiz und mehr. Kostenlos." },
  pt: { title: "Biblioteca de jogos IA", description: "Explore mais de 15 jogos de texto com um mestre de jogo IA. Lobisomem, Máfia, Escape Room, Trivia e mais. Grátis." },
  ru: { title: "Библиотека игр с ИИ", description: "Просмотрите 15+ текстовых игр с ИИ-ведущим. Мафия, Оборотень, Квест-комната, Викторина и другие. Бесплатно." },
  it: { title: "Libreria di giochi IA", description: "Esplora oltre 15 giochi testuali con un master di gioco IA. Lupus, Mafia, Escape Room, Quiz e altro. Gratis." },
  ar: { title: "مكتبة ألعاب الذكاء الاصطناعي", description: "تصفح أكثر من 15 لعبة نصية مع مدير ألعاب ذكاء اصطناعي. المستذئب، المافيا، غرفة الهروب والمزيد. مجاناً." },
  hi: { title: "AI गेम लाइब्रेरी", description: "AI गेम मास्टर के साथ 15+ टेक्स्ट गेम ब्राउज़ करें। वेयरवुल्फ, माफिया, एस्केप रूम, ट्रिविया और अधिक। मुफ्त।" },
  tr: { title: "AI Oyun Kütüphanesi", description: "AI oyun yöneticisi ile 15'ten fazla metin oyununa göz atın. Kurt Adam, Mafya, Kaçış Odası, Bilgi Yarışması ve daha fazlası. Ücretsiz." },
  id: { title: "Perpustakaan Game AI", description: "Telusuri 15+ game teks dengan AI game master. Werewolf, Mafia, Escape Room, Trivia, dan lainnya. Gratis." },
  vi: { title: "Thư viện game AI", description: "Duyệt qua hơn 15 game văn bản với AI game master. Ma Sói, Mafia, Phòng thoát hiểm, Đố vui và hơn thế nữa. Miễn phí." },
  th: { title: "คลังเกม AI", description: "เรียกดูเกมข้อความกว่า 15 เกมกับ AI Game Master หมาป่า มาเฟีย ห้องหนีภัย ตอบคำถาม และอื่นๆ ฟรี" },
  pl: { title: "Biblioteka gier AI", description: "Przeglądaj ponad 15 gier tekstowych z AI game masterem. Wilkołak, Mafia, Escape Room, Quiz i więcej. Za darmo." },
  nl: { title: "AI-spelbibliotheek", description: "Blader door 15+ tekstspellen met een AI-spelleider. Weerwolf, Maffia, Escape Room, Trivia en meer. Gratis." },
  uk: { title: "Бібліотека ігор зі ШІ", description: "Перегляньте 15+ текстових ігор з ШІ-ведучим. Вовкулака, Мафія, Квест-кімната, Вікторина та інші. Безкоштовно." },
};
