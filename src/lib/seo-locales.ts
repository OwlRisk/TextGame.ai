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
  zh: { title: "TextGame.ai — AI驱动的RPG冒险", description: "与AI游戏大师和拥有真实个性的AI队友一起踏上永不结束的RPG冒险。探索开放世界，战斗史诗Boss，塑造你自己的故事。" },
  ja: { title: "TextGame.ai — AIパワードRPGアドベンチャー", description: "AIゲームマスターとリアルな個性を持つAI仲間と共にRPGアドベンチャーに出発。オープンワールド探索、ボス戦、自分だけの物語。" },
  ko: { title: "TextGame.ai — AI RPG 어드벤처", description: "AI 게임마스터와 진짜 성격을 가진 AI 동료와 함께 RPG 모험을 떠나세요. 오픈 월드, 보스 전투, 나만의 이야기." },
  es: { title: "TextGame.ai — Aventuras RPG con IA", description: "Embárcate en aventuras RPG con un Game Master IA y compañeros con personalidades reales. Mundo abierto, combates épicos, tu propia historia." },
  fr: { title: "TextGame.ai — Aventures RPG propulsées par l'IA", description: "Partez à l'aventure RPG avec un Maître du Jeu IA et des compagnons aux personnalités réelles. Monde ouvert, combats épiques." },
  de: { title: "TextGame.ai — KI-gestützte RPG-Abenteuer", description: "Erlebe RPG-Abenteuer mit einem KI-Spielleiter und Gefährten mit echten Persönlichkeiten. Offene Welt, epische Kämpfe." },
  pt: { title: "TextGame.ai — Aventuras RPG com IA", description: "Embarque em aventuras RPG com um Mestre de Jogo IA e companheiros com personalidades reais. Mundo aberto, batalhas épicas." },
  ru: { title: "TextGame.ai — RPG-приключения с ИИ", description: "Отправляйтесь в RPG-приключения с ИИ-мастером и спутниками с реальными характерами. Открытый мир, эпические бои." },
  it: { title: "TextGame.ai — Avventure RPG con IA", description: "Intraprendi avventure RPG con un Game Master IA e compagni con personalità reali. Mondo aperto, battaglie epiche." },
  ar: { title: "TextGame.ai — مغامرات RPG بالذكاء الاصطناعي", description: "انطلق في مغامرات RPG مع سيد لعبة ذكي ورفاق بشخصيات حقيقية. عالم مفتوح، معارك ملحمية." },
  hi: { title: "TextGame.ai — AI RPG एडवेंचर", description: "AI गेम मास्टर और असली व्यक्तित्व वाले AI साथियों के साथ RPG एडवेंचर पर निकलें। ओपन वर्ल्ड, एपिक बैटल।" },
  tr: { title: "TextGame.ai — Yapay Zekâ RPG Maceraları", description: "Yapay zekâ oyun yöneticisi ve gerçek kişiliklere sahip AI yoldaşlarla RPG macerasına çık. Açık dünya, destansı savaşlar." },
  id: { title: "TextGame.ai — Petualangan RPG AI", description: "Mulai petualangan RPG dengan Game Master AI dan rekan tim AI berpribadi nyata. Dunia terbuka, pertempuran epik." },
  vi: { title: "TextGame.ai — Phiêu lưu RPG cùng AI", description: "Bắt đầu phiêu lưu RPG cùng Game Master AI và đồng đội AI có tính cách thật. Thế giới mở, trận chiến hoành tráng." },
  th: { title: "TextGame.ai — ผจญภัย RPG กับ AI", description: "ออกผจญภัย RPG กับ AI Game Master และเพื่อนร่วมทีม AI ที่มีบุคลิกจริง โลกเปิด สู้บอสมันส์" },
  pl: { title: "TextGame.ai — Przygody RPG z AI", description: "Wyrusz na przygodę RPG z Mistrzem Gry AI i towarzyszami o prawdziwych osobowościach. Otwarty świat, epickie bitwy." },
  nl: { title: "TextGame.ai — AI RPG-avonturen", description: "Ga op RPG-avontuur met een AI Game Master en metgezellen met echte persoonlijkheden. Open wereld, epische gevechten." },
  uk: { title: "TextGame.ai — RPG-пригоди з ШІ", description: "Вирушайте у RPG-пригоди зі ШІ-майстром та супутниками з реальними характерами. Відкритий світ, епічні битви." },
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
