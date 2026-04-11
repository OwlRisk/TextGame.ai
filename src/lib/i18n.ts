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
  "placeholder.message_channel": {
    en: "Message #{channel}",
    zh: "发送消息到 #{channel}",
    ja: "#{channel} にメッセージ",
    ko: "#{channel}에 메시지",
    de: "Nachricht an #{channel}",
    fr: "Message #{channel}",
    es: "Mensaje a #{channel}",
    pt: "Mensagem em #{channel}",
    ru: "Сообщение в #{channel}",
    it: "Messaggio in #{channel}",
    ar: "رسالة في #{channel}",
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
  "do.no_actions": {
    en: "No actions available right now",
    zh: "\u5f53\u524d\u6ca1\u6709\u53ef\u7528\u7684\u884c\u52a8",
    de: "Momentan keine Aktionen verf\u00fcgbar",
    fr: "Aucune action disponible pour le moment",
    es: "No hay acciones disponibles ahora",
    ja: "\u73fe\u5728\u5229\u7528\u53ef\u80fd\u306a\u30a2\u30af\u30b7\u30e7\u30f3\u306f\u3042\u308a\u307e\u305b\u3093",
    ko: "\ud604\uc7ac \uc0ac\uc6a9 \uac00\ub2a5\ud55c \ud589\ub3d9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4",
    pt: "Nenhuma a\u00e7\u00e3o dispon\u00edvel no momento",
    ru: "\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439",
    it: "Nessuna azione disponibile al momento",
    ar: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0645\u062a\u0627\u062d\u0629 \u062d\u0627\u0644\u064a\u0627",
  },
  "tab.say": {
    en: "Say", zh: "说", ja: "発言", ko: "말하기",
    de: "Sagen", fr: "Dire", es: "Decir",
    pt: "Dizer", ru: "Сказать", it: "Dire", ar: "قل",
  },
  "tab.do": {
    en: "Do", zh: "行动", ja: "行動", ko: "행동",
    de: "Tun", fr: "Agir", es: "Hacer",
    pt: "Fazer", ru: "Действие", it: "Fare", ar: "افعل",
  },
  "btn.execute_action": {
    en: "Execute action", zh: "执行", ja: "実行", ko: "실행",
    de: "Ausführen", fr: "Exécuter", es: "Ejecutar",
    pt: "Executar", ru: "Выполнить", it: "Esegui", ar: "نفّذ",
  },
  "hint.first_turn": {
    en: "It's your turn! Type a response in character, or tap a suggestion below.",
    zh: "轮到你了！输入你的台词，或点击下方建议。",
    ja: "あなたの番です！キャラクターとして返答を入力するか、下の提案をタップしてください。",
    ko: "당신 차례입니다! 캐릭터로 답변을 입력하거나 아래 제안을 탭하세요.",
    de: "Du bist dran! Antworte als dein Charakter oder tippe auf einen Vorschlag.",
    fr: "C'est votre tour ! Répondez en personnage ou tapez sur une suggestion.",
    es: "¡Es tu turno! Escribe una respuesta en personaje o toca una sugerencia.",
    pt: "É a sua vez! Digite uma resposta no personagem ou toque em uma sugestão.",
    ru: "Ваш ход! Напишите ответ за персонажа или нажмите на подсказку.",
    it: "Tocca a te! Scrivi una risposta in personaggio o tocca un suggerimento.",
    ar: "دورك! اكتب ردًا بشخصيتك أو انقر على اقتراح أدناه.",
  },
  "channel.default_room": {
    en: "Game Room", zh: "游戏大厅", ja: "ゲームルーム", ko: "게임 룸",
    de: "Spielraum", fr: "Salle de jeu", es: "Sala de juego",
    pt: "Sala de jogo", ru: "Игровая", it: "Stanza di gioco", ar: "غرفة اللعبة",
  },

  // ── Evidence Board ───────────────────────────────────────────────────
  "board.evidence_board": {
    en: "Evidence Board", zh: "证据板", ja: "証拠ボード", ko: "증거 보드",
    de: "Beweistafel", fr: "Tableau des preuves", es: "Tablero de evidencias",
    pt: "Painel de evidências", ru: "Доска улик", it: "Tabella delle prove", ar: "لوحة الأدلة",
  },
  "board.victim": {
    en: "Victim", zh: "受害者", ja: "被害者", ko: "피해자",
    de: "Opfer", fr: "Victime", es: "Víctima",
    pt: "Vítima", ru: "Жертва", it: "Vittima", ar: "الضحية",
  },
  "board.cause_of_death": {
    en: "Cause of Death", zh: "死因", ja: "死因", ko: "사인",
    de: "Todesursache", fr: "Cause du décès", es: "Causa de muerte",
    pt: "Causa da morte", ru: "Причина смерти", it: "Causa della morte", ar: "سبب الوفاة",
  },
  "board.evidence_collected": {
    en: "Evidence Collected", zh: "已收集证据", ja: "収集済み証拠", ko: "수집된 증거",
    de: "Gesammelte Beweise", fr: "Preuves collectées", es: "Evidencia recopilada",
    pt: "Evidências coletadas", ru: "Собранные улики", it: "Prove raccolte", ar: "الأدلة المجمعة",
  },
  "board.suspect_notes": {
    en: "Suspect Notes", zh: "嫌疑人笔记", ja: "容疑者メモ", ko: "용의자 메모",
    de: "Verdächtigennotizen", fr: "Notes sur les suspects", es: "Notas de sospechosos",
    pt: "Notas de suspeitos", ru: "Заметки о подозреваемых", it: "Note sui sospetti", ar: "ملاحظات المشتبهين",
  },
  "board.alibi": {
    en: "Alibi", zh: "不在场证明", ja: "アリバイ", ko: "알리바이",
    de: "Alibi", fr: "Alibi", es: "Coartada",
    pt: "Álibi", ru: "Алиби", it: "Alibi", ar: "حجة الغياب",
  },
  "board.no_evidence_yet": {
    en: "No evidence yet.", zh: "暂无证据。", ja: "まだ証拠がありません。", ko: "아직 증거가 없습니다.",
    de: "Noch keine Beweise.", fr: "Pas encore de preuves.", es: "Aún no hay evidencia.",
    pt: "Ainda sem evidências.", ru: "Пока нет улик.", it: "Ancora nessuna prova.", ar: "لا أدلة بعد.",
  },
  "board.no_evidence_hint": {
    en: "Evidence will appear here as the investigation progresses.",
    zh: "随着调查推进，证据会出现在这里。",
    ja: "調査が進むにつれ、証拠がここに表示されます。",
    ko: "조사가 진행되면 증거가 여기에 나타납니다.",
    de: "Beweise erscheinen hier im Laufe der Ermittlung.",
    fr: "Les preuves apparaîtront ici au fur et à mesure de l'enquête.",
    es: "Las evidencias aparecerán aquí a medida que avance la investigación.",
    pt: "As evidências aparecerão aqui conforme a investigação progride.",
    ru: "Улики появятся здесь по мере продвижения расследования.",
    it: "Le prove appariranno qui con il progresso dell'indagine.",
    ar: "ستظهر الأدلة هنا مع تقدم التحقيق.",
  },

  // ── Player Rules (Script Kill) ──────────────────────────────────────
  "pr.is_dead": {
    en: "is dead. You are the detective.",
    zh: "死了。你是侦探。",
    ja: "は死んだ。あなたは探偵です。",
    ko: "이(가) 죽었습니다. 당신은 탐정입니다.",
    de: "ist tot. Du bist der Ermittler.",
    fr: "est mort(e). Vous êtes le détective.",
    es: "ha muerto. Tú eres el detective.",
    pt: "está morto(a). Você é o detetive.",
    ru: "мертв(а). Вы — детектив.",
    it: "è morto/a. Tu sei il detective.",
    ar: "مات. أنت المحقق.",
  },
  "pr.suspects": {
    en: "Suspects", zh: "嫌疑人", ja: "容疑者", ko: "용의자",
    de: "Verdächtige", fr: "Suspects", es: "Sospechosos",
    pt: "Suspeitos", ru: "Подозреваемые", it: "Sospetti", ar: "المشتبهون",
  },
  "pr.how_to_play": {
    en: "How to Play", zh: "玩法说明", ja: "遊び方", ko: "플레이 방법",
    de: "Spielanleitung", fr: "Comment jouer", es: "Cómo jugar",
    pt: "Como jogar", ru: "Как играть", it: "Come giocare", ar: "كيفية اللعب",
  },
  "pr.ask_questions": {
    en: "Ask questions", zh: "提问", ja: "質問する", ko: "질문하기",
    de: "Fragen stellen", fr: "Poser des questions", es: "Hacer preguntas",
    pt: "Fazer perguntas", ru: "Задавать вопросы", it: "Fare domande", ar: "اطرح أسئلة",
  },
  "pr.ask_questions_desc": {
    en: "interrogate suspects, challenge their stories, look for contradictions.",
    zh: "审问嫌疑人，质疑他们的说法，寻找矛盾之处。",
    ja: "容疑者を尋問し、話の矛盾を見つけましょう。",
    ko: "용의자를 심문하고, 진술의 모순을 찾으세요.",
    de: "Verdächtige verhören, Geschichten hinterfragen, Widersprüche finden.",
    fr: "interrogez les suspects, remettez en question leurs histoires, cherchez les contradictions.",
    es: "interroga a los sospechosos, cuestiona sus historias, busca contradicciones.",
  },
  "pr.collect_evidence": {
    en: "Collect evidence", zh: "收集证据", ja: "証拠を集める", ko: "증거 수집",
    de: "Beweise sammeln", fr: "Collecter des preuves", es: "Recoger pruebas",
  },
  "pr.collect_evidence_desc": {
    en: "your evidence board updates as you investigate. Check it often.",
    zh: "随着调查推进，证据板会更新。经常查看。",
    ja: "調査が進むと証拠ボードが更新されます。こまめにチェックしましょう。",
    ko: "조사가 진행되면 증거 보드가 업데이트됩니다. 자주 확인하세요.",
  },
  "pr.present_evidence": {
    en: "Present evidence", zh: "出示证据", ja: "証拠を提示", ko: "증거 제시",
    de: "Beweise vorlegen", fr: "Présenter des preuves", es: "Presentar pruebas",
  },
  "pr.present_evidence_desc": {
    en: "confront suspects with what you've found. Watch how they react.",
    zh: "用你找到的证据质问嫌疑人。观察他们的反应。",
    ja: "見つけた証拠で容疑者を問い詰めましょう。反応を観察してください。",
    ko: "발견한 증거로 용의자를 추궁하세요. 반응을 관찰하세요.",
  },
  "pr.make_accusation": {
    en: "Make your accusation", zh: "做出指控", ja: "告発する", ko: "고발하기",
    de: "Anklage erheben", fr: "Faire votre accusation", es: "Hacer tu acusación",
  },
  "pr.make_accusation_desc": {
    en: "when you're ready, name the killer. You only get one shot.",
    zh: "准备好了就指出凶手。机会只有一次。",
    ja: "準備ができたら犯人を指名してください。チャンスは一度だけです。",
    ko: "준비가 되면 범인을 지목하세요. 기회는 한 번뿐입니다.",
  },
  "pr.tips": {
    en: "Tips", zh: "小贴士", ja: "ヒント", ko: "팁",
    de: "Tipps", fr: "Conseils", es: "Consejos",
    pt: "Dicas", ru: "Советы", it: "Suggerimenti", ar: "نصائح",
  },
  "pr.tip_lies": {
    en: "Suspects will lie. Pay attention to details that don't add up.",
    zh: "嫌疑人会撒谎。注意那些对不上的细节。",
    ja: "容疑者は嘘をつきます。辻褄が合わない部分に注意してください。",
    ko: "용의자는 거짓말을 합니다. 맞지 않는 세부 사항에 주의하세요.",
  },
  "pr.tip_nervous": {
    en: "Push harder when someone gets nervous — they might crack.",
    zh: "有人紧张的时候加把劲——他们可能会露出破绽。",
    ja: "誰かが動揺したら追及してください——口を割るかもしれません。",
    ko: "누군가 긴장하면 더 밀어붙이세요 — 무너질 수도 있습니다.",
  },
  "pr.tip_no_rush": {
    en: "Don't rush. A wrong accusation means the killer walks free.",
    zh: "别急。指控错了，凶手就逍遥法外了。",
    ja: "焦らないで。間違った告発は犯人を逃がすことになります。",
    ko: "서두르지 마세요. 잘못된 고발은 범인을 풀어주는 것입니다.",
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

  // ── Action Templates (prefilled text for player messages) ────────────
  "template._player_": {
    en: "{player}, ", zh: "{player}，", ja: "{player}、", ko: "{player}, ",
  },
  "template.i_d_like_to_show__player__the_evidence": {
    en: "I'd like to show {player} the evidence: ",
    zh: "我想给{player}看一个证据：",
    ja: "{player}に証拠を見せたい：",
    ko: "{player}에게 증거를 보여주고 싶습니다: ",
  },
  "template._player___you_said_earlier_that": {
    en: "{player}, you said earlier that ",
    zh: "{player}，你之前说过",
    ja: "{player}、さっき言ったことだけど",
    ko: "{player}, 아까 말했잖아요 ",
  },
  "template.i_want_to_look_more_closely_at": {
    en: "I want to look more closely at ",
    zh: "我想仔细看看",
    ja: "もっとよく見たい：",
    ko: "더 자세히 살펴보고 싶습니다: ",
  },
  "template.let_me_review_the_timeline": {
    en: "Let me review the timeline — ",
    zh: "让我梳理一下时间线——",
    ja: "タイムラインを確認させて——",
    ko: "타임라인을 정리해 보겠습니다 — ",
  },
  "template.i_m_ready_to_make_my_accusation_i_believe_the_killer_is": {
    en: "I'm ready to make my accusation. I believe the killer is ",
    zh: "我准备好指控了。我认为凶手是",
    ja: "告発します。犯人は",
    ko: "고발하겠습니다. 범인은 ",
  },
  "template._player": {
    en: "@{player} ", zh: "@{player} ", ja: "@{player} ", ko: "@{player} ",
  },
  "template.that_s": {
    en: "That's ", zh: "这……", ja: "それは…", ko: "그건... ",
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
  "game.no_rules": {
    en: "No rules defined for this game.",
    zh: "本游戏未定义规则。",
    ja: "このゲームにはルールが定義されていません。",
    ko: "이 게임에 정의된 규칙이 없습니다.",
    de: "Keine Regeln für dieses Spiel definiert.",
    fr: "Aucune règle définie pour ce jeu.",
    es: "No hay reglas definidas para este juego.",
    pt: "Nenhuma regra definida para este jogo.",
    ru: "Правила для этой игры не определены.",
    it: "Nessuna regola definita per questo gioco.",
    ar: "لم يتم تحديد قواعد لهذه اللعبة.",
  },
  "game.no_rules_hint": {
    en: "Rules will be shown here once the game starts.",
    zh: "游戏开始后将在此显示规则。",
    ja: "ゲームが始まるとここにルールが表示されます。",
    ko: "게임이 시작되면 여기에 규칙이 표시됩니다.",
    de: "Regeln werden hier angezeigt, sobald das Spiel beginnt.",
    fr: "Les règles seront affichées ici une fois le jeu commencé.",
    es: "Las reglas se mostrarán aquí una vez que comience el juego.",
    pt: "As regras serão exibidas aqui quando o jogo começar.",
    ru: "Правила появятся здесь после начала игры.",
    it: "Le regole verranno mostrate qui all'inizio del gioco.",
    ar: "ستظهر القواعد هنا بمجرد بدء اللعبة.",
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

  "board.your_role": {
    en: "**Your Role: {role}**",
    zh: "**你的角色：{role}**",
    ja: "**あなたの役割：{role}**",
    ko: "**당신의 역할: {role}**",
    de: "**Deine Rolle: {role}**",
    fr: "**Votre rôle : {role}**",
    es: "**Tu rol: {role}**",
    pt: "**Seu papel: {role}**",
    ru: "**Ваша роль: {role}**",
    it: "**Il tuo ruolo: {role}**",
    ar: "**دورك: {role}**",
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
    zh: "\u6b22\u8fce\uff0c{count} \u4f4d\u73a9\u5bb6\uff01\u89d2\u8272\u5df2\u79d8\u5bc6\u5206\u914d\u2014\u2014\u70b9\u51fb\u5de6\u4fa7 **\u201c\u6211\u7684\u9762\u677f\u201d** \u67e5\u770b\u4f60\u7684\u8eab\u4efd\u3002\n\n\u8f6e\u5230\u4f60\u65f6\uff0c\u5728\u4e0b\u65b9\u8f93\u5165\u56de\u590d\u6216\u70b9\u51fb\u5feb\u6377\u6309\u94ae\u3002\u591c\u5e55\u964d\u4e34\u2026\u2026",
    de: "Willkommen, {count} Spieler! Rollen wurden heimlich zugewiesen \u2014 pr\u00fcfe **\u201eMein Board\u201c** links.\n\nWenn du dran bist, tippe deine Antwort ein. Die Nacht bricht herein\u2026",
    fr: "Bienvenue, {count} joueurs ! Les r\u00f4les ont \u00e9t\u00e9 attribu\u00e9s \u2014 consultez **\u00ab Mon tableau \u00bb** \u00e0 gauche.\n\nLa nuit tombe\u2026",
    es: "\u00a1Bienvenidos, {count} jugadores! Los roles han sido asignados \u2014 revisa **\u201cMi tablero\u201d** a la izquierda.\n\nCae la noche\u2026",
    ja: "\u3088\u3046\u3053\u305d\u3001{count}\u4eba\u306e\u30d7\u30ec\u30a4\u30e4\u30fc\uff01\u5f79\u8077\u304c\u914d\u5e03\u3055\u308c\u307e\u3057\u305f\u2014\u2014\u5de6\u306e **\u201c\u30de\u30a4\u30dc\u30fc\u30c9\u201d** \u3067\u78ba\u8a8d\u3002\n\n\u591c\u304c\u8fc7\u308a\u307e\u3059\u2026",
    ko: "\ud658\uc601\ud569\ub2c8\ub2e4, {count}\uba85! \uc5ed\ud560\uc774 \ubc30\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4 \u2014 \uc67c\ucabd **\u201c\ub0b4 \ubcf4\ub4dc\u201d**\uc5d0\uc11c \ud655\uc778\ud558\uc138\uc694.\n\n\ubc24\uc774 \ucc3e\uc544\uc635\ub2c8\ub2e4\u2026",
    pt: "Bem-vindos, {count} jogadores! Os pap\u00e9is foram atribu\u00eddos \u2014 verifique **\u201cMeu painel\u201d** \u00e0 esquerda.\n\nA noite cai\u2026",
    ru: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c, {count} \u0438\u0433\u0440\u043e\u043a\u043e\u0432! \u0420\u043e\u043b\u0438 \u0440\u0430\u0441\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u044b \u2014 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 **\u00ab\u041c\u043e\u044f \u0434\u043e\u0441\u043a\u0430\u00bb** \u0441\u043b\u0435\u0432\u0430.\n\n\u041d\u043e\u0447\u044c \u043d\u0430\u0441\u0442\u0443\u043f\u0430\u0435\u0442\u2026",
    it: "Benvenuti, {count} giocatori! I ruoli sono stati assegnati \u2014 controlla **\u201cLa mia bacheca\u201d** a sinistra.\n\nScende la notte\u2026",
    ar: "\u0623\u0647\u0644\u0627\u064b\u060c {count} \u0644\u0627\u0639\u0628\u064a\u0646! \u062a\u0645 \u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0623\u062f\u0648\u0627\u0631 \u2014 \u062a\u062d\u0642\u0642 \u0645\u0646 **\u201c\u0644\u0648\u062d\u062a\u064a\u201d** \u0639\u0644\u0649 \u0627\u0644\u064a\u0633\u0627\u0631.\n\n\u064a\u062d\u0644 \u0627\u0644\u0644\u064a\u0644\u2026",
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
  "discover.subtitle": {
    en: "AI-powered game templates. Pick one and start playing in seconds.",
    zh: "AI \u9a71\u52a8\u7684\u6e38\u620f\u6a21\u677f\u3002\u9009\u4e00\u4e2a\uff0c\u79d2\u5f00\u5f00\u73a9\u3002",
    de: "KI-gest\u00fctzte Spielvorlagen. W\u00e4hle eine und spiele sofort los.",
    fr: "Mod\u00e8les de jeu anim\u00e9s par l\u2019IA. Choisissez et jouez en quelques secondes.",
    es: "Plantillas de juegos con IA. Elige una y empieza a jugar en segundos.",
    ja: "AI\u641c\u8f09\u306e\u30b2\u30fc\u30e0\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3002\u9078\u3093\u3067\u3059\u3050\u30d7\u30ec\u30a4\u3002",
    ko: "AI \uae30\ubc18 \uac8c\uc784 \ud15c\ud50c\ub9bf. \ud558\ub098\ub97c \uace8\ub77c \ubc14\ub85c \uc2dc\uc791\ud558\uc138\uc694.",
    pt: "Modelos de jogos com IA. Escolha um e comece a jogar em segundos.",
    ru: "\u0428\u0430\u0431\u043b\u043e\u043d\u044b \u0438\u0433\u0440 \u043d\u0430 \u0431\u0430\u0437\u0435 \u0418\u0418. \u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0438 \u043d\u0430\u0447\u043d\u0438\u0442\u0435 \u0438\u0433\u0440\u0430\u0442\u044c.",
    it: "Modelli di gioco basati sull\u2019IA. Scegli e inizia a giocare in pochi secondi.",
    ar: "\u0642\u0648\u0627\u0644\u0628 \u0623\u0644\u0639\u0627\u0628 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a. \u0627\u062e\u062a\u0631 \u0648\u0627\u0628\u062f\u0623 \u0627\u0644\u0644\u0639\u0628 \u0641\u0648\u0631\u0627\u064b.",
  },
  "discover.try_different": {
    en: "Try a different keyword or category",
    zh: "\u8bd5\u8bd5\u5176\u4ed6\u5173\u952e\u8bcd\u6216\u5206\u7c7b",
    de: "Versuche ein anderes Stichwort oder eine andere Kategorie",
    fr: "Essayez un autre mot-cl\u00e9 ou une autre cat\u00e9gorie",
    es: "Prueba otra palabra clave o categor\u00eda",
    ja: "\u5225\u306e\u30ad\u30fc\u30ef\u30fc\u30c9\u304b\u30ab\u30c6\u30b4\u30ea\u3092\u8a66\u3057\u3066\u304f\u3060\u3055\u3044",
    ko: "\ub2e4\ub978 \ud0a4\uc6cc\ub4dc\ub098 \uce74\ud14c\uace0\ub9ac\ub97c \uc2dc\ub3c4\ud574\ubcf4\uc138\uc694",
    pt: "Tente outra palavra-chave ou categoria",
    ru: "\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043e\u0435 \u0441\u043b\u043e\u0432\u043e \u0438\u043b\u0438 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044e",
    it: "Prova una parola chiave o categoria diversa",
    ar: "\u062c\u0631\u0628 \u0643\u0644\u0645\u0629 \u0623\u0648 \u0641\u0626\u0629 \u0645\u062e\u062a\u0644\u0641\u0629",
  },
  "discover.play": {
    en: "Play \u2192", zh: "\u5f00\u59cb \u2192", de: "Spielen \u2192", fr: "Jouer \u2192",
    es: "Jugar \u2192", ja: "\u30d7\u30ec\u30a4 \u2192", ko: "\ud50c\ub808\uc774 \u2192",
    pt: "Jogar \u2192", ru: "\u0418\u0433\u0440\u0430\u0442\u044c \u2192", it: "Gioca \u2192", ar: "\u0627\u0644\u0639\u0628 \u2192",
  },
  // Category tabs
  "cat.all": {
    en: "All Games", zh: "\u5168\u90e8\u6e38\u620f", de: "Alle Spiele", fr: "Tous les jeux",
    es: "Todos los juegos", ja: "\u3059\u3079\u3066\u306e\u30b2\u30fc\u30e0", ko: "\ubaa8\ub4e0 \uac8c\uc784",
    pt: "Todos os jogos", ru: "\u0412\u0441\u0435 \u0438\u0433\u0440\u044b", it: "Tutti i giochi", ar: "\u0643\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628",
  },
  "cat.deduction": {
    en: "Social Deduction", zh: "\u793e\u4ea4\u63a8\u7406", de: "Soziale Deduktion", fr: "D\u00e9duction sociale",
    es: "Deducci\u00f3n social", ja: "\u4eba\u72fc\u7cfb", ko: "\uc0ac\ud68c\uc801 \ucd94\ub9ac",
    pt: "Dedu\u00e7\u00e3o social", ru: "\u0421\u043e\u0446\u0438\u0430\u043b\u044c\u043d\u0430\u044f \u0434\u0435\u0434\u0443\u043a\u0446\u0438\u044f", it: "Deduzione sociale", ar: "\u0627\u0633\u062a\u0646\u062a\u0627\u062c \u0627\u062c\u062a\u0645\u0627\u0639\u064a",
  },
  "cat.party": {
    en: "Party", zh: "\u6d3e\u5bf9", de: "Party", fr: "F\u00eate",
    es: "Fiesta", ja: "\u30d1\u30fc\u30c6\u30a3\u30fc", ko: "\ud30c\ud2f0",
    pt: "Festa", ru: "\u0412\u0435\u0447\u0435\u0440\u0438\u043d\u043a\u0430", it: "Festa", ar: "\u062d\u0641\u0644\u0629",
  },
  "cat.mystery": {
    en: "Mystery", zh: "\u60ac\u7591", de: "Mysterium", fr: "Myst\u00e8re",
    es: "Misterio", ja: "\u30df\u30b9\u30c6\u30ea\u30fc", ko: "\ubbf8\uc2a4\ud130\ub9ac",
    pt: "Mist\u00e9rio", ru: "\u0422\u0430\u0439\u043d\u0430", it: "Mistero", ar: "\u0644\u063a\u0632",
  },
  "cat.creative": {
    en: "Creative", zh: "\u521b\u610f", de: "Kreativ", fr: "Cr\u00e9atif",
    es: "Creativo", ja: "\u30af\u30ea\u30a8\u30a4\u30c6\u30a3\u30d6", ko: "\ud06c\ub9ac\uc5d0\uc774\ud2f0\ube0c",
    pt: "Criativo", ru: "\u0422\u0432\u043e\u0440\u0447\u0435\u0441\u043a\u0438\u0435", it: "Creativo", ar: "\u0625\u0628\u062f\u0627\u0639\u064a",
  },
  "cat.brain": {
    en: "Brain Games", zh: "\u667a\u529b\u6e38\u620f", de: "Denkspiele", fr: "Jeux de r\u00e9flexion",
    es: "Juegos mentales", ja: "\u8133\u30c8\u30ec", ko: "\ub450\ub1cc \uac8c\uc784",
    pt: "Jogos mentais", ru: "\u0418\u043d\u0442\u0435\u043b\u043b\u0435\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u0435", it: "Rompicapo", ar: "\u0623\u0644\u0639\u0627\u0628 \u0630\u0647\u0646\u064a\u0629",
  },
  // Style badges
  "style.casual": {
    en: "Casual", zh: "\u4f11\u95f2", de: "Locker", fr: "D\u00e9contract\u00e9",
    es: "Casual", ja: "\u30ab\u30b8\u30e5\u30a2\u30eb", ko: "\uce90\uc8fc\uc5bc",
    pt: "Casual", ru: "\u041a\u0430\u0436\u0443\u0430\u043b\u044c\u043d\u0430\u044f", it: "Casual", ar: "\u0639\u0627\u062f\u064a\u0629",
  },
  "style.strategic": {
    en: "Strategic", zh: "\u7b56\u7565", de: "Strategisch", fr: "Strat\u00e9gique",
    es: "Estrat\u00e9gico", ja: "\u6226\u7565", ko: "\uc804\ub7b5",
    pt: "Estrat\u00e9gico", ru: "\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f", it: "Strategico", ar: "\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a",
  },
  "style.competitive": {
    en: "Competitive", zh: "\u7ade\u6280", de: "Wettbewerb", fr: "Comp\u00e9titif",
    es: "Competitivo", ja: "\u7af6\u6280", ko: "\uacbd\uc7c1",
    pt: "Competitivo", ru: "\u0421\u043e\u0440\u0435\u0432\u043d\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u043d\u0430\u044f", it: "Competitivo", ar: "\u062a\u0646\u0627\u0641\u0633\u064a",
  },
  "discover.multiplayer": {
    en: "Multiplayer", zh: "\u591a\u4eba\u6e38\u620f", de: "Mehrspieler", fr: "Multijoueur",
    es: "Multijugador", ja: "\u30de\u30eb\u30c1\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "\uba40\ud2f0\ud50c\ub808\uc774\uc5b4",
    pt: "Multijogador", ru: "\u041c\u043d\u043e\u0433\u043e\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0430\u044f", it: "Multigiocatore", ar: "\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646",
  },

  // ── Landing page ──────────────────────────────────────────────────────
  "landing.hero_1": {
    en: "Play multiplayer games", zh: "\u548cAI\u89d2\u8272\u4e00\u8d77", ja: "AI\u30ad\u30e3\u30e9\u3068", ko: "AI \uce90\ub9ad\ud130\uc640",
    de: "Multiplayer-Spiele spielen", fr: "Jouez \u00e0 des jeux multijoueurs", es: "Juega juegos multijugador",
    pt: "Jogue jogos multijogador", ru: "\u0418\u0433\u0440\u0430\u0439\u0442\u0435 \u0432 \u0438\u0433\u0440\u044b", it: "Gioca a giochi multiplayer", ar: "\u0627\u0644\u0639\u0628 \u0623\u0644\u0639\u0627\u0628 \u062c\u0645\u0627\u0639\u064a\u0629",
  },
  "landing.hero_2": {
    en: "with AI characters", zh: "\u73a9\u591a\u4eba\u6e38\u620f", ja: "\u30de\u30eb\u30c1\u30d7\u30ec\u30a4", ko: "\uba40\ud2f0\ud50c\ub808\uc774",
    de: "mit KI-Charakteren", fr: "avec des personnages IA", es: "con personajes IA",
    pt: "com personagens IA", ru: "\u0441 \u0418\u0418-\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430\u043c\u0438", it: "con personaggi IA", ar: "\u0645\u0639 \u0634\u062e\u0635\u064a\u0627\u062a \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a",
  },
  "landing.hero_sub": {
    en: "AI fills every seat. Play solo or with friends.",
    zh: "AI\u586b\u6ee1\u6bcf\u4e2a\u5ea7\u4f4d\u3002\u5355\u4eba\u6216\u4e0e\u670b\u53cb\u4e00\u8d77\u73a9\u3002",
    ja: "AI\u304c\u5168\u5e2d\u3092\u57cb\u3081\u308b\u3002\u30bd\u30ed\u3067\u3082\u53cb\u9054\u3068\u3067\u3082\u3002",
    ko: "AI\uac00 \ubaa8\ub4e0 \uc790\ub9ac\ub97c \ucc44\uc6c1\ub2c8\ub2e4. \uc194\ub85c \ub610\ub294 \uce5c\uad6c\uc640 \ud568\uaed8.",
    de: "KI f\u00fcllt jeden Platz. Spiele allein oder mit Freunden.",
    fr: "L\u2019IA remplit chaque si\u00e8ge. Jouez seul ou entre amis.",
    es: "La IA llena cada asiento. Juega solo o con amigos.",
    pt: "A IA preenche cada lugar. Jogue sozinho ou com amigos.",
    ru: "\u0418\u0418 \u0437\u0430\u043d\u0438\u043c\u0430\u0435\u0442 \u043a\u0430\u0436\u0434\u043e\u0435 \u043c\u0435\u0441\u0442\u043e. \u0418\u0433\u0440\u0430\u0439\u0442\u0435 \u043e\u0434\u0438\u043d \u0438\u043b\u0438 \u0441 \u0434\u0440\u0443\u0437\u044c\u044f\u043c\u0438.",
    it: "L\u2019IA riempie ogni posto. Gioca da solo o con amici.",
    ar: "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0645\u0644\u0623 \u0643\u0644 \u0645\u0642\u0639\u062f. \u0627\u0644\u0639\u0628 \u0648\u062d\u062f\u0643 \u0623\u0648 \u0645\u0639 \u0627\u0644\u0623\u0635\u062f\u0642\u0627\u0621.",
  },
  "landing.cta_google": {
    en: "Get Started with Google", zh: "\u7528Google\u5f00\u59cb", ja: "Google\u3067\u59cb\u3081\u308b", ko: "Google\ub85c \uc2dc\uc791\ud558\uae30",
    de: "Mit Google starten", fr: "Commencer avec Google", es: "Comenzar con Google",
    pt: "Come\u00e7ar com Google", ru: "\u041d\u0430\u0447\u0430\u0442\u044c \u0441 Google", it: "Inizia con Google", ar: "\u0627\u0628\u062f\u0623 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 Google",
  },
  "landing.cta_facebook": {
    en: "Continue with Facebook", zh: "\u7528Facebook\u7ee7\u7eed", ja: "Facebook\u3067\u7d9a\u3051\u308b", ko: "Facebook\uc73c\ub85c \uacc4\uc18d",
    de: "Mit Facebook fortfahren", fr: "Continuer avec Facebook", es: "Continuar con Facebook",
    pt: "Continuar com Facebook", ru: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0441 Facebook", it: "Continua con Facebook", ar: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 Facebook",
  },
  "landing.explore": {
    en: "Explore Games", zh: "\u63a2\u7d22\u6e38\u620f", ja: "\u30b2\u30fc\u30e0\u3092\u63a2\u7d22", ko: "\uac8c\uc784 \ud0d0\uc0c9",
    de: "Spiele entdecken", fr: "Explorer les jeux", es: "Explorar juegos",
    pt: "Explorar jogos", ru: "\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u044c \u0438\u0433\u0440\u044b", it: "Esplora i giochi", ar: "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0623\u0644\u0639\u0627\u0628",
  },
  "landing.type_message": {
    en: "Type your message...", zh: "\u8f93\u5165\u4f60\u7684\u6d88\u606f...", ja: "\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u5165\u529b...", ko: "\uba54\uc2dc\uc9c0\ub97c \uc785\ub825\ud558\uc138\uc694...",
    de: "Nachricht eingeben...", fr: "Tapez votre message...", es: "Escribe tu mensaje...",
    pt: "Digite sua mensagem...", ru: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435...", it: "Scrivi il tuo messaggio...", ar: "\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643...",
  },
  "landing.ai_players_badge": {
    en: "AI PLAYERS", zh: "AI\u73a9\u5bb6", ja: "AI\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "AI \ud50c\ub808\uc774\uc5b4",
    de: "KI-SPIELER", fr: "JOUEURS IA", es: "JUGADORES IA",
    pt: "JOGADORES IA", ru: "\u0418\u0418-\u0418\u0413\u0420\u041e\u041a\u0418", it: "GIOCATORI IA", ar: "\u0644\u0627\u0639\u0628\u0648 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
  },
  "landing.ai_players_title": {
    en: "Every seat filled with a unique character", zh: "\u6bcf\u4e2a\u5ea7\u4f4d\u90fd\u662f\u72ec\u4e00\u65e0\u4e8c\u7684\u89d2\u8272",
    ja: "\u3059\u3079\u3066\u306e\u5e2d\u304c\u30e6\u30cb\u30fc\u30af\u306a\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3067\u57cb\u307e\u308b", ko: "\ubaa8\ub4e0 \uc790\ub9ac\ub97c \uace0\uc720\ud55c \uce90\ub9ad\ud130\uac00 \ucc44\uc6c0",
    de: "Jeder Platz mit einem einzigartigen Charakter besetzt", fr: "Chaque place remplie par un personnage unique",
    es: "Cada asiento ocupado por un personaje \u00fanico", pt: "Cada lugar preenchido com um personagem \u00fanico",
    ru: "\u041a\u0430\u0436\u0434\u043e\u0435 \u043c\u0435\u0441\u0442\u043e \u0437\u0430\u043d\u044f\u0442\u043e \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u044b\u043c \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0435\u043c",
    it: "Ogni posto occupato da un personaggio unico", ar: "\u0643\u0644 \u0645\u0642\u0639\u062f \u0645\u0645\u0644\u0648\u0621 \u0628\u0634\u062e\u0635\u064a\u0629 \u0641\u0631\u064a\u062f\u0629",
  },
  "landing.ai_players_desc": {
    en: "Each AI player has their own personality, role, and strategy. No two games feel the same.",
    zh: "\u6bcf\u4e2aAI\u73a9\u5bb6\u90fd\u6709\u72ec\u7279\u7684\u4e2a\u6027\u3001\u89d2\u8272\u548c\u7b56\u7565\u3002\u6bcf\u5c40\u6e38\u620f\u90fd\u4e0d\u4e00\u6837\u3002",
    ja: "\u5404AI\u30d7\u30ec\u30a4\u30e4\u30fc\u306b\u306f\u56fa\u6709\u306e\u6027\u683c\u3001\u5f79\u5272\u3001\u6226\u7565\u304c\u3042\u308b\u3002\u540c\u3058\u30b2\u30fc\u30e0\u306f\u4e8c\u5ea6\u3068\u306a\u3044\u3002",
    ko: "\uac01 AI \ud50c\ub808\uc774\uc5b4\ub294 \uace0\uc720\ud55c \uc131\uaca9, \uc5ed\ud560, \uc804\ub7b5\uc744 \uac00\uc9d0. \uac19\uc740 \uac8c\uc784\uc740 \uc5c6\uc2b5\ub2c8\ub2e4.",
    de: "Jeder KI-Spieler hat eigene Pers\u00f6nlichkeit, Rolle und Strategie. Kein Spiel gleicht dem anderen.",
    fr: "Chaque joueur IA a sa personnalit\u00e9, son r\u00f4le et sa strat\u00e9gie. Aucune partie ne se ressemble.",
    es: "Cada jugador IA tiene su personalidad, rol y estrategia. Ninguna partida es igual.",
    pt: "Cada jogador IA tem personalidade, papel e estrat\u00e9gia pr\u00f3prios. Nenhuma partida \u00e9 igual.",
    ru: "\u041a\u0430\u0436\u0434\u044b\u0439 \u0418\u0418-\u0438\u0433\u0440\u043e\u043a \u0438\u043c\u0435\u0435\u0442 \u0441\u0432\u043e\u044e \u043b\u0438\u0447\u043d\u043e\u0441\u0442\u044c, \u0440\u043e\u043b\u044c \u0438 \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044e. \u041a\u0430\u0436\u0434\u0430\u044f \u0438\u0433\u0440\u0430 \u0443\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u0430.",
    it: "Ogni giocatore IA ha personalit\u00e0, ruolo e strategia propri. Nessuna partita \u00e8 uguale.",
    ar: "\u0644\u0643\u0644 \u0644\u0627\u0639\u0628 \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0634\u062e\u0635\u064a\u062a\u0647 \u0648\u062f\u0648\u0631\u0647 \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u062a\u0647. \u0644\u0627 \u062a\u062a\u0643\u0631\u0631 \u0623\u064a \u0644\u0639\u0628\u0629.",
  },
  "landing.features_badge": {
    en: "FEATURES", zh: "\u7279\u8272\u529f\u80fd", ja: "\u7279\u5fb4", ko: "\uae30\ub2a5",
    de: "FUNKTIONEN", fr: "FONCTIONNALIT\u00c9S", es: "CARACTER\u00cdSTICAS",
    pt: "RECURSOS", ru: "\u0412\u041e\u0417\u041c\u041e\u0416\u041d\u041e\u0421\u0422\u0418", it: "FUNZIONALIT\u00c0", ar: "\u0627\u0644\u0645\u064a\u0632\u0627\u062a",
  },
  "landing.features_title": {
    en: "Why You'll Love It", zh: "\u4e3a\u4ec0\u4e48\u4f60\u4f1a\u559c\u6b22", ja: "\u304d\u3063\u3068\u6c17\u306b\u5165\u308b\u7406\u7531", ko: "\ub9e4\ub825 \ud3ec\uc778\ud2b8",
    de: "Warum du es lieben wirst", fr: "Pourquoi vous allez adorer", es: "Por qu\u00e9 te encantar\u00e1",
    pt: "Por que voc\u00ea vai adorar", ru: "\u041f\u043e\u0447\u0435\u043c\u0443 \u0432\u0430\u043c \u043f\u043e\u043d\u0440\u0430\u0432\u0438\u0442\u0441\u044f", it: "Perch\u00e9 ti piacer\u00e0", ar: "\u0644\u0645\u0627\u0630\u0627 \u0633\u062a\u062d\u0628\u0647",
  },
  "landing.feat.ai_host": {
    en: "AI runs the table", zh: "AI\u4e3b\u6301\u5168\u573a", ja: "AI\u304c\u30b2\u30fc\u30e0\u3092\u904b\u55b6", ko: "AI\uac00 \uac8c\uc784\uc744 \uc9c4\ud589",
    de: "KI leitet das Spiel", fr: "L\u2019IA m\u00e8ne le jeu", es: "La IA dirige la mesa",
    pt: "A IA comanda a mesa", ru: "\u0418\u0418 \u0432\u0435\u0434\u0451\u0442 \u0438\u0433\u0440\u0443", it: "L\u2019IA gestisce il tavolo", ar: "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u062f\u064a\u0631 \u0627\u0644\u0644\u0639\u0628\u0629",
  },
  "landing.feat.always_players": {
    en: "Always enough players", zh: "\u6c38\u8fdc\u4e0d\u7f3a\u73a9\u5bb6", ja: "\u3044\u3064\u3067\u3082\u5341\u5206\u306a\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "\ud56d\uc0c1 \ucda9\ubd84\ud55c \ud50c\ub808\uc774\uc5b4",
    de: "Immer genug Spieler", fr: "Toujours assez de joueurs", es: "Siempre suficientes jugadores",
    pt: "Sempre jogadores suficientes", ru: "\u0412\u0441\u0435\u0433\u0434\u0430 \u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0438\u0433\u0440\u043e\u043a\u043e\u0432", it: "Sempre abbastanza giocatori", ar: "\u0644\u0627\u0639\u0628\u0648\u0646 \u0643\u0627\u0641\u0648\u0646 \u062f\u0627\u0626\u0645\u0627\u064b",
  },
  "landing.feat.ai_plays": {
    en: "AI characters actually play", zh: "AI\u89d2\u8272\u771f\u6b63\u5728\u73a9", ja: "AI\u30ad\u30e3\u30e9\u304c\u672c\u5f53\u306b\u30d7\u30ec\u30a4", ko: "AI \uce90\ub9ad\ud130\uac00 \uc2e4\uc81c\ub85c \ud50c\ub808\uc774",
    de: "KI-Charaktere spielen wirklich", fr: "Les personnages IA jouent vraiment", es: "Los personajes IA realmente juegan",
    pt: "Personagens IA realmente jogam", ru: "\u0418\u0418-\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u043e \u0438\u0433\u0440\u0430\u044e\u0442", it: "I personaggi IA giocano davvero", ar: "\u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u062a\u0644\u0639\u0628 \u0641\u0639\u0644\u0627\u064b",
  },
  "landing.feat.easy_start": {
    en: "Easy to start with friends", zh: "\u8f7b\u677e\u548c\u670b\u53cb\u5f00\u59cb", ja: "\u53cb\u9054\u3068\u7c21\u5358\u306b\u59cb\u3081\u3089\u308c\u308b", ko: "\uce5c\uad6c\uc640 \uc27d\uac8c \uc2dc\uc791",
    de: "Einfach mit Freunden starten", fr: "Facile \u00e0 jouer entre amis", es: "F\u00e1cil de empezar con amigos",
    pt: "F\u00e1cil de come\u00e7ar com amigos", ru: "\u041b\u0435\u0433\u043a\u043e \u043d\u0430\u0447\u0430\u0442\u044c \u0441 \u0434\u0440\u0443\u0437\u044c\u044f\u043c\u0438", it: "Facile iniziare con gli amici", ar: "\u0633\u0647\u0644 \u0627\u0644\u0628\u062f\u0621 \u0645\u0639 \u0627\u0644\u0623\u0635\u062f\u0642\u0627\u0621",
  },
  "landing.inside_badge": {
    en: "INSIDE A GAME", zh: "游戏内部", ja: "ゲーム内部", ko: "게임 내부",
    de: "IM SPIEL", fr: "DANS LE JEU", es: "DENTRO DEL JUEGO",
    pt: "DENTRO DO JOGO", ru: "ВНУТРИ ИГРЫ", it: "DENTRO IL GIOCO", ar: "داخل اللعبة",
  },
  "landing.inside_title": {
    en: "What actually happens inside a game", zh: "游戏中到底会发生什么",
    ja: "ゲーム内で実際に何が起きるか", ko: "게임 안에서 실제로 일어나는 일",
    de: "Was tatsächlich in einem Spiel passiert", fr: "Ce qui se passe vraiment dans un jeu",
    es: "Lo que realmente sucede dentro de un juego", pt: "O que realmente acontece dentro de um jogo",
    ru: "Что на самом деле происходит в игре", it: "Cosa succede davvero in una partita", ar: "ما يحدث فعلاً داخل اللعبة",
  },
  "landing.inside_desc": {
    en: "Experience every stage of gameplay", zh: "体验游戏的每个阶段",
    ja: "ゲームプレイのすべてのステージを体験", ko: "게임플레이의 모든 단계를 경험",
    de: "Erlebe jede Phase des Spiels", fr: "Découvrez chaque étape du gameplay",
    es: "Experimenta cada etapa del juego", pt: "Experimente cada estágio do gameplay",
    ru: "Испытайте каждый этап игры", it: "Vivi ogni fase del gameplay", ar: "جرّب كل مرحلة من مراحل اللعب",
  },
  "landing.inside_step": {
    en: "STEP", zh: "步骤", ja: "ステップ", ko: "단계",
    de: "SCHRITT", fr: "ÉTAPE", es: "PASO",
    pt: "PASSO", ru: "ШАГ", it: "PASSO", ar: "خطوة",
  },
  "landing.inside_live": {
    en: "LIVE EXAMPLE", zh: "实时演示", ja: "ライブ例", ko: "라이브 예시",
    de: "LIVE-BEISPIEL", fr: "EXEMPLE EN DIRECT", es: "EJEMPLO EN VIVO",
    pt: "EXEMPLO AO VIVO", ru: "ЖИВОЙ ПРИМЕР", it: "ESEMPIO DAL VIVO", ar: "مثال مباشر",
  },
  "landing.faq_title": {
    en: "Common Questions", zh: "常见问题", ja: "よくある質問", ko: "자주 묻는 질문",
    de: "Häufige Fragen", fr: "Questions fréquentes", es: "Preguntas frecuentes",
    pt: "Perguntas frequentes", ru: "Частые вопросы", it: "Domande frequenti", ar: "أسئلة شائعة",
  },
  "landing.faq_desc": {
    en: "Everything you need to know", zh: "你需要知道的一切",
    ja: "知っておくべきすべてのこと", ko: "알아야 할 모든 것",
    de: "Alles, was du wissen musst", fr: "Tout ce que vous devez savoir",
    es: "Todo lo que necesitas saber", pt: "Tudo o que você precisa saber",
    ru: "Всё, что нужно знать", it: "Tutto ciò che devi sapere", ar: "كل ما تحتاج معرفته",
  },
  "landing.brand_tagline": {
    en: "Any game you can describe, you can play",
    zh: "你能描述的任何游戏，都能玩",
    ja: "思いつくゲームを、すぐにプレイ",
    ko: "설명할 수 있는 모든 게임을 플레이",
    de: "Jedes Spiel, das du beschreibst, kannst du spielen",
    fr: "Tout jeu que vous décrivez, vous pouvez y jouer",
    es: "Cualquier juego que describas, puedes jugarlo",
    pt: "Qualquer jogo que você descreva, pode jogar",
    ru: "Любую игру, которую вы опишете, можно играть",
    it: "Qualsiasi gioco descrivi, puoi giocarci",
    ar: "أي لعبة تصفها، يمكنك لعبها",
  },
  "landing.templates_badge": {
    en: "FEATURED TEMPLATES", zh: "\u7cbe\u9009\u6a21\u677f", ja: "\u304a\u3059\u3059\u3081\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8", ko: "\ucd94\ucc9c \ud15c\ud50c\ub9bf",
    de: "VORGESTELLTE VORLAGEN", fr: "MOD\u00c8LES VEDETTES", es: "PLANTILLAS DESTACADAS",
    pt: "MODELOS EM DESTAQUE", ru: "\u0420\u0415\u041a\u041e\u041c\u0415\u041d\u0414\u0423\u0415\u041c\u042b\u0415 \u0428\u0410\u0411\u041b\u041e\u041d\u042b", it: "MODELLI IN EVIDENZA", ar: "\u0642\u0648\u0627\u0644\u0628 \u0645\u0645\u064a\u0632\u0629",
  },
  "landing.templates_title": {
    en: "One-click start \u2014 or make it your own", zh: "\u4e00\u952e\u5f00\u59cb \u2014 \u6216\u81ea\u5b9a\u4e49", ja: "\u30ef\u30f3\u30af\u30ea\u30c3\u30af\u3067\u958b\u59cb \u2014 \u307e\u305f\u306f\u81ea\u7531\u306b\u30ab\u30b9\u30bf\u30de\u30a4\u30ba",
    ko: "\ud074\ub9ad \ud55c \ubc88\uc73c\ub85c \uc2dc\uc791 \u2014 \ub610\ub294 \ub098\ub9cc\uc758 \uac8c\uc784\uc73c\ub85c",
    de: "Ein-Klick-Start \u2014 oder selbst gestalten", fr: "D\u00e9marrage en un clic \u2014 ou personnalisez",
    es: "Inicio en un clic \u2014 o personaliza", pt: "Comece em um clique \u2014 ou personalize",
    ru: "\u0421\u0442\u0430\u0440\u0442 \u0432 \u043e\u0434\u0438\u043d \u043a\u043b\u0438\u043a \u2014 \u0438\u043b\u0438 \u0441\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u0432\u043e\u0451",
    it: "Avvio con un clic \u2014 o personalizza", ar: "\u0627\u0628\u062f\u0623 \u0628\u0646\u0642\u0631\u0629 \u2014 \u0623\u0648 \u0627\u0635\u0646\u0639 \u0644\u0639\u0628\u062a\u0643",
  },
  "landing.templates_desc": {
    en: "Classic games ready to play, or describe your own idea and the AI builds it for you.",
    zh: "\u7ecf\u5178\u6e38\u620f\u5373\u70b9\u5373\u73a9\uff0c\u6216\u63cf\u8ff0\u4f60\u7684\u60f3\u6cd5\uff0cAI\u5e2e\u4f60\u5b9e\u73b0\u3002",
    ja: "\u5b9a\u756a\u30b2\u30fc\u30e0\u3092\u3059\u3050\u30d7\u30ec\u30a4\u3001\u307e\u305f\u306f\u30a2\u30a4\u30c7\u30a2\u3092\u4f1d\u3048\u308c\u3070AI\u304c\u4f5c\u308a\u307e\u3059\u3002",
    ko: "\ud074\ub798\uc2dd \uac8c\uc784\uc744 \ubc14\ub85c \ud50c\ub808\uc774\ud558\uac70\ub098, \uc544\uc774\ub514\uc5b4\ub97c \uc124\uba85\ud558\uba74 AI\uac00 \ub9cc\ub4e4\uc5b4\uc90d\ub2c8\ub2e4.",
    de: "Klassische Spiele sofort spielbar, oder beschreibe deine Idee und die KI baut sie f\u00fcr dich.",
    fr: "Des jeux classiques pr\u00eats \u00e0 jouer, ou d\u00e9crivez votre id\u00e9e et l\u2019IA la construit pour vous.",
    es: "Juegos cl\u00e1sicos listos para jugar, o describe tu idea y la IA la construye.",
    pt: "Jogos cl\u00e1ssicos prontos para jogar, ou descreva sua ideia e a IA constr\u00f3i para voc\u00ea.",
    ru: "\u041a\u043b\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0438\u0433\u0440\u044b \u0433\u043e\u0442\u043e\u0432\u044b \u043a \u0437\u0430\u043f\u0443\u0441\u043a\u0443, \u0438\u043b\u0438 \u043e\u043f\u0438\u0448\u0438\u0442\u0435 \u0441\u0432\u043e\u044e \u0438\u0434\u0435\u044e \u2014 \u0418\u0418 \u043f\u043e\u0441\u0442\u0440\u043e\u0438\u0442.",
    it: "Giochi classici pronti da giocare, o descrivi la tua idea e l\u2019IA la costruisce.",
    ar: "\u0623\u0644\u0639\u0627\u0628 \u0643\u0644\u0627\u0633\u064a\u0643\u064a\u0629 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0639\u0628\u060c \u0623\u0648 \u0635\u0641 \u0641\u0643\u0631\u062a\u0643 \u0648\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0628\u0646\u064a\u0647\u0627.",
  },
  "landing.start_game": {
    en: "Start this game \u2192", zh: "\u5f00\u59cb\u6e38\u620f \u2192", ja: "\u3053\u306e\u30b2\u30fc\u30e0\u3092\u59cb\u3081\u308b \u2192", ko: "\uc774 \uac8c\uc784 \uc2dc\uc791 \u2192",
    de: "Dieses Spiel starten \u2192", fr: "Lancer ce jeu \u2192", es: "Iniciar este juego \u2192",
    pt: "Iniciar este jogo \u2192", ru: "\u041d\u0430\u0447\u0430\u0442\u044c \u044d\u0442\u0443 \u0438\u0433\u0440\u0443 \u2192", it: "Avvia questo gioco \u2192", ar: "\u0627\u0628\u062f\u0623 \u0647\u0630\u0647 \u0627\u0644\u0644\u0639\u0628\u0629 \u2192",
  },
  "landing.players_suffix": {
    en: "players", zh: "\u73a9\u5bb6", ja: "\u30d7\u30ec\u30a4\u30e4\u30fc", ko: "\ud50c\ub808\uc774\uc5b4",
    de: "Spieler", fr: "joueurs", es: "jugadores",
    pt: "jogadores", ru: "\u0438\u0433\u0440\u043e\u043a\u043e\u0432", it: "giocatori", ar: "\u0644\u0627\u0639\u0628\u064a\u0646",
  },
  "landing.start_free": {
    en: "Start Your First Game \u2014 Free", zh: "\u514d\u8d39\u5f00\u59cb\u4f60\u7684\u7b2c\u4e00\u5c40\u6e38\u620f",
    ja: "\u6700\u521d\u306e\u30b2\u30fc\u30e0\u3092\u7121\u6599\u3067\u59cb\u3081\u3088\u3046", ko: "\ucc98\uc74c \uac8c\uc784\uc744 \ubb34\ub8cc\ub85c \uc2dc\uc791\ud558\uc138\uc694",
    de: "Starte dein erstes Spiel \u2014 Kostenlos", fr: "Commencez votre premi\u00e8re partie \u2014 Gratuit",
    es: "Empieza tu primera partida \u2014 Gratis", pt: "Comece seu primeiro jogo \u2014 Gr\u00e1tis",
    ru: "\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u043f\u0435\u0440\u0432\u0443\u044e \u0438\u0433\u0440\u0443 \u2014 \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e",
    it: "Inizia la tua prima partita \u2014 Gratis", ar: "\u0627\u0628\u062f\u0623 \u0644\u0639\u0628\u062a\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u2014 \u0645\u062c\u0627\u0646\u0627\u064b",
  },
  "landing.continue_google": {
    en: "Continue with Google", zh: "\u7528Google\u7ee7\u7eed", ja: "Google\u3067\u7d9a\u3051\u308b", ko: "Google\ub85c \uacc4\uc18d",
    de: "Mit Google fortfahren", fr: "Continuer avec Google", es: "Continuar con Google",
    pt: "Continuar com Google", ru: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0441 Google", it: "Continua con Google", ar: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 Google",
  },
  "landing.guides": {
    en: "Guides & Resources", zh: "\u6307\u5357\u4e0e\u8d44\u6e90", ja: "\u30ac\u30a4\u30c9\u3068\u30ea\u30bd\u30fc\u30b9", ko: "\uac00\uc774\ub4dc \ubc0f \ub9ac\uc18c\uc2a4",
    de: "Anleitungen & Ressourcen", fr: "Guides et ressources", es: "Gu\u00edas y recursos",
    pt: "Guias e recursos", ru: "\u0413\u0430\u0439\u0434\u044b \u0438 \u0440\u0435\u0441\u0443\u0440\u0441\u044b", it: "Guide e risorse", ar: "\u0623\u062f\u0644\u0629 \u0648\u0645\u0648\u0627\u0631\u062f",
  },
  "landing.view_guides": {
    en: "View all guides \u2192", zh: "\u67e5\u770b\u6240\u6709\u6307\u5357 \u2192", ja: "\u3059\u3079\u3066\u306e\u30ac\u30a4\u30c9\u3092\u898b\u308b \u2192", ko: "\ubaa8\ub4e0 \uac00\uc774\ub4dc \ubcf4\uae30 \u2192",
    de: "Alle Anleitungen ansehen \u2192", fr: "Voir tous les guides \u2192", es: "Ver todas las gu\u00edas \u2192",
    pt: "Ver todos os guias \u2192", ru: "\u0412\u0441\u0435 \u0433\u0430\u0439\u0434\u044b \u2192", it: "Vedi tutte le guide \u2192", ar: "\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u062f\u0644\u0629 \u2192",
  },
  "landing.footer": {
    en: "Any game you describe, playable in minutes", zh: "\u63cf\u8ff0\u4efb\u4f55\u6e38\u620f\uff0c\u5206\u949f\u5185\u53ef\u73a9",
    ja: "\u3069\u3093\u306a\u30b2\u30fc\u30e0\u3082\u8aac\u660e\u3059\u308c\u3070\u6570\u5206\u3067\u30d7\u30ec\u30a4\u53ef\u80fd", ko: "\uc5b4\ub5a4 \uac8c\uc784\uc774\ub4e0 \uc124\uba85\ud558\uba74 \uba87 \ubd84 \ub9cc\uc5d0 \ud50c\ub808\uc774 \uac00\ub2a5",
    de: "Jedes Spiel, das du beschreibst, in Minuten spielbar", fr: "Tout jeu que vous d\u00e9crivez, jouable en quelques minutes",
    es: "Cualquier juego que describas, jugable en minutos", pt: "Qualquer jogo que voc\u00ea descreva, jog\u00e1vel em minutos",
    ru: "\u041b\u044e\u0431\u0430\u044f \u0438\u0433\u0440\u0430, \u043a\u043e\u0442\u043e\u0440\u0443\u044e \u0432\u044b \u043e\u043f\u0438\u0448\u0435\u0442\u0435, \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0437\u0430 \u043c\u0438\u043d\u0443\u0442\u044b",
    it: "Qualsiasi gioco descrivi, giocabile in pochi minuti", ar: "\u0623\u064a \u0644\u0639\u0628\u0629 \u062a\u0635\u0641\u0647\u0627\u060c \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0639\u0628 \u0641\u064a \u062f\u0642\u0627\u0626\u0642",
  },
  "landing.blog": { en: "Blog", zh: "\u535a\u5ba2", ja: "\u30d6\u30ed\u30b0", ko: "\ube14\ub85c\uadf8", de: "Blog", fr: "Blog", es: "Blog", pt: "Blog", ru: "\u0411\u043b\u043e\u0433", it: "Blog", ar: "\u0645\u062f\u0648\u0646\u0629" },
  "landing.privacy": {
    en: "Privacy Policy", zh: "\u9690\u79c1\u653f\u7b56", ja: "\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc", ko: "\uac1c\uc778\uc815\ubcf4 \ucc98\ub9ac\ubc29\uce68",
    de: "Datenschutzrichtlinie", fr: "Politique de confidentialit\u00e9", es: "Pol\u00edtica de privacidad",
    pt: "Pol\u00edtica de privacidade", ru: "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438", it: "Informativa sulla privacy", ar: "\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629",
  },
  "landing.terms": {
    en: "Terms of Service", zh: "\u670d\u52a1\u6761\u6b3e", ja: "\u5229\u7528\u898f\u7d04", ko: "\uc774\u7528\uc57d\uad00",
    de: "Nutzungsbedingungen", fr: "Conditions d\u2019utilisation", es: "T\u00e9rminos de servicio",
    pt: "Termos de servi\u00e7o", ru: "\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u044f", it: "Termini di servizio", ar: "\u0634\u0631\u0648\u0637 \u0627\u0644\u062e\u062f\u0645\u0629",
  },

  // ── Sidebar / User menu ───────────────────────────────────────────────
  "sidebar.credits": {
    en: "Credits", zh: "\u989d\u5ea6", ja: "\u30af\u30ec\u30b8\u30c3\u30c8", ko: "\ud06c\ub808\ub527",
    de: "Guthaben", fr: "Cr\u00e9dits", es: "Cr\u00e9ditos",
    pt: "Cr\u00e9ditos", ru: "\u041a\u0440\u0435\u0434\u0438\u0442\u044b", it: "Crediti", ar: "\u0627\u0644\u0631\u0635\u064a\u062f",
  },
  "sidebar.edit_profile": {
    en: "Edit Profile", zh: "\u7f16\u8f91\u8d44\u6599", ja: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u7de8\u96c6", ko: "\ud504\ub85c\ud544 \ud3b8\uc9d1",
    de: "Profil bearbeiten", fr: "Modifier le profil", es: "Editar perfil",
    pt: "Editar perfil", ru: "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c", it: "Modifica profilo", ar: "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  },
  "sidebar.buy_credits": {
    en: "Buy Credits", zh: "\u8d2d\u4e70\u989d\u5ea6", ja: "\u30af\u30ec\u30b8\u30c3\u30c8\u8cfc\u5165", ko: "\ud06c\ub808\ub527 \uad6c\ub9e4",
    de: "Guthaben kaufen", fr: "Acheter des cr\u00e9dits", es: "Comprar cr\u00e9ditos",
    pt: "Comprar cr\u00e9ditos", ru: "\u041a\u0443\u043f\u0438\u0442\u044c \u043a\u0440\u0435\u0434\u0438\u0442\u044b", it: "Acquista crediti", ar: "\u0634\u0631\u0627\u0621 \u0631\u0635\u064a\u062f",
  },
  "sidebar.help": {
    en: "Help & Support", zh: "\u5e2e\u52a9\u4e0e\u652f\u6301", ja: "\u30d8\u30eb\u30d7\u3068\u30b5\u30dd\u30fc\u30c8", ko: "\ub3c4\uc6c0\ub9d0 \ubc0f \uc9c0\uc6d0",
    de: "Hilfe & Support", fr: "Aide et support", es: "Ayuda y soporte",
    pt: "Ajuda e suporte", ru: "\u041f\u043e\u043c\u043e\u0449\u044c \u0438 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430", it: "Aiuto e supporto", ar: "\u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u0648\u0627\u0644\u062f\u0639\u0645",
  },
  "sidebar.log_out": {
    en: "Log Out", zh: "\u9000\u51fa\u767b\u5f55", ja: "\u30ed\u30b0\u30a2\u30a6\u30c8", ko: "\ub85c\uadf8\uc544\uc6c3",
    de: "Abmelden", fr: "D\u00e9connexion", es: "Cerrar sesi\u00f3n",
    pt: "Sair", ru: "\u0412\u044b\u0439\u0442\u0438", it: "Esci", ar: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  },
  "sidebar.signing_out": {
    en: "Signing out...", zh: "\u6b63\u5728\u9000\u51fa...", ja: "\u30ed\u30b0\u30a2\u30a6\u30c8\u4e2d...", ko: "\ub85c\uadf8\uc544\uc6c3 \uc911...",
    de: "Abmelden...", fr: "D\u00e9connexion...", es: "Cerrando sesi\u00f3n...",
    pt: "Saindo...", ru: "\u0412\u044b\u0445\u043e\u0434...", it: "Disconnessione...", ar: "\u062c\u0627\u0631\u064d \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c...",
  },
  "sidebar.delete_game": {
    en: "Delete Game", zh: "\u5220\u9664\u6e38\u620f", ja: "\u30b2\u30fc\u30e0\u3092\u524a\u9664", ko: "\uac8c\uc784 \uc0ad\uc81c",
    de: "Spiel l\u00f6schen", fr: "Supprimer le jeu", es: "Eliminar juego",
    pt: "Excluir jogo", ru: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0438\u0433\u0440\u0443", it: "Elimina gioco", ar: "\u062d\u0630\u0641 \u0627\u0644\u0644\u0639\u0628\u0629",
  },
  "sidebar.failed_sign_out": {
    en: "Failed to sign out. Please try again.", zh: "\u9000\u51fa\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002", ja: "\u30ed\u30b0\u30a2\u30a6\u30c8\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u518d\u8a66\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    ko: "\ub85c\uadf8\uc544\uc6c3\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
    de: "Abmeldung fehlgeschlagen. Bitte erneut versuchen.", fr: "\u00c9chec de la d\u00e9connexion. Veuillez r\u00e9essayer.",
    es: "Error al cerrar sesi\u00f3n. Int\u00e9ntalo de nuevo.", pt: "Falha ao sair. Tente novamente.",
    ru: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u0439\u0442\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.",
    it: "Disconnessione non riuscita. Riprova.", ar: "\u0641\u0634\u0644 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.",
  },

  // ── Channel list ──────────────────────────────────────────────────────
  "channel.game_rooms": {
    en: "Game Rooms", zh: "游戏房间", ja: "ゲームルーム", ko: "게임 룸",
    de: "Spielräume", fr: "Salles de jeu", es: "Salas de juego",
    pt: "Salas de jogo", ru: "Игровые комнаты", it: "Stanze di gioco", ar: "غرف اللعبة",
  },
  "channel.adventure": {
    en: "Adventure", zh: "冒险", ja: "アドベンチャー", ko: "어드벤처",
    de: "Abenteuer", fr: "Aventure", es: "Aventura",
    pt: "Aventura", ru: "Приключение", it: "Avventura", ar: "مغامرة",
  },
  "channel.my_board": {
    en: "My Board", zh: "我的面板", ja: "マイボード", ko: "내 보드",
    de: "Mein Board", fr: "Mon tableau", es: "Mi tablero",
    pt: "Meu painel", ru: "Моя доска", it: "La mia bacheca", ar: "لوحتي",
  },
  "channel.evidence_board": {
    en: "Evidence Board", zh: "证据板", ja: "証拠ボード", ko: "증거 보드",
    de: "Beweisboard", fr: "Tableau de preuves", es: "Tablero de evidencias",
    pt: "Painel de evidências", ru: "Доска улик", it: "Bacheca prove", ar: "لوحة الأدلة",
  },
  "channel.cannot_remove": {
    en: "Game rooms are defined by the Game Master and cannot be removed",
    zh: "游戏房间由系统定义，无法删除",
    ja: "ゲームルームはシステムが定義しており、削除できません",
    ko: "게임 룸은 시스템이 정의하며 삭제할 수 없습니다",
    de: "Spielräume werden vom System definiert und können nicht entfernt werden",
    fr: "Les salles de jeu sont définies par le système et ne peuvent pas être supprimées",
    es: "Las salas de juego están definidas por el sistema y no se pueden eliminar",
    pt: "As salas de jogo são definidas pelo sistema e não podem ser removidas",
    ru: "Игровые комнаты определены системой и не могут быть удалены",
    it: "Le stanze di gioco sono definite dal sistema e non possono essere rimosse",
    ar: "غرف اللعبة محددة من النظام ولا يمكن إزالتها",
  },
  "channel.delete_section": {
    en: "Delete Section", zh: "\u5220\u9664\u5206\u533a", ja: "\u30bb\u30af\u30b7\u30e7\u30f3\u3092\u524a\u9664", ko: "\uc139\uc158 \uc0ad\uc81c",
    de: "Bereich l\u00f6schen", fr: "Supprimer la section", es: "Eliminar secci\u00f3n",
    pt: "Excluir se\u00e7\u00e3o", ru: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0440\u0430\u0437\u0434\u0435\u043b", it: "Elimina sezione", ar: "\u062d\u0630\u0641 \u0627\u0644\u0642\u0633\u0645",
  },
  "channel.delete_room": {
    en: "Delete Room", zh: "\u5220\u9664\u623f\u95f4", ja: "\u30eb\u30fc\u30e0\u3092\u524a\u9664", ko: "\ubc29 \uc0ad\uc81c",
    de: "Raum l\u00f6schen", fr: "Supprimer la salle", es: "Eliminar sala",
    pt: "Excluir sala", ru: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u043e\u043c\u043d\u0430\u0442\u0443", it: "Elimina stanza", ar: "\u062d\u0630\u0641 \u0627\u0644\u063a\u0631\u0641\u0629",
  },
  "channel.public_room": {
    en: "Public room", zh: "\u516c\u5f00\u623f\u95f4", ja: "\u516c\u958b\u30eb\u30fc\u30e0", ko: "\uacf5\uac1c \ubc29",
    de: "\u00d6ffentlicher Raum", fr: "Salle publique", es: "Sala p\u00fablica",
    pt: "Sala p\u00fablica", ru: "\u041e\u0442\u043a\u0440\u044b\u0442\u0430\u044f \u043a\u043e\u043c\u043d\u0430\u0442\u0430", it: "Stanza pubblica", ar: "\u063a\u0631\u0641\u0629 \u0639\u0627\u0645\u0629",
  },
  "channel.member": {
    en: "{count} member", zh: "{count} \u540d\u6210\u5458", ja: "{count} \u30e1\u30f3\u30d0\u30fc", ko: "{count}\uba85",
    de: "{count} Mitglied", fr: "{count} membre", es: "{count} miembro",
    pt: "{count} membro", ru: "{count} \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a", it: "{count} membro", ar: "{count} \u0639\u0636\u0648",
  },
  "channel.members": {
    en: "{count} members", zh: "{count} \u540d\u6210\u5458", ja: "{count} \u30e1\u30f3\u30d0\u30fc", ko: "{count}\uba85",
    de: "{count} Mitglieder", fr: "{count} membres", es: "{count} miembros",
    pt: "{count} membros", ru: "{count} \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432", it: "{count} membri", ar: "{count} \u0623\u0639\u0636\u0627\u0621",
  },
  "channel.confirm_delete": {
    en: "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
    zh: "\u786e\u5b9a\u8981\u5220\u9664\u201c{name}\u201d\u5417\uff1f\u6b64\u64cd\u4f5c\u65e0\u6cd5\u64a4\u6d88\u3002",
    ja: "\u300c{name}\u300d\u3092\u524a\u9664\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f\u3053\u306e\u64cd\u4f5c\u306f\u53d6\u308a\u6d88\u305b\u307e\u305b\u3093\u3002",
    ko: "\"{name}\"\uc744(\ub97c) \uc0ad\uc81c\ud558\uc2dc\uaca0\uc2b5\ub2c8\uae4c? \uc774 \uc791\uc5c5\uc740 \ucde8\uc18c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
    de: "M\u00f6chten Sie \u201e{name}\u201c wirklich l\u00f6schen? Dies kann nicht r\u00fcckg\u00e4ngig gemacht werden.",
    fr: "\u00cates-vous s\u00fbr de vouloir supprimer \u00ab {name} \u00bb ? Cette action est irr\u00e9versible.",
    es: "\u00bfEst\u00e1s seguro de que quieres eliminar \u201c{name}\u201d? Esta acci\u00f3n no se puede deshacer.",
    pt: "Tem certeza de que deseja excluir \u201c{name}\u201d? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.",
    ru: "\u0412\u044b \u0443\u0432\u0435\u0440\u0435\u043d\u044b, \u0447\u0442\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u00ab{name}\u00bb? \u042d\u0442\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.",
    it: "Sei sicuro di voler eliminare \u201c{name}\u201d? Questa azione non pu\u00f2 essere annullata.",
    ar: "\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u201c{name}\u201d\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.",
  },
  "btn.delete": {
    en: "Delete", zh: "\u5220\u9664", ja: "\u524a\u9664", ko: "\uc0ad\uc81c",
    de: "L\u00f6schen", fr: "Supprimer", es: "Eliminar",
    pt: "Excluir", ru: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c", it: "Elimina", ar: "\u062d\u0630\u0641",
  },

  // ── Welcome page ──────────────────────────────────────────────────────
  "welcome.jump_back": {
    en: "Jump back in", zh: "\u7ee7\u7eed\u6e38\u620f", ja: "\u7d9a\u304d\u304b\u3089", ko: "\ub3cc\uc544\uac00\uae30",
    de: "Weiterspielen", fr: "Reprendre", es: "Volver al juego",
    pt: "Voltar ao jogo", ru: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c", it: "Riprendi", ar: "\u0627\u0644\u0639\u0648\u062f\u0629",
  },
  "welcome.loading": {
    en: "Loading\u2026", zh: "\u52a0\u8f7d\u4e2d\u2026", ja: "\u8aad\u307f\u8fbc\u307f\u4e2d\u2026", ko: "\ub85c\ub529 \uc911\u2026",
    de: "Laden\u2026", fr: "Chargement\u2026", es: "Cargando\u2026",
    pt: "Carregando\u2026", ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026", it: "Caricamento\u2026", ar: "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026",
  },
  "welcome.design_game": {
    en: "Design a game", zh: "\u8bbe\u8ba1\u4e00\u6b3e\u6e38\u620f", ja: "\u30b2\u30fc\u30e0\u3092\u30c7\u30b6\u30a4\u30f3", ko: "\uac8c\uc784 \ub514\uc790\uc778",
    de: "Ein Spiel entwerfen", fr: "Concevoir un jeu", es: "Dise\u00f1a un juego",
    pt: "Crie um jogo", ru: "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0438\u0433\u0440\u0443", it: "Progetta un gioco", ar: "\u0635\u0645\u0651\u0645 \u0644\u0639\u0628\u0629",
  },
  "welcome.in_conversation": {
    en: "in a conversation.", zh: "\u5728\u5bf9\u8bdd\u4e2d\u5b8c\u6210\u3002", ja: "\u4f1a\u8a71\u3067\u3002", ko: "\ub300\ud654\ub85c.",
    de: "im Gespr\u00e4ch.", fr: "en conversant.", es: "en una conversaci\u00f3n.",
    pt: "numa conversa.", ru: "\u0432 \u0434\u0438\u0430\u043b\u043e\u0433\u0435.", it: "in una conversazione.", ar: "\u0641\u064a \u0645\u062d\u0627\u062f\u062b\u0629.",
  },
  "welcome.hero_desc": {
    en: "Describe your idea. Get roles, rules, and a playable session\u2014with an AI host and AI players. No game design experience needed.",
    zh: "\u63cf\u8ff0\u4f60\u7684\u60f3\u6cd5\uff0c\u83b7\u53d6\u89d2\u8272\u3001\u89c4\u5219\u548c\u53ef\u73a9\u7684\u573a\u6b21\u2014\u2014\u7531AI\u4e3b\u6301\u548cAI\u73a9\u5bb6\u52a9\u9635\u3002\u65e0\u9700\u6e38\u620f\u8bbe\u8ba1\u7ecf\u9a8c\u3002",
    ja: "\u30a2\u30a4\u30c7\u30a2\u3092\u8aac\u660e\u3059\u308c\u3070\u3001\u5f79\u5272\u30fb\u30eb\u30fc\u30eb\u30fb\u30d7\u30ec\u30a4\u53ef\u80fd\u306a\u30bb\u30c3\u30b7\u30e7\u30f3\u304c\u624b\u306b\u5165\u308b\u3002\u30b2\u30fc\u30e0\u30c7\u30b6\u30a4\u30f3\u306e\u7d4c\u9a13\u4e0d\u8981\u3002",
    ko: "\uc544\uc774\ub514\uc5b4\ub97c \uc124\uba85\ud558\uba74 \uc5ed\ud560, \uaddc\uce59, \ud50c\ub808\uc774 \uac00\ub2a5\ud55c \uc138\uc158\uc744 \uc5bb\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uac8c\uc784 \ub514\uc790\uc778 \uacbd\ud5d8 \ubd88\ud544\uc694.",
    de: "Beschreibe deine Idee. Erhalte Rollen, Regeln und eine spielbare Session \u2014 mit einem KI-Host und KI-Spielern. Keine Spieldesign-Erfahrung n\u00f6tig.",
    fr: "D\u00e9crivez votre id\u00e9e. Obtenez r\u00f4les, r\u00e8gles et une session jouable \u2014 avec un h\u00f4te IA et des joueurs IA. Aucune exp\u00e9rience requise.",
    es: "Describe tu idea. Obt\u00e9n roles, reglas y una sesi\u00f3n jugable \u2014 con un anfitri\u00f3n IA y jugadores IA. Sin experiencia necesaria.",
    pt: "Descreva sua ideia. Obtenha pap\u00e9is, regras e uma sess\u00e3o jog\u00e1vel \u2014 com host IA e jogadores IA. Sem experi\u00eancia necess\u00e1ria.",
    ru: "\u041e\u043f\u0438\u0448\u0438\u0442\u0435 \u0438\u0434\u0435\u044e. \u041f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0440\u043e\u043b\u0438, \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0438 \u0438\u0433\u0440\u043e\u0432\u0443\u044e \u0441\u0435\u0441\u0441\u0438\u044e \u2014 \u0441 \u0418\u0418-\u0432\u0435\u0434\u0443\u0449\u0438\u043c \u0438 \u0418\u0418-\u0438\u0433\u0440\u043e\u043a\u0430\u043c\u0438.",
    it: "Descrivi la tua idea. Ottieni ruoli, regole e una sessione giocabile \u2014 con host IA e giocatori IA. Nessuna esperienza necessaria.",
    ar: "\u0635\u0641 \u0641\u0643\u0631\u062a\u0643. \u0627\u062d\u0635\u0644 \u0639\u0644\u0649 \u0623\u062f\u0648\u0627\u0631 \u0648\u0642\u0648\u0627\u0639\u062f \u0648\u062c\u0644\u0633\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0639\u0628 \u2014 \u0628\u0644\u0627 \u062e\u0628\u0631\u0629.",
  },
  "welcome.sign_in_create": {
    en: "Sign in to create your first game", zh: "\u767b\u5f55\u4ee5\u521b\u5efa\u4f60\u7684\u7b2c\u4e00\u5c40\u6e38\u620f",
    ja: "\u30b5\u30a4\u30f3\u30a4\u30f3\u3057\u3066\u6700\u521d\u306e\u30b2\u30fc\u30e0\u3092\u4f5c\u308d\u3046", ko: "\ub85c\uadf8\uc778\ud558\uc5ec \uccab \uac8c\uc784\uc744 \ub9cc\ub4dc\uc138\uc694",
    de: "Anmelden und erstes Spiel erstellen", fr: "Connectez-vous pour cr\u00e9er votre premier jeu",
    es: "Inicia sesi\u00f3n para crear tu primer juego", pt: "Entre para criar seu primeiro jogo",
    ru: "\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0435\u0440\u0432\u0443\u044e \u0438\u0433\u0440\u0443",
    it: "Accedi per creare il tuo primo gioco", ar: "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0625\u0646\u0634\u0627\u0621 \u0644\u0639\u0628\u062a\u0643 \u0627\u0644\u0623\u0648\u0644\u0649",
  },
  "welcome.browse_templates": {
    en: "Browse templates", zh: "\u6d4f\u89c8\u6a21\u677f", ja: "\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u63a2\u3059", ko: "\ud15c\ud50c\ub9bf \ub458\ub7ec\ubcf4\uae30",
    de: "Vorlagen durchsuchen", fr: "Parcourir les mod\u00e8les", es: "Explorar plantillas",
    pt: "Explorar modelos", ru: "\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0448\u0430\u0431\u043b\u043e\u043d\u044b", it: "Sfoglia i modelli", ar: "\u062a\u0635\u0641\u062d \u0627\u0644\u0642\u0648\u0627\u0644\u0628",
  },
  "welcome.free_start": {
    en: "Free to start \u00b7 No credit card required", zh: "\u514d\u8d39\u5f00\u59cb \u00b7 \u65e0\u9700\u4fe1\u7528\u5361",
    ja: "\u7121\u6599\u3067\u59cb\u3081\u3089\u308c\u308b \u00b7 \u30af\u30ec\u30b8\u30c3\u30c8\u30ab\u30fc\u30c9\u4e0d\u8981", ko: "\ubb34\ub8cc\ub85c \uc2dc\uc791 \u00b7 \uc2e0\uc6a9\uce74\ub4dc \ubd88\ud544\uc694",
    de: "Kostenlos starten \u00b7 Keine Kreditkarte n\u00f6tig", fr: "Gratuit pour commencer \u00b7 Pas de carte de cr\u00e9dit",
    es: "Gratis para empezar \u00b7 Sin tarjeta de cr\u00e9dito", pt: "Gratuito para come\u00e7ar \u00b7 Sem cart\u00e3o de cr\u00e9dito",
    ru: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u00b7 \u041a\u0430\u0440\u0442\u0430 \u043d\u0435 \u043d\u0443\u0436\u043d\u0430",
    it: "Gratis per iniziare \u00b7 Nessuna carta di credito", ar: "\u0645\u062c\u0627\u0646\u064a \u0644\u0644\u0628\u062f\u0621 \u00b7 \u0644\u0627 \u062d\u0627\u062c\u0629 \u0644\u0628\u0637\u0627\u0642\u0629",
  },
  "welcome.save_games": {
    en: "Save games", zh: "\u4fdd\u5b58\u6e38\u620f", ja: "\u30b2\u30fc\u30e0\u3092\u4fdd\u5b58", ko: "\uac8c\uc784 \uc800\uc7a5",
    de: "Spiele speichern", fr: "Sauvegarder les jeux", es: "Guardar juegos",
    pt: "Salvar jogos", ru: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0433\u0440\u044b", it: "Salva i giochi", ar: "\u062d\u0641\u0638 \u0627\u0644\u0623\u0644\u0639\u0627\u0628",
  },
  "welcome.sync_devices": {
    en: "Sync across devices", zh: "\u8de8\u8bbe\u5907\u540c\u6b65", ja: "\u30c7\u30d0\u30a4\u30b9\u9593\u540c\u671f", ko: "\uae30\uae30 \uac04 \ub3d9\uae30\ud654",
    de: "Ger\u00e4te\u00fcbergreifend synchronisieren", fr: "Synchroniser entre appareils", es: "Sincronizar entre dispositivos",
    pt: "Sincronizar entre dispositivos", ru: "\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f \u043c\u0435\u0436\u0434\u0443 \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430\u043c\u0438", it: "Sincronizza tra dispositivi", ar: "\u0645\u0632\u0627\u0645\u0646\u0629 \u0639\u0628\u0631 \u0627\u0644\u0623\u062c\u0647\u0632\u0629",
  },
  "welcome.share_friends": {
    en: "Share links to play with friends", zh: "\u5206\u4eab\u94fe\u63a5\u4e0e\u670b\u53cb\u4e00\u8d77\u73a9", ja: "\u30ea\u30f3\u30af\u3092\u5171\u6709\u3057\u3066\u53cb\u9054\u3068\u30d7\u30ec\u30a4",
    ko: "\ub9c1\ud06c\ub97c \uacf5\uc720\ud558\uc5ec \uce5c\uad6c\uc640 \ud50c\ub808\uc774",
    de: "Links teilen, um mit Freunden zu spielen", fr: "Partager des liens pour jouer entre amis",
    es: "Comparte enlaces para jugar con amigos", pt: "Compartilhe links para jogar com amigos",
    ru: "\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u0435\u0441\u044c \u0441\u0441\u044b\u043b\u043a\u043e\u0439 \u0434\u043b\u044f \u0438\u0433\u0440\u044b \u0441 \u0434\u0440\u0443\u0437\u044c\u044f\u043c\u0438",
    it: "Condividi link per giocare con amici", ar: "\u0634\u0627\u0631\u0643 \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0644\u0644\u0639\u0628 \u0645\u0639 \u0627\u0644\u0623\u0635\u062f\u0642\u0627\u0621",
  },
  "welcome.try_it": {
    en: "Try it \u2014 no sign-in required", zh: "\u8bd5\u8bd5\u770b \u2014 \u65e0\u9700\u767b\u5f55", ja: "\u8a66\u3057\u3066\u307f\u3088\u3046 \u2014 \u30b5\u30a4\u30f3\u30a4\u30f3\u4e0d\u8981",
    ko: "\uc2dc\ub3c4\ud574\ubcf4\uc138\uc694 \u2014 \ub85c\uadf8\uc778 \ubd88\ud544\uc694",
    de: "Ausprobieren \u2014 ohne Anmeldung", fr: "Essayez \u2014 sans connexion",
    es: "Prueba \u2014 sin registrarse", pt: "Experimente \u2014 sem login",
    ru: "\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u2014 \u0431\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438",
    it: "Prova \u2014 senza registrazione", ar: "\u062c\u0631\u0651\u0628 \u2014 \u0628\u062f\u0648\u0646 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644",
  },
  "welcome.ready": {
    en: "Ready to create?", zh: "\u51c6\u5907\u597d\u521b\u5efa\u4e86\u5417\uff1f", ja: "\u4f5c\u6210\u6e96\u5099\u306f\u3044\u3044\u3067\u3059\u304b\uff1f", ko: "\ub9cc\ub4e4 \uc900\ube44\uac00 \ub418\uc168\ub098\uc694?",
    de: "Bereit zu erstellen?", fr: "Pr\u00eat \u00e0 cr\u00e9er ?", es: "\u00bfListo para crear?",
    pt: "Pronto para criar?", ru: "\u0413\u043e\u0442\u043e\u0432\u044b \u0441\u043e\u0437\u0434\u0430\u0442\u044c?", it: "Pronto a creare?", ar: "\u0645\u0633\u062a\u0639\u062f \u0644\u0644\u0625\u0646\u0634\u0627\u0621\u061f",
  },
  "welcome.create_new": {
    en: "Create a new game", zh: "\u521b\u5efa\u65b0\u6e38\u620f", ja: "\u65b0\u3057\u3044\u30b2\u30fc\u30e0\u3092\u4f5c\u6210", ko: "\uc0c8 \uac8c\uc784 \ub9cc\ub4e4\uae30",
    de: "Neues Spiel erstellen", fr: "Cr\u00e9er un nouveau jeu", es: "Crear un juego nuevo",
    pt: "Criar um novo jogo", ru: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u0438\u0433\u0440\u0443", it: "Crea un nuovo gioco", ar: "\u0623\u0646\u0634\u0626 \u0644\u0639\u0628\u0629 \u062c\u062f\u064a\u062f\u0629",
  },
  "welcome.sign_in_save": {
    en: "Sign in to save and run your games.", zh: "\u767b\u5f55\u4ee5\u4fdd\u5b58\u548c\u8fd0\u884c\u4f60\u7684\u6e38\u620f\u3002",
    ja: "\u30b5\u30a4\u30f3\u30a4\u30f3\u3057\u3066\u30b2\u30fc\u30e0\u3092\u4fdd\u5b58\u30fb\u5b9f\u884c\u3002", ko: "\ub85c\uadf8\uc778\ud558\uc5ec \uac8c\uc784\uc744 \uc800\uc7a5\ud558\uace0 \uc2e4\ud589\ud558\uc138\uc694.",
    de: "Anmelden, um Spiele zu speichern und auszuf\u00fchren.", fr: "Connectez-vous pour sauvegarder et lancer vos jeux.",
    es: "Inicia sesi\u00f3n para guardar y ejecutar tus juegos.", pt: "Entre para salvar e rodar seus jogos.",
    ru: "\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0442\u044c \u0438 \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0442\u044c \u0438\u0433\u0440\u044b.",
    it: "Accedi per salvare e avviare i tuoi giochi.", ar: "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062d\u0641\u0638 \u0648\u062a\u0634\u063a\u064a\u0644 \u0623\u0644\u0639\u0627\u0628\u0643.",
  },

  // ── User profile / settings ──────────────────────────────────────────
  "profile.user_settings": {
    en: "User Settings", zh: "\u7528\u6237\u8bbe\u7f6e", ja: "\u30e6\u30fc\u30b6\u30fc\u8a2d\u5b9a", ko: "\uc0ac\uc6a9\uc790 \uc124\uc815",
    de: "Benutzereinstellungen", fr: "Param\u00e8tres utilisateur", es: "Configuraci\u00f3n de usuario",
    pt: "Configura\u00e7\u00f5es do usu\u00e1rio", ru: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", it: "Impostazioni utente", ar: "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
  },
  "profile.my_account": {
    en: "My Account", zh: "\u6211\u7684\u8d26\u6237", ja: "\u30de\u30a4\u30a2\u30ab\u30a6\u30f3\u30c8", ko: "\ub0b4 \uacc4\uc815",
    de: "Mein Konto", fr: "Mon compte", es: "Mi cuenta",
    pt: "Minha conta", ru: "\u041c\u043e\u0439 \u0430\u043a\u043a\u0430\u0443\u043d\u0442", it: "Il mio account", ar: "\u062d\u0633\u0627\u0628\u064a",
  },
  "profile.game_history": {
    en: "Game History", zh: "\u6e38\u620f\u5386\u53f2", ja: "\u30b2\u30fc\u30e0\u5c65\u6b74", ko: "\uac8c\uc784 \uae30\ub85d",
    de: "Spielverlauf", fr: "Historique des jeux", es: "Historial de juegos",
    pt: "Hist\u00f3rico de jogos", ru: "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0438\u0433\u0440", it: "Cronologia giochi", ar: "\u0633\u062c\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628",
  },
  "profile.profile_picture": {
    en: "Profile Picture", zh: "\u5934\u50cf", ja: "\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u753b\u50cf", ko: "\ud504\ub85c\ud544 \uc0ac\uc9c4",
    de: "Profilbild", fr: "Photo de profil", es: "Foto de perfil",
    pt: "Foto de perfil", ru: "\u0410\u0432\u0430\u0442\u0430\u0440", it: "Immagine profilo", ar: "\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
  },
  "profile.avatar_provider": {
    en: "Avatar managed via your sign-in provider", zh: "\u5934\u50cf\u7531\u767b\u5f55\u670d\u52a1\u63d0\u4f9b\u5546\u7ba1\u7406",
    ja: "\u30a2\u30d0\u30bf\u30fc\u306f\u30b5\u30a4\u30f3\u30a4\u30f3\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3067\u7ba1\u7406\u3055\u308c\u3066\u3044\u307e\u3059", ko: "\uc544\ubc14\ud0c0\ub294 \ub85c\uadf8\uc778 \uc81c\uacf5\uc5c5\uccb4\uc5d0\uc11c \uad00\ub9ac\ub429\ub2c8\ub2e4",
    de: "Avatar wird \u00fcber Ihren Anmeldeanbieter verwaltet", fr: "Avatar g\u00e9r\u00e9 par votre fournisseur de connexion",
    es: "Avatar gestionado por tu proveedor de inicio de sesi\u00f3n", pt: "Avatar gerenciado pelo seu provedor de login",
    ru: "\u0410\u0432\u0430\u0442\u0430\u0440 \u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u0432\u0430\u0448\u0438\u043c \u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440\u043e\u043c \u0432\u0445\u043e\u0434\u0430",
    it: "Avatar gestito dal tuo provider di accesso", ar: "\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0631\u0645\u0632\u064a\u0629 \u062a\u062f\u064a\u0631\u0647\u0627 \u062e\u062f\u0645\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  },
  "profile.username": {
    en: "Username", zh: "\u7528\u6237\u540d", ja: "\u30e6\u30fc\u30b6\u30fc\u540d", ko: "\uc0ac\uc6a9\uc790\uba85",
    de: "Benutzername", fr: "Nom d\u2019utilisateur", es: "Nombre de usuario",
    pt: "Nome de usu\u00e1rio", ru: "\u0418\u043c\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f", it: "Nome utente", ar: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
  },
  "profile.email": {
    en: "Email", zh: "\u7535\u5b50\u90ae\u4ef6", ja: "\u30e1\u30fc\u30eb", ko: "\uc774\uba54\uc77c",
    de: "E-Mail", fr: "E-mail", es: "Correo electr\u00f3nico",
    pt: "E-mail", ru: "\u042d\u043b. \u043f\u043e\u0447\u0442\u0430", it: "E-mail", ar: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
  },
  "profile.update_hint": {
    en: "To update your name or email, edit them in your sign-in provider (Google, Facebook, etc.).",
    zh: "\u8981\u66f4\u65b0\u59d3\u540d\u6216\u90ae\u7bb1\uff0c\u8bf7\u5728\u767b\u5f55\u670d\u52a1\u63d0\u4f9b\u5546\uff08Google\u3001Facebook \u7b49\uff09\u4e2d\u4fee\u6539\u3002",
    ja: "\u540d\u524d\u3084\u30e1\u30fc\u30eb\u3092\u66f4\u65b0\u3059\u308b\u306b\u306f\u3001\u30b5\u30a4\u30f3\u30a4\u30f3\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\uff08Google\u3001Facebook\u306a\u3069\uff09\u3067\u7de8\u96c6\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    ko: "\uc774\ub984\uc774\ub098 \uc774\uba54\uc77c\uc744 \ubcc0\uacbd\ud558\ub824\uba74 \ub85c\uadf8\uc778 \uc81c\uacf5\uc5c5\uccb4(Google, Facebook \ub4f1)\uc5d0\uc11c \uc218\uc815\ud558\uc138\uc694.",
    de: "Um Ihren Namen oder Ihre E-Mail zu \u00e4ndern, bearbeiten Sie diese bei Ihrem Anmeldeanbieter (Google, Facebook usw.).",
    fr: "Pour modifier votre nom ou e-mail, modifiez-les dans votre fournisseur de connexion (Google, Facebook, etc.).",
    es: "Para actualizar tu nombre o correo, ed\u00edtalos en tu proveedor de inicio de sesi\u00f3n (Google, Facebook, etc.).",
    pt: "Para atualizar seu nome ou e-mail, edite-os no seu provedor de login (Google, Facebook, etc.).",
    ru: "\u0427\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0438\u043c\u044f \u0438\u043b\u0438 \u044d\u043b. \u043f\u043e\u0447\u0442\u0443, \u043e\u0442\u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0438\u0445 \u0443 \u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440\u0430 \u0432\u0445\u043e\u0434\u0430 (Google, Facebook \u0438 \u0442.\u0434.).",
    it: "Per aggiornare nome o e-mail, modificali nel tuo provider di accesso (Google, Facebook, ecc.).",
    ar: "\u0644\u062a\u062d\u062f\u064a\u062b \u0627\u0633\u0645\u0643 \u0623\u0648 \u0628\u0631\u064a\u062f\u0643\u060c \u0639\u062f\u0651\u0644\u0647\u0645\u0627 \u0641\u064a \u0645\u0632\u0648\u062f \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 (Google\u060c Facebook \u0625\u0644\u062e).",
  },
  "profile.game_language": {
    en: "Game Language", zh: "\u6e38\u620f\u8bed\u8a00", ja: "\u30b2\u30fc\u30e0\u8a00\u8a9e", ko: "\uac8c\uc784 \uc5b8\uc5b4",
    de: "Spielsprache", fr: "Langue du jeu", es: "Idioma del juego",
    pt: "Idioma do jogo", ru: "\u042f\u0437\u044b\u043a \u0438\u0433\u0440\u044b", it: "Lingua del gioco", ar: "\u0644\u063a\u0629 \u0627\u0644\u0644\u0639\u0628\u0629",
  },
  "profile.language_hint": {
    en: "AI characters and narration will use this language at the start of each game. If you reply in a different language, they will automatically switch.",
    zh: "AI\u89d2\u8272\u548c\u53d9\u8ff0\u4f1a\u5728\u6bcf\u5c40\u6e38\u620f\u5f00\u59cb\u65f6\u4f7f\u7528\u6b64\u8bed\u8a00\u3002\u5982\u679c\u4f60\u7528\u5176\u4ed6\u8bed\u8a00\u56de\u590d\uff0c\u5b83\u4eec\u4f1a\u81ea\u52a8\u5207\u6362\u3002",
    ja: "AI\u30ad\u30e3\u30e9\u3068\u30ca\u30ec\u30fc\u30b7\u30e7\u30f3\u306f\u5404\u30b2\u30fc\u30e0\u958b\u59cb\u6642\u306b\u3053\u306e\u8a00\u8a9e\u3092\u4f7f\u7528\u3057\u307e\u3059\u3002\u5225\u306e\u8a00\u8a9e\u3067\u8fd4\u4fe1\u3059\u308b\u3068\u81ea\u52d5\u3067\u5207\u308a\u66ff\u308f\u308a\u307e\u3059\u3002",
    ko: "AI \uce90\ub9ad\ud130\uc640 \ub0b4\ub808\uc774\uc158\uc740 \uac01 \uac8c\uc784 \uc2dc\uc791 \uc2dc \uc774 \uc5b8\uc5b4\ub97c \uc0ac\uc6a9\ud569\ub2c8\ub2e4. \ub2e4\ub978 \uc5b8\uc5b4\ub85c \ub2f5\uc7a5\ud558\uba74 \uc790\ub3d9\uc73c\ub85c \uc804\ud658\ub429\ub2c8\ub2e4.",
    de: "KI-Charaktere und Erz\u00e4hlung verwenden diese Sprache zu Spielbeginn. Bei Antworten in einer anderen Sprache wird automatisch gewechselt.",
    fr: "Les personnages IA et la narration utiliseront cette langue au d\u00e9but de chaque partie. Si vous r\u00e9pondez dans une autre langue, ils basculeront automatiquement.",
    es: "Los personajes IA y la narraci\u00f3n usar\u00e1n este idioma al inicio de cada partida. Si respondes en otro idioma, cambiar\u00e1n autom\u00e1ticamente.",
    pt: "Os personagens IA e a narra\u00e7\u00e3o usar\u00e3o este idioma no in\u00edcio de cada jogo. Se voc\u00ea responder em outro idioma, eles mudam automaticamente.",
    ru: "\u0418\u0418-\u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438 \u0438 \u043f\u043e\u0432\u0435\u0441\u0442\u0432\u043e\u0432\u0430\u043d\u0438\u0435 \u0431\u0443\u0434\u0443\u0442 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u044d\u0442\u043e\u0442 \u044f\u0437\u044b\u043a \u0432 \u043d\u0430\u0447\u0430\u043b\u0435 \u043a\u0430\u0436\u0434\u043e\u0439 \u0438\u0433\u0440\u044b. \u041f\u0440\u0438 \u043e\u0442\u0432\u0435\u0442\u0435 \u043d\u0430 \u0434\u0440\u0443\u0433\u043e\u043c \u044f\u0437\u044b\u043a\u0435 \u043e\u043d\u0438 \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0430\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438.",
    it: "I personaggi IA e la narrazione useranno questa lingua all\u2019inizio di ogni partita. Se rispondi in un\u2019altra lingua, cambieranno automaticamente.",
    ar: "\u0633\u062a\u0633\u062a\u062e\u062f\u0645 \u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u0633\u0631\u062f \u0647\u0630\u0647 \u0627\u0644\u0644\u063a\u0629 \u0641\u064a \u0628\u062f\u0627\u064a\u0629 \u0643\u0644 \u0644\u0639\u0628\u0629. \u0625\u0630\u0627 \u0631\u062f\u062f\u062a \u0628\u0644\u063a\u0629 \u0623\u062e\u0631\u0649\u060c \u0633\u064a\u062a\u062d\u0648\u0644\u0648\u0646 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b.",
  },
  "profile.lang_saved": {
    en: "Language saved", zh: "\u8bed\u8a00\u5df2\u4fdd\u5b58", ja: "\u8a00\u8a9e\u304c\u4fdd\u5b58\u3055\u308c\u307e\u3057\u305f", ko: "\uc5b8\uc5b4\uac00 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4",
    de: "Sprache gespeichert", fr: "Langue enregistr\u00e9e", es: "Idioma guardado",
    pt: "Idioma salvo", ru: "\u042f\u0437\u044b\u043a \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d", it: "Lingua salvata", ar: "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0644\u063a\u0629",
  },
  "profile.lang_failed": {
    en: "Failed to save language", zh: "\u4fdd\u5b58\u8bed\u8a00\u5931\u8d25", ja: "\u8a00\u8a9e\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f", ko: "\uc5b8\uc5b4 \uc800\uc7a5 \uc2e4\ud328",
    de: "Sprache konnte nicht gespeichert werden", fr: "\u00c9chec de l\u2019enregistrement de la langue", es: "Error al guardar el idioma",
    pt: "Falha ao salvar o idioma", ru: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u044f\u0437\u044b\u043a", it: "Impossibile salvare la lingua", ar: "\u0641\u0634\u0644 \u062d\u0641\u0638 \u0627\u0644\u0644\u063a\u0629",
  },
  "profile.games_created": {
    en: "Games Created", zh: "\u5df2\u521b\u5efa\u6e38\u620f", ja: "\u4f5c\u6210\u3057\u305f\u30b2\u30fc\u30e0", ko: "\uc0dd\uc131\ud55c \uac8c\uc784",
    de: "Erstellte Spiele", fr: "Jeux cr\u00e9\u00e9s", es: "Juegos creados",
    pt: "Jogos criados", ru: "\u0421\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0435 \u0438\u0433\u0440\u044b", it: "Giochi creati", ar: "\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
  },
  "profile.view_all": {
    en: "View All", zh: "\u67e5\u770b\u5168\u90e8", ja: "\u3059\u3079\u3066\u898b\u308b", ko: "\ubaa8\ub450 \ubcf4\uae30",
    de: "Alle anzeigen", fr: "Tout voir", es: "Ver todo",
    pt: "Ver tudo", ru: "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0432\u0441\u0435", it: "Vedi tutto", ar: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
  },
  "profile.loading_games": {
    en: "Loading games\u2026", zh: "\u52a0\u8f7d\u6e38\u620f\u4e2d\u2026", ja: "\u30b2\u30fc\u30e0\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u2026", ko: "\uac8c\uc784 \ub85c\ub529 \uc911\u2026",
    de: "Spiele laden\u2026", fr: "Chargement des jeux\u2026", es: "Cargando juegos\u2026",
    pt: "Carregando jogos\u2026", ru: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0438\u0433\u0440\u2026", it: "Caricamento giochi\u2026", ar: "\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628\u2026",
  },
  "profile.no_games": {
    en: "No games yet. Create your first game!", zh: "\u8fd8\u6ca1\u6709\u6e38\u620f\u3002\u521b\u5efa\u4f60\u7684\u7b2c\u4e00\u5c40\u5427\uff01",
    ja: "\u30b2\u30fc\u30e0\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002\u6700\u521d\u306e\u30b2\u30fc\u30e0\u3092\u4f5c\u308a\u307e\u3057\u3087\u3046\uff01", ko: "\uc544\uc9c1 \uac8c\uc784\uc774 \uc5c6\uc2b5\ub2c8\ub2e4. \uccab \uac8c\uc784\uc744 \ub9cc\ub4e4\uc5b4 \ubcf4\uc138\uc694!",
    de: "Noch keine Spiele. Erstelle dein erstes Spiel!", fr: "Aucun jeu pour l\u2019instant. Cr\u00e9ez votre premier jeu !",
    es: "A\u00fan no hay juegos. \u00a1Crea tu primer juego!", pt: "Nenhum jogo ainda. Crie seu primeiro jogo!",
    ru: "\u0418\u0433\u0440 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043f\u0435\u0440\u0432\u0443\u044e!",
    it: "Nessun gioco ancora. Crea il tuo primo gioco!", ar: "\u0644\u0627 \u0623\u0644\u0639\u0627\u0628 \u0628\u0639\u062f. \u0623\u0646\u0634\u0626 \u0644\u0639\u0628\u062a\u0643 \u0627\u0644\u0623\u0648\u0644\u0649!",
  },
  "profile.start_game": {
    en: "Start a Game", zh: "\u5f00\u59cb\u6e38\u620f", ja: "\u30b2\u30fc\u30e0\u3092\u59cb\u3081\u308b", ko: "\uac8c\uc784 \uc2dc\uc791",
    de: "Spiel starten", fr: "Commencer une partie", es: "Iniciar un juego",
    pt: "Iniciar um jogo", ru: "\u041d\u0430\u0447\u0430\u0442\u044c \u0438\u0433\u0440\u0443", it: "Inizia un gioco", ar: "\u0627\u0628\u062f\u0623 \u0644\u0639\u0628\u0629",
  },
  "profile.untitled": {
    en: "Untitled Game", zh: "\u65e0\u6807\u9898\u6e38\u620f", ja: "\u7121\u984c\u306e\u30b2\u30fc\u30e0", ko: "\uc81c\ubaa9 \uc5c6\ub294 \uac8c\uc784",
    de: "Unbenanntes Spiel", fr: "Jeu sans titre", es: "Juego sin t\u00edtulo",
    pt: "Jogo sem t\u00edtulo", ru: "\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f", it: "Gioco senza titolo", ar: "\u0644\u0639\u0628\u0629 \u0628\u062f\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
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

/**
 * Translate an action template string (the prefilled text sent as the player's message).
 * Uses the English template as the lookup key (normalized).
 */
export function tTemplate(template: string, lang?: string): string {
  const key = `template.${template.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "")}`;
  const entry = T[key];
  if (!entry) return template;
  const effectiveLang = lang ?? getAppLanguage();
  const base = resolveKey(effectiveLang);
  return entry[base] ?? entry.en ?? template;
}

/**
 * Translate a game style badge ("Casual" / "Strategic" / "Competitive").
 */
export function tStyle(style: string, lang?: string): string {
  const key = `style.${style.toLowerCase()}`;
  const entry = T[key];
  if (!entry) return style;
  const effectiveLang = lang ?? getAppLanguage();
  const base = resolveKey(effectiveLang);
  return entry[base] ?? entry.en ?? style;
}

/**
 * Translate a category label by its id.
 */
export function tCategory(catId: string, lang?: string): string {
  const key = `cat.${catId}`;
  const entry = T[key];
  if (!entry) return catId;
  const effectiveLang = lang ?? getAppLanguage();
  const base = resolveKey(effectiveLang);
  return entry[base] ?? entry.en ?? catId;
}

/** @deprecated Use `getAppLanguage()` instead */
export function getBrowserLanguage(): string {
  return getAppLanguage();
}
