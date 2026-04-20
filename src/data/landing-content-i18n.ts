/**
 * Localized overrides for landing page structured data.
 *
 * English text lives in landing-content.ts (the source of truth).
 * This file provides overlay translations — only text fields are
 * replaced; structural fields (icons, images, etc.) come from the
 * English originals.
 *
 * Tier 1 languages: en, zh, ja, ko, de, fr, es, pt, ru, it, ar
 */

import type {
  GameScenario,
  MarqueeCharacter,
  Feature,
  FAQItem,
  InsideGameStep,
} from "./landing-content";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type L = Record<string, string>;

function resolveKey(lang: string): string {
  if (!lang) return "en";
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  return lower.split("-")[0];
}

function pick(map: L, lang: string): string | undefined {
  return map[resolveKey(lang)];
}

// ─── Game Scenarios ───────────────────────────────────────────────────────────

type ScenarioOverlay = { title: string; messages: string[] };

// Scenario IDs match GAME_SCENARIOS in landing-content.ts. When the source
// scenarios get renamed/replaced, this file MUST be updated in lockstep —
// otherwise localizeScenarios() falls through to English, leaving
// non-English homepages silently un-localized.
// Order of `messages` matches landing-content.ts message order exactly.
const SCENARIO_TEXT: Record<string, Record<string, ScenarioOverlay>> = {
  zh: {
    dungeon: { title: "地下城探险", messages: [
      "厚重的石门轰然推开，火把光照亮一间圆形石室——三个哥布林斥候从一只被偷的补给箱旁抬起头，狞笑着。",
      "总算来活了——我都快无聊死了。退到我身后，前排我来扛。",
      "等等——阴影里还藏着第四个，我看见了。让我先把那个偷袭的解决掉。",
      "去吧。前面三个我顶住。别失手。",
    ]},
    exploration: { title: "开放世界", messages: [
      "锈剑客栈一早冷冷清清，门口的告示板贴满任务榜。掌柜一边擦着酒杯，一边斜眼打量你们。",
      "看看告示板——说不定有合适的活。我去问问掌柜最近有什么传闻。",
      "这条不错——『商队失踪，最后出现在北方』，赏金挺厚。我们正缺银子。",
      "北边是黑林。先备好补给。最好再找个帮手。",
    ]},
    boss: { title: "Boss 战", messages: [
      "巨龙咆哮，洞顶碎石簌簌而落。它的鳞片烧得通红——它进入狂暴阶段了。地面震得发颤。",
      "Aldric，你血量到极限了！立刻退到掩体后——快！我可以治你，但你得先撑过这两秒。",
      "再一击我就能把它打趴！再撑我十秒就行！",
      "十秒？！行啊——你要是死了，我可不会把你那身铠甲扛回城。",
    ]},
  },
  ja: {
    dungeon: { title: "ダンジョン探索", messages: [
      "重い石の扉が音を立てて開く。たいまつの光が円形の広間を照らし出す——三体のゴブリン斥候が、奪った補給箱から顔を上げ、唸り声を上げる。",
      "ようやくか。退屈してたところだ。下がってろ——前線は俺が抑える。",
      "待って——影に四体目が隠れてる。見えた。あれは私が片付ける。",
      "ならいけ。前の三体は俺が引き受ける。外すなよ。",
    ]},
    exploration: { title: "オープンワールド", messages: [
      "錆びた剣亭は朝から静まり返り、入口の掲示板には依頼書がびっしり貼られている。店主はジョッキを磨きながら、片目でこちらを見ている。",
      "掲示板を見てみよう——割のいい仕事があるかも。店主にも噂を聞いてみる。",
      "これいいぞ——『商隊が失踪、最後に目撃されたのは北方』。賞金もまとも。路銀の足しになる。",
      "北はダークウッドね。先に物資を整えて。応援も呼んだ方がいいかも。",
    ]},
    boss: { title: "ボス戦", messages: [
      "竜が咆哮し、洞窟の天井から小石が落ちる。鱗が真っ赤に焼けあがり——奴は狂乱モードに入った。地面が震える。",
      "Aldric、HPが危ない！すぐに遮蔽物の後ろへ——今だ！治癒はする、でもあと二秒だけ生き延びて。",
      "もう一発で奴をよろめかせられる！あと十秒だけ俺を生かしてくれ！",
      "十秒！？分かった——でも死んだらその鎧、町まで運んであげないからね。",
    ]},
  },
  ko: {
    dungeon: { title: "던전 탐험", messages: [
      "육중한 돌문이 신음을 내며 열린다. 횃불 빛이 원형 방을 비추자 — 약탈한 보급 상자 옆에 있던 고블린 정찰병 셋이 으르렁거리며 고개를 든다.",
      "드디어. 지루해 죽을 뻔했어. 뒤로 빠져 — 전열은 내가 막는다.",
      "잠깐 — 그림자에 넷째가 숨어 있어. 보여. 저 암살자는 내가 처리할게.",
      "그럼 가. 앞의 셋은 내가 막을 테니까. 빗나가지 마.",
    ]},
    exploration: { title: "오픈 월드", messages: [
      "녹슨 검 여관은 아침부터 한산하다. 문 옆 게시판에 의뢰서가 빼곡히 붙어 있고, 주인은 술잔을 닦으며 한쪽 눈으로 너희를 살핀다.",
      "게시판을 보자 — 쓸만한 일이 있을지도. 나는 주인한테 소문을 물어볼게.",
      "이거 괜찮은데 — '상단 실종, 마지막 목격은 북쪽.' 현상금이 두둑해. 돈이 필요하잖아.",
      "북쪽은 다크우드야. 먼저 보급부터 챙겨. 지원도 부르는 게 나아.",
    ]},
    boss: { title: "보스 전투", messages: [
      "용이 포효하자 동굴 천장에서 돌조각이 우수수 떨어진다. 비늘이 시뻘겋게 달아오른다 — 광폭화 단계에 들어섰다. 땅이 흔들린다.",
      "Aldric, HP 위험해! 당장 엄폐물 뒤로 — 지금! 치유는 해줄 수 있어, 단 2초만 버텨.",
      "한 방만 더 치면 비틀거리게 만들 수 있어! 딱 10초만 더 살려줘!",
      "10초?! 좋아 — 근데 죽으면 그 갑옷, 나 마을까지 안 들고 간다.",
    ]},
  },
  de: {
    dungeon: { title: "Dungeon-Erkundung", messages: [
      "Die schwere Steintür ächzt auf. Fackellicht enthüllt eine runde Kammer — drei Goblin-Späher schauen knurrend von einer geraubten Vorratskiste hoch.",
      "Endlich. Mir wurde langsam langweilig. Bleib hinter mir — die Front halte ich.",
      "Moment — im Schatten versteckt sich ein vierter. Ich sehe ihn. Den Schleicher übernehme ich.",
      "Dann los. Die drei vorne halte ich. Nur nicht daneben treffen.",
    ]},
    exploration: { title: "Offene Welt", messages: [
      "Das Wirtshaus „Zum Rostigen Krug\u201C ist heute Morgen still. Eine Anschlagtafel an der Tür ist mit Auftragsanzeigen übersät. Der Wirt poliert einen Krug und beobachtet euch mit einem Auge.",
      "Schaut auf das Brett — vielleicht ist was Lohnendes dabei. Ich frage den Wirt nach Gerüchten.",
      "Hier — ‚Vermisste Händlerkarawane, zuletzt gen Norden gesehen.' Das Kopfgeld ist solide. Wir können das Gold gebrauchen.",
      "Der Norden ist der Dunkelwald. Erst Proviant. Und besser noch Verstärkung.",
    ]},
    boss: { title: "Boss-Kampf", messages: [
      "Der Drache brüllt, lose Steine prasseln von der Höhlendecke. Seine Schuppen glühen geschmolzen rot — er tritt in seine Wutphase. Der Boden bebt.",
      "Aldric, deine HP sind kritisch! Sofort hinter Deckung — JETZT! Ich kann dich heilen, aber du musst die nächsten zwei Sekunden überleben.",
      "Noch ein Treffer und ich bringe ihn aus dem Tritt. Halt mich nur noch zehn Sekunden am Leben!",
      "Zehn Sekunden?! Na schön — aber wenn du stirbst, trage ich deine Rüstung NICHT in die Stadt zurück.",
    ]},
  },
  fr: {
    dungeon: { title: "Exploration de donjon", messages: [
      "La lourde porte de pierre s'ouvre en grinçant. La lumière des torches révèle une salle circulaire — trois éclaireurs gobelins lèvent les yeux d'une caisse de ravitaillement volée, grognant.",
      "Enfin. Je commençais à m'ennuyer. Restez derrière moi — je tiens la première ligne.",
      "Attendez — il y en a un quatrième caché dans les ombres. Je le vois. Laissez-moi gérer le furtif.",
      "Alors vas-y. Je m'occupe des trois devant. Ne le rate surtout pas.",
    ]},
    exploration: { title: "Monde ouvert", messages: [
      "La taverne du Fer Rouillé est calme ce matin. Un tableau d'affichage près de la porte est couvert d'avis de quêtes. L'aubergiste astique une chope en vous observant d'un œil.",
      "Regardez le tableau — il y a peut-être quelque chose qui en vaut la peine. Je vais demander à l'aubergiste s'il a entendu des rumeurs.",
      "En voilà une — « Caravane marchande disparue, vue pour la dernière fois en route vers le nord. » La prime est correcte. On a besoin de l'or.",
      "Le nord, c'est le Bois Sombre. Il nous faut des provisions d'abord. Et probablement du renfort.",
    ]},
    boss: { title: "Combat de boss", messages: [
      "Le dragon rugit, faisant pleuvoir des pierres du plafond de la caverne. Ses écailles rougeoient comme de la lave — il entre dans sa phase de fureur. Le sol tremble.",
      "Aldric, tes PV sont critiques ! À l'abri — TOUT DE SUITE ! Je peux te soigner, mais tu dois survivre aux deux prochaines secondes.",
      "Encore un coup et je le déstabilise. Garde-moi en vie dix secondes de plus !",
      "Dix secondes ?! Bon — mais si tu meurs, je ne ramène PAS ton armure en ville.",
    ]},
  },
  es: {
    dungeon: { title: "Exploración de mazmorra", messages: [
      "La pesada puerta de piedra se abre con un gemido. La luz de la antorcha revela una cámara circular — tres exploradores goblins levantan la vista de una caja de suministros robada, gruñendo.",
      "Por fin. Me estaba aburriendo. Quédate detrás de mí — yo aguanto la línea.",
      "Espera — hay un cuarto escondido en las sombras. Lo veo. Yo me ocupo del sigiloso.",
      "Entonces ve. Yo aguanto a los tres del frente. Solo no falles.",
    ]},
    exploration: { title: "Mundo abierto", messages: [
      "La taberna del Espadín Oxidado está tranquila esta mañana. Un tablón junto a la puerta está cubierto de carteles de misiones. El tabernero pule una jarra mientras os observa con un ojo.",
      "Mira el tablón — puede que haya algo que valga la pena. Yo le preguntaré al tabernero si ha oído rumores.",
      "Aquí hay uno — 'Caravana mercante desaparecida, vista por última vez rumbo al norte.' La recompensa está bien. Nos viene bien el oro.",
      "El norte es el Bosque Oscuro. Necesitaremos suministros primero. Y probablemente refuerzos.",
    ]},
    boss: { title: "Pelea de jefe", messages: [
      "El dragón ruge, sacudiendo piedras sueltas del techo de la caverna. Sus escamas brillan al rojo vivo — está entrando en su fase de furia. El suelo tiembla.",
      "¡Aldric, tu HP está crítico! ¡A cubierto — AHORA! Puedo curarte, pero tienes que sobrevivir los próximos dos segundos.",
      "¡Un golpe más y lo tambaleo. Mantenme vivo diez segundos más!",
      "¿¡Diez segundos!? Vale — pero si mueres, NO te llevo la armadura de vuelta al pueblo.",
    ]},
  },
  pt: {
    dungeon: { title: "Exploração de masmorra", messages: [
      "A pesada porta de pedra range ao abrir. A luz da tocha revela uma câmara circular — três batedores goblins erguem o olhar de uma caixa de suprimentos roubada, rosnando.",
      "Finalmente. Estava ficando entediado. Fique atrás de mim — eu seguro a frente.",
      "Espera — tem um quarto escondido nas sombras. Eu o vejo. Deixa o furtivo comigo.",
      "Então vai. Eu seguro os três da frente. Só não erre.",
    ]},
    exploration: { title: "Mundo aberto", messages: [
      "A taverna do Florete Enferrujado está calma esta manhã. Um quadro de avisos junto à porta está coberto de cartazes de missão. O taverneiro polia uma caneca, observando-os com um olho.",
      "Veja o quadro — pode ter algo que valha a pena. Eu pergunto ao taverneiro se ouviu boatos.",
      "Aqui — 'Caravana mercante desaparecida, vista pela última vez indo para o norte.' A recompensa é boa. Estamos precisando de ouro.",
      "O norte é a Floresta Sombria. Precisamos de suprimentos primeiro. E provavelmente reforços.",
    ]},
    boss: { title: "Luta de chefe", messages: [
      "O dragão ruge, fazendo cair pedras soltas do teto da caverna. Suas escamas brilham em vermelho fundido — está entrando na fase de fúria. O chão treme.",
      "Aldric, seu HP está crítico! Para trás da cobertura — AGORA! Posso te curar, mas precisa sobreviver os próximos dois segundos.",
      "Mais um golpe e eu o desequilibro. Só me mantenha vivo por mais dez segundos!",
      "Dez segundos?! Tá bem — mas se você morrer, eu NÃO carrego sua armadura de volta para a cidade.",
    ]},
  },
  ru: {
    dungeon: { title: "Исследование подземелья", messages: [
      "Тяжёлая каменная дверь со скрипом открывается. Свет факела освещает круглый зал — три гоблина-разведчика поднимают взгляд от украденного ящика с припасами, скалясь.",
      "Наконец-то. Я уже скучать начал. Держись позади — фронт я возьму на себя.",
      "Стой — в тенях прячется четвёртый. Я его вижу. Этого скрытного беру на себя.",
      "Тогда давай. Троих спереди я держу. Только не промахнись.",
    ]},
    exploration: { title: "Открытый мир", messages: [
      "Таверна «Ржавый клинок» тиха этим утром. У двери — доска объявлений, увешанная заказами. Трактирщик протирает кружку, поглядывая на вас одним глазом.",
      "Посмотрим на доску — может, найдём стоящее дело. Я расспрошу трактирщика про слухи.",
      "Вот это — «Пропавший торговый караван, последний раз видели на севере». Награда приличная. Деньги нам пригодятся.",
      "На севере — Тёмный Лес. Сначала припасы. И, скорее всего, подкрепление.",
    ]},
    boss: { title: "Битва с боссом", messages: [
      "Дракон ревёт, и с потолка пещеры сыплются камни. Его чешуя пылает раскалённым красным — он входит в фазу ярости. Земля дрожит.",
      "Aldric, у тебя критический HP! За укрытие — НЕМЕДЛЕННО! Я могу тебя вылечить, но ты должен пережить следующие две секунды.",
      "Ещё один удар — и я его пошатну. Просто держи меня живым ещё десять секунд!",
      "Десять секунд?! Ладно — но если ты умрёшь, я НЕ потащу твою броню обратно в город.",
    ]},
  },
  it: {
    dungeon: { title: "Esplorazione del dungeon", messages: [
      "La pesante porta di pietra geme aprendosi. La luce della torcia rivela una camera circolare — tre esploratori goblin alzano lo sguardo da una cassa di rifornimenti rubata, ringhiando.",
      "Finalmente. Mi stavo annoiando. Stammi dietro — la prima linea la tengo io.",
      "Aspetta — c'è un quarto nascosto nelle ombre. Lo vedo. Al furtivo penso io.",
      "Allora vai. I tre davanti li tengo io. Solo non fallire.",
    ]},
    exploration: { title: "Mondo aperto", messages: [
      "La taverna del Fioretto Arrugginito è tranquilla stamattina. Una bacheca accanto alla porta è coperta di annunci di missioni. L'oste lucida un boccale, guardandovi con un occhio.",
      "Guarda la bacheca — potrebbe esserci qualcosa che vale la pena. Io chiedo all'oste se ha sentito qualche voce.",
      "Eccone uno — 'Carovana mercantile scomparsa, vista l'ultima volta diretta a nord.' La taglia è buona. Ci serve l'oro.",
      "Il nord è il Bosco Oscuro. Prima i rifornimenti. E probabilmente dei rinforzi.",
    ]},
    boss: { title: "Scontro con il boss", messages: [
      "Il drago ruggisce, facendo cadere pietre dal soffitto della caverna. Le sue scaglie brillano di un rosso fuso — sta entrando in fase di furia. Il terreno trema.",
      "Aldric, i tuoi PF sono critici! Al riparo — ORA! Posso curarti, ma devi sopravvivere ai prossimi due secondi.",
      "Ancora un colpo e lo faccio barcollare. Tienimi in vita dieci secondi in più!",
      "Dieci secondi?! Va bene — ma se muori, NON ti riporto l'armatura in città.",
    ]},
  },
  ar: {
    dungeon: { title: "استكشاف الدنجن", messages: [
      "يُفتح الباب الحجري الثقيل بأنين. يكشف ضوء المشعل عن قاعة دائرية — ثلاثة كشّافة من الغوبلين يرفعون أعينهم من صندوق إمدادات مسروق، وهم يزمجرون.",
      "أخيراً. كنت أشعر بالملل. ابقَ خلفي — أنا أتولى الجبهة الأمامية.",
      "انتظروا — ثمة رابع مختبئ في الظلال. أراه. اتركوا المتسلل لي.",
      "اذهبي إذاً. الثلاثة الأماميون عليّ. فقط لا تخطئي.",
    ]},
    exploration: { title: "عالم مفتوح", messages: [
      "حانة السيف الصدئ هادئة هذا الصباح. لوحة إعلانات بجانب الباب مغطاة بإعلانات المهام. صاحب الحانة يلمّع كأساً، يراقبكم بعين واحدة.",
      "تفقدوا اللوحة — قد يكون هناك شيء يستحق وقتنا. سأسأل صاحب الحانة إن كان قد سمع شائعات.",
      "هذه واحدة — «قافلة تجارية مفقودة، شوهدت آخر مرة متجهة شمالاً». المكافأة جيدة. نحتاج إلى الذهب.",
      "الشمال هو الغابة المظلمة. سنحتاج إلى إمدادات أولاً. وربما دعم.",
    ]},
    boss: { title: "معركة الزعيم", messages: [
      "يزمجر التنين، فتتساقط حجارة من سقف الكهف. حراشفه تتوهج بحمرة منصهرة — إنه يدخل طور الغضب. تهتز الأرض.",
      "Aldric، نقاط حياتك حرجة! إلى الغطاء — الآن! يمكنني شفاؤك، لكن عليك الصمود الثانيتين القادمتين.",
      "ضربة أخرى وأُسقطه. فقط أبقني حياً عشر ثوانٍ أخرى!",
      "عشر ثوانٍ؟! حسناً — لكن إن متّ، لن أحمل درعك إلى المدينة.",
    ]},
  },
};

export function localizeScenarios(
  scenarios: Record<string, GameScenario>,
  lang: string,
): Record<string, GameScenario> {
  const key = resolveKey(lang);
  const overlay = SCENARIO_TEXT[key];
  if (!overlay) return scenarios;

  const result: Record<string, GameScenario> = {};
  for (const [id, scenario] of Object.entries(scenarios)) {
    const loc = overlay[id];
    if (!loc) { result[id] = scenario; continue; }
    result[id] = {
      title: loc.title,
      messages: scenario.messages.map((msg, i) => ({
        ...msg,
        text: loc.messages[i] ?? msg.text,
      })),
    };
  }
  return result;
}

// ─── Marquee Characters ──────────────────────────────────────────────────────

const NAME: Record<string, L> = {
  "Zhao Mei":        { zh: "赵梅", ja: "趙メイ", ko: "자오 메이" },
  "Kenji Yamamoto":  { zh: "山本健二", ja: "山本健二", ko: "야마모토 켄지" },
  "Haruka Tanaka":   { zh: "田中遥", ja: "田中はるか", ko: "타나카 하루카" },
};

// Roles below match BASE_MARQUEE_CHARACTERS in landing-content.ts.
const ROLE: Record<string, L> = {
  Deceiver:         { zh: "欺诈者", ja: "欺瞞者", ko: "기만자", de: "Betrüger", fr: "Trompeur", es: "Engañador", pt: "Enganador", ru: "Обманщик", it: "Ingannatore", ar: "مخادع" },
  Commander:        { zh: "指挥官", ja: "指揮官", ko: "지휘관", de: "Kommandant", fr: "Commandant", es: "Comandante", pt: "Comandante", ru: "Командир", it: "Comandante", ar: "قائد" },
  Healer:           { zh: "治愈者", ja: "癒し手", ko: "치유사", de: "Heiler", fr: "Guérisseur", es: "Sanador", pt: "Curador", ru: "Целитель", it: "Guaritore", ar: "معالج" },
  Diplomat:         { zh: "外交官", ja: "外交官", ko: "외교관", de: "Diplomat", fr: "Diplomate", es: "Diplomático", pt: "Diplomata", ru: "Дипломат", it: "Diplomatico", ar: "دبلوماسي" },
  Enchantress:      { zh: "魅惑者", ja: "魅惑者", ko: "마법사", de: "Zauberin", fr: "Enchanteresse", es: "Hechicera", pt: "Encantadora", ru: "Чародейка", it: "Incantatrice", ar: "ساحرة" },
  Shadow:           { zh: "暗影", ja: "影", ko: "그림자", de: "Schatten", fr: "Ombre", es: "Sombra", pt: "Sombra", ru: "Тень", it: "Ombra", ar: "ظل" },
  Trickster:        { zh: "捣蛋鬼", ja: "いたずら者", ko: "장난꾸러기", de: "Schelm", fr: "Farceur", es: "Bromista", pt: "Trapaceiro", ru: "Трикстер", it: "Imbroglione", ar: "محتال" },
  Champion:         { zh: "勇士", ja: "勇者", ko: "챔피언", de: "Champion", fr: "Champion", es: "Campeón", pt: "Campeão", ru: "Чемпион", it: "Campione", ar: "بطل" },
  Bard:             { zh: "吟游诗人", ja: "吟遊詩人", ko: "음유시인", de: "Barde", fr: "Barde", es: "Bardo", pt: "Bardo", ru: "Бард", it: "Bardo", ar: "شاعر" },
};

// Personalities below match BASE_MARQUEE_CHARACTERS in landing-content.ts.
const PERSONALITY: Record<string, L> = {
  "Cold and calculating, thrives in deception":                  { zh: "冷酷精明，在欺骗中如鱼得水", ja: "冷酷で計算高く、欺瞞に長ける", ko: "냉정하고 계산적, 속임수에 능함" },
  "Dominant and intimidating, directs with precision":          { zh: "强势且令人生畏，精准掌控全局", ja: "支配的で威圧的、正確に指揮する", ko: "지배적이고 위압적, 정확하게 지휘" },
  "Gentle and nurturing, creates a peaceful atmosphere":        { zh: "温柔体贴，营造和平氛围", ja: "穏やかで包容力があり、和やかな雰囲気を作る", ko: "부드럽고 포용적, 평화로운 분위기 조성" },
  "Composed and insightful, provides balanced perspectives":    { zh: "沉稳洞察，提供均衡的观点", ja: "冷静で洞察力があり、バランスの取れた視点を提供", ko: "침착하고 통찰력 있음, 균형 잡힌 시각 제공" },
  "Charming and persuasive, sways others with ease":            { zh: "魅力十足，轻松说服他人", ja: "魅力的で説得力があり、容易に人を動かす", ko: "매력적이고 설득력 있음, 쉽게 상대를 움직임" },
  "Measured and ominous, adds suspense to every scene":         { zh: "沉着而不祥，为每个场景增添悬疑", ja: "沈着で不穏、あらゆる場面にサスペンスを加える", ko: "신중하고 불길함, 모든 장면에 긴장감 추가" },
  "Playful and mischievous, uses charm to sway others":         { zh: "调皮捣蛋，用魅力影响他人", ja: "お茶目でいたずら好き、魅力で人を動かす", ko: "장난스럽고 짓궂음, 매력으로 상대를 설득" },
  "Dramatic and expressive, makes bold decisions":              { zh: "戏剧化且富有表现力，决断果敢", ja: "ドラマチックで表現豊か、大胆な決断を下す", ko: "극적이고 표현력 풍부, 과감한 결정" },
  "Friendly and optimistic, brings joy to the group":           { zh: "友善乐观，为团队带来欢乐", ja: "友好的で楽観的、グループに喜びをもたらす", ko: "친근하고 낙관적, 그룹에 기쁨을 가져옴" },
};

// Marquee currently only uses "AI Player" as the game label.
const GAME: Record<string, L> = {
  "AI Player":    { zh: "AI玩家", ja: "AIプレイヤー", ko: "AI 플레이어", de: "KI-Spieler", fr: "Joueur IA", es: "Jugador IA", pt: "Jogador IA", ru: "ИИ-игрок", it: "Giocatore IA", ar: "لاعب ذكاء اصطناعي" },
};

export function localizeMarqueeCharacters(
  characters: MarqueeCharacter[],
  lang: string,
): MarqueeCharacter[] {
  const key = resolveKey(lang);
  if (key === "en") return characters;
  return characters.map((c) => ({
    ...c,
    name: pick(NAME[c.name] ?? {}, lang) ?? c.name,
    role: pick(ROLE[c.role] ?? {}, lang) ?? c.role,
    personality: pick(PERSONALITY[c.personality] ?? {}, lang) ?? c.personality,
    game: pick(GAME[c.game] ?? {}, lang) ?? c.game,
  }));
}

// ─── Features ─────────────────────────────────────────────────────────────────

type FeatureOverlay = { title: string; description: string };

// Order matches FEATURES in landing-content.ts:
//   0. AI Game Master
//   1. AI party companions
//   2. Persistent open world
//   3. Design your own world
const FEATURES_I18N: Record<string, FeatureOverlay[]> = {
  zh: [
    { title: "AI 游戏主持", description: "专属 AI 游戏主持负责讲述世界、操纵 NPC，并根据你的选择实时调整剧情。" },
    { title: "AI 队友陪你冒险", description: "你的队友拥有真实的性格、目标和恐惧。他们会争论、开玩笑、保护你，让每段冒险都独一无二。" },
    { title: "永不结束的开放世界", description: "你的冒险永不停歇。探索一个由互联房间、NPC、任务和秘密组成的无限 MUD 风格世界。" },
    { title: "自由设计你的世界", description: "和 AI 一起共建你的 RPG 世界——通过自然对话定义传说、势力、魔法体系和冒险线索。" },
  ],
  ja: [
    { title: "AIゲームマスター", description: "専属のAIゲームマスターが世界を語り、NPCを操り、あなたの選択に合わせて物語をリアルタイムで紡ぎます。" },
    { title: "AIの仲間たち", description: "仲間たちには本物の個性、目標、恐怖があります。議論し、冗談を言い、あなたを守り、すべての冒険をユニークなものにします。" },
    { title: "終わらないオープンワールド", description: "冒険は決して終わりません。MUD風の無限に広がる世界——部屋、NPC、クエスト、秘密が織りなす世界を探索しましょう。" },
    { title: "自分の世界をデザイン", description: "AIと一緒にあなたのRPG世界を共創——伝承、派閥、魔法体系、冒険のフックを自然な会話で定義します。" },
  ],
  ko: [
    { title: "AI 게임 마스터", description: "전담 AI 게임 마스터가 세계를 서술하고, NPC를 조종하며, 당신의 선택에 맞춰 이야기를 실시간으로 적응시킵니다." },
    { title: "AI 동료가 함께", description: "동료들은 진짜 성격, 목표, 두려움을 가지고 있습니다. 그들은 논쟁하고, 농담하고, 당신을 지키며, 매 모험을 유일무이하게 만듭니다." },
    { title: "끝나지 않는 오픈 월드", description: "당신의 모험은 결코 끝나지 않습니다. 서로 연결된 방, NPC, 퀘스트, 비밀로 이루어진 MUD 스타일 무한 세계를 탐험하세요." },
    { title: "당신만의 세계 설계", description: "AI와 함께 당신의 RPG 세계를 공동 창작 — 전승, 세력, 마법 체계, 모험 단서를 자연어 대화로 정의하세요." },
  ],
  de: [
    { title: "KI-Spielleiter", description: "Ein eigener KI-Spielleiter erzählt deine Welt, steuert NPCs und passt die Geschichte in Echtzeit an deine Entscheidungen an." },
    { title: "KI-Gefährten an deiner Seite", description: "Deine Gefährten haben echte Persönlichkeiten, Ziele und Ängste. Sie streiten, scherzen, beschützen dich und machen jedes Abenteuer einzigartig." },
    { title: "Persistente offene Welt", description: "Dein Abenteuer endet nie. Erkunde eine unendliche MUD-artige Welt aus verbundenen Räumen, NPCs, Quests und Geheimnissen." },
    { title: "Erschaffe deine eigene Welt", description: "Erschaffe gemeinsam mit der KI deine RPG-Welt — definiere Lore, Fraktionen, Magiesysteme und Abenteuer-Aufhänger im natürlichen Gespräch." },
  ],
  fr: [
    { title: "Maître du jeu IA", description: "Un Maître du Jeu IA dédié narre votre monde, contrôle les PNJ et adapte l'histoire à vos choix en temps réel." },
    { title: "Compagnons IA dans votre groupe", description: "Vos compagnons ont de vraies personnalités, des objectifs et des peurs. Ils argumentent, plaisantent, vous protègent et rendent chaque aventure unique." },
    { title: "Monde ouvert persistant", description: "Votre aventure ne s'arrête jamais. Explorez un monde MUD infini fait de salles connectées, de PNJ, de quêtes et de secrets." },
    { title: "Créez votre propre monde", description: "Co-créez votre monde RPG avec l'IA — définissez le folklore, les factions, le système magique et les accroches d'aventure par conversation naturelle." },
  ],
  es: [
    { title: "Game Master IA", description: "Un Game Master IA dedicado narra tu mundo, controla a los NPCs y adapta la historia a tus elecciones en tiempo real." },
    { title: "Compañeros IA en tu grupo", description: "Tus compañeros tienen personalidades, objetivos y miedos reales. Discuten, bromean, te protegen y hacen única cada aventura." },
    { title: "Mundo abierto persistente", description: "Tu aventura nunca termina. Explora un mundo infinito estilo MUD con salas interconectadas, NPCs, misiones y secretos." },
    { title: "Diseña tu propio mundo", description: "Co-crea tu mundo RPG con la IA — define el lore, las facciones, el sistema mágico y los ganchos de la aventura mediante conversación natural." },
  ],
  pt: [
    { title: "Mestre de Jogo IA", description: "Um Mestre de Jogo IA dedicado narra seu mundo, controla NPCs e adapta a história às suas escolhas em tempo real." },
    { title: "Companheiros IA no seu grupo", description: "Seus companheiros têm personalidades, objetivos e medos reais. Discutem, brincam, protegem você e tornam cada aventura única." },
    { title: "Mundo aberto persistente", description: "Sua aventura nunca termina. Explore um mundo infinito estilo MUD com salas interligadas, NPCs, missões e segredos." },
    { title: "Crie seu próprio mundo", description: "Co-crie seu mundo RPG com a IA — defina o folclore, as facções, o sistema de magia e os ganchos da aventura por conversa natural." },
  ],
  ru: [
    { title: "ИИ-мастер игры", description: "Выделенный ИИ-мастер игры повествует ваш мир, управляет NPC и адаптирует историю к вашим решениям в реальном времени." },
    { title: "ИИ-спутники в отряде", description: "У ваших спутников настоящие личности, цели и страхи. Они спорят, шутят, защищают вас и делают каждое приключение уникальным." },
    { title: "Постоянный открытый мир", description: "Ваше приключение никогда не заканчивается. Исследуйте бесконечный MUD-мир из связанных комнат, NPC, квестов и секретов." },
    { title: "Создайте свой мир", description: "Сотворите RPG-мир вместе с ИИ — определите лор, фракции, магическую систему и сюжетные крючки через естественный диалог." },
  ],
  it: [
    { title: "Game Master IA", description: "Un Game Master IA dedicato narra il tuo mondo, controlla i PNG e adatta la storia alle tue scelte in tempo reale." },
    { title: "Compagni IA nel gruppo", description: "I tuoi compagni hanno personalità, obiettivi e paure reali. Discutono, scherzano, ti proteggono e rendono ogni avventura unica." },
    { title: "Mondo aperto persistente", description: "La tua avventura non finisce mai. Esplora un mondo infinito in stile MUD fatto di stanze connesse, PNG, missioni e segreti." },
    { title: "Progetta il tuo mondo", description: "Co-crea il tuo mondo RPG con l'IA — definisci il folklore, le fazioni, il sistema magico e gli agganci dell'avventura tramite conversazione naturale." },
  ],
  ar: [
    { title: "سيد لعبة بالذكاء الاصطناعي", description: "سيد لعبة بالذكاء الاصطناعي مخصص يروي عالمك، ويتحكم في الشخصيات غير اللاعبة، ويكيّف القصة وفق اختياراتك في الوقت الحقيقي." },
    { title: "رفاق ذكاء اصطناعي في فريقك", description: "رفاقك لديهم شخصيات وأهداف ومخاوف حقيقية. يجادلون ويمزحون ويحمونك ويجعلون كل مغامرة فريدة." },
    { title: "عالم مفتوح دائم", description: "مغامرتك لا تنتهي أبداً. استكشف عالماً لا نهائياً على طراز MUD، مكوناً من غرف متصلة وشخصيات ومهام وأسرار." },
    { title: "صمّم عالمك الخاص", description: "تشارك مع الذكاء الاصطناعي في صنع عالم RPG الخاص بك — حدّد الأساطير والفصائل ونظام السحر وخيوط المغامرة عبر محادثة طبيعية." },
  ],
};

export function localizeFeatures(features: Feature[], lang: string): Feature[] {
  const key = resolveKey(lang);
  const overlay = FEATURES_I18N[key];
  if (!overlay) return features;
  return features.map((f, i) => ({
    ...f,
    title: overlay[i]?.title ?? f.title,
    description: overlay[i]?.description ?? f.description,
  }));
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

// Order matches FAQ_ITEMS in landing-content.ts:
//   0. How do I start an adventure?
//   1. What is the AI Game Master?
//   2. Can I save my progress and come back?
//   3. What RPG worlds are available?
//   4. Do I need to sign in? Is it free?
//   5. Can I design my own RPG world?
//   6. How much does it cost?
const FAQ_I18N: Record<string, FAQItem[]> = {
  zh: [
    { question: "如何开始冒险？", answer: "用 Google 登录，进入「探索」页面浏览 RPG 冒险——选一个预设比如「星陨地下城」或「乞丐的铜钱」。点一下，几秒钟就进入游戏。AI 队友会自动生成。你也可以从头设计自己的世界。" },
    { question: "什么是 AI 游戏主持？", answer: "AI 游戏主持（Chronicle）负责讲述你的冒险、操控世界与 NPC、运行战斗，并根据你的选择调整剧情。你的 AI 队友个性鲜明——会争吵、开玩笑、害怕、并肩作战，就像真人玩家一样。" },
    { question: "可以保存进度，下次继续吗？", answer: "可以！冒险会自动保存。你随时可以关掉浏览器再回来——队伍、装备、任务进度和整个世界状态都会保留。故事从你离开的地方继续。" },
    { question: "有哪些 RPG 世界可玩？", answer: "目前提供西方奇幻世界，配套地下城探险、城市悬疑等现成冒险。你也可以通过和 AI 主持的对话，自定义你的世界——设定背景、传说、魔法体系和冒险线索。" },
    { question: "需要登录吗？免费吗？", answer: "用 Google 登录就可以创建冒险——只要几秒钟。新账号自带免费起始额度，可以立刻体验整个平台。" },
    { question: "可以设计自己的 RPG 世界吗？", answer: "当然可以！进入「创建」页，和 AI 游戏主持一起共建你的世界。描述世界设定、基调、势力、故事线索——主持会帮你搭建规则和传说。你的世界会被保存，随时可以再玩。" },
    { question: "费用是多少？", answer: "新账号自带免费额度。之后按需购买额外额度——定价透明，按实际 AI 使用量计费。没有订阅，没有隐藏费用。" },
  ],
  ja: [
    { question: "冒険を始めるには？", answer: "Googleでログインし、「ディスカバー」でRPGアドベンチャーを閲覧——「星落のダンジョン」や「乞食の銅貨」などのプリセットを選びます。クリックすれば数秒でゲームに入れます。AIの仲間は自動生成。ゼロから自分だけの世界を設計することもできます。" },
    { question: "AIゲームマスターって何？", answer: "AIゲームマスター（Chronicle）が冒険を語り、世界とNPCを操り、戦闘を進行し、あなたの選択に合わせて物語を紡ぎます。AIの仲間たちは本物の個性を持ち——議論し、冗談を言い、怖がり、本物のプレイヤーのように共に戦います。" },
    { question: "進行を保存して再開できますか？", answer: "はい！冒険は自動で保存されます。ブラウザを閉じてもいつでも戻ってこられます——パーティー、インベントリ、クエスト進行、世界全体の状態すべてが残ります。物語は中断したところから再開します。" },
    { question: "どのRPG世界がありますか？", answer: "現在、西洋ファンタジー世界を提供——ダンジョン探索や都市ミステリーなど事前に組まれた冒険があります。AIゲームマスターとの会話で、自分専用の世界をデザインすることもできます——設定、伝承、魔法体系、ストーリーフックを定義しましょう。" },
    { question: "サインインは必要？無料？", answer: "冒険を作るにはGoogleでログイン——数秒で完了。新規アカウントには無料のスタートクレジットが付与され、すぐにプラットフォームを試せます。" },
    { question: "自分のRPG世界を設計できますか？", answer: "もちろん！「作成」ページでAIゲームマスターと共にあなたの世界を共創します。設定、トーン、派閥、ストーリーフックを説明すれば——GMがルールと伝承の構築を助けます。あなたのカスタム世界は保存され、いつでも遊べます。" },
    { question: "料金はいくら？", answer: "新規アカウントは無料クレジット付きでスタート。その後、必要に応じて追加クレジットを購入——料金は透明で、実際のAI使用量に基づきます。サブスクリプションも隠れた費用もありません。" },
  ],
  ko: [
    { question: "모험은 어떻게 시작하나요?", answer: "Google로 로그인 후 「탐색」에서 RPG 모험을 둘러보세요 — '별이 떨어진 던전', '거지의 동전' 같은 프리셋을 고르면 클릭 몇 초 만에 게임에 입장합니다. AI 동료는 자동으로 생성됩니다. 처음부터 나만의 세계를 설계할 수도 있습니다." },
    { question: "AI 게임 마스터란?", answer: "AI 게임 마스터(Chronicle)가 모험을 서술하고, 세계와 NPC를 조종하며, 전투를 진행하고, 당신의 선택에 따라 이야기를 적응시킵니다. AI 동료들은 진짜 성격을 가지고 있습니다 — 논쟁하고, 농담하고, 두려워하고, 진짜 플레이어처럼 함께 싸웁니다." },
    { question: "진행을 저장하고 나중에 돌아올 수 있나요?", answer: "네! 모험은 자동으로 저장됩니다. 브라우저를 닫고 언제든 돌아올 수 있습니다 — 파티, 인벤토리, 퀘스트 진행, 전체 세계 상태가 모두 유지됩니다. 이야기는 떠난 곳에서 그대로 이어집니다." },
    { question: "어떤 RPG 세계가 있나요?", answer: "현재 서양 판타지 세계를 제공하며, 던전 탐험과 도시 미스터리 등 사전 구성된 모험이 있습니다. AI 게임 마스터와의 대화를 통해 자신만의 세계도 디자인할 수 있습니다 — 배경, 전설, 마법 체계, 모험 단서를 정의하세요." },
    { question: "로그인이 필요한가요? 무료인가요?", answer: "모험을 만들려면 Google 로그인 — 몇 초면 됩니다. 신규 계정은 무료 시작 크레딧을 받아 즉시 플랫폼을 체험할 수 있습니다." },
    { question: "나만의 RPG 세계를 설계할 수 있나요?", answer: "물론이죠! 「만들기」 페이지에서 AI 게임 마스터와 함께 세계를 공동 창작하세요. 배경, 분위기, 세력, 이야기 단서를 설명하면 — GM이 규칙과 전설 구축을 도와줍니다. 당신의 커스텀 세계는 저장되어 언제든 플레이 가능합니다." },
    { question: "비용은 얼마인가요?", answer: "신규 계정은 무료 크레딧으로 시작합니다. 이후 필요에 따라 추가 크레딧을 구매할 수 있습니다 — 가격은 투명하며 실제 AI 사용량에 기반합니다. 구독이나 숨겨진 비용은 없습니다." },
  ],
  de: [
    { question: "Wie starte ich ein Abenteuer?", answer: "Melde dich mit Google an und durchstöbere unter „Entdecken\u201C die RPG-Abenteuer — wähle eine Vorlage wie „Der Sternfall-Dungeon\u201C oder „Die Münze des Bettlers\u201C. Ein Klick und du bist in Sekunden im Spiel. KI-Gefährten werden automatisch erzeugt. Du kannst auch von Grund auf deine eigene Welt entwerfen." },
    { question: "Was ist der KI-Spielleiter?", answer: "Der KI-Spielleiter (Chronicle) erzählt dein Abenteuer, kontrolliert Welt und NPCs, leitet Kämpfe und passt die Geschichte an deine Entscheidungen an. Deine KI-Gefährten haben echte Persönlichkeiten — sie streiten, scherzen, fürchten sich und kämpfen wie echte Spieler an deiner Seite." },
    { question: "Kann ich meinen Fortschritt speichern und später weitermachen?", answer: "Ja! Dein Abenteuer wird automatisch gespeichert. Du kannst den Browser schließen und jederzeit zurückkehren — Gruppe, Inventar, Quest-Fortschritt und der gesamte Weltzustand bleiben erhalten. Die Geschichte geht genau dort weiter, wo du aufgehört hast." },
    { question: "Welche RPG-Welten gibt es?", answer: "Wir bieten westliche Fantasy-Welten mit vorgefertigten Abenteuern — Dungeon-Crawls, urbane Mysterien und mehr. Du kannst auch deine eigene Welt entwerfen — definiere Setting, Lore, Magiesystem und Storyhaken im Gespräch mit dem KI-Spielleiter." },
    { question: "Muss ich mich anmelden? Ist es kostenlos?", answer: "Melde dich mit Google an, um Abenteuer zu erstellen — das dauert nur Sekunden. Neue Konten erhalten kostenlose Startguthaben, um die Plattform sofort zu testen." },
    { question: "Kann ich meine eigene RPG-Welt entwerfen?", answer: "Absolut! Nutze die Seite „Erstellen\u201C, um deine Welt mit dem KI-Spielleiter zu co-designen. Beschreibe Setting, Ton, Fraktionen und Storyhaken — der GM hilft beim Aufbau von Regeln und Lore. Deine eigene Welt wird gespeichert und kann jederzeit bespielt werden." },
    { question: "Was kostet es?", answer: "Neue Konten starten mit kostenlosen Guthaben. Danach kannst du bei Bedarf zusätzliche Guthaben kaufen — die Preise sind transparent und basieren auf der tatsächlichen KI-Nutzung. Keine Abonnements, keine versteckten Gebühren." },
  ],
  fr: [
    { question: "Comment commencer une aventure ?", answer: "Connectez-vous avec Google, puis parcourez les aventures RPG dans Découvrir — choisissez un préréglage comme « Le Donjon de l'Étoile Tombée » ou « La Pièce du Mendiant ». Un clic et vous êtes dans le jeu en quelques secondes. Les compagnons IA sont générés automatiquement. Vous pouvez aussi concevoir votre propre monde de zéro." },
    { question: "Qu'est-ce que le Maître du Jeu IA ?", answer: "Le Maître du Jeu IA (Chronicle) narre votre aventure, contrôle le monde et les PNJ, gère les combats et adapte l'histoire à vos choix. Vos compagnons IA ont de vraies personnalités — ils argumentent, plaisantent, ont peur et combattent à vos côtés comme de vrais joueurs." },
    { question: "Puis-je sauvegarder ma progression et revenir plus tard ?", answer: "Oui ! Votre aventure est sauvegardée automatiquement. Vous pouvez fermer le navigateur et revenir à tout moment — groupe, inventaire, progression des quêtes et état du monde restent intacts. L'histoire reprend exactement là où vous l'avez laissée." },
    { question: "Quels mondes RPG sont disponibles ?", answer: "Nous proposons des mondes de Fantasy occidentale avec des aventures prêtes à l'emploi — donjons, mystères urbains et plus. Vous pouvez aussi concevoir votre propre monde personnalisé — définissez le décor, le folklore, le système magique et les accroches d'histoire en conversant avec le Maître du Jeu IA." },
    { question: "Dois-je me connecter ? Est-ce gratuit ?", answer: "Connectez-vous avec Google pour créer des aventures — ça ne prend que quelques secondes. Les nouveaux comptes reçoivent des crédits gratuits pour essayer la plateforme tout de suite." },
    { question: "Puis-je concevoir mon propre monde RPG ?", answer: "Absolument ! Utilisez la page « Créer » pour co-concevoir votre monde avec le Maître du Jeu IA. Décrivez le décor, le ton, les factions et les accroches narratives — le GM aide à construire les règles et le folklore. Votre monde personnalisé est sauvegardé et jouable à tout moment." },
    { question: "Combien ça coûte ?", answer: "Les nouveaux comptes démarrent avec des crédits gratuits. Ensuite, vous pouvez acheter des crédits supplémentaires selon vos besoins — les tarifs sont transparents et basés sur l'utilisation réelle de l'IA. Pas d'abonnement, pas de frais cachés." },
  ],
  es: [
    { question: "¿Cómo empiezo una aventura?", answer: "Inicia sesión con Google, luego explora las aventuras RPG en Descubrir — elige un preset como 'La Mazmorra de la Caída Estelar' o 'La Moneda del Mendigo'. Un clic y estás en el juego en segundos. Los compañeros IA se generan automáticamente. También puedes diseñar tu propio mundo desde cero." },
    { question: "¿Qué es el Game Master IA?", answer: "El Game Master IA (Chronicle) narra tu aventura, controla el mundo y los NPCs, gestiona combates y adapta la historia a tus decisiones. Tus compañeros IA tienen personalidades reales — discuten, bromean, se asustan y luchan contigo como jugadores reales." },
    { question: "¿Puedo guardar mi progreso y volver?", answer: "¡Sí! Tu aventura se guarda automáticamente. Puedes cerrar el navegador y volver cuando quieras — el grupo, el inventario, el progreso de las misiones y el estado del mundo persisten. La historia continúa exactamente donde la dejaste." },
    { question: "¿Qué mundos RPG están disponibles?", answer: "Ofrecemos mundos de Fantasía Occidental con aventuras preconstruidas — mazmorras, misterios urbanos y más. También puedes diseñar tu propio mundo personalizado — define el escenario, el lore, el sistema mágico y los ganchos narrativos conversando con el Game Master IA." },
    { question: "¿Necesito iniciar sesión? ¿Es gratis?", answer: "Inicia sesión con Google para crear aventuras — solo toma unos segundos. Las cuentas nuevas reciben créditos gratuitos para probar la plataforma de inmediato." },
    { question: "¿Puedo diseñar mi propio mundo RPG?", answer: "¡Absolutamente! Usa la página Crear para co-diseñar tu mundo con el Game Master IA. Describe el escenario, el tono, las facciones y los ganchos narrativos — el GM ayuda a construir las reglas y el lore. Tu mundo personalizado se guarda y se puede jugar cuando quieras." },
    { question: "¿Cuánto cuesta?", answer: "Las cuentas nuevas empiezan con créditos gratuitos. Después, puedes comprar créditos adicionales según necesites — los precios son transparentes y basados en el uso real de la IA. Sin suscripciones ni cobros ocultos." },
  ],
  pt: [
    { question: "Como começo uma aventura?", answer: "Faça login com Google, depois navegue pelas aventuras RPG em Descobrir — escolha um preset como 'A Masmorra da Queda Estelar' ou 'A Moeda do Mendigo'. Clique e você está no jogo em segundos. Companheiros IA são gerados automaticamente. Você também pode projetar seu próprio mundo do zero." },
    { question: "O que é o Mestre de Jogo IA?", answer: "O Mestre de Jogo IA (Chronicle) narra sua aventura, controla o mundo e os NPCs, gerencia combates e adapta a história às suas escolhas. Seus companheiros IA têm personalidades reais — discutem, brincam, têm medo e lutam ao seu lado como jogadores reais." },
    { question: "Posso salvar meu progresso e voltar?", answer: "Sim! Sua aventura é salva automaticamente. Você pode fechar o navegador e voltar a qualquer momento — o grupo, o inventário, o progresso das missões e o estado do mundo persistem. A história continua exatamente de onde você parou." },
    { question: "Quais mundos RPG estão disponíveis?", answer: "Oferecemos mundos de Fantasia Ocidental com aventuras pré-construídas — masmorras, mistérios urbanos e mais. Você também pode projetar seu próprio mundo personalizado — defina o cenário, o folclore, o sistema mágico e os ganchos narrativos conversando com o Mestre de Jogo IA." },
    { question: "Preciso fazer login? É gratuito?", answer: "Faça login com Google para criar aventuras — leva apenas segundos. Novas contas recebem créditos gratuitos para experimentar a plataforma imediatamente." },
    { question: "Posso projetar meu próprio mundo RPG?", answer: "Com certeza! Use a página Criar para co-projetar seu mundo com o Mestre de Jogo IA. Descreva o cenário, o tom, as facções e os ganchos narrativos — o GM ajuda a construir as regras e o folclore. Seu mundo personalizado é salvo e jogável a qualquer momento." },
    { question: "Quanto custa?", answer: "Novas contas começam com créditos gratuitos. Depois, você pode comprar créditos adicionais conforme necessário — os preços são transparentes e baseados no uso real da IA. Sem assinaturas, sem taxas ocultas." },
  ],
  ru: [
    { question: "Как начать приключение?", answer: "Войдите через Google, затем просмотрите RPG-приключения в разделе «Обзор» — выберите пресет вроде «Подземелье Звездопада» или «Монета Нищего». Клик — и через секунды вы в игре. ИИ-спутники создаются автоматически. Можно также спроектировать свой мир с нуля." },
    { question: "Что такое ИИ-мастер игры?", answer: "ИИ-мастер игры (Chronicle) ведёт ваше приключение, управляет миром и NPC, проводит сражения и адаптирует историю под ваши решения. У ваших ИИ-спутников настоящие личности — они спорят, шутят, боятся и сражаются плечом к плечу, как настоящие игроки." },
    { question: "Можно ли сохранить прогресс и вернуться позже?", answer: "Да! Ваше приключение сохраняется автоматически. Можно закрыть браузер и вернуться когда угодно — отряд, инвентарь, прогресс квестов и весь мир сохраняются. История продолжается ровно с того места, где вы остановились." },
    { question: "Какие RPG-миры доступны?", answer: "Предлагаем миры Западной Фэнтези с готовыми приключениями — подземелья, городские детективы и многое другое. Можно также спроектировать свой собственный мир — определите сеттинг, лор, систему магии и сюжетные крючки в диалоге с ИИ-мастером игры." },
    { question: "Нужно ли входить? Это бесплатно?", answer: "Войдите через Google, чтобы создавать приключения — это занимает секунды. Новые аккаунты получают бесплатные стартовые кредиты, чтобы сразу попробовать платформу." },
    { question: "Можно ли спроектировать свой RPG-мир?", answer: "Конечно! Используйте страницу «Создать», чтобы спроектировать мир вместе с ИИ-мастером игры. Опишите сеттинг, тон, фракции и сюжетные крючки — ГМ поможет построить правила и лор. Ваш мир сохраняется и доступен в любое время." },
    { question: "Сколько это стоит?", answer: "Новые аккаунты начинают с бесплатных кредитов. Затем можно покупать дополнительные кредиты по мере необходимости — цены прозрачные, основаны на реальном использовании ИИ. Никаких подписок, никаких скрытых сборов." },
  ],
  it: [
    { question: "Come inizio un'avventura?", answer: "Accedi con Google, poi sfoglia le avventure RPG su Scopri — scegli un preset come 'Il Dungeon della Caduta Stellare' o 'La Moneta del Mendicante'. Un clic e sei nel gioco in pochi secondi. I compagni IA sono generati automaticamente. Puoi anche progettare il tuo mondo da zero." },
    { question: "Cos'è il Game Master IA?", answer: "Il Game Master IA (Chronicle) narra la tua avventura, controlla il mondo e i PNG, gestisce i combattimenti e adatta la storia alle tue scelte. I tuoi compagni IA hanno personalità vere — discutono, scherzano, si spaventano e combattono al tuo fianco come giocatori veri." },
    { question: "Posso salvare i miei progressi e tornare?", answer: "Sì! La tua avventura viene salvata automaticamente. Puoi chiudere il browser e tornare quando vuoi — gruppo, inventario, progresso delle missioni e stato del mondo persistono. La storia riprende esattamente da dove l'avevi lasciata." },
    { question: "Quali mondi RPG sono disponibili?", answer: "Offriamo mondi di Fantasy Occidentale con avventure preconfezionate — dungeon, misteri urbani e altro. Puoi anche progettare il tuo mondo personalizzato — definisci ambientazione, folklore, sistema magico e ganci narrativi conversando con il Game Master IA." },
    { question: "Devo accedere? È gratuito?", answer: "Accedi con Google per creare avventure — ci vogliono solo pochi secondi. I nuovi account ricevono crediti gratuiti per provare subito la piattaforma." },
    { question: "Posso progettare il mio mondo RPG?", answer: "Assolutamente! Usa la pagina Crea per co-progettare il tuo mondo con il Game Master IA. Descrivi ambientazione, tono, fazioni e ganci narrativi — il GM aiuta a costruire regole e folklore. Il tuo mondo personalizzato viene salvato e giocabile in qualsiasi momento." },
    { question: "Quanto costa?", answer: "I nuovi account iniziano con crediti gratuiti. Poi puoi acquistare crediti aggiuntivi secondo necessità — i prezzi sono trasparenti e basati sull'uso effettivo dell'IA. Nessun abbonamento, nessun costo nascosto." },
  ],
  ar: [
    { question: "كيف أبدأ مغامرة؟", answer: "سجّل الدخول بحساب Google، ثم تصفّح مغامرات RPG في «الاستكشاف» — اختر إعداداً مسبقاً مثل «دنجن السقوط النجمي» أو «عملة المتسوّل». انقر وستكون داخل اللعبة خلال ثوانٍ. يُنشأ الرفاق بالذكاء الاصطناعي تلقائياً. يمكنك أيضاً تصميم عالمك الخاص من الصفر." },
    { question: "ما هو سيد اللعبة بالذكاء الاصطناعي؟", answer: "سيد اللعبة بالذكاء الاصطناعي (Chronicle) يروي مغامرتك، ويتحكم في العالم والشخصيات غير اللاعبة، ويدير القتال، ويكيّف القصة وفق اختياراتك. رفاقك بالذكاء الاصطناعي لديهم شخصيات حقيقية — يجادلون، يمزحون، يخافون، ويقاتلون إلى جانبك كلاعبين حقيقيين." },
    { question: "هل يمكنني حفظ تقدمي والعودة لاحقاً؟", answer: "نعم! تُحفظ مغامرتك تلقائياً. يمكنك إغلاق المتصفح والعودة في أي وقت — الفريق، المخزون، تقدم المهام، وحالة العالم بأكملها تُحفظ. تستأنف القصة من حيث توقفت بالضبط." },
    { question: "ما عوالم RPG المتاحة؟", answer: "نوفر عوالم الفانتازيا الغربية مع مغامرات جاهزة — استكشاف الزنازين وألغاز المدن وأكثر. يمكنك أيضاً تصميم عالمك المخصص — حدّد الإعداد، الأساطير، نظام السحر، وخيوط القصة عبر محادثة مع سيد اللعبة." },
    { question: "هل يجب تسجيل الدخول؟ هل هو مجاني؟", answer: "سجّل الدخول بحساب Google لإنشاء المغامرات — لا يستغرق سوى ثوانٍ. تحصل الحسابات الجديدة على رصيد مجاني للبدء فوراً." },
    { question: "هل يمكنني تصميم عالم RPG خاص بي؟", answer: "بالتأكيد! استخدم صفحة «إنشاء» لتصميم عالمك مع سيد اللعبة. صِف الإعداد، النغمة، الفصائل، وخيوط القصة — وسيد اللعبة سيساعدك في بناء القواعد والأساطير. عالمك المخصص يُحفظ ويمكن لعبه في أي وقت." },
    { question: "كم تكلفتها؟", answer: "تبدأ الحسابات الجديدة برصيد مجاني. بعد ذلك، يمكنك شراء رصيد إضافي حسب الحاجة — التسعير شفاف ويعتمد على الاستخدام الفعلي للذكاء الاصطناعي. لا اشتراكات، لا رسوم خفية." },
  ],
};

export function localizeFAQ(items: FAQItem[], lang: string): FAQItem[] {
  const key = resolveKey(lang);
  const overlay = FAQ_I18N[key];
  if (!overlay || overlay.length !== items.length) return items;
  return overlay;
}

// ─── Inside Game Steps ────────────────────────────────────────────────────────

type StepOverlay = { title: string; heading: string; description: string; messages: string[] };

// Order matches INSIDE_GAME_STEPS in landing-content.ts:
//   0. Design with GM (4 messages)
//   1. The Host (3 messages — Chronicle narrating)
//   2. AI party (3 messages — Aldric, Lyra, Mira)
//   3. You play (3 messages — You [ACTION], Lyra, Chronicle)
const STEPS_I18N: Record<string, StepOverlay[]> = {
  zh: [
    { title: "与GM共同设计", heading: "告诉 GM 你想玩什么 RPG", description: "用大白话和 GM 聊。描述世界、基调、剧情钩子——单人地下城、奇幻盗宝、什么都行。GM 会为你设计世界、职业和开场冒险。", messages: ["想玩黑暗奇幻地下城，小队人数少。古老的精灵遗迹，亡灵主题。", "明白——亡灵盘踞的精灵遗迹。我安排一支 4 人小队：骑士、盗贼、法师、牧师。要加什么自定义钩子吗？", "牧师暗中在地下墓穴寻找失踪的妹妹。", "完美。我会把这个设定融进牧师背景，并在前几间房散布线索。准备好就开始。"] },
    { title: "GM 主持", heading: "AI 主持讲述世界", description: "GM 描述场景、运行 encounter、管理 NPC 和骰子、追踪队伍状态，并根据你的决定调整剧情。你专注于扮演，GM 让世界保持自洽。", messages: ["厚重的石门轰然推开，火把光照亮一间圆形石室——三个哥布林斥候从一只被偷的补给箱旁抬起头，狞笑着。", "先攻顺序：Lyra 发现房梁上还有第四个偷袭者。Aldric，你先动。", "投个 STR 检定来突破前线，或者描述你想怎么绕侧。"] },
    { title: "AI 队友", heading: "AI 队友会按角色反应", description: "每个 AI 队友都有自己的职业、个性和动机。他们自己行动、互相吐槽、争论战术，并随故事成长——绝不是傻站着等 GM 的木头人。", messages: ["总算来活了——我都快无聊死了。退到我身后，前排我来扛。", "我先解决房梁上那个，免得他放冷箭——给我数三秒。", "我可以用闪光术晕住前面两个。Aldric，等他们晕了你就冲。"] },
    { title: "你来主导", heading: "你推动剧情——世界做出反应", description: "用 [SAY] 以角色身份说话，或用 [ACTION] 做物理动作。GM 和你的队友会针对你做的任何事调整——哪怕你完全脱稿。", messages: ["[ACTION]我把补给箱推向哥布林，挡住房梁的射击线。[/ACTION]", "漂亮——这下我有角度了。冲！", "箱子把两个斥候撞在墙上，Lyra 一闪而过，房梁上的哥布林应声坠落——石室陷入寂静。投一个搜索检定。"] },
  ],
  ja: [
    { title: "GMと共に設計", heading: "やりたいRPGをGMに伝える", description: "ゲームマスターと自然な日本語で話すだけ。世界、トーン、フック——ソロダンジョン、剣と魔法のヒースト、何でも描写してください。GMが世界、クラス、開幕の冒険を設計します。", messages: ["ダークファンタジーのダンジョン探索を少人数パーティーでやりたい。古いエルフの遺跡、アンデッドテーマ。", "了解——アンデッドが棲むエルフ遺跡。4人パーティー（騎士、盗賊、魔術師、僧侶）を組みます。カスタムフックは？", "うん——僧侶は地下墓所で行方不明の妹を密かに探している、という設定で。", "完璧。それを僧侶の背景に織り込み、序盤の部屋に手がかりを撒きます。準備ができたら始めましょう。"] },
    { title: "ホスト", heading: "AIホストが世界を語る", description: "GMはシーンを描写し、エンカウンターを進行し、NPCとロールを管理し、パーティー状態を追跡し、あなたの決断に物語を適応させます。あなたはロールプレイに集中し、GMが世界の整合性を保ちます。", messages: ["重い石の扉が音を立てて開く。たいまつの光が円形の広間を照らし出す——三体のゴブリン斥候が、奪った補給箱から顔を上げ、唸り声を上げる。", "イニシアチブ：Lyraが梁の上の四体目に気づく。Aldric、君から動け。", "STR判定で正面を突破するか、側面に回り込む方法を描写してくれ。"] },
    { title: "AIの仲間", heading: "AIの仲間がキャラとして反応する", description: "各AI仲間には独自のクラス、個性、動機があります。自分のターンを取り、雑談し、戦術を議論し、物語と共に成長します——ただ突っ立っているだけではありません。", messages: ["ようやくか。退屈してたところだ。下がってろ——前線は俺が抑える。", "私が梁の上の奴を先に片付ける。きれいな射線を取られる前に——3つ数えたら撃つ。", "私が閃光呪文で前の二体を目くらましする。Aldric、彼らがスタンしたら突っ込んで。"] },
    { title: "あなたが動かす", heading: "あなたが物語を動かす——世界が応える", description: "[SAY]でキャラとしてセリフを言い、[ACTION]で物理アクションを取れます。GMと仲間はあなたが何をしても適応します——脚本から完全に外れてもね。", messages: ["[ACTION]補給箱をゴブリンに突き飛ばし、梁からの射線を遮る。[/ACTION]", "いいぞ——これで角度ができた。行く！", "箱が二体の斥候を壁に叩きつける。Lyraがその脇をすり抜け、梁の上のゴブリンが転落する——広間は静寂に包まれる。死体を調べるために判定を。"] },
  ],
  ko: [
    { title: "GM과 함께 설계", heading: "하고 싶은 RPG를 GM에게 말하세요", description: "게임 마스터와 평범한 한국어로 채팅하세요. 세계관, 분위기, 훅 — 솔로 던전, 검과 마법의 강도극, 무엇이든 묘사하세요. GM이 세계, 클래스, 오프닝 모험을 설계해줍니다.", messages: ["다크 판타지 던전 탐험을 작은 파티로 하고 싶어요. 오래된 엘프 유적, 언데드 테마.", "알겠습니다 — 언데드가 깃든 엘프 유적. 4인 파티(기사, 도적, 마법사, 사제)를 구성할게요. 커스텀 훅은?", "사제가 비밀리에 지하 묘지에서 실종된 여동생을 찾고 있다는 설정으로요.", "완벽합니다. 그 설정을 사제의 배경에 녹이고 초기 방들에 단서를 뿌릴게요. 준비되면 시작합니다."] },
    { title: "호스트", heading: "AI 호스트가 세계를 서술", description: "GM은 장면을 묘사하고, 인카운터를 진행하며, NPC와 굴림을 관리하고, 파티 상태를 추적하며, 당신의 결정에 따라 이야기를 적응시킵니다. 당신은 롤플레이에 집중하고, GM이 세계의 일관성을 유지합니다.", messages: ["육중한 돌문이 신음을 내며 열린다. 횃불 빛이 원형 방을 비추자 — 약탈한 보급 상자 옆에 있던 고블린 정찰병 셋이 으르렁거리며 고개를 든다.", "기선 제압: Lyra가 서까래 위의 네 번째를 발견한다. Aldric, 네가 먼저 움직여라.", "STR 판정으로 전열을 돌파하거나, 측면으로 도는 방법을 묘사해줘."] },
    { title: "AI 동료", heading: "AI 동료가 캐릭터로 반응", description: "각 AI 동료는 고유한 클래스, 성격, 동기를 가집니다. 자신의 차례를 가지고, 잡담하고, 전술을 논의하며, 이야기와 함께 성장합니다 — GM을 기다리며 그냥 서 있는 인형이 아닙니다.", messages: ["드디어. 지루해 죽을 뻔했어. 뒤로 빠져 — 전열은 내가 막는다.", "서까래 위 녀석은 내가 먼저 처리할게. 깔끔한 사선을 잡기 전에 — 셋 셀 동안 줘.", "내가 섬광 주문으로 앞 두 명을 멍하게 만들 수 있어. Aldric, 멍해지면 돌격해."] },
    { title: "당신이 이끈다", heading: "당신이 이야기를 끌고 — 세계가 반응한다", description: "[SAY]로 캐릭터로 말하고, [ACTION]으로 물리적 행동을 취하세요. GM과 동료들은 당신이 무엇을 하든 — 완전히 각본에서 벗어나도 — 적응합니다.", messages: ["[ACTION]보급 상자를 고블린들에게 밀어 서까래 사선을 막는다.[/ACTION]", "좋아 — 각도가 나왔어. 간다!", "상자가 두 정찰병을 벽에 박고, Lyra가 그 옆을 지나며, 서까래 위 고블린이 굴러떨어진다 — 방이 고요해진다. 시체를 뒤지기 위해 굴림을 해라."] },
  ],
  de: [
    { title: "Mit dem GM designen", heading: "Sag dem GM, was für ein RPG du spielen willst", description: "Chatte einfach mit dem Game Master in normalem Deutsch. Beschreibe Welt, Ton, Aufhänger — Solo-Dungeon, Sword-and-Sorcery-Heist, alles. Der GM entwirft Welt, Klassen und Eröffnungsabenteuer für dich.", messages: ["Ich will einen Dark-Fantasy-Dungeon mit kleiner Gruppe. Alte Elfenruinen, Untoten-Thema.", "Verstanden — von Untoten heimgesuchte Elfenruinen. Ich stelle eine 4er-Gruppe zusammen: Ritter, Schurke, Magier, Kleriker. Spezielle Aufhänger?", "Ja — der Kleriker sucht heimlich eine verschollene Schwester in den Katakomben.", "Perfekt. Ich webe das in die Hintergrundgeschichte des Klerikers und säe Hinweise in den frühen Räumen. Bereit, wenn du es bist."] },
    { title: "Der Host", heading: "KI-Host erzählt die Welt", description: "Der GM beschreibt Szenen, leitet Encounter, verwaltet NPCs und Würfe, verfolgt den Gruppenzustand und passt die Geschichte an deine Entscheidungen an. Du konzentrierst dich aufs Rollenspiel; der GM hält die Welt kohärent.", messages: ["Die schwere Steintür ächzt auf. Fackellicht enthüllt eine runde Kammer — drei Goblin-Späher schauen knurrend von einer geraubten Vorratskiste hoch.", "Initiative: Lyra entdeckt einen vierten Angreifer in den Sparren. Aldric, du bist zuerst dran.", "Würfel einen ST-Test, um die Linie zu durchbrechen, oder beschreibe, wie du flankieren willst."] },
    { title: "KI-Gruppe", heading: "KI-Gruppenmitglieder reagieren in Charakter", description: "Jedes KI-Mitglied hat eigene Klasse, Persönlichkeit und Motivation. Sie nehmen ihre Züge, plaudern, streiten über Taktik und wachsen mit der Geschichte — sie stehen nie nur untätig herum.", messages: ["Endlich. Mir wurde langsam langweilig. Bleib hinter mir — die Front halte ich.", "Den auf den Sparren übernehme ich, bevor er einen sauberen Schuss bekommt — gib mir bis drei.", "Ich kann die vorderen zwei mit einem Blendzauber lähmen. Aldric, stürm los, sobald sie betäubt sind."] },
    { title: "Du spielst", heading: "Du treibst die Geschichte — die Welt reagiert", description: "Sprich als Charakter mit [SAY] oder führe eine Aktion mit [ACTION] aus. Der Game Master und deine Gruppe passen sich an, was immer du tust — auch wenn du komplett vom Skript abweichst.", messages: ["[ACTION]Ich stoße die Vorratskiste in die Goblins, um die Sparrenschützenlinie zu blockieren.[/ACTION]", "Stark — das gibt mir den Winkel. Los geht's!", "Die Kiste schmettert zwei Späher gegen die Wand, Lyra schlüpft vorbei, und der Goblin auf dem Sparren stürzt herab — Stille legt sich über die Kammer. Würfle einen Such-Test."] },
  ],
  fr: [
    { title: "Concevoir avec le GM", heading: "Dites au GM quel RPG vous voulez jouer", description: "Discutez simplement avec le Maître du Jeu en français courant. Décrivez un monde, un ton, une accroche — donjon solo, casse heroic-fantasy, n'importe quoi. Le GM conçoit le monde, les classes et l'aventure d'ouverture pour vous.", messages: ["Je veux un donjon dark-fantasy en petite équipe. Vieilles ruines elfiques, thème mort-vivant.", "Compris — ruines elfiques hantées par des morts-vivants. Je monte une équipe de 4 : chevalier, voleur, mage, clerc. Des accroches personnalisées ?", "Oui — le clerc cherche secrètement une sœur disparue dans les catacombes.", "Parfait. J'intègre ça à l'histoire du clerc et sème des indices dans les premières salles. On commence quand vous voulez."] },
    { title: "L'Hôte", heading: "L'hôte IA raconte le monde", description: "Le GM décrit les scènes, lance les rencontres, gère les PNJ et les jets, suit l'état du groupe, et adapte l'histoire à vos décisions. Vous vous concentrez sur le jeu de rôle ; le GM garde le monde cohérent.", messages: ["La lourde porte de pierre s'ouvre en grinçant. La lumière des torches révèle une salle circulaire — trois éclaireurs gobelins lèvent les yeux d'une caisse de ravitaillement volée, grognant.", "Initiative : Lyra repère un quatrième attaquant dans les chevrons. Aldric, à toi de jouer en premier.", "Lance un test de FOR pour briser la ligne, ou décris comment tu veux flanquer."] },
    { title: "Groupe IA", heading: "Les membres IA réagissent en personnage", description: "Chaque membre IA a sa propre classe, personnalité et motivation. Ils prennent leurs tours, échangent, débattent de tactique et évoluent avec l'histoire — jamais juste plantés à attendre le GM.", messages: ["Enfin. Je commençais à m'ennuyer. Restez derrière moi — je tiens la première ligne.", "Je m'occupe de celui dans les chevrons avant qu'il ait un tir clair — donne-moi trois secondes.", "Je peux aveugler les deux premiers avec un sort d'éclair. Aldric, charge dès qu'ils sont étourdis."] },
    { title: "À vous de jouer", heading: "Vous menez l'histoire — le monde réagit", description: "Parlez en personnage avec [SAY] ou faites une action avec [ACTION]. Le Maître du Jeu et votre groupe s'adaptent à tout ce que vous faites — même hors-scénario complet.", messages: ["[ACTION]Je pousse la caisse de ravitaillement dans les gobelins pour bloquer le tir des chevrons.[/ACTION]", "Joli — ça me donne l'angle. J'y vais !", "La caisse écrase deux éclaireurs contre le mur, Lyra se faufile, et le gobelin des chevrons tombe — le silence règne dans la chambre. Lance un test pour fouiller les corps."] },
  ],
  es: [
    { title: "Diseñar con el GM", heading: "Cuéntale al GM qué RPG quieres jugar", description: "Solo chatea con el Game Master en español sencillo. Describe un mundo, un tono, un gancho — mazmorra en solitario, atraco de espada y hechicería, lo que sea. El GM diseña el mundo, las clases y la aventura inicial por ti.", messages: ["Quiero una mazmorra de dark fantasy con grupo pequeño. Ruinas élficas antiguas, temática no-muerta.", "Entendido — ruinas élficas plagadas de no-muertos. Monto un grupo de 4: caballero, pícaro, mago, clérigo. ¿Algún gancho personalizado?", "Sí — el clérigo busca en secreto a una hermana desaparecida en las catacumbas.", "Perfecto. Lo entrelazo en la historia del clérigo y siembro pistas en las primeras salas. Empezamos cuando estés listo."] },
    { title: "El Anfitrión", heading: "El anfitrión IA narra el mundo", description: "El GM describe escenas, dirige encuentros, gestiona NPCs y tiradas, rastrea el estado del grupo y adapta la historia a tus decisiones. Tú te enfocas en el rol; el GM mantiene el mundo coherente.", messages: ["La pesada puerta de piedra se abre con un gemido. La luz de la antorcha revela una cámara circular — tres exploradores goblins levantan la vista de una caja de suministros robada, gruñendo.", "Iniciativa: Lyra detecta un cuarto atacante en las vigas. Aldric, tú actúas primero.", "Tira un chequeo de FUE para romper la línea, o describe cómo quieres flanquear."] },
    { title: "Grupo IA", heading: "Los miembros IA reaccionan en personaje", description: "Cada miembro IA tiene su propia clase, personalidad y motivaciones. Toman sus turnos, charlan, discuten tácticas y crecen con la historia — nunca se quedan plantados esperando al GM.", messages: ["Por fin. Me estaba aburriendo. Quédate detrás de mí — yo aguanto la línea.", "Me encargo del de las vigas antes de que tenga un tiro limpio — dame hasta tres.", "Puedo cegar a los dos primeros con un destello. Aldric, carga en cuanto estén aturdidos."] },
    { title: "Tú juegas", heading: "Tú llevas la historia — el mundo reacciona", description: "Habla como personaje con [SAY] o realiza una acción con [ACTION]. El Game Master y tu grupo se adaptan a lo que sea que hagas — incluso si te sales completamente del guión.", messages: ["[ACTION]Empujo la caja de suministros hacia los goblins para bloquear el tiro de las vigas.[/ACTION]", "Bien — eso me da el ángulo. ¡Voy!", "La caja aplasta a dos exploradores contra la pared, Lyra pasa rápido al lado, y el goblin de las vigas cae — la cámara queda en silencio. Tira para registrar los cuerpos."] },
  ],
  pt: [
    { title: "Projetar com o GM", heading: "Diga ao GM que RPG você quer jogar", description: "Basta conversar com o Game Master em português comum. Descreva um mundo, tom, gancho — masmorra solo, assalto de espada e feitiçaria, o que for. O GM projeta o mundo, as classes e a aventura de abertura para você.", messages: ["Quero uma masmorra dark-fantasy com grupo pequeno. Ruínas élficas antigas, tema mortos-vivos.", "Entendido — ruínas élficas assombradas por mortos-vivos. Monto um grupo de 4: cavaleiro, ladino, mago, clérigo. Algum gancho personalizado?", "Sim — o clérigo procura secretamente uma irmã desaparecida nas catacumbas.", "Perfeito. Tramo isso na história do clérigo e planto pistas nas primeiras salas. Começamos quando estiver pronto."] },
    { title: "O Anfitrião", heading: "O anfitrião IA narra o mundo", description: "O GM descreve cenas, conduz encontros, gerencia NPCs e rolagens, rastreia o estado do grupo e adapta a história às suas decisões. Você foca no roleplay; o GM mantém o mundo coerente.", messages: ["A pesada porta de pedra range ao abrir. A luz da tocha revela uma câmara circular — três batedores goblins erguem o olhar de uma caixa de suprimentos roubada, rosnando.", "Iniciativa: Lyra detecta um quarto atacante nos caibros. Aldric, você age primeiro.", "Role um teste de FOR para romper a linha, ou descreva como quer flanquear."] },
    { title: "Grupo IA", heading: "Membros IA reagem em personagem", description: "Cada membro IA tem classe, personalidade e motivações próprias. Tomam seus turnos, conversam, discutem táticas e crescem com a história — nunca ficam parados esperando o GM.", messages: ["Finalmente. Estava ficando entediado. Fique atrás de mim — eu seguro a frente.", "Cuido do dos caibros antes que ele tenha um tiro limpo — me dê até três.", "Posso cegar os dois da frente com um clarão. Aldric, ataque assim que ficarem atordoados."] },
    { title: "Você joga", heading: "Você guia a história — o mundo reage", description: "Fale em personagem com [SAY] ou faça uma ação com [ACTION]. O Game Master e seu grupo se adaptam ao que quer que você faça — mesmo se sair completamente do roteiro.", messages: ["[ACTION]Empurro a caixa de suprimentos para os goblins, bloqueando o tiro dos caibros.[/ACTION]", "Boa — isso me dá o ângulo. Vou!", "A caixa esmaga dois batedores contra a parede, Lyra desliza ao lado, e o goblin nos caibros cai — a câmara fica em silêncio. Role para revistar os corpos."] },
  ],
  ru: [
    { title: "Дизайн с ГМ", heading: "Расскажите ГМ, какую RPG вы хотите", description: "Просто общайтесь с Мастером Игры на обычном языке. Опишите мир, тон, сюжетный крючок — соло-подземелье, фэнтези-ограбление, что угодно. ГМ спроектирует мир, классы и стартовое приключение.", messages: ["Хочу dark-fantasy подземелье с небольшой партией. Древние эльфийские руины, тема нежити.", "Понял — эльфийские руины, кишащие нежитью. Соберу группу из 4: рыцарь, плут, маг, клирик. Какие-то особые крючки?", "Да — клирик тайно ищет пропавшую сестру в катакомбах.", "Отлично. Вплету это в предысторию клирика и расставлю подсказки в ранних комнатах. Начнём, когда будете готовы."] },
    { title: "Ведущий", heading: "ИИ-ведущий повествует мир", description: "ГМ описывает сцены, проводит столкновения, управляет NPC и бросками, отслеживает состояние группы и адаптирует историю под ваши решения. Вы фокусируетесь на отыгрыше; ГМ держит мир связным.", messages: ["Тяжёлая каменная дверь со скрипом открывается. Свет факела освещает круглый зал — три гоблина-разведчика поднимают взгляд от украденного ящика с припасами, скалясь.", "Инициатива: Lyra замечает четвёртого нападающего на стропилах. Aldric, ты ходишь первым.", "Брось проверку СИЛ, чтобы прорвать линию, или опиши, как хочешь зайти с фланга."] },
    { title: "ИИ-партия", heading: "ИИ-спутники реагируют в роли", description: "У каждого ИИ-спутника свой класс, личность и мотивы. Они берут свои ходы, шутят, спорят о тактике и растут вместе с историей — никогда не стоят без дела, ожидая ГМ.", messages: ["Наконец-то. Я уже скучать начал. Держись позади — фронт я возьму на себя.", "Я разберусь с тем, что на стропилах, пока он не нашёл чистый угол — досчитай до трёх.", "Я могу ослепить переднюю двойку вспышкой. Aldric, врывайся, как только их оглушит."] },
    { title: "Ваш ход", heading: "Вы ведёте историю — мир отвечает", description: "Говорите от лица персонажа через [SAY] или совершайте физическое действие через [ACTION]. Мастер Игры и ваш отряд адаптируются ко всему, что вы делаете — даже если вы полностью отойдёте от сценария.", messages: ["[ACTION]Я толкаю ящик с припасами на гоблинов, чтобы перекрыть линию выстрела со стропил.[/ACTION]", "Красиво — теперь у меня есть угол. Иду!", "Ящик впечатывает двух разведчиков в стену, Lyra проскакивает мимо, гоблин со стропил падает — в зале тишина. Брось проверку для обыска тел."] },
  ],
  it: [
    { title: "Progetta con il GM", heading: "Dì al GM che RPG vuoi giocare", description: "Chatta semplicemente con il Game Master in italiano normale. Descrivi un mondo, un tono, un gancio — dungeon in solitaria, colpo sword-and-sorcery, qualsiasi cosa. Il GM progetta mondo, classi e avventura d'apertura per te.", messages: ["Voglio un dungeon dark-fantasy con gruppo piccolo. Antiche rovine elfiche, tema non-morti.", "Capito — rovine elfiche infestate da non-morti. Preparo un gruppo da 4: cavaliere, ladro, mago, chierico. Vuoi ganci personalizzati?", "Sì — il chierico cerca segretamente una sorella scomparsa nelle catacombe.", "Perfetto. Intreccio questo nel background del chierico e semino indizi nelle prime stanze. Si parte quando sei pronto."] },
    { title: "L'Host", heading: "L'host IA narra il mondo", description: "Il GM descrive scene, conduce gli scontri, gestisce PNG e tiri, traccia lo stato del gruppo e adatta la storia alle tue decisioni. Tu ti concentri sul roleplay; il GM mantiene il mondo coerente.", messages: ["La pesante porta di pietra geme aprendosi. La luce della torcia rivela una camera circolare — tre esploratori goblin alzano lo sguardo da una cassa di rifornimenti rubata, ringhiando.", "Iniziativa: Lyra individua un quarto aggressore tra le travi. Aldric, tocca a te per primo.", "Tira una prova di FOR per rompere la linea, o descrivi come vuoi prenderli di fianco."] },
    { title: "Gruppo IA", heading: "I membri IA reagiscono in personaggio", description: "Ogni membro IA ha la propria classe, personalità e motivazioni. Prendono i propri turni, chiacchierano, discutono di tattiche e crescono con la storia — non restano mai impalati ad aspettare il GM.", messages: ["Finalmente. Mi stavo annoiando. Stammi dietro — la prima linea la tengo io.", "A quello tra le travi penso io prima che abbia un tiro pulito — dammi fino a tre.", "Posso accecare i primi due con un lampo. Aldric, carica appena sono stordi."] },
    { title: "Tocca a te", heading: "Tu guidi la storia — il mondo reagisce", description: "Parla in personaggio con [SAY] o fai un'azione con [ACTION]. Il Game Master e il tuo gruppo si adattano a qualsiasi cosa tu faccia — anche se esci completamente dal copione.", messages: ["[ACTION]Spingo la cassa di rifornimenti contro i goblin per bloccare il tiro dalle travi.[/ACTION]", "Bello — adesso ho l'angolo. Vado!", "La cassa schianta due esploratori contro il muro, Lyra sguscia di lato, e il goblin sulle travi precipita — la camera cala nel silenzio. Tira per perquisire i corpi."] },
  ],
  ar: [
    { title: "صمّم مع المدير", heading: "أخبر المدير عن RPG التي تريد لعبها", description: "تحدث مع مدير اللعبة بالعربية الفصحى أو العامية. صِف عالماً، نبرة، خطاف قصة — دنجن منفرد، سرقة في عالم سيوف وسحر، أي شيء. سيصمم لك المدير العالم والفئات ومغامرة الافتتاح.", messages: ["أريد استكشاف دنجن بأسلوب dark-fantasy مع فريق صغير. أطلال جنية قديمة، نمط الأموات الأحياء.", "فهمت — أطلال جنية مسكونة بالأموات الأحياء. سأشكّل فريقاً من 4: فارس، لص، ساحر، كاهن. هل تريد خطافات مخصصة؟", "نعم — الكاهن يبحث سراً عن أخت مفقودة في السراديب.", "ممتاز. سأنسج ذلك في خلفية الكاهن وأبثّ القرائن في الغرف الأولى. ابدأ عندما تكون جاهزاً."] },
    { title: "المضيف", heading: "مضيف الذكاء الاصطناعي يروي العالم", description: "المدير يصف المشاهد، يدير الملاقاة، ويدير الشخصيات غير اللاعبة والرميات، ويتتبع حالة الفريق، ويكيّف القصة وفق قراراتك. أنت تركّز على لعب الدور؛ المدير يحافظ على تماسك العالم.", messages: ["يُفتح الباب الحجري الثقيل بأنين. يكشف ضوء المشعل عن قاعة دائرية — ثلاثة كشّافة من الغوبلين يرفعون أعينهم من صندوق إمدادات مسروق، وهم يزمجرون.", "المبادرة: Lyra ترصد رابعاً يكمن في العوارض. Aldric، أنت تتحرك أولاً.", "ارمِ اختبار قوة لتخترق الصف، أو صِف كيف تريد الالتفاف."] },
    { title: "الفريق الذكي", heading: "أعضاء الفريق الذكي يتفاعلون كشخصياتهم", description: "كل عضو ذكاء اصطناعي لديه فئته الخاصة، شخصيته ودوافعه. يأخذون أدوارهم، يتجاذبون أطراف الحديث، يناقشون التكتيكات، وينمون مع القصة — لا يقفون بلا فعل في انتظار المدير.", messages: ["أخيراً. كنت أشعر بالملل. ابقَ خلفي — أنا أتولى الجبهة الأمامية.", "أتولى أمر الذي على العوارض قبل أن يحصل على رمية نظيفة — أمهلني حتى ثلاثة.", "يمكنني إعماء الأماميين بإسعاف ضوئي. Aldric، اندفع حالما يصابون بالدوار."] },
    { title: "دورك", heading: "أنت تقود القصة — والعالم يستجيب", description: "تحدث كشخصيتك بـ [SAY] أو نفّذ فعلاً جسدياً بـ [ACTION]. مدير اللعبة وفريقك يتكيفون مع أي شيء تفعله — حتى لو خرجت كلياً عن السيناريو.", messages: ["[ACTION]أدفع صندوق الإمدادات نحو الغوبلين لأسد خط الرماية من العوارض.[/ACTION]", "رائع — هذا يمنحني الزاوية. هيا!", "يصدم الصندوق كشّافين بالحائط، تنزلق Lyra بجانبه، ويهوي غوبلين العوارض — تخيّم على القاعة. ارمِ اختبار بحث لتفتيش الجثث."] },
  ],
};

export function localizeInsideGameSteps(
  steps: InsideGameStep[],
  lang: string,
): InsideGameStep[] {
  const key = resolveKey(lang);
  const overlay = STEPS_I18N[key];
  if (!overlay) return steps;

  return steps.map((step, i) => {
    const loc = overlay[i];
    if (!loc) return step;
    return {
      ...step,
      title: loc.title,
      heading: loc.heading,
      description: loc.description,
      messages: step.messages.map((msg, j) => ({
        ...msg,
        text: loc.messages[j] ?? msg.text,
      })),
    };
  });
}

