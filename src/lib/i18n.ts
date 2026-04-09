/**
 * Lightweight i18n for game UI strings.
 * AI-generated content (narration, character speech) is handled by
 * buildLanguageInstruction() in content-language.ts — this file only
 * covers hardcoded UI text like greetings, turn indicators, and placeholders.
 */

const translations: Record<string, Record<string, string>> = {
  // ─── Turn indicator ─────────────────────────────────────────────
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

  // ─── Input placeholders ─────────────────────────────────────────
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

  // ─── Loading / status ────────────────────────────────────────────
  "status.ai_responding": {
    en: "AI players are responding \u2014 you can type ahead",
    zh: "AI \u73a9\u5bb6\u6b63\u5728\u56de\u590d\u2014\u2014\u4f60\u53ef\u4ee5\u63d0\u524d\u8f93\u5165",
    de: "KI-Spieler antworten \u2014 du kannst schon tippen",
    fr: "Les joueurs IA r\u00e9pondent \u2014 vous pouvez taper en attendant",
    es: "Los jugadores IA est\u00e1n respondiendo \u2014 puedes escribir mientras",
    ja: "AI\u30d7\u30ec\u30a4\u30e4\u30fc\u304c\u5fdc\u7b54\u4e2d\u2014\u2014\u5148\u306b\u5165\u529b\u3067\u304d\u307e\u3059",
    ko: "AI \ud50c\ub808\uc774\uc5b4\uac00 \uc751\ub2f5 \uc911 \u2014 \ubbf8\ub9ac \uc785\ub825\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4",
    pt: "Jogadores IA est\u00e3o respondendo \u2014 voc\u00ea pode digitar enquanto isso",
    ru: "\u0418\u0418-\u0438\u0433\u0440\u043e\u043a\u0438 \u043e\u0442\u0432\u0435\u0447\u0430\u044e\u0442 \u2014 \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0438\u0441\u0430\u0442\u044c \u0437\u0430\u0440\u0430\u043d\u0435\u0435",
    it: "I giocatori IA stanno rispondendo \u2014 puoi scrivere in anticipo",
    ar: "\u0644\u0627\u0639\u0628\u0648 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0631\u062f\u0648\u0646 \u2014 \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0645\u0633\u0628\u0642\u0627\u064b",
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

  // ─── Opening greetings ──────────────────────────────────────────
  "greeting.solo": {
    en: "Welcome! Just type your response below when it\u2019s your turn \u2014 you can also tap a suggested reply. Let\u2019s begin!",
    zh: "\u6b22\u8fce\uff01\u8f6e\u5230\u4f60\u65f6\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\uff0c\u4e5f\u53ef\u4ee5\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u5feb\u901f\u56de\u5e94\u3002\u5f00\u59cb\u5427\uff01",
    de: "Willkommen! Tippe deine Antwort unten ein, wenn du dran bist \u2014 du kannst auch eine vorgeschlagene Antwort antippen. Los geht\u2019s!",
    fr: "Bienvenue ! Tapez votre r\u00e9ponse ci-dessous quand c\u2019est votre tour \u2014 vous pouvez aussi appuyer sur une r\u00e9ponse sugg\u00e9r\u00e9e. C\u2019est parti !",
    es: "\u00a1Bienvenido! Escribe tu respuesta abajo cuando sea tu turno \u2014 tambi\u00e9n puedes tocar una respuesta sugerida. \u00a1Empecemos!",
    ja: "\u3088\u3046\u3053\u305d\uff01\u3042\u306a\u305f\u306e\u756a\u306b\u306a\u3063\u305f\u3089\u4e0b\u306b\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u30af\u30a4\u30c3\u30af\u30ea\u30d7\u30e9\u30a4\u3082\u4f7f\u3048\u307e\u3059\u3002\u59cb\u3081\u307e\u3057\u3087\u3046\uff01",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4! \ucc28\ub840\uac00 \ub418\uba74 \uc544\ub798\uc5d0 \uc751\ub2f5\uc744 \uc785\ub825\ud558\uc138\uc694. \ube60\ub978 \uc751\ub2f5 \ubc84\ud2bc\ub3c4 \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc2dc\uc791\ud569\ub2c8\ub2e4!",
    pt: "Bem-vindo! Digite sua resposta abaixo quando for sua vez \u2014 voc\u00ea tamb\u00e9m pode tocar em uma resposta sugerida. Vamos come\u00e7ar!",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c! \u041f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0432\u0435\u0442 \u043d\u0438\u0436\u0435, \u043a\u043e\u0433\u0434\u0430 \u043f\u0440\u0438\u0434\u0451\u0442 \u0432\u0430\u0448\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u044c. \u041d\u0430\u0447\u043d\u0451\u043c!",
    it: "Benvenuto! Scrivi la tua risposta qui sotto quando \u00e8 il tuo turno \u2014 puoi anche toccare una risposta suggerita. Iniziamo!",
    ar: "\u0623\u0647\u0644\u0627\u064b! \u0627\u0643\u062a\u0628 \u0631\u062f\u0643 \u0623\u062f\u0646\u0627\u0647 \u0639\u0646\u062f\u0645\u0627 \u064a\u062d\u064a\u0646 \u062f\u0648\u0631\u0643. \u0647\u064a\u0627 \u0646\u0628\u062f\u0623!",
  },
  "greeting.hidden_roles": {
    en: "Welcome, {count} players! Roles have been secretly assigned \u2014 check **\u201cMy Board\u201d** on the left for your identity.\n\nWhen it\u2019s your turn, type your response below or tap a suggested reply. Night falls\u2026",
    zh: "\u6b22\u8fce\uff0c{count} \u4f4d\u73a9\u5bb6\uff01\u89d2\u8272\u5df2\u79d8\u5bc6\u5206\u914d\u2014\u2014\u70b9\u51fb\u5de6\u4fa7 **\u201cMy Board\u201d** \u67e5\u770b\u4f60\u7684\u8eab\u4efd\u3002\n\n\u8f6e\u5230\u4f60\u65f6\uff0c\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\u6216\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u591c\u5e55\u964d\u4e34\u2026\u2026",
    de: "Willkommen, {count} Spieler! Rollen wurden heimlich zugewiesen \u2014 pr\u00fcfe **\u201eMy Board\u201c** links f\u00fcr deine Identit\u00e4t.\n\nWenn du dran bist, tippe deine Antwort unten ein. Die Nacht bricht herein\u2026",
    fr: "Bienvenue, {count} joueurs ! Les r\u00f4les ont \u00e9t\u00e9 secr\u00e8tement attribu\u00e9s \u2014 consultez **\u00ab My Board \u00bb** \u00e0 gauche.\n\nQuand c\u2019est votre tour, tapez votre r\u00e9ponse. La nuit tombe\u2026",
    es: "\u00a1Bienvenidos, {count} jugadores! Los roles han sido asignados en secreto \u2014 revisa **\u201cMy Board\u201d** a la izquierda.\n\nCuando sea tu turno, escribe tu respuesta. Cae la noche\u2026",
    ja: "\u3088\u3046\u3053\u305d\u3001{count}\u4eba\u306e\u30d7\u30ec\u30a4\u30e4\u30fc\uff01\u5f79\u8077\u304c\u79d8\u5bc6\u88cf\u306b\u914d\u5e03\u3055\u308c\u307e\u3057\u305f\u2014\u2014\u5de6\u306e **\u201cMy Board\u201d** \u3067\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002\n\n\u3042\u306a\u305f\u306e\u756a\u304c\u6765\u305f\u3089\u5fdc\u7b54\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u591c\u304c\u8fc7\u308a\u307e\u3059\u2026",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4, {count}\uba85\uc758 \ud50c\ub808\uc774\uc5b4! \uc5ed\ud560\uc774 \ube44\ubc00\ub9ac \ubc30\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4 \u2014 \uc67c\ucabd **\u201cMy Board\u201d**\uc5d0\uc11c \ud655\uc778\ud558\uc138\uc694.\n\n\ucc28\ub840\uac00 \ub418\uba74 \uc751\ub2f5\uc744 \uc785\ub825\ud558\uc138\uc694. \ubc24\uc774 \ucc3e\uc544\uc635\ub2c8\ub2e4\u2026",
    pt: "Bem-vindos, {count} jogadores! Os pap\u00e9is foram atribu\u00eddos secretamente \u2014 verifique **\u201cMy Board\u201d** \u00e0 esquerda.\n\nQuando for sua vez, digite sua resposta. A noite cai\u2026",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c, {count} \u0438\u0433\u0440\u043e\u043a\u043e\u0432! \u0420\u043e\u043b\u0438 \u0442\u0430\u0439\u043d\u043e \u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u044b \u2014 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 **\u00abMy Board\u00bb** \u0441\u043b\u0435\u0432\u0430.\n\n\u041a\u043e\u0433\u0434\u0430 \u043f\u0440\u0438\u0434\u0451\u0442 \u0432\u0430\u0448\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u044c, \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0432\u0435\u0442. \u041d\u043e\u0447\u044c \u043d\u0430\u0441\u0442\u0443\u043f\u0430\u0435\u0442\u2026",
    it: "Benvenuti, {count} giocatori! I ruoli sono stati assegnati segretamente \u2014 controlla **\u201cMy Board\u201d** a sinistra.\n\nQuando \u00e8 il tuo turno, scrivi la tua risposta. Scende la notte\u2026",
    ar: "\u0623\u0647\u0644\u0627\u064b\u060c {count} \u0644\u0627\u0639\u0628\u064a\u0646! \u062a\u0645 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u0633\u0631\u0627\u064b \u2014 \u062a\u062d\u0642\u0642 \u0645\u0646 **\u201cMy Board\u201d** \u0639\u0644\u0649 \u0627\u0644\u064a\u0633\u0627\u0631.\n\n\u0639\u0646\u062f\u0645\u0627 \u064a\u062d\u064a\u0646 \u062f\u0648\u0631\u0643\u060c \u0627\u0643\u062a\u0628 \u0631\u062f\u0643. \u064a\u062d\u0644 \u0627\u0644\u0644\u064a\u0644\u2026",
  },
  "greeting.default": {
    en: "Welcome! The game begins now with {count} players. When you see **\u201cIt\u2019s your turn\u201d**, type your response below \u2014 or tap a suggested reply to jump right in. Let\u2019s go!",
    zh: "\u6b22\u8fce\uff01\u6e38\u620f\u5f00\u59cb\uff0c\u5171 {count} \u4f4d\u73a9\u5bb6\u3002\u770b\u5230 **\u201c\u8f6e\u5230\u4f60\u53d1\u8a00\u201d** \u65f6\uff0c\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\u6216\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u5f00\u59cb\u5427\uff01",
    de: "Willkommen! Das Spiel beginnt jetzt mit {count} Spielern. Wenn du **\u201eDu bist dran\u201c** siehst, tippe deine Antwort ein. Los geht\u2019s!",
    fr: "Bienvenue ! La partie commence avec {count} joueurs. Quand vous voyez **\u00ab C\u2019est votre tour \u00bb**, tapez votre r\u00e9ponse. C\u2019est parti !",
    es: "\u00a1Bienvenidos! El juego comienza con {count} jugadores. Cuando veas **\u201cEs tu turno\u201d**, escribe tu respuesta. \u00a1Vamos!",
    ja: "\u3088\u3046\u3053\u305d\uff01{count}\u4eba\u3067\u30b2\u30fc\u30e0\u958b\u59cb\u3067\u3059\u3002**\u300c\u3042\u306a\u305f\u306e\u756a\u3067\u3059\u300d**\u304c\u8868\u793a\u3055\u308c\u305f\u3089\u5fdc\u7b54\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u59cb\u3081\u307e\u3057\u3087\u3046\uff01",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4! {count}\uba85\uc73c\ub85c \uac8c\uc784\uc744 \uc2dc\uc791\ud569\ub2c8\ub2e4. **\u201c\ub2f9\uc2e0\uc758 \ucc28\ub840\u201d**\uac00 \ubcf4\uc774\uba74 \uc751\ub2f5\uc744 \uc785\ub825\ud558\uc138\uc694!",
    pt: "Bem-vindos! O jogo come\u00e7a agora com {count} jogadores. Quando vir **\u201c\u00c9 a sua vez\u201d**, digite sua resposta. Vamos l\u00e1!",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c! \u0418\u0433\u0440\u0430 \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442\u0441\u044f \u0441 {count} \u0438\u0433\u0440\u043e\u043a\u0430\u043c\u0438. \u041a\u043e\u0433\u0434\u0430 \u0443\u0432\u0438\u0434\u0438\u0442\u0435 **\u00ab\u0412\u0430\u0448\u0430 \u043e\u0447\u0435\u0440\u0435\u0434\u044c\u00bb**, \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0432\u0435\u0442. \u041d\u0430\u0447\u043d\u0451\u043c!",
    it: "Benvenuti! La partita inizia con {count} giocatori. Quando vedi **\u201c\u00c8 il tuo turno\u201d**, scrivi la tua risposta. Iniziamo!",
    ar: "\u0623\u0647\u0644\u0627\u064b! \u062a\u0628\u062f\u0623 \u0627\u0644\u0644\u0639\u0628\u0629 \u0645\u0639 {count} \u0644\u0627\u0639\u0628\u064a\u0646. \u0639\u0646\u062f\u0645\u0627 \u062a\u0631\u0649 **\u201c\u062f\u0648\u0631\u0643\u201d**\u060c \u0627\u0643\u062a\u0628 \u0631\u062f\u0643. \u0647\u064a\u0627 \u0646\u0628\u062f\u0623!",
  },
};

/**
 * Resolve a language code like "zh-CN", "de-DE", "fr" to a base key
 * that matches our translation map ("zh", "de", "fr", etc.).
 */
function resolveLanguageKey(lang: string): string {
  if (!lang) return "en";
  const base = lang.split("-")[0].toLowerCase();
  return base;
}

/**
 * Get a translated UI string. Falls back to English if the language
 * or key is not found. Supports {placeholder} interpolation.
 */
export function t(
  key: string,
  lang: string,
  vars?: Record<string, string | number>,
): string {
  const entry = translations[key];
  if (!entry) return key;
  const base = resolveLanguageKey(lang);
  let text = entry[base] ?? entry.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/**
 * Detect browser language (client-side only). Returns "en" on server.
 */
export function getBrowserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  return navigator.language || "en";
}
