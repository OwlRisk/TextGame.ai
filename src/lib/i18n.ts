/**
 * Lightweight i18n for game UI strings.
 *
 * AI-generated content (narration, character speech) is handled by
 * buildLanguageInstruction() in content-language.ts — this file covers
 * hardcoded UI text: greetings, buttons, labels, status, placeholders, etc.
 *
 * Tier 1 languages (full UI): en, zh, ja, ko, de, fr, es, pt, ru, it, ar
 * Tier 2 languages (AI content only): all others via buildLanguageInstruction
 */

const LS_KEY = "textgame_ui_lang";

export function setAppLanguage(lang: string) {
  try { localStorage.setItem(LS_KEY, lang); } catch {}
}

export function getAppLanguage(): string {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return stored;
  } catch {}
  if (typeof navigator !== "undefined") return navigator.language || "en";
  return "en";
}

function resolveKey(lang: string): string {
  if (!lang) return "en";
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  return lower.split("-")[0];
}

// ─────────────────────────────────────────────────────────────────────────
// Translation table
// ─────────────────────────────────────────────────────────────────────────

const T: Record<string, Record<string, string>> = {

  // ── Turn / status ──────────────────────────────────────────────────────
  "turn.yours": {
    en: "It\u2019s your turn to speak",
    zh: "\u8f6e\u5230\u4f60\u53d1\u8a00",
    de: "Du bist dran",
    fr: "C\u2019est ton tour de parler",
    es: "Es tu turno para hablar",
    ja: "\u3042\u306a\u305f\u306e\u756a\u3067\u3059",
    ko: "\ub2f9\uc2e0\uc758 \ucc28\ub840\uc785\ub2c8\ub2e4",
    pt: "\u00c9 a sua vez de falar",
    ru: "\u0412\u0430\u0448\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u044c \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c",
    it: "\u00c8 il tuo turno di parlare",
    ar: "\u062f\u0648\u0631\u0643 \u0644\u0644\u062a\u062d\u062f\u062b",
  },
  "status.ai_responding": {
    en: "AI players are responding \u2014 you can type ahead",
    zh: "AI \u73a9\u5bb6\u6b63\u5728\u56de\u590d\u2014\u2014\u4f60\u53ef\u4ee5\u63d0\u524d\u8f93\u5165",
    de: "KI-Spieler antworten \u2014 du kannst schon tippen",
    fr: "Les joueurs IA r\u00e9pondent \u2014 vous pouvez taper en attendant",
    es: "Los jugadores IA est\u00e1n respondiendo \u2014 puedes escribir mientras",
    ja: "AI\u30d7\u30ec\u30a4\u30e4\u30fc\u304c\u5fdc\u7b54\u4e2d\u2014\u2014\u5148\u306b\u5165\u529b\u3067\u304d\u307e\u3059",
    ko: "AI \ud50c\ub808\uc774\uc5b4\uac00 \uc751\ub2f5 \uc911 \u2014 \ubbf8\ub9ac \uc785\ub825\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4",
    pt: "Jogadores IA est\u00e3o respondendo \u2014 voc\u00ea pode digitar",
    ru: "\u0418\u0418-\u0438\u0433\u0440\u043e\u043a\u0438 \u043e\u0442\u0432\u0435\u0447\u0430\u044e\u0442 \u2014 \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0438\u0441\u0430\u0442\u044c",
    it: "I giocatori IA stanno rispondendo \u2014 puoi scrivere",
    ar: "\u0644\u0627\u0639\u0628\u0648 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0631\u062f\u0648\u0646 \u2014 \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0643\u062a\u0627\u0628\u0629",
  },
  "status.setting_scene": {
    en: "Setting the scene\u2026",
    zh: "\u6b63\u5728\u8bbe\u5b9a\u573a\u666f\u2026",
    de: "Szene wird vorbereitet\u2026",
    fr: "Pr\u00e9paration de la sc\u00e8ne\u2026",
    es: "Preparando la escena\u2026",
    ja: "\u30b7\u30fc\u30f3\u3092\u6e96\u5099\u4e2d\u2026",
    ko: "\uc7a5\uba74 \uc124\uc815 \uc911\u2026",
    pt: "Preparando a cena\u2026",
    ru: "\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u0441\u0446\u0435\u043d\u044b\u2026",
    it: "Preparazione della scena\u2026",
    ar: "\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u0645\u0634\u0647\u062f\u2026",
  },
  "status.preparing_game": {
    en: "Preparing the game\u2026",
    zh: "\u6b63\u5728\u51c6\u5907\u6e38\u620f\u2026",
    de: "Spiel wird vorbereitet\u2026",
    fr: "Pr\u00e9paration du jeu\u2026",
    es: "Preparando el juego\u2026",
    ja: "\u30b2\u30fc\u30e0\u3092\u6e96\u5099\u4e2d\u2026",
    ko: "\uac8c\uc784 \uc900\ube44 \uc911\u2026",
    pt: "Preparando o jogo\u2026",
    ru: "\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u0438\u0433\u0440\u044b\u2026",
    it: "Preparazione del gioco\u2026",
    ar: "\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u0644\u0639\u0628\u0629\u2026",
  },
  "status.game_starting": {
    en: "Game is starting\u2026",
    zh: "\u6e38\u620f\u6b63\u5728\u5f00\u59cb\u2026",
    de: "Spiel startet\u2026",
    fr: "La partie commence\u2026",
    es: "El juego est\u00e1 comenzando\u2026",
    ja: "\u30b2\u30fc\u30e0\u958b\u59cb\u4e2d\u2026",
    ko: "\uac8c\uc784 \uc2dc\uc791 \uc911\u2026",
    pt: "O jogo est\u00e1 come\u00e7ando\u2026",
    ru: "\u0418\u0433\u0440\u0430 \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442\u0441\u044f\u2026",
    it: "La partita sta iniziando\u2026",
    ar: "\u0627\u0644\u0644\u0639\u0628\u0629 \u062a\u0628\u062f\u0623\u2026",
  },
  "status.loading_game": {
    en: "Loading game\u2026",
    zh: "\u52a0\u8f7d\u6e38\u620f\u4e2d\u2026",
    de: "Spiel wird geladen\u2026",
    fr: "Chargement du jeu\u2026",
    es: "Cargando juego\u2026",
    ja: "\u30b2\u30fc\u30e0\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u2026",
    ko: "\uac8c\uc784 \ub85c\ub529 \uc911\u2026",
    pt: "Carregando jogo\u2026",
    ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0438\u0433\u0440\u044b\u2026",
    it: "Caricamento del gioco\u2026",
    ar: "\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0644\u0639\u0628\u0629\u2026",
  },
  "status.loading_room": {
    en: "Loading room from cloud\u2026",
    zh: "\u4ece\u4e91\u7aef\u52a0\u8f7d\u623f\u95f4\u2026",
    de: "Raum wird aus der Cloud geladen\u2026",
    fr: "Chargement depuis le cloud\u2026",
    es: "Cargando sala desde la nube\u2026",
    ja: "\u30af\u30e9\u30a6\u30c9\u304b\u3089\u30eb\u30fc\u30e0\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u2026",
    ko: "\ud074\ub77c\uc6b0\ub4dc\uc5d0\uc11c \ubc29 \ub85c\ub529 \uc911\u2026",
    pt: "Carregando sala da nuvem\u2026",
    ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u043e\u043c\u043d\u0430\u0442\u044b \u0438\u0437 \u043e\u0431\u043b\u0430\u043a\u0430\u2026",
    it: "Caricamento stanza dal cloud\u2026",
    ar: "\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u063a\u0631\u0641\u0629 \u0645\u0646 \u0627\u0644\u0633\u062d\u0627\u0628\u0629\u2026",
  },

  // ── Placeholders ───────────────────────────────────────────────────────
  "placeholder.ai_replying": {
    en: "AI replying\u2026",
    zh: "AI \u6b63\u5728\u56de\u590d\u2026",
    de: "KI antwortet\u2026",
    fr: "L\u2019IA r\u00e9pond\u2026",
    es: "La IA est\u00e1 respondiendo\u2026",
    ja: "AI\u304c\u5fdc\u7b54\u4e2d\u2026",
    ko: "AI \uc751\ub2f5 \uc911\u2026",
    pt: "IA respondendo\u2026",
    ru: "\u0418\u0418 \u043e\u0442\u0432\u0435\u0447\u0430\u0435\u0442\u2026",
    it: "L\u2019IA sta rispondendo\u2026",
    ar: "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0631\u062f\u2026",
  },
  "placeholder.crew_talking": {
    en: "Your crew is talking\u2026",
    zh: "\u961f\u53cb\u6b63\u5728\u4ea4\u8c08\u2026",
    de: "Deine Crew spricht\u2026",
    fr: "Votre \u00e9quipe parle\u2026",
    es: "Tu equipo est\u00e1 hablando\u2026",
    ja: "\u4ef2\u9593\u304c\u4f1a\u8a71\u4e2d\u2026",
    ko: "\ud300\uc774 \ub300\ud654 \uc911\u2026",
    pt: "Sua equipe est\u00e1 conversando\u2026",
    ru: "\u0412\u0430\u0448\u0430 \u043a\u043e\u043c\u0430\u043d\u0434\u0430 \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u2026",
    it: "Il tuo gruppo sta parlando\u2026",
    ar: "\u0641\u0631\u064a\u0642\u0643 \u064a\u062a\u062d\u062f\u062b\u2026",
  },
  "placeholder.say": {
    en: "Say something\u2026",
    zh: "\u8bf4\u70b9\u4ec0\u4e48\u2026",
    de: "Sag etwas\u2026",
    fr: "Dis quelque chose\u2026",
    es: "Di algo\u2026",
    ja: "\u4f55\u304b\u8a00\u3063\u3066\u2026",
    ko: "\ubb50\ub77c\ub3c4 \ub9d0\ud574\ubcf4\uc138\uc694\u2026",
    pt: "Diga algo\u2026",
    ru: "\u0421\u043a\u0430\u0436\u0438\u0442\u0435 \u0447\u0442\u043e-\u043d\u0438\u0431\u0443\u0434\u044c\u2026",
    it: "Di qualcosa\u2026",
    ar: "\u0642\u0644 \u0634\u064a\u0626\u0627\u2026",
  },
  "placeholder.do": {
    en: "What do you do?",
    zh: "\u4f60\u8981\u505a\u4ec0\u4e48\uff1f",
    de: "Was tust du?",
    fr: "Que fais-tu ?",
    es: "\u00bfQu\u00e9 haces?",
    ja: "\u4f55\u3092\u3057\u307e\u3059\u304b\uff1f",
    ko: "\ubb34\uc5c7\uc744 \ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c?",
    pt: "O que voc\u00ea faz?",
    ru: "\u0427\u0442\u043e \u0432\u044b \u0434\u0435\u043b\u0430\u0435\u0442\u0435?",
    it: "Cosa fai?",
    ar: "\u0645\u0627\u0630\u0627 \u062a\u0641\u0639\u0644\u061f",
  },

  // ── Labels ─────────────────────────────────────────────────────────────
  "label.players": {
    en: "Players", zh: "\u73a9\u5bb6", de: "Spieler", fr: "Joueurs",
    es: "Jugadores", ja: "\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "\ud50c\ub808\uc774\uc5b4",
    pt: "Jogadores", ru: "\u0418\u0433\u0440\u043e\u043a\u0438", it: "Giocatori", ar: "\u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646",
  },
  "label.you": {
    en: "YOU", zh: "\u4f60", de: "DU", fr: "VOUS",
    es: "T\u00da", ja: "\u3042\u306a\u305f", ko: "\ub098",
    pt: "VOC\u00ca", ru: "\u0412\u042b", it: "TU", ar: "\u0623\u0646\u062a",
  },
  "label.rules": {
    en: "Rules", zh: "\u89c4\u5219", de: "Regeln", fr: "R\u00e8gles",
    es: "Reglas", ja: "\u30eb\u30fc\u30eb", ko: "\uaddc\uce59",
    pt: "Regras", ru: "\u041f\u0440\u0430\u0432\u0438\u043b\u0430", it: "Regole", ar: "\u0627\u0644\u0642\u0648\u0627\u0639\u062f",
  },
  "label.sections": {
    en: "Sections", zh: "\u680f\u76ee", de: "Abschnitte", fr: "Sections",
    es: "Secciones", ja: "\u30bb\u30af\u30b7\u30e7\u30f3", ko: "\uc139\uc158",
    pt: "Se\u00e7\u00f5es", ru: "\u0420\u0430\u0437\u0434\u0435\u043b\u044b", it: "Sezioni", ar: "\u0627\u0644\u0623\u0642\u0633\u0627\u0645",
  },
  "label.host": {
    en: "HOST", zh: "\u4e3b\u6301", de: "HOST", fr: "H\u00d4TE",
    es: "ANFITRI\u00d3N", ja: "\u30db\u30b9\u30c8", ko: "\ud638\uc2a4\ud2b8",
    pt: "HOST", ru: "\u0425\u041e\u0421\u0422", it: "HOST", ar: "\u0627\u0644\u0645\u0636\u064a\u0641",
  },
  "label.ai": {
    en: "AI", zh: "AI", de: "KI", fr: "IA",
    es: "IA", ja: "AI", ko: "AI",
    pt: "IA", ru: "\u0418\u0418", it: "IA", ar: "\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a",
  },
  "label.guest": {
    en: "Guest", zh: "\u8bbf\u5ba2", de: "Gast", fr: "Invit\u00e9",
    es: "Invitado", ja: "\u30b2\u30b9\u30c8", ko: "\uac8c\uc2a4\ud2b8",
    pt: "Convidado", ru: "\u0413\u043e\u0441\u0442\u044c", it: "Ospite", ar: "\u0636\u064a\u0641",
  },
  "label.spectator": {
    en: "Spectator", zh: "\u89c2\u4f17", de: "Zuschauer", fr: "Spectateur",
    es: "Espectador", ja: "\u89b3\u5ba2", ko: "\uad00\uc804\uc790",
    pt: "Espectador", ru: "\u0417\u0440\u0438\u0442\u0435\u043b\u044c", it: "Spettatore", ar: "\u0645\u062a\u0641\u0631\u062c",
  },
  "label.private": {
    en: "Private", zh: "\u79c1\u5bc6", de: "Privat", fr: "Priv\u00e9",
    es: "Privado", ja: "\u30d7\u30e9\u30a4\u30d9\u30fc\u30c8", ko: "\ube44\uacf5\uac1c",
    pt: "Privado", ru: "\u041b\u0438\u0447\u043d\u043e\u0435", it: "Privato", ar: "\u062e\u0627\u0635",
  },

  // ── Chat empty states ──────────────────────────────────────────────────
  "chat.no_messages": {
    en: "No messages yet", zh: "\u8fd8\u6ca1\u6709\u6d88\u606f", de: "Noch keine Nachrichten",
    fr: "Pas encore de messages", es: "A\u00fan no hay mensajes", ja: "\u307e\u3060\u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u3042\u308a\u307e\u305b\u3093",
    ko: "\uc544\uc9c1 \uba54\uc2dc\uc9c0\uac00 \uc5c6\uc2b5\ub2c8\ub2e4", pt: "Nenhuma mensagem ainda", ru: "\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442",
    it: "Nessun messaggio ancora", ar: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u0633\u0627\u0626\u0644 \u0628\u0639\u062f",
  },
  "chat.start_conversation": {
    en: "Start the conversation!", zh: "\u5f00\u59cb\u5bf9\u8bdd\u5427\uff01", de: "Starte die Unterhaltung!",
    fr: "Lancez la conversation !", es: "\u00a1Inicia la conversaci\u00f3n!", ja: "\u4f1a\u8a71\u3092\u59cb\u3081\u307e\u3057\u3087\u3046\uff01",
    ko: "\ub300\ud654\ub97c \uc2dc\uc791\ud558\uc138\uc694!", pt: "Comece a conversa!", ru: "\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440!",
    it: "Inizia la conversazione!", ar: "\u0627\u0628\u062f\u0623 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629!",
  },
  "chat.pull_older": {
    en: "Pull up for older messages", zh: "\u4e0a\u62c9\u52a0\u8f7d\u66f4\u591a\u6d88\u606f", de: "Nach oben ziehen f\u00fcr \u00e4ltere Nachrichten",
    fr: "Tirez vers le haut pour les anciens messages", es: "Tire hacia arriba para mensajes anteriores", ja: "\u4e0a\u306b\u30b9\u30af\u30ed\u30fc\u30eb\u3057\u3066\u53e4\u3044\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u8868\u793a",
    ko: "\uc704\ub85c \ub04c\uc5b4 \uc774\uc804 \uba54\uc2dc\uc9c0 \ubcf4\uae30", pt: "Puxe para cima para mensagens antigas", ru: "\u041f\u043e\u0442\u044f\u043d\u0438\u0442\u0435 \u0432\u0432\u0435\u0440\u0445 \u0434\u043b\u044f \u0441\u0442\u0430\u0440\u044b\u0445 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439",
    it: "Tira su per i messaggi precedenti", ar: "\u0627\u0633\u062d\u0628 \u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0642\u062f\u064a\u0645\u0629",
  },

  // ── Eliminated / ghost ─────────────────────────────────────────────────
  "eliminated.watching": {
    en: "You\u2019ve been eliminated \u2014 watching as spectator. Switch to Afterlife to chat with other ghosts.",
    zh: "\u4f60\u5df2\u88ab\u6dd8\u6c70\u2014\u2014\u6b63\u5728\u4ee5\u89c2\u4f17\u8eab\u4efd\u89c2\u770b\u3002\u5207\u6362\u5230\u201c\u4ea1\u7075\u201d\u9891\u9053\u4e0e\u5176\u4ed6\u6dd8\u6c70\u8005\u804a\u5929\u3002",
    de: "Du wurdest eliminiert \u2014 du schaust als Zuschauer zu. Wechsle zum Jenseits, um mit anderen Geistern zu chatten.",
    fr: "Vous avez \u00e9t\u00e9 \u00e9limin\u00e9 \u2014 vous regardez en tant que spectateur. Passez \u00e0 l\u2019Au-del\u00e0 pour discuter.",
    es: "Has sido eliminado \u2014 viendo como espectador. Cambia al M\u00e1s All\u00e1 para chatear con otros fantasmas.",
    ja: "\u8131\u843d\u3057\u307e\u3057\u305f\u2014\u2014\u89b3\u5ba2\u3068\u3057\u3066\u89b3\u6226\u4e2d\u3002\u3042\u306e\u4e16\u306b\u5207\u308a\u66ff\u3048\u3066\u4ed6\u306e\u5e7d\u970a\u3068\u30c1\u30e3\u30c3\u30c8\u3067\u304d\u307e\u3059\u3002",
    ko: "\ud0c8\ub77d\ud588\uc2b5\ub2c8\ub2e4 \u2014 \uad00\uc804\uc790\ub85c \uc2dc\uccad \uc911\uc785\ub2c8\ub2e4.",
    pt: "Voc\u00ea foi eliminado \u2014 assistindo como espectador.",
    ru: "\u0412\u044b \u0432\u044b\u0431\u044b\u043b\u0438 \u2014 \u0441\u043c\u043e\u0442\u0440\u0438\u0442\u0435 \u043a\u0430\u043a \u0437\u0440\u0438\u0442\u0435\u043b\u044c.",
    it: "Sei stato eliminato \u2014 stai guardando come spettatore.",
    ar: "\u0644\u0642\u062f \u062a\u0645 \u0625\u0642\u0635\u0627\u0624\u0643 \u2014 \u062a\u0634\u0627\u0647\u062f \u0643\u0645\u062a\u0641\u0631\u062c.",
  },
  "eliminated.ghost_chat": {
    en: "Ghost chat \u2014 only eliminated players can see this",
    zh: "\u4ea1\u7075\u804a\u5929\u2014\u2014\u4ec5\u88ab\u6dd8\u6c70\u7684\u73a9\u5bb6\u53ef\u89c1",
    de: "Geister-Chat \u2014 nur eliminierte Spieler k\u00f6nnen dies sehen",
    fr: "Chat fant\u00f4me \u2014 seuls les joueurs \u00e9limin\u00e9s peuvent voir ceci",
    es: "Chat fantasma \u2014 solo los jugadores eliminados pueden ver esto",
    ja: "\u5e7d\u970a\u30c1\u30e3\u30c3\u30c8\u2014\u2014\u8131\u843d\u8005\u306e\u307f\u95b2\u89a7\u53ef\u80fd",
    ko: "\uc720\ub839 \ucc44\ud305 \u2014 \ud0c8\ub77d\ud55c \ud50c\ub808\uc774\uc5b4\ub9cc \ubcfc \uc218 \uc788\uc2b5\ub2c8\ub2e4",
    pt: "Chat fantasma \u2014 apenas jogadores eliminados podem ver",
    ru: "\u0427\u0430\u0442 \u043f\u0440\u0438\u0437\u0440\u0430\u043a\u043e\u0432 \u2014 \u0432\u0438\u0434\u044f\u0442 \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u044b\u0431\u044b\u0432\u0448\u0438\u0435",
    it: "Chat fantasma \u2014 solo i giocatori eliminati possono vederlo",
    ar: "\u062f\u0631\u062f\u0634\u0629 \u0627\u0644\u0623\u0634\u0628\u0627\u062d \u2014 \u0641\u0642\u0637 \u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0645\u0642\u0635\u064a\u0648\u0646 \u064a\u0645\u0643\u0646\u0647\u0645 \u0627\u0644\u0631\u0624\u064a\u0629",
  },

  // ── Buttons / actions ──────────────────────────────────────────────────
  "btn.send_failed": {
    en: "Send failed. Try again?", zh: "\u53d1\u9001\u5931\u8d25\uff0c\u91cd\u8bd5\uff1f", de: "Senden fehlgeschlagen. Nochmal?",
    fr: "\u00c9chec de l\u2019envoi. R\u00e9essayer ?", es: "Error al enviar. \u00bfReintentar?", ja: "\u9001\u4fe1\u5931\u6557\u3002\u518d\u8a66\u884c\uff1f",
    ko: "\uc804\uc1a1 \uc2e4\ud328. \ub2e4\uc2dc \uc2dc\ub3c4?", pt: "Falha ao enviar. Tentar novamente?", ru: "\u041e\u0448\u0438\u0431\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438. \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c?",
    it: "Invio fallito. Riprovare?", ar: "\u0641\u0634\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644. \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629\u061f",
  },
  "btn.retry": {
    en: "Retry", zh: "\u91cd\u8bd5", de: "Wiederholen", fr: "R\u00e9essayer",
    es: "Reintentar", ja: "\u518d\u8a66\u884c", ko: "\uc7ac\uc2dc\ub3c4",
    pt: "Tentar novamente", ru: "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c", it: "Riprova", ar: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629",
  },
  "btn.cancel": {
    en: "Cancel", zh: "\u53d6\u6d88", de: "Abbrechen", fr: "Annuler",
    es: "Cancelar", ja: "\u30ad\u30e3\u30f3\u30bb\u30eb", ko: "\ucde8\uc18c",
    pt: "Cancelar", ru: "\u041e\u0442\u043c\u0435\u043d\u0430", it: "Annulla", ar: "\u0625\u0644\u063a\u0627\u0621",
  },
  "btn.add_character": {
    en: "Add Character", zh: "\u6dfb\u52a0\u89d2\u8272", de: "Charakter hinzuf\u00fcgen", fr: "Ajouter un personnage",
    es: "A\u00f1adir personaje", ja: "\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3092\u8ffd\u52a0", ko: "\uce90\ub9ad\ud130 \ucd94\uac00",
    pt: "Adicionar personagem", ru: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430", it: "Aggiungi personaggio", ar: "\u0625\u0636\u0627\u0641\u0629 \u0634\u062e\u0635\u064a\u0629",
  },

  // ── Quick actions (scene) ──────────────────────────────────────────────
  "action.look_around": {
    en: "Look around", zh: "\u73af\u987e\u56db\u5468", de: "Umsehen", fr: "Regarder autour",
    es: "Mirar alrededor", ja: "\u5468\u308a\u3092\u898b\u308b", ko: "\ub458\ub7ec\ubcf4\uae30",
    pt: "Olhar ao redor", ru: "\u041e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c\u0441\u044f", it: "Guardarsi intorno", ar: "\u0627\u0644\u0646\u0638\u0631 \u062d\u0648\u0644\u0643",
  },
  "action.ask": {
    en: "Ask", zh: "\u63d0\u95ee", de: "Fragen", fr: "Demander",
    es: "Preguntar", ja: "\u8cea\u554f", ko: "\uc9c8\ubb38",
    pt: "Perguntar", ru: "\u0421\u043f\u0440\u043e\u0441\u0438\u0442\u044c", it: "Chiedere", ar: "\u0627\u0633\u0623\u0644",
  },
  "action.lets_go": {
    en: "Let's go", zh: "\u51fa\u53d1", de: "Los geht's", fr: "Allons-y",
    es: "Vamos", ja: "\u884c\u3053\u3046", ko: "\uac00\uc790",
    pt: "Vamos", ru: "\u041f\u043e\u0439\u0434\u0451\u043c", it: "Andiamo", ar: "\u0647\u064a\u0627 \u0628\u0646\u0627",
  },
  "action.wait": {
    en: "Wait", zh: "\u7b49\u7b49", de: "Warte", fr: "Attends",
    es: "Espera", ja: "\u5f85\u3066", ko: "\uae30\ub2e4\ub824",
    pt: "Espere", ru: "\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435", it: "Aspetta", ar: "\u0627\u0646\u062a\u0638\u0631",
  },
  "action.run": {
    en: "Run", zh: "\u5feb\u8dd1", de: "Rennen", fr: "Courir",
    es: "Correr", ja: "\u8d70\u308c", ko: "\ub2ec\ub9ac\uae30",
    pt: "Correr", ru: "\u0411\u0435\u0436\u0430\u0442\u044c", it: "Corri", ar: "\u0627\u0631\u0643\u0636",
  },
  "action.investigate": {
    en: "Investigate", zh: "\u8c03\u67e5", de: "Untersuchen", fr: "Enqu\u00eater",
    es: "Investigar", ja: "\u8abf\u67fb", ko: "\uc870\uc0ac",
    pt: "Investigar", ru: "\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u044c", it: "Indagare", ar: "\u062a\u062d\u0642\u064a\u0642",
  },
  "action.respond": {
    en: "Respond", zh: "\u56de\u5e94", de: "Antworten", fr: "R\u00e9pondre",
    es: "Responder", ja: "\u5fdc\u7b54", ko: "\uc751\ub2f5",
    pt: "Responder", ru: "\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c", it: "Rispondi", ar: "\u0631\u062f",
  },
  "action.react": {
    en: "React", zh: "\u53cd\u5e94", de: "Reagieren", fr: "R\u00e9agir",
    es: "Reaccionar", ja: "\u53cd\u5fdc", ko: "\ubc18\uc751",
    pt: "Reagir", ru: "\u041e\u0442\u0440\u0435\u0430\u0433\u0438\u0440\u043e\u0432\u0430\u0442\u044c", it: "Reagire", ar: "\u0631\u062f \u0641\u0639\u0644",
  },

  // ── Quick actions (script-kill / template) ─────────────────────────────
  "action.interrogate": {
    en: "Interrogate", zh: "\u5ba1\u8baf", de: "Verh\u00f6ren", fr: "Interroger",
    es: "Interrogar", ja: "\u5c0b\u554f", ko: "\uc2ec\ubb38",
    pt: "Interrogar", ru: "\u0414\u043e\u043f\u0440\u043e\u0441\u0438\u0442\u044c", it: "Interrogare", ar: "\u0627\u0633\u062a\u062c\u0648\u0627\u0628",
  },
  "action.present_evidence": {
    en: "Present evidence", zh: "\u51fa\u793a\u8bc1\u636e", de: "Beweis vorlegen", fr: "Pr\u00e9senter une preuve",
    es: "Presentar prueba", ja: "\u8a3c\u62e0\u3092\u63d0\u793a", ko: "\uc99d\uac70 \uc81c\uc2dc",
    pt: "Apresentar evid\u00eancia", ru: "\u041f\u0440\u0435\u0434\u044a\u044f\u0432\u0438\u0442\u044c \u0443\u043b\u0438\u043a\u0443", it: "Presentare prove", ar: "\u062a\u0642\u062f\u064a\u0645 \u062f\u0644\u064a\u0644",
  },
  "action.challenge": {
    en: "Challenge", zh: "\u8d28\u7591", de: "Herausfordern", fr: "Contester",
    es: "Desaf\u00edar", ja: "\u7570\u8b70", ko: "\uc774\uc758 \uc81c\uae30",
    pt: "Contestar", ru: "\u041e\u0441\u043f\u043e\u0440\u0438\u0442\u044c", it: "Contestare", ar: "\u0627\u0639\u062a\u0631\u0627\u0636",
  },
  "action.examine_scene": {
    en: "Examine scene", zh: "\u68c0\u67e5\u73b0\u573a", de: "Szene untersuchen", fr: "Examiner la sc\u00e8ne",
    es: "Examinar escena", ja: "\u73fe\u5834\u3092\u8abf\u3079\u308b", ko: "\ud604\uc7a5 \uc870\uc0ac",
    pt: "Examinar cena", ru: "\u041e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0441\u0446\u0435\u043d\u0443", it: "Esaminare la scena", ar: "\u0641\u062d\u0635 \u0627\u0644\u0645\u0634\u0647\u062f",
  },
  "action.review_timeline": {
    en: "Review timeline", zh: "\u56de\u987e\u65f6\u95f4\u7ebf", de: "Zeitlinie pr\u00fcfen", fr: "Revoir la chronologie",
    es: "Revisar l\u00ednea de tiempo", ja: "\u30bf\u30a4\u30e0\u30e9\u30a4\u30f3\u78ba\u8a8d", ko: "\ud0c0\uc784\ub77c\uc778 \uac80\ud1a0",
    pt: "Revisar linha do tempo", ru: "\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0445\u0440\u043e\u043d\u043e\u043b\u043e\u0433\u0438\u044e", it: "Rivedere la cronologia", ar: "\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064a",
  },
  "action.final_accusation": {
    en: "Final accusation", zh: "\u6700\u7ec8\u6307\u63a7", de: "Endanklage", fr: "Accusation finale",
    es: "Acusaci\u00f3n final", ja: "\u6700\u7d42\u544a\u767a", ko: "\ucd5c\uc885 \uace0\ubc1c",
    pt: "Acusa\u00e7\u00e3o final", ru: "\u0424\u0438\u043d\u0430\u043b\u044c\u043d\u043e\u0435 \u043e\u0431\u0432\u0438\u043d\u0435\u043d\u0438\u0435", it: "Accusa finale", ar: "\u0627\u0644\u0627\u062a\u0647\u0627\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064a",
  },

  // ── Navigation ─────────────────────────────────────────────────────────
  "nav.home": {
    en: "Home", zh: "\u9996\u9875", de: "Startseite", fr: "Accueil",
    es: "Inicio", ja: "\u30db\u30fc\u30e0", ko: "\ud648",
    pt: "In\u00edcio", ru: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f", it: "Home", ar: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  },
  "nav.my_games": {
    en: "My Games", zh: "\u6211\u7684\u6e38\u620f", de: "Meine Spiele", fr: "Mes Jeux",
    es: "Mis Juegos", ja: "\u30de\u30a4\u30b2\u30fc\u30e0", ko: "\ub0b4 \uac8c\uc784",
    pt: "Meus Jogos", ru: "\u041c\u043e\u0438 \u0438\u0433\u0440\u044b", it: "I miei giochi", ar: "\u0623\u0644\u0639\u0627\u0628\u064a",
  },
  "nav.discover": {
    en: "Discover", zh: "\u53d1\u73b0", de: "Entdecken", fr: "D\u00e9couvrir",
    es: "Descubrir", ja: "\u63a2\u7d22", ko: "\ud0d0\uc0c9",
    pt: "Descobrir", ru: "\u041e\u0431\u0437\u043e\u0440", it: "Scopri", ar: "\u0627\u0633\u062a\u0643\u0634\u0641",
  },
  "nav.create_game": {
    en: "Create Game", zh: "\u521b\u5efa\u6e38\u620f", de: "Spiel erstellen", fr: "Cr\u00e9er un jeu",
    es: "Crear juego", ja: "\u30b2\u30fc\u30e0\u4f5c\u6210", ko: "\uac8c\uc784 \ub9cc\ub4e4\uae30",
    pt: "Criar jogo", ru: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0438\u0433\u0440\u0443", it: "Crea gioco", ar: "\u0625\u0646\u0634\u0627\u0621 \u0644\u0639\u0628\u0629",
  },
  "nav.sign_in": {
    en: "Sign In", zh: "\u767b\u5f55", de: "Anmelden", fr: "Se connecter",
    es: "Iniciar sesi\u00f3n", ja: "\u30b5\u30a4\u30f3\u30a4\u30f3", ko: "\ub85c\uadf8\uc778",
    pt: "Entrar", ru: "\u0412\u043e\u0439\u0442\u0438", it: "Accedi", ar: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  },

  // ── Game page ──────────────────────────────────────────────────────────
  "game.not_found": {
    en: "Game not found", zh: "\u6e38\u620f\u672a\u627e\u5230", de: "Spiel nicht gefunden", fr: "Jeu introuvable",
    es: "Juego no encontrado", ja: "\u30b2\u30fc\u30e0\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093", ko: "\uac8c\uc784\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
    pt: "Jogo n\u00e3o encontrado", ru: "\u0418\u0433\u0440\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430", it: "Gioco non trovato", ar: "\u0627\u0644\u0644\u0639\u0628\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629",
  },
  "game.not_found_desc": {
    en: "This game may have been deleted or you may not have access to it.",
    zh: "\u8be5\u6e38\u620f\u53ef\u80fd\u5df2\u88ab\u5220\u9664\uff0c\u6216\u4f60\u6ca1\u6709\u8bbf\u95ee\u6743\u9650\u3002",
    de: "Dieses Spiel wurde m\u00f6glicherweise gel\u00f6scht oder du hast keinen Zugriff.",
    fr: "Ce jeu a peut-\u00eatre \u00e9t\u00e9 supprim\u00e9 ou vous n\u2019y avez pas acc\u00e8s.",
    es: "Este juego puede haber sido eliminado o no tienes acceso.",
    ja: "\u3053\u306e\u30b2\u30fc\u30e0\u306f\u524a\u9664\u3055\u308c\u305f\u304b\u3001\u30a2\u30af\u30bb\u30b9\u6a29\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
    ko: "\uc774 \uac8c\uc784\uc774 \uc0ad\uc81c\ub418\uc5c8\uac70\ub098 \uc811\uadfc \uad8c\ud55c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
    pt: "Este jogo pode ter sido exclu\u00eddo ou voc\u00ea n\u00e3o tem acesso.",
    ru: "\u0418\u0433\u0440\u0430 \u043c\u043e\u0433\u043b\u0430 \u0431\u044b\u0442\u044c \u0443\u0434\u0430\u043b\u0435\u043d\u0430 \u0438\u043b\u0438 \u0443 \u0432\u0430\u0441 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430.",
    it: "Questo gioco potrebbe essere stato eliminato o non hai accesso.",
    ar: "\u0642\u062f \u062a\u0643\u0648\u0646 \u0647\u0630\u0647 \u0627\u0644\u0644\u0639\u0628\u0629 \u0642\u062f \u062d\u064f\u0630\u0641\u062a \u0623\u0648 \u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0648\u0635\u0648\u0644.",
  },
  "game.nothing_here": {
    en: "Nothing here yet.", zh: "\u8fd8\u6ca1\u6709\u5185\u5bb9\u3002", de: "Noch nichts hier.",
    fr: "Rien ici pour le moment.", es: "Nada aqu\u00ed a\u00fan.", ja: "\u307e\u3060\u4f55\u3082\u3042\u308a\u307e\u305b\u3093\u3002",
    ko: "\uc544\uc9c1 \uc544\ubb34\uac83\ub3c4 \uc5c6\uc2b5\ub2c8\ub2e4.", pt: "Nada aqui ainda.", ru: "\u041f\u043e\u043a\u0430 \u043f\u0443\u0441\u0442\u043e.",
    it: "Ancora niente qui.", ar: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0634\u064a\u0621 \u0647\u0646\u0627 \u0628\u0639\u062f.",
  },
  "game.board_hint": {
    en: "The Game Master will update your board as the game progresses.",
    zh: "\u6e38\u620f\u8fdb\u884c\u65f6\u4f1a\u81ea\u52a8\u66f4\u65b0\u4f60\u7684\u9762\u677f\u3002",
    de: "Der Spielleiter aktualisiert dein Board im Spielverlauf.",
    fr: "Le ma\u00eetre du jeu mettra \u00e0 jour votre tableau.",
    es: "El director del juego actualizar\u00e1 tu tablero.",
    ja: "\u30b2\u30fc\u30e0\u304c\u9032\u3080\u3068\u30dc\u30fc\u30c9\u304c\u66f4\u65b0\u3055\u308c\u307e\u3059\u3002",
    ko: "\uac8c\uc784\uc774 \uc9c4\ud589\ub418\uba74 \ubcf4\ub4dc\uac00 \uc5c5\ub370\uc774\ud2b8\ub429\ub2c8\ub2e4.",
    pt: "O mestre do jogo atualizar\u00e1 seu painel conforme o jogo progride.",
    ru: "\u0414\u043e\u0441\u043a\u0430 \u0431\u0443\u0434\u0435\u0442 \u043e\u0431\u043d\u043e\u0432\u043b\u044f\u0442\u044c\u0441\u044f \u043f\u043e \u0445\u043e\u0434\u0443 \u0438\u0433\u0440\u044b.",
    it: "Il master aggiorner\u00e0 il tuo pannello man mano che il gioco prosegue.",
    ar: "\u0633\u064a\u0642\u0648\u0645 \u0645\u062f\u064a\u0631 \u0627\u0644\u0644\u0639\u0628\u0629 \u0628\u062a\u062d\u062f\u064a\u062b \u0644\u0648\u062d\u062a\u0643.",
  },

  // ── Greetings ──────────────────────────────────────────────────────────
  "greeting.solo": {
    en: "Welcome! Just type your response below when it\u2019s your turn \u2014 you can also tap a suggested reply. Let\u2019s begin!",
    zh: "\u6b22\u8fce\uff01\u8f6e\u5230\u4f60\u65f6\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\uff0c\u4e5f\u53ef\u4ee5\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u5f00\u59cb\u5427\uff01",
    de: "Willkommen! Tippe deine Antwort unten ein, wenn du dran bist. Los geht\u2019s!",
    fr: "Bienvenue ! Tapez votre r\u00e9ponse ci-dessous quand c\u2019est votre tour. C\u2019est parti !",
    es: "\u00a1Bienvenido! Escribe tu respuesta abajo cuando sea tu turno. \u00a1Empecemos!",
    ja: "\u3088\u3046\u3053\u305d\uff01\u3042\u306a\u305f\u306e\u756a\u306b\u306a\u3063\u305f\u3089\u4e0b\u306b\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u59cb\u3081\u307e\u3057\u3087\u3046\uff01",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4! \ucc28\ub840\uac00 \ub418\uba74 \uc544\ub798\uc5d0 \uc751\ub2f5\uc744 \uc785\ub825\ud558\uc138\uc694. \uc2dc\uc791\ud569\ub2c8\ub2e4!",
    pt: "Bem-vindo! Digite sua resposta abaixo quando for sua vez. Vamos come\u00e7ar!",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c! \u041f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0432\u0435\u0442 \u043d\u0438\u0436\u0435. \u041d\u0430\u0447\u043d\u0451\u043c!",
    it: "Benvenuto! Scrivi la tua risposta qui sotto. Iniziamo!",
    ar: "\u0623\u0647\u0644\u0627\u064b! \u0627\u0643\u062a\u0628 \u0631\u062f\u0643 \u0623\u062f\u0646\u0627\u0647 \u0639\u0646\u062f\u0645\u0627 \u064a\u062d\u064a\u0646 \u062f\u0648\u0631\u0643. \u0647\u064a\u0627 \u0646\u0628\u062f\u0623!",
  },
  "greeting.hidden_roles": {
    en: "Welcome, {count} players! Roles have been secretly assigned \u2014 check **\u201cMy Board\u201d** on the left for your identity.\n\nWhen it\u2019s your turn, type your response below or tap a suggested reply. Night falls\u2026",
    zh: "\u6b22\u8fce\uff0c{count} \u4f4d\u73a9\u5bb6\uff01\u89d2\u8272\u5df2\u79d8\u5bc6\u5206\u914d\u2014\u2014\u70b9\u51fb\u5de6\u4fa7 **\u201cMy Board\u201d** \u67e5\u770b\u4f60\u7684\u8eab\u4efd\u3002\n\n\u8f6e\u5230\u4f60\u65f6\uff0c\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\u6216\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u591c\u5e55\u964d\u4e34\u2026\u2026",
    de: "Willkommen, {count} Spieler! Rollen wurden heimlich zugewiesen \u2014 pr\u00fcfe **\u201eMy Board\u201c** links.\n\nWenn du dran bist, tippe deine Antwort ein. Die Nacht bricht herein\u2026",
    fr: "Bienvenue, {count} joueurs ! Les r\u00f4les ont \u00e9t\u00e9 attribu\u00e9s \u2014 consultez **\u00ab My Board \u00bb** \u00e0 gauche.\n\nLa nuit tombe\u2026",
    es: "\u00a1Bienvenidos, {count} jugadores! Los roles han sido asignados \u2014 revisa **\u201cMy Board\u201d** a la izquierda.\n\nCae la noche\u2026",
    ja: "\u3088\u3046\u3053\u305d\u3001{count}\u4eba\u306e\u30d7\u30ec\u30a4\u30e4\u30fc\uff01\u5f79\u8077\u304c\u914d\u5e03\u3055\u308c\u307e\u3057\u305f\u2014\u2014\u5de6\u306e **\u201cMy Board\u201d** \u3067\u78ba\u8a8d\u3002\n\n\u591c\u304c\u8fc7\u308a\u307e\u3059\u2026",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4, {count}\uba85! \uc5ed\ud560\uc774 \ubc30\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4 \u2014 \uc67c\ucabd **\u201cMy Board\u201d**\uc5d0\uc11c \ud655\uc778\ud558\uc138\uc694.\n\n\ubc24\uc774 \ucc3e\uc544\uc635\ub2c8\ub2e4\u2026",
    pt: "Bem-vindos, {count} jogadores! Os pap\u00e9is foram atribu\u00eddos \u2014 verifique **\u201cMy Board\u201d** \u00e0 esquerda.\n\nA noite cai\u2026",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c, {count} \u0438\u0433\u0440\u043e\u043a\u043e\u0432! \u0420\u043e\u043b\u0438 \u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u044b \u2014 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 **\u00abMy Board\u00bb** \u0441\u043b\u0435\u0432\u0430.\n\n\u041d\u043e\u0447\u044c \u043d\u0430\u0441\u0442\u0443\u043f\u0430\u0435\u0442\u2026",
    it: "Benvenuti, {count} giocatori! I ruoli sono stati assegnati \u2014 controlla **\u201cMy Board\u201d** a sinistra.\n\nScende la notte\u2026",
    ar: "\u0623\u0647\u0644\u0627\u064b\u060c {count} \u0644\u0627\u0639\u0628\u064a\u0646! \u062a\u0645 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u2014 \u062a\u062d\u0642\u0642 \u0645\u0646 **\u201cMy Board\u201d**.\n\n\u064a\u062d\u0644 \u0627\u0644\u0644\u064a\u0644\u2026",
  },
  "greeting.default": {
    en: "Welcome! The game begins now with {count} players. When you see **\u201cIt\u2019s your turn\u201d**, type your response below \u2014 or tap a suggested reply to jump right in. Let\u2019s go!",
    zh: "\u6b22\u8fce\uff01\u6e38\u620f\u5f00\u59cb\uff0c\u5171 {count} \u4f4d\u73a9\u5bb6\u3002\u770b\u5230 **\u201c\u8f6e\u5230\u4f60\u53d1\u8a00\u201d** \u65f6\uff0c\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\u6216\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u5f00\u59cb\u5427\uff01",
    de: "Willkommen! Das Spiel beginnt mit {count} Spielern. Wenn du **\u201eDu bist dran\u201c** siehst, tippe deine Antwort ein. Los geht\u2019s!",
    fr: "Bienvenue ! La partie commence avec {count} joueurs. C\u2019est parti !",
    es: "\u00a1Bienvenidos! El juego comienza con {count} jugadores. \u00a1Vamos!",
    ja: "\u3088\u3046\u3053\u305d\uff01{count}\u4eba\u3067\u30b2\u30fc\u30e0\u958b\u59cb\u3002\u59cb\u3081\u307e\u3057\u3087\u3046\uff01",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4! {count}\uba85\uc73c\ub85c \uac8c\uc784 \uc2dc\uc791!",
    pt: "Bem-vindos! O jogo come\u00e7a com {count} jogadores. Vamos l\u00e1!",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c! \u0418\u0433\u0440\u0430 \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442\u0441\u044f \u0441 {count} \u0438\u0433\u0440\u043e\u043a\u0430\u043c\u0438. \u041d\u0430\u0447\u043d\u0451\u043c!",
    it: "Benvenuti! La partita inizia con {count} giocatori. Iniziamo!",
    ar: "\u0623\u0647\u0644\u0627\u064b! \u062a\u0628\u062f\u0623 \u0627\u0644\u0644\u0639\u0628\u0629 \u0645\u0639 {count} \u0644\u0627\u0639\u0628\u064a\u0646. \u0647\u064a\u0627 \u0646\u0628\u062f\u0623!",
  },

  // ── Scene select ───────────────────────────────────────────────────────
  "scene.pick_adventure": {
    en: "Pick an adventure", zh: "\u9009\u62e9\u4e00\u4e2a\u5192\u9669", de: "W\u00e4hle ein Abenteuer",
    fr: "Choisissez une aventure", es: "Elige una aventura", ja: "\u30a2\u30c9\u30d9\u30f3\u30c1\u30e3\u30fc\u3092\u9078\u3076",
    ko: "\ubaa8\ud5d8\uc744 \uc120\ud0dd\ud558\uc138\uc694", pt: "Escolha uma aventura", ru: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u0438\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435",
    it: "Scegli un\u2019avventura", ar: "\u0627\u062e\u062a\u0631 \u0645\u063a\u0627\u0645\u0631\u0629",
  },
  "scene.tap_to_start": {
    en: "Tap to start \u2192", zh: "\u70b9\u51fb\u5f00\u59cb \u2192", de: "Tippe zum Starten \u2192",
    fr: "Appuyez pour commencer \u2192", es: "Toca para empezar \u2192", ja: "\u30bf\u30c3\u30d7\u3057\u3066\u958b\u59cb \u2192",
    ko: "\ud0ed\ud558\uc5ec \uc2dc\uc791 \u2192", pt: "Toque para come\u00e7ar \u2192", ru: "\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0434\u043b\u044f \u0441\u0442\u0430\u0440\u0442\u0430 \u2192",
    it: "Tocca per iniziare \u2192", ar: "\u0627\u0646\u0642\u0631 \u0644\u0644\u0628\u062f\u0621 \u2192",
  },

  // ── Discover page ──────────────────────────────────────────────────────
  "discover.title": {
    en: "Discover", zh: "\u53d1\u73b0", de: "Entdecken", fr: "D\u00e9couvrir",
    es: "Descubrir", ja: "\u63a2\u7d22", ko: "\ud0d0\uc0c9",
    pt: "Descobrir", ru: "\u041e\u0431\u0437\u043e\u0440", it: "Scopri", ar: "\u0627\u0633\u062a\u0643\u0634\u0641",
  },
  "discover.games": {
    en: "Games", zh: "\u6e38\u620f", de: "Spiele", fr: "Jeux",
    es: "Juegos", ja: "\u30b2\u30fc\u30e0", ko: "\uac8c\uc784",
    pt: "Jogos", ru: "\u0418\u0433\u0440\u044b", it: "Giochi", ar: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628",
  },
  "discover.search": {
    en: "Search games\u2026", zh: "\u641c\u7d22\u6e38\u620f\u2026", de: "Spiele suchen\u2026",
    fr: "Rechercher des jeux\u2026", es: "Buscar juegos\u2026", ja: "\u30b2\u30fc\u30e0\u3092\u691c\u7d22\u2026",
    ko: "\uac8c\uc784 \uac80\uc0c9\u2026", pt: "Pesquisar jogos\u2026", ru: "\u041f\u043e\u0438\u0441\u043a \u0438\u0433\u0440\u2026",
    it: "Cerca giochi\u2026", ar: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0623\u0644\u0639\u0627\u0628\u2026",
  },
  "discover.no_results": {
    en: "No games found", zh: "\u672a\u627e\u5230\u6e38\u620f", de: "Keine Spiele gefunden",
    fr: "Aucun jeu trouv\u00e9", es: "No se encontraron juegos", ja: "\u30b2\u30fc\u30e0\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093",
    ko: "\uac8c\uc784\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4", pt: "Nenhum jogo encontrado", ru: "\u0418\u0433\u0440\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b",
    it: "Nessun gioco trovato", ar: "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0623\u0644\u0639\u0627\u0628",
  },
  "discover.multiplayer": {
    en: "Multiplayer", zh: "\u591a\u4eba\u6e38\u620f", de: "Mehrspieler", fr: "Multijoueur",
    es: "Multijugador", ja: "\u30de\u30eb\u30c1\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "\uba40\ud2f0\ud50c\ub808\uc774\uc5b4",
    pt: "Multijogador", ru: "\u041c\u043d\u043e\u0433\u043e\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0430\u044f", it: "Multigiocatore", ar: "\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Translate a key. If `lang` is omitted, reads from stored preference / browser.
 * Supports `{placeholder}` interpolation.
 */
export function t(key: string, lang?: string, vars?: Record<string, string | number>): string {
  const effectiveLang = lang ?? getAppLanguage();
  const entry = T[key];
  if (!entry) return key;
  const base = resolveKey(effectiveLang);
  let text = entry[base] ?? entry.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

/**
 * Translate a quick-action label. Tries `action.<normalized>` key first,
 * falls back to the original label for user/AI-generated actions.
 */
export function tAction(label: string, lang?: string): string {
  const key = `action.${label.toLowerCase().replace(/\s+/g, "_")}`;
  const entry = T[key];
  if (!entry) return label;
  const effectiveLang = lang ?? getAppLanguage();
  const base = resolveKey(effectiveLang);
  return entry[base] ?? entry.en ?? label;
}

/** @deprecated Use `getAppLanguage()` instead */
export function getBrowserLanguage(): string {
  return getAppLanguage();
}
