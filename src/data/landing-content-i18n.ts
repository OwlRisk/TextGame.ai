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

const SCENARIO_TEXT: Record<string, Record<string, ScenarioOverlay>> = {
  zh: {
    werewolf: { title: "狼人杀", messages: [
      "村庄入睡。狼人——选择你们的猎物。",
      "Blake！一！整！晚！没！说！话！你们不觉得有问题吗？？",
      "淡定——我昨晚守了Blake，他没事，相信我。",
      "等等——你刚承认自己是医生？？这不就是狼人骗信任的套路吗！",
    ]},
    mafia: { title: "黑手党", messages: [
      "城市入睡。黑手党——选人。",
      "我亲眼看到Marco半夜在外面。别想抵赖。",
      "我去买面包！！给家里人买面包！！这也有罪？？",
      "行行行，买面包。投他出去——我看够了。",
    ]},
    spy: { title: "谁是卧底", messages: [
      "暗号已发。有一个人拿到了不同的词。描述但别说穿。",
      "嗯……我的是那种冷天早上会想来一杯的东西，暖暖的。",
      "哇这也说得太模糊了吧，你是不是卧底啊Jordan？",
      "好笑，第一个跳出来指人的往往最有鬼。说的就是你Riley 😏",
    ]},
    mystery: { title: "谋杀之谜", messages: [
      "钻石不见了。保险库是锁着的。你们中有人干的。",
      "那个……我9点左右看到有人在展柜那边。当时没多想。",
      "博物馆8点就关门了啊Morgan，你那时候在里面干嘛？🤔",
      "我有钥匙！我在盘点库存——真不是我干的！",
    ]},
  },
  ja: {
    werewolf: { title: "人狼", messages: [
      "村に夜が訪れた。狼たちが動き出す……人狼よ、目を開けてターゲットを選べ。",
      "Blakeは一晩中ほとんど何も言わなかった。あの沈黙は怪しい——指摘させてもらう。",
      "Blakeのはずがない。昨夜私が守った——もし狼だったら、もう分かっているはず。",
      "待てよ……Caseyが今、能力を暴露した。医者がわざわざ正体を明かすのは、何かをごまかしている時だけだ。",
    ]},
    mafia: { title: "マフィア", messages: [
      "街が静まり返る。マフィアよ——目を開け。夜明け前にターゲットを選べ。",
      "Marcoは真夜中にパン屋の外にいた。偶然じゃない——記録を確認した。",
      "誓って言うけど、家族のためにパンを買いに行っただけだ！！こんなことで嘘をつく理由がない！",
      "それこそマフィアが言いそうなことだからよ。出来すぎた話ね、Marco。",
    ]},
    spy: { title: "スパイは誰だ", messages: [
      "秘密の言葉が送られた。一人を除いて全員が同じ言葉を持っている。ばれないように自分の言葉を描写せよ。",
      "僕のはね、ゆっくりした朝に手が伸びる温かいもの……とても心地いい。",
      "曖昧すぎるよ、Jordan。スパイか、スパイっぽく振る舞ってるかのどっちかだ。",
      "ただ答えを明白にしたくないだけかもよ？話をそらしてるのは君の方だよ、Riley。",
    ]},
    mystery: { title: "殺人ミステリー", messages: [
      "施錠された美術館の金庫から、高価なダイヤモンドが消えた。この部屋にいる全員が容疑者だ。",
      "私は……午後9時頃に展示ケースの近くで誰かを見ました。その時はあまり気にしませんでした。",
      "それはありえない——美術館は8時に閉まる。閉館後に誰が入れたんだ、Morgan？",
      "鍵を持っていたんです。私じゃないです、約束します……在庫確認をしていただけです。",
    ]},
  },
  ko: {
    werewolf: { title: "늑대인간", messages: [
      "마을에 밤이 찾아왔습니다. 늑대들이 움직이기 시작합니다... 늑대인간들이여, 눈을 뜨고 목표를 선택하세요.",
      "Blake는 밤새 거의 말을 하지 않았어요. 그 침묵이 수상합니다 — 지적하겠습니다.",
      "Blake일 리가 없어요. 어젯밤에 제가 보호했으니까 — 만약 늑대였다면, 이미 알았을 거예요.",
      "잠깐... Casey가 방금 자신의 능력을 드러냈어요. 의사가 왜 자신을 노출하겠어요, 주의를 돌리려는 게 아니라면?",
    ]},
    mafia: { title: "마피아", messages: [
      "도시가 고요해집니다. 마피아 — 눈을 뜨세요. 새벽 전에 목표를 선택하세요.",
      "Marco가 자정에 빵집 밖에 있었어요. 우연이 아닙니다 — 기록을 확인했어요.",
      "맹세하건대 가족을 위해 빵을 사러 간 것뿐이에요!! 이런 일에 대해 왜 거짓말을 하겠어요?",
      "마피아 조직원이 딱 할 법한 말이니까요. 너무 편리하네요, Marco.",
    ]},
    spy: { title: "스파이는 누구", messages: [
      "비밀 단어가 전송되었습니다. 한 명을 제외하고 모두 같은 단어를 가지고 있습니다. 들키지 않게 설명하세요.",
      "제 것은 느긋한 아침에 사람들이 찾는 따뜻한 무언가예요... 매우 편안해요.",
      "너무 모호하네요, Jordan. 스파이거나, 스파이처럼 보이려는 거거나 둘 중 하나예요.",
      "아니면 너무 뻔하게 말하고 싶지 않았을 뿐인 걸요? 여기서 주의를 돌리는 건 Riley, 당신이에요.",
    ]},
    mystery: { title: "살인 미스터리", messages: [
      "잠긴 박물관 금고에서 값을 매길 수 없는 다이아몬드가 사라졌습니다. 이 방에 있는 모든 사람이 용의자입니다.",
      "저는... 밤 9시쯤 진열장 근처에서 누군가를 봤어요. 당시에는 대수롭지 않게 생각했어요.",
      "그건 불가능해요 — 박물관은 8시에 닫습니다. 폐관 후에 누가 당신을 들여보냈나요, Morgan?",
      "저한테 열쇠가 있었어요. 제가 한 게 아니에요, 약속해요... 재고 조사를 하고 있었을 뿐이에요.",
    ]},
  },
  de: {
    werewolf: { title: "Werwolf", messages: [
      "Die Nacht bricht über das Dorf herein. Die Wölfe erwachen… Werwölfe, öffnet eure Augen und wählt euer Ziel.",
      "Blake hat die ganze Nacht kaum ein Wort gesagt. Dieses Schweigen ist verdächtig — das muss ich ansprechen.",
      "Unmöglich, dass es Blake ist. Ich habe ihn letzte Nacht beschützt — wäre er ein Wolf, wüssten wir es bereits.",
      "Moment… Casey hat gerade seine Fähigkeit enthüllt. Warum sollte der Arzt sich offenbaren, wenn er nicht ablenken will?",
    ]},
    mafia: { title: "Mafia", messages: [
      "Die Stadt verstummt. Mafia — öffnet die Augen. Wählt euer Ziel vor Tagesanbruch.",
      "Marco war um Mitternacht vor der Bäckerei. Das ist kein Zufall — ich habe die Aufzeichnungen überprüft.",
      "Ich schwöre, ich wollte nur Brot für meine Familie holen!! Warum sollte ich bei so etwas lügen?",
      "Weil genau das ein Mafia-Mitglied sagen würde. Zu bequem, Marco.",
    ]},
    spy: { title: "Wer ist der Spion", messages: [
      "Geheimwörter gesendet. Alle haben dasselbe Wort — außer ein Spieler. Beschreibt eures, ohne es zu verraten.",
      "Meins ist etwas Warmes, nach dem man an einem gemütlichen Morgen greift… sehr wohltuend.",
      "Das ist extrem vage, Jordan. Du bist entweder der Spion oder versuchst so zu klingen.",
      "Oder vielleicht will ich es einfach nicht zu offensichtlich machen? Du bist hier derjenige, der ablenkt, Riley.",
    ]},
    mystery: { title: "Mordmysterium", messages: [
      "Ein unbezahlbarer Diamant ist aus dem verschlossenen Museumstresor verschwunden. Jede Person in diesem Raum ist verdächtig.",
      "Ich… habe gegen 21 Uhr jemanden in der Nähe der Vitrine gesehen. Ich habe mir dabei nichts gedacht.",
      "Das ist unmöglich — das Museum schließt um 8. Wer hat dich nach Feierabend reingelassen, Morgan?",
      "Ich hatte einen Schlüssel. Ich war es nicht, versprochen… Ich habe nur Inventur gemacht.",
    ]},
  },
  fr: {
    werewolf: { title: "Loup-garou", messages: [
      "La nuit tombe sur le village. Les loups s'agitent… Loups-garous, ouvrez les yeux et choisissez votre cible.",
      "Blake n'a presque rien dit de toute la nuit. Ce silence est suspect — je le signale.",
      "Impossible que ce soit Blake. Je l'ai protégé cette nuit — s'il était un loup, on le saurait déjà.",
      "Attendez… Casey vient de révéler son pouvoir. Pourquoi le Médecin se dévoilerait-il, à moins de chercher à détourner l'attention ?",
    ]},
    mafia: { title: "Mafia", messages: [
      "La ville se tait. Mafia — ouvrez les yeux. Choisissez votre cible avant l'aube.",
      "Marco était devant la boulangerie à minuit. Ce n'est pas une coïncidence — j'ai vérifié les registres.",
      "Je jure que j'allais juste chercher du pain pour ma famille !! Pourquoi mentirais-je sur un truc pareil ?",
      "Parce que c'est exactement ce qu'un membre de la Mafia dirait. Trop pratique, Marco.",
    ]},
    spy: { title: "Qui est l'espion", messages: [
      "Mots secrets envoyés. Tout le monde a le même mot — sauf un joueur. Décrivez le vôtre sans le révéler.",
      "Le mien est quelque chose de chaud qu'on cherche lors d'une matinée tranquille… très réconfortant.",
      "C'est extrêmement vague, Jordan. Tu es soit l'espion, soit tu essaies d'y ressembler.",
      "Ou peut-être que je ne veux pas rendre la chose trop évidente ? C'est toi qui détournes l'attention, Riley.",
    ]},
    mystery: { title: "Mystère du meurtre", messages: [
      "Un diamant inestimable a disparu du coffre-fort verrouillé du musée. Chaque personne ici est suspecte.",
      "J'ai… vu quelqu'un près de la vitrine vers 21 heures. Je n'y ai pas prêté attention sur le moment.",
      "C'est impossible — le musée ferme à 20 heures. Qui t'a laissé entrer après la fermeture, Morgan ?",
      "J'avais une clé. Ce n'est pas moi, je vous le promets… Je faisais juste l'inventaire.",
    ]},
  },
  es: {
    werewolf: { title: "Hombre Lobo", messages: [
      "La noche cae sobre el pueblo. Los lobos se agitan… Hombres lobo, abran los ojos y elijan su objetivo.",
      "Blake apenas dijo una palabra en toda la noche. Ese silencio es sospechoso — lo voy a señalar.",
      "No puede ser Blake. Lo protegí anoche — si fuera un lobo, ya lo sabríamos.",
      "Espera… Casey acaba de revelar su habilidad. ¿Por qué el Doctor se expondría a menos que esté desviando la atención?",
    ]},
    mafia: { title: "Mafia", messages: [
      "La ciudad se sume en el silencio. Mafia — abran los ojos. Elijan su objetivo antes del amanecer.",
      "Marco estaba fuera de la panadería a medianoche. No es coincidencia — revisé los registros.",
      "¡¡Les juro que solo fui a comprar pan para mi familia!! ¿Por qué mentiría sobre algo así?",
      "Porque eso es exactamente lo que diría un miembro de la Mafia. Demasiado conveniente, Marco.",
    ]},
    spy: { title: "¿Quién es el espía?", messages: [
      "Palabras secretas enviadas. Todos tienen la misma palabra — excepto un jugador. Describe la tuya sin revelarla.",
      "Lo mío es algo cálido que la gente busca en una mañana tranquila… muy reconfortante.",
      "Eso es extremadamente vago, Jordan. O eres el espía o intentas parecer uno.",
      "O quizás no quiero hacerlo demasiado obvio. Tú eres quien desvía la atención aquí, Riley.",
    ]},
    mystery: { title: "Misterio de asesinato", messages: [
      "Un diamante invaluable ha desaparecido de la bóveda cerrada del museo. Cada persona en esta sala es sospechosa.",
      "Yo… vi a alguien cerca de la vitrina alrededor de las 9 PM. No le di mucha importancia en ese momento.",
      "Eso es imposible — el museo cierra a las 8. ¿Quién te dejó entrar fuera de horario, Morgan?",
      "Tenía una llave. No fui yo, lo prometo… Solo estaba haciendo inventario.",
    ]},
  },
  pt: {
    werewolf: { title: "Lobisomem", messages: [
      "A noite cai sobre a aldeia. Os lobos se agitam… Lobisomens, abram os olhos e escolham seu alvo.",
      "Blake mal disse uma palavra a noite toda. Esse silêncio é suspeito — preciso apontar isso.",
      "Impossível ser o Blake. Eu o protegi na noite passada — se fosse um lobo, já saberíamos.",
      "Espera… Casey acabou de revelar sua habilidade. Por que o Médico se exporia, a menos que esteja desviando a atenção?",
    ]},
    mafia: { title: "Máfia", messages: [
      "A cidade cai em silêncio. Máfia — abram os olhos. Escolham seu alvo antes do amanhecer.",
      "Marco estava fora da padaria à meia-noite. Isso não é coincidência — eu verifiquei os registros.",
      "Eu juro que só fui buscar pão para minha família!! Por que eu mentiria sobre algo assim?",
      "Porque é exatamente o que um membro da Máfia diria. Conveniente demais, Marco.",
    ]},
    spy: { title: "Quem é o espião", messages: [
      "Palavras secretas enviadas. Todos têm a mesma palavra — exceto um jogador. Descreva a sua sem revelá-la.",
      "O meu é algo quente que as pessoas buscam numa manhã tranquila… muito reconfortante.",
      "Isso é extremamente vago, Jordan. Ou você é o espião ou está tentando parecer um.",
      "Ou talvez eu só não queira tornar óbvio demais? Quem está desviando a atenção aqui é você, Riley.",
    ]},
    mystery: { title: "Mistério de assassinato", messages: [
      "Um diamante inestimável desapareceu do cofre trancado do museu. Cada pessoa nesta sala é suspeita.",
      "Eu… vi alguém perto da vitrine por volta das 21h. Na hora não pensei muito sobre isso.",
      "Isso é impossível — o museu fecha às 8. Quem te deixou entrar fora do horário, Morgan?",
      "Eu tinha uma chave. Não fui eu, prometo… Estava apenas fazendo inventário.",
    ]},
  },
  ru: {
    werewolf: { title: "Оборотень", messages: [
      "На деревню опускается ночь. Волки пробуждаются… Оборотни, откройте глаза и выберите цель.",
      "Блейк за всю ночь едва слово сказал. Это молчание подозрительно — я должен это отметить.",
      "Не может быть Блейк. Я защитил его прошлой ночью — будь он волком, мы бы уже знали.",
      "Подождите… Кейси только что раскрыл свою способность. Зачем Доктору раскрываться, если не для того, чтобы отвести подозрения?",
    ]},
    mafia: { title: "Мафия", messages: [
      "Город погружается в тишину. Мафия — откройте глаза. Выберите цель до рассвета.",
      "Марко был у пекарни в полночь. Это не совпадение — я проверила записи.",
      "Клянусь, я просто ходил за хлебом для семьи!! Зачем мне врать о таком?",
      "Потому что именно это сказал бы член Мафии. Слишком удобно, Марко.",
    ]},
    spy: { title: "Кто шпион", messages: [
      "Секретные слова отправлены. У всех одно слово — кроме одного игрока. Опишите своё, не выдавая его.",
      "Моё — это что-то тёплое, к чему тянешься неспешным утром… Очень уютное.",
      "Это слишком размыто, Джордан. Ты либо шпион, либо просто пытаешься им казаться.",
      "А может, я просто не хочу делать это слишком очевидным? Это ты здесь уводишь разговор, Райли.",
    ]},
    mystery: { title: "Тайна убийства", messages: [
      "Бесценный бриллиант исчез из запертого музейного хранилища. Каждый в этой комнате — подозреваемый.",
      "Я… видел кого-то у витрины около 9 вечера. Тогда не придал этому значения.",
      "Это невозможно — музей закрывается в 8. Кто впустил тебя после закрытия, Морган?",
      "У меня был ключ. Это не я, обещаю… Я просто проводил инвентаризацию.",
    ]},
  },
  it: {
    werewolf: { title: "Lupo Mannaro", messages: [
      "La notte cala sul villaggio. I lupi si agitano… Lupi mannari, aprite gli occhi e scegliete il vostro bersaglio.",
      "Blake non ha quasi detto una parola tutta la notte. Quel silenzio è sospetto — devo farlo notare.",
      "Impossibile che sia Blake. L'ho protetto stanotte — se fosse un lupo, lo sapremmo già.",
      "Aspettate… Casey ha appena rivelato la sua abilità. Perché il Dottore dovrebbe esporsi, se non per depistare?",
    ]},
    mafia: { title: "Mafia", messages: [
      "La città ammutolisce. Mafia — aprite gli occhi. Scegliete il vostro bersaglio prima dell'alba.",
      "Marco era fuori dalla panetteria a mezzanotte. Non è una coincidenza — ho controllato i registri.",
      "Vi giuro che stavo solo prendendo il pane per la mia famiglia!! Perché dovrei mentire su una cosa del genere?",
      "Perché è esattamente quello che direbbe un membro della Mafia. Troppo comodo, Marco.",
    ]},
    spy: { title: "Chi è la spia", messages: [
      "Parole segrete inviate. Tutti hanno la stessa parola — tranne un giocatore. Descrivete la vostra senza rivelarla.",
      "Il mio è qualcosa di caldo a cui ci si aggrappa in una mattina tranquilla… molto confortante.",
      "È estremamente vago, Jordan. O sei la spia o stai cercando di sembrarlo.",
      "O forse non voglio renderlo troppo ovvio? Sei tu che stai deviando, Riley.",
    ]},
    mystery: { title: "Mistero dell'omicidio", messages: [
      "Un diamante inestimabile è scomparso dalla cassaforte chiusa del museo. Ogni persona in questa stanza è sospettata.",
      "Io… ho visto qualcuno vicino alla vetrina verso le 21. Al momento non ci ho fatto caso.",
      "È impossibile — il museo chiude alle 8. Chi ti ha fatto entrare fuori orario, Morgan?",
      "Avevo una chiave. Non sono stato io, lo giuro… Stavo solo facendo l'inventario.",
    ]},
  },
  ar: {
    werewolf: { title: "المستذئب", messages: [
      "يحل الليل على القرية. الذئاب تتحرك… أيها المستذئبون، افتحوا أعينكم واختاروا هدفكم.",
      "بالكاد نطق Blake بكلمة طوال الليل. هذا الصمت مثير للريبة — يجب أن أشير إلى ذلك.",
      "مستحيل أن يكون Blake. لقد حميته الليلة الماضية — لو كان ذئباً، لكنا عرفنا بالفعل.",
      "انتظروا… Casey كشف للتو عن قدرته. لماذا يكشف الطبيب عن نفسه إلا إذا كان يحاول تحويل الانتباه؟",
    ]},
    mafia: { title: "المافيا", messages: [
      "يخيّم الصمت على المدينة. أيها المافيا — افتحوا أعينكم. اختاروا هدفكم قبل الفجر.",
      "كان Marco خارج المخبز في منتصف الليل. هذه ليست مصادفة — لقد راجعت السجلات.",
      "أقسم أنني كنت فقط أشتري خبزاً لعائلتي!! لماذا سأكذب بشأن شيء كهذا؟",
      "لأن هذا بالضبط ما سيقوله عضو في المافيا. مريح جداً يا Marco.",
    ]},
    spy: { title: "من هو الجاسوس", messages: [
      "تم إرسال الكلمات السرية. الجميع لديهم نفس الكلمة — ما عدا لاعب واحد. صِفوا كلمتكم دون كشفها.",
      "ما لديّ هو شيء دافئ يلجأ إليه الناس في صباح هادئ… مريح جداً.",
      "هذا غامض للغاية يا Jordan. إما أنك الجاسوس أو تحاول أن تبدو كأنك واحد.",
      "أو ربما لا أريد أن أجعل الأمر واضحاً جداً؟ أنتِ من تحاولين تحويل الانتباه هنا يا Riley.",
    ]},
    mystery: { title: "لغز الجريمة", messages: [
      "اختفت ماسة لا تُقدّر بثمن من خزنة المتحف المقفلة. كل شخص في هذه الغرفة مشتبه به.",
      "أنا… رأيت شخصاً بالقرب من واجهة العرض حوالي الساعة 9 مساءً. لم أعر الأمر اهتماماً حينها.",
      "هذا مستحيل — المتحف يُغلق الساعة 8. من سمح لك بالدخول بعد ساعات العمل يا Morgan؟",
      "كان معي مفتاح. لم أكن أنا، أعدكم… كنت أقوم بالجرد فقط.",
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

const ROLE: Record<string, L> = {
  Villager:  { zh: "村民", ja: "村人", ko: "마을 주민", de: "Dorfbewohner", fr: "Villageois", es: "Aldeano", pt: "Aldeão", ru: "Житель", it: "Villico", ar: "قروي" },
  Doctor:    { zh: "医生", ja: "医者", ko: "의사", de: "Arzt", fr: "Médecin", es: "Doctor", pt: "Médico", ru: "Доктор", it: "Dottore", ar: "طبيب" },
  Detective: { zh: "侦探", ja: "探偵", ko: "탐정", de: "Detektiv", fr: "Détective", es: "Detective", pt: "Detetive", ru: "Детектив", it: "Detective", ar: "محقق" },
  Civilian:  { zh: "平民", ja: "市民", ko: "시민", de: "Zivilist", fr: "Civil", es: "Civil", pt: "Civil", ru: "Мирный", it: "Civile", ar: "مدني" },
  Spy:       { zh: "间谍", ja: "スパイ", ko: "스파이", de: "Spion", fr: "Espion", es: "Espía", pt: "Espião", ru: "Шпион", it: "Spia", ar: "جاسوس" },
  Witness:   { zh: "目击者", ja: "目撃者", ko: "목격자", de: "Zeuge", fr: "Témoin", es: "Testigo", pt: "Testemunha", ru: "Свидетель", it: "Testimone", ar: "شاهد" },
  Suspect:   { zh: "嫌疑人", ja: "容疑者", ko: "용의자", de: "Verdächtiger", fr: "Suspect", es: "Sospechoso", pt: "Suspeito", ru: "Подозреваемый", it: "Sospettato", ar: "مشتبه به" },
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

const PERSONALITY: Record<string, L> = {
  "Outspoken and analytical":             { zh: "直言不讳，善于分析", ja: "率直で分析的", ko: "직설적이고 분석적", de: "Direkt und analytisch", fr: "Franc et analytique", es: "Directo y analítico", pt: "Franco e analítico", ru: "Прямолинейный и аналитичный", it: "Schietto e analitico", ar: "صريح وتحليلي" },
  "Calm, protective instincts":           { zh: "冷静沉着，保护本能", ja: "冷静、守護本能", ko: "침착하고 보호 본능적", de: "Ruhig, beschützend", fr: "Calme, instinct protecteur", es: "Tranquilo, instinto protector", pt: "Calmo, instinto protetor", ru: "Спокойный, защитный инстинкт", it: "Calmo, istinto protettivo", ar: "هادئ، غريزة حماية" },
  "Sharp, suspicious of everyone":        { zh: "敏锐多疑，怀疑一切", ja: "鋭い、全員を疑う", ko: "날카롭고 모두를 의심", de: "Scharfsinnig, misstraut jedem", fr: "Perspicace, méfiant envers tous", es: "Agudo, sospecha de todos", pt: "Perspicaz, desconfia de todos", ru: "Проницательный, подозревает всех", it: "Acuto, sospettoso di tutti", ar: "حاد الذكاء، يشتبه بالجميع" },
  "Nervous, eager to prove innocence":    { zh: "紧张不安，急于自证清白", ja: "神経質、無実を証明したがる", ko: "긴장하며 무죄를 증명하려 함", de: "Nervös, will Unschuld beweisen", fr: "Nerveux, désireux de prouver son innocence", es: "Nervioso, ansioso por demostrar inocencia", pt: "Nervoso, ansioso para provar inocência", ru: "Нервный, стремится доказать невиновность", it: "Nervoso, desideroso di dimostrare innocenza", ar: "متوتر، حريص على إثبات البراءة" },
  "Clever, deliberately vague":           { zh: "聪明机智，故意含糊", ja: "賢い、意図的に曖昧", ko: "영리하고 의도적으로 모호함", de: "Clever, absichtlich vage", fr: "Malin, volontairement vague", es: "Astuto, deliberadamente vago", pt: "Esperto, deliberadamente vago", ru: "Хитрый, намеренно расплывчатый", it: "Furbo, deliberatamente vago", ar: "ذكي، غامض عمداً" },
  "Paranoid, accuses to deflect":         { zh: "多疑偏执，指控以转移注意", ja: "被害妄想、責任転嫁で攻撃", ko: "편집증적, 주의를 돌리기 위해 고발", de: "Paranoid, beschuldigt zur Ablenkung", fr: "Paranoïaque, accuse pour détourner", es: "Paranoico, acusa para desviar", pt: "Paranoico, acusa para desviar", ru: "Параноик, обвиняет для отвода глаз", it: "Paranoico, accusa per depistare", ar: "مرتاب، يتّهم لتحويل الانتباه" },
  "Nervous, detail-oriented":             { zh: "紧张敏感，注重细节", ja: "神経質、細部にこだわる", ko: "긴장하며 세부 사항에 집중", de: "Nervös, detailorientiert", fr: "Nerveux, soucieux des détails", es: "Nervioso, atento a los detalles", pt: "Nervoso, atento aos detalhes", ru: "Нервный, внимателен к деталям", it: "Nervoso, attento ai dettagli", ar: "متوتر، يهتم بالتفاصيل" },
  "Confrontational, quick to contradict": { zh: "对抗性强，反应迅速", ja: "対立的、すぐに反論する", ko: "대립적이고 반박이 빠름", de: "Konfrontativ, widerspricht schnell", fr: "Confrontant, contredit rapidement", es: "Confrontacional, rápido en contradecir", pt: "Confrontador, rápido em contradizer", ru: "Конфликтный, быстро возражает", it: "Combattivo, pronto a contraddire", ar: "مواجه، سريع في المعارضة" },
  "Quiet, watchful observer":             { zh: "沉默寡言，善于观察", ja: "静かで注意深い観察者", ko: "조용하고 관찰력이 뛰어남", de: "Ruhig, aufmerksamer Beobachter", fr: "Discret, observateur attentif", es: "Callado, observador atento", pt: "Quieto, observador atento", ru: "Тихий, внимательный наблюдатель", it: "Silenzioso, osservatore attento", ar: "هادئ، مراقب يقظ" },
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

const GAME: Record<string, L> = {
  Werewolf:       { zh: "狼人杀", ja: "人狼", ko: "늑대인간", de: "Werwolf", fr: "Loup-garou", es: "Hombre Lobo", pt: "Lobisomem", ru: "Оборотень", it: "Lupo Mannaro", ar: "المستذئب" },
  Mafia:          { zh: "黑手党", ja: "マフィア", ko: "마피아", de: "Mafia", fr: "Mafia", es: "Mafia", pt: "Máfia", ru: "Мафия", it: "Mafia", ar: "المافيا" },
  "Who's the Spy": { zh: "谁是卧底", ja: "スパイは誰だ", ko: "스파이는 누구", de: "Wer ist der Spion", fr: "Qui est l'espion", es: "¿Quién es el espía?", pt: "Quem é o espião", ru: "Кто шпион", it: "Chi è la spia", ar: "من هو الجاسوس" },
  Mystery:        { zh: "谜案", ja: "ミステリー", ko: "미스터리", de: "Krimi", fr: "Mystère", es: "Misterio", pt: "Mistério", ru: "Детектив", it: "Mistero", ar: "لغز" },
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

const FEATURES_I18N: Record<string, FeatureOverlay[]> = {
  zh: [
    { title: "AI主持全场", description: "角色分配、阶段推进、投票、揭示——主持人让游戏流畅进行，无需任何人手动管理。" },
    { title: "永远不缺玩家", description: "独自玩、和朋友玩，或混合搭配。AI角色自动填满每个空位。" },
    { title: "AI角色真正在玩", description: "他们会虚张声势、指控他人、为自己辩护，反应就像真人玩家——不是沉默的机器人。" },
    { title: "轻松和朋友开始", description: "分享链接，几分钟内开始。无需下载，无需设置，不用等人凑齐。" },
  ],
  ja: [
    { title: "AIがゲームを運営", description: "役職、フェーズ、投票、公開——ホストがゲームを進行するので、誰も司会を務める必要がありません。" },
    { title: "いつでも十分なプレイヤー", description: "ソロでも友達とでもミックスでも。AIキャラが空席を自動で埋めます。" },
    { title: "AIキャラが本当にプレイ", description: "ブラフをかけ、告発し、自分を守り、本物のプレイヤーのように反応します——黙ったダミーではありません。" },
    { title: "友達と簡単に始められる", description: "リンクを共有して数分で開始。ダウンロード不要、セットアップ不要、フルメンバーを待つ必要なし。" },
  ],
  ko: [
    { title: "AI가 게임을 진행", description: "역할, 단계, 투표, 공개 — 호스트가 게임을 진행하므로 아무도 중재할 필요가 없습니다." },
    { title: "항상 충분한 플레이어", description: "혼자, 친구와, 또는 둘을 섞어서 플레이하세요. AI 캐릭터가 빈자리를 자동으로 채웁니다." },
    { title: "AI 캐릭터가 실제로 플레이", description: "허세를 부리고, 고발하고, 자신을 방어하며, 진짜 플레이어처럼 반응합니다 — 조용한 봇이 아닙니다." },
    { title: "친구와 쉽게 시작", description: "링크를 공유하고 몇 분 안에 시작하세요. 다운로드 없이, 설정 없이, 인원을 모을 필요 없이." },
  ],
  de: [
    { title: "KI leitet das Spiel", description: "Rollen, Phasen, Abstimmungen, Enthüllungen — der Host hält das Spiel am Laufen, ohne dass jemand moderieren muss." },
    { title: "Immer genug Spieler", description: "Spiele allein, mit Freunden oder gemischt. KI-Charaktere füllen automatisch jeden freien Platz." },
    { title: "KI-Charaktere spielen wirklich", description: "Sie bluffen, beschuldigen, verteidigen sich und reagieren wie echte Spieler — keine stummen Lückenfüller." },
    { title: "Einfach mit Freunden starten", description: "Teile einen Link und starte in Minuten. Kein Download, kein Setup, kein Warten auf eine volle Gruppe." },
  ],
  fr: [
    { title: "L'IA mène le jeu", description: "Rôles, phases, votes, révélations — l'hôte fait avancer le jeu pour que personne n'ait à modérer." },
    { title: "Toujours assez de joueurs", description: "Jouez seul, avec des amis ou les deux. Les personnages IA remplissent chaque place vide automatiquement." },
    { title: "Les personnages IA jouent vraiment", description: "Ils bluffent, accusent, se défendent et réagissent comme de vrais joueurs — pas des bots silencieux." },
    { title: "Facile à jouer entre amis", description: "Partagez un lien et commencez en quelques minutes. Pas de téléchargement, pas de configuration, pas besoin d'attendre un groupe complet." },
  ],
  es: [
    { title: "La IA dirige la mesa", description: "Roles, fases, votos, revelaciones — el anfitrión mantiene el juego en movimiento para que nadie tenga que moderar." },
    { title: "Siempre suficientes jugadores", description: "Juega solo, con amigos o una mezcla. Los personajes IA llenan cada asiento vacío automáticamente." },
    { title: "Los personajes IA realmente juegan", description: "Hacen faroles, acusan, se defienden y reaccionan como jugadores reales — no son bots silenciosos." },
    { title: "Fácil de empezar con amigos", description: "Comparte un enlace y empieza en minutos. Sin descargas, sin configuración, sin esperar a un grupo completo." },
  ],
  pt: [
    { title: "A IA comanda a mesa", description: "Papéis, fases, votos, revelações — o anfitrião mantém o jogo fluindo para que ninguém precise moderar." },
    { title: "Sempre jogadores suficientes", description: "Jogue sozinho, com amigos ou misto. Personagens IA preenchem cada assento vazio automaticamente." },
    { title: "Personagens IA realmente jogam", description: "Blefam, acusam, se defendem e reagem como jogadores reais — não são bots silenciosos." },
    { title: "Fácil de começar com amigos", description: "Compartilhe um link e comece em minutos. Sem download, sem configuração, sem esperar pelo grupo completo." },
  ],
  ru: [
    { title: "ИИ ведёт игру", description: "Роли, фазы, голосования, раскрытия — ведущий поддерживает ход игры, никто не должен модерировать." },
    { title: "Всегда достаточно игроков", description: "Играйте соло, с друзьями или вместе. ИИ-персонажи автоматически заполняют каждое свободное место." },
    { title: "ИИ-персонажи действительно играют", description: "Они блефуют, обвиняют, защищаются и реагируют как настоящие игроки — не молчаливые боты." },
    { title: "Легко начать с друзьями", description: "Поделитесь ссылкой и начните за минуты. Без скачивания, без настройки, без ожидания полной группы." },
  ],
  it: [
    { title: "L'IA gestisce il tavolo", description: "Ruoli, fasi, voti, rivelazioni — l'host tiene il gioco in movimento così nessuno deve fare da moderatore." },
    { title: "Sempre abbastanza giocatori", description: "Gioca da solo, con amici o entrambi. I personaggi IA riempiono ogni posto vuoto automaticamente." },
    { title: "I personaggi IA giocano davvero", description: "Bluffano, accusano, si difendono e reagiscono come giocatori veri — non bot silenziosi." },
    { title: "Facile iniziare con gli amici", description: "Condividi un link e inizia in pochi minuti. Nessun download, nessuna configurazione, nessuna attesa." },
  ],
  ar: [
    { title: "الذكاء الاصطناعي يدير اللعبة", description: "الأدوار، المراحل، التصويت، الكشف — المضيف يحافظ على سير اللعبة فلا يحتاج أحد للإدارة." },
    { title: "لاعبون كافون دائماً", description: "العب وحدك أو مع أصدقائك أو مزيج من الاثنين. شخصيات الذكاء الاصطناعي تملأ كل مقعد فارغ تلقائياً." },
    { title: "شخصيات الذكاء الاصطناعي تلعب فعلاً", description: "يخادعون ويتّهمون ويدافعون عن أنفسهم ويتفاعلون كلاعبين حقيقيين — ليسوا روبوتات صامتة." },
    { title: "سهل البدء مع الأصدقاء", description: "شارك رابطاً وابدأ في دقائق. بدون تحميل، بدون إعداد، بدون انتظار مجموعة كاملة." },
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

const FAQ_I18N: Record<string, FAQItem[]> = {
  zh: [
    { question: "如何创建游戏？", answer: "用Google登录，然后在探索页面浏览模板——选一个像狼人杀、谁是卧底或黑手党这样的游戏。点击模板，几秒钟内就能进入游戏房间。AI玩家会自动加入。无需任何设置或编程。" },
    { question: "什么是游戏主持人，它是如何工作的？", answer: "游戏主持人是一个AI主持，负责运行你的游戏：解释规则、推进白天/黑夜或讨论阶段，保持游戏流畅。你还可以添加AI玩家，这样即使独自玩也能坐满房间。主持人和玩家使用自然对话，让你感觉像真正的桌游聚会。" },
    { question: "可以和朋友一起玩吗？", answer: "当然可以！从游戏房间分享邀请链接——朋友们可以在浏览器中即时加入，无需创建账号。他们以访客身份与你的AI角色一起游戏。同一局游戏中可以任意混搭真人和AI玩家。" },
    { question: "有哪些模板或游戏类型？", answer: "我们提供10+模板，包括狼人杀（社交推理）、谁是卧底（文字游戏）、黑手党、谋杀之谜、秘密希特勒和塔罗占卜。在探索页面一键开始。你也可以通过向游戏主持人描述自己的规则和角色来创建完全自定义的游戏。" },
    { question: "需要登录吗？是免费的吗？", answer: "用Google登录来创建游戏——只需几秒钟。新账号会获得免费初始额度，让你立即体验平台。加入你游戏的朋友完全不需要注册账号。" },
    { question: "可以创建任何类型的游戏吗？", answer: "完全可以！虽然我们提供10+热门游戏模板，但你有完全的自由来设计具有独特规则、角色和胜利条件的自定义游戏。只需用自然语言向游戏主持人描述你的想法。" },
    { question: "费用是多少？", answer: "新账号自带免费额度。之后，你可以根据需要购买额外额度——定价透明，基于实际使用量。没有订阅费或隐藏费用。" },
  ],
  ja: [
    { question: "ゲームの作り方は？", answer: "Googleでログインし、ディスカバーでテンプレートを閲覧——人狼、スパイは誰だ、マフィアなどのゲームを選びます。テンプレートをクリックすれば数秒でゲームルームに入れます。AIプレイヤーは自動で追加されます。セットアップやプログラミングは不要です。" },
    { question: "ゲームマスターとは何ですか？", answer: "ゲームマスターはAIホストで、ゲームの進行を担当します：ルールの説明、昼夜フェーズや議論の進行、ゲームの流れの維持を行います。AIプレイヤーを追加すれば、一人でもルームが埋まります。ホストとプレイヤーは自然な対話を使うので、本物のテーブルトップセッションのように感じられます。" },
    { question: "友達と一緒にプレイできますか？", answer: "もちろん！ゲームルームから招待リンクを共有すれば、友達はブラウザで即座に参加できます。アカウント作成は不要です。AIキャラクターと一緒にゲストとしてプレイできます。同じゲームに人間とAIプレイヤーを自由に混ぜられます。" },
    { question: "どんなテンプレートがありますか？", answer: "10以上のテンプレートを用意しています：人狼（社会的推理）、スパイは誰だ（ワードゲーム）、マフィア、殺人ミステリー、シークレットヒトラー、タロット占いなど。ディスカバーでワンクリックスタート。ゲームマスターに自分のルールや役割を説明して、完全カスタムゲームも作れます。" },
    { question: "サインインは必要ですか？無料ですか？", answer: "ゲーム作成にはGoogleログインが必要です——数秒で完了。新規アカウントには無料の初期クレジットが付与され、すぐにプラットフォームを試せます。あなたのゲームに参加する友達はアカウント不要です。" },
    { question: "どんな種類のゲームでも作れますか？", answer: "もちろん！10以上の人気ゲームテンプレートを提供していますが、独自のルール、役割、勝利条件を持つカスタムゲームを完全に自由に設計できます。アイデアをゲームマスターに自然な言葉で説明するだけです。" },
    { question: "いくらかかりますか？", answer: "新規アカウントには無料クレジットが付きます。その後、必要に応じて追加クレジットを購入できます——料金は透明で、実際の使用量に基づきます。サブスクリプションや隠れた手数料はありません。" },
  ],
  ko: [
    { question: "게임은 어떻게 만드나요?", answer: "Google로 로그인한 후 탐색 페이지에서 템플릿을 둘러보세요 — 늑대인간, 스파이는 누구, 마피아 같은 게임을 선택하세요. 템플릿을 클릭하면 몇 초 안에 게임 방에 입장합니다. AI 플레이어가 자동으로 추가됩니다. 설정이나 코딩이 필요 없습니다." },
    { question: "게임 마스터란 무엇인가요?", answer: "게임 마스터는 AI 진행자로, 게임을 운영합니다: 규칙 설명, 낮/밤 또는 토론 단계 진행, 게임 흐름 유지를 담당합니다. AI 플레이어를 추가하면 혼자서도 방을 가득 채울 수 있습니다. 진행자와 플레이어가 자연스러운 대화를 사용하므로 실제 보드게임 세션 같은 느낌입니다." },
    { question: "친구와 함께 플레이할 수 있나요?", answer: "물론이죠! 게임 방에서 초대 링크를 공유하면 친구들이 브라우저에서 즉시 참여할 수 있습니다. 계정을 만들 필요가 없습니다. AI 캐릭터와 함께 게스트로 플레이합니다. 같은 게임에서 사람과 AI 플레이어를 자유롭게 섞을 수 있습니다." },
    { question: "어떤 템플릿이나 게임 유형이 있나요?", answer: "10개 이상의 템플릿을 제공합니다: 늑대인간(사회적 추리), 스파이는 누구(단어 게임), 마피아, 살인 미스터리, 시크릿 히틀러, 타로 점술 등. 탐색 페이지에서 원클릭으로 시작하세요. 게임 마스터에게 자신만의 규칙과 역할을 설명하여 완전 맞춤 게임도 만들 수 있습니다." },
    { question: "로그인이 필요한가요? 무료인가요?", answer: "게임 생성을 위해 Google 로그인이 필요합니다 — 몇 초면 됩니다. 신규 계정에는 무료 시작 크레딧이 제공되어 바로 플랫폼을 체험할 수 있습니다. 게임에 참여하는 친구들은 계정이 전혀 필요 없습니다." },
    { question: "어떤 유형의 게임이든 만들 수 있나요?", answer: "물론이죠! 10개 이상의 인기 게임 템플릿을 제공하지만, 고유한 규칙, 역할, 승리 조건을 가진 커스텀 게임을 완전히 자유롭게 디자인할 수 있습니다. 자연어로 게임 마스터에게 아이디어를 설명하기만 하면 됩니다." },
    { question: "비용은 얼마인가요?", answer: "신규 계정에는 무료 크레딧이 제공됩니다. 이후 필요에 따라 추가 크레딧을 구매할 수 있습니다 — 가격은 투명하며 실제 사용량에 기반합니다. 구독료나 숨겨진 비용은 없습니다." },
  ],
  de: [
    { question: "Wie erstelle ich ein Spiel?", answer: "Melde dich mit Google an und durchsuche die Vorlagen unter Entdecken — wähle ein Spiel wie Werwolf, Wer ist der Spion oder Mafia. Klicke auf die Vorlage und du bist innerhalb von Sekunden im Spielraum. KI-Spieler werden automatisch hinzugefügt. Kein Setup oder Programmieren nötig." },
    { question: "Was ist der Game Master?", answer: "Der Game Master ist ein KI-Host, der dein Spiel leitet: Er erklärt Regeln, führt Tag-/Nacht- oder Diskussionsphasen durch und hält den Spielfluss aufrecht. Du kannst auch KI-Spieler hinzufügen, damit der Raum auch beim Alleinspiel gefüllt ist. Host und Spieler nutzen natürliche Dialoge, sodass es sich wie eine echte Tabletop-Session anfühlt." },
    { question: "Kann ich mit Freunden spielen?", answer: "Ja! Teile einen Einladungslink aus deinem Spielraum — Freunde können sofort in ihrem Browser beitreten, ohne ein Konto zu erstellen. Sie spielen als Gäste neben deinen KI-Charakteren. Du kannst jede Mischung aus menschlichen und KI-Spielern im selben Spiel haben." },
    { question: "Welche Vorlagen gibt es?", answer: "Wir bieten 10+ Vorlagen: Werwolf (soziale Deduktion), Wer ist der Spion (Wortspiel), Mafia, Mordmysterium, Secret Hitler und Tarot-Lesung. Starte sie mit einem Klick unter Entdecken. Du kannst auch ein komplett eigenes Spiel erstellen, indem du dem Game Master deine Regeln und Rollen beschreibst." },
    { question: "Muss ich mich anmelden? Ist es kostenlos?", answer: "Zum Erstellen von Spielen meldest du dich mit Google an — das dauert nur Sekunden. Neue Konten erhalten kostenlose Startguthaben, damit du die Plattform sofort ausprobieren kannst. Freunde, die deinem Spiel beitreten, brauchen kein Konto." },
    { question: "Kann ich jede Art von Spiel erstellen?", answer: "Absolut! Wir bieten zwar 10+ Vorlagen für beliebte Spiele, aber du hast völlige Freiheit, eigene Spiele mit einzigartigen Regeln, Rollen und Siegbedingungen zu entwerfen. Beschreibe deine Idee einfach in natürlicher Sprache dem Game Master." },
    { question: "Was kostet es?", answer: "Neue Konten starten mit kostenlosen Guthaben. Danach kannst du bei Bedarf zusätzliche Guthaben kaufen — die Preise sind transparent und basieren auf der tatsächlichen Nutzung. Keine Abonnements oder versteckten Gebühren." },
  ],
  fr: [
    { question: "Comment créer un jeu ?", answer: "Connectez-vous avec Google, puis parcourez les modèles dans Découvrir — choisissez un jeu comme Loup-garou, Qui est l'espion ou Mafia. Cliquez sur le modèle et vous êtes dans un salon de jeu en quelques secondes. Les joueurs IA sont ajoutés automatiquement. Aucune configuration ni programmation nécessaire." },
    { question: "Qu'est-ce que le Game Master ?", answer: "Le Game Master est un hôte IA qui gère votre jeu : il explique les règles, gère les phases jour/nuit ou de discussion, et maintient le rythme. Vous pouvez aussi ajouter des joueurs IA pour remplir la salle même en jouant seul. L'hôte et les joueurs utilisent un dialogue naturel pour que ça ressemble à une vraie session de jeu de société." },
    { question: "Puis-je jouer avec des amis ?", answer: "Bien sûr ! Partagez un lien d'invitation depuis votre salon — vos amis peuvent rejoindre instantanément dans leur navigateur sans créer de compte. Ils jouent en tant qu'invités aux côtés de vos personnages IA. Vous pouvez avoir n'importe quel mélange de joueurs humains et IA." },
    { question: "Quels modèles sont disponibles ?", answer: "Nous proposons plus de 10 modèles : Loup-garou (déduction sociale), Qui est l'espion (jeu de mots), Mafia, Mystère du meurtre, Secret Hitler et Tarot. Lancez-les en un clic dans Découvrir. Vous pouvez aussi créer un jeu entièrement personnalisé en décrivant vos règles et rôles au Game Master." },
    { question: "Dois-je me connecter ? Est-ce gratuit ?", answer: "Connectez-vous avec Google pour créer des jeux — ça ne prend que quelques secondes. Les nouveaux comptes reçoivent des crédits gratuits pour essayer la plateforme immédiatement. Les amis qui rejoignent votre jeu n'ont pas besoin de compte." },
    { question: "Puis-je créer n'importe quel type de jeu ?", answer: "Absolument ! Bien que nous proposions plus de 10 modèles, vous avez une liberté totale pour concevoir des jeux personnalisés avec des règles, rôles et conditions de victoire uniques. Décrivez simplement votre idée au Game Master en langage naturel." },
    { question: "Combien ça coûte ?", answer: "Les nouveaux comptes démarrent avec des crédits gratuits. Ensuite, vous pouvez acheter des crédits supplémentaires selon vos besoins — les tarifs sont transparents et basés sur l'utilisation réelle. Pas d'abonnement ni de frais cachés." },
  ],
  es: [
    { question: "¿Cómo creo un juego?", answer: "Inicia sesión con Google y explora las plantillas en Descubrir — elige un juego como Hombre Lobo, ¿Quién es el espía? o Mafia. Haz clic en la plantilla y estarás en una sala de juego en segundos. Los jugadores IA se añaden automáticamente. Sin configuración ni programación." },
    { question: "¿Qué es el Game Master?", answer: "El Game Master es un anfitrión IA que dirige tu juego: explica las reglas, gestiona las fases de día/noche o discusión, y mantiene el flujo del juego. También puedes añadir jugadores IA para llenar la sala aunque juegues solo. El anfitrión y los jugadores usan diálogo natural para que se sienta como una verdadera sesión de mesa." },
    { question: "¿Puedo jugar con amigos?", answer: "¡Sí! Comparte un enlace de invitación desde tu sala de juego — tus amigos pueden unirse al instante desde su navegador sin crear una cuenta. Juegan como invitados junto a tus personajes IA. Puedes tener cualquier combinación de jugadores humanos e IA en el mismo juego." },
    { question: "¿Qué plantillas hay disponibles?", answer: "Ofrecemos más de 10 plantillas: Hombre Lobo (deducción social), ¿Quién es el espía? (juego de palabras), Mafia, Misterio de asesinato, Secret Hitler y Lectura de Tarot. Inícielos con un clic en Descubrir. También puedes crear un juego completamente personalizado describiendo tus propias reglas y roles al Game Master." },
    { question: "¿Necesito iniciar sesión? ¿Es gratis?", answer: "Inicia sesión con Google para crear juegos — solo toma unos segundos. Las cuentas nuevas reciben créditos gratuitos iniciales para probar la plataforma de inmediato. Los amigos que se unan a tu juego no necesitan cuenta." },
    { question: "¿Puedo crear cualquier tipo de juego?", answer: "¡Absolutamente! Aunque ofrecemos más de 10 plantillas para juegos populares, tienes total libertad para diseñar juegos personalizados con reglas, roles y condiciones de victoria únicas. Solo describe tu idea al Game Master en lenguaje natural." },
    { question: "¿Cuánto cuesta?", answer: "Las cuentas nuevas comienzan con créditos gratuitos. Después, puedes comprar créditos adicionales según necesites — los precios son transparentes y basados en el uso real. Sin suscripciones ni tarifas ocultas." },
  ],
  pt: [
    { question: "Como criar um jogo?", answer: "Faça login com Google e navegue pelos modelos em Descobrir — escolha um jogo como Lobisomem, Quem é o Espião ou Máfia. Clique no modelo e entre numa sala de jogo em segundos. Jogadores IA são adicionados automaticamente. Sem configuração ou programação." },
    { question: "O que é o Game Master?", answer: "O Game Master é um anfitrião IA que gerencia seu jogo: explica regras, conduz fases de dia/noite ou discussão, e mantém o fluxo do jogo. Você também pode adicionar jogadores IA para preencher a sala mesmo jogando sozinho. O anfitrião e os jogadores usam diálogo natural, fazendo parecer uma sessão de jogo de mesa real." },
    { question: "Posso jogar com amigos?", answer: "Sim! Compartilhe um link de convite da sua sala de jogo — amigos podem entrar instantaneamente pelo navegador sem criar uma conta. Eles jogam como convidados ao lado dos seus personagens IA. Você pode ter qualquer mistura de jogadores humanos e IA no mesmo jogo." },
    { question: "Quais modelos estão disponíveis?", answer: "Oferecemos mais de 10 modelos: Lobisomem (dedução social), Quem é o Espião (jogo de palavras), Máfia, Mistério de Assassinato, Secret Hitler e Leitura de Tarot. Inicie com um clique em Descobrir. Você também pode criar um jogo totalmente personalizado descrevendo suas próprias regras e papéis ao Game Master." },
    { question: "Preciso fazer login? É gratuito?", answer: "Faça login com Google para criar jogos — leva apenas segundos. Novas contas recebem créditos iniciais gratuitos para experimentar a plataforma imediatamente. Amigos que entram no seu jogo não precisam de conta." },
    { question: "Posso criar qualquer tipo de jogo?", answer: "Com certeza! Embora ofereçamos mais de 10 modelos para jogos populares, você tem total liberdade para criar jogos personalizados com regras, papéis e condições de vitória únicos. Basta descrever sua ideia ao Game Master em linguagem natural." },
    { question: "Quanto custa?", answer: "Novas contas começam com créditos gratuitos. Depois, você pode comprar créditos adicionais conforme necessário — os preços são transparentes e baseados no uso real. Sem assinaturas ou taxas ocultas." },
  ],
  ru: [
    { question: "Как создать игру?", answer: "Войдите через Google, затем просмотрите шаблоны в разделе «Обзор» — выберите игру вроде Оборотня, Кто шпион или Мафии. Нажмите на шаблон — и через секунды вы в игровой комнате. ИИ-игроки добавляются автоматически. Никакой настройки или программирования." },
    { question: "Что такое Мастер Игры?", answer: "Мастер Игры — это ИИ-ведущий, управляющий вашей игрой: он объясняет правила, ведёт дневные/ночные фазы или обсуждения и поддерживает темп игры. Можно добавить ИИ-игроков, чтобы заполнить комнату даже при одиночной игре. Ведущий и игроки используют естественный диалог — ощущение как от настоящей настольной сессии." },
    { question: "Можно играть с друзьями?", answer: "Конечно! Поделитесь ссылкой-приглашением из игровой комнаты — друзья могут мгновенно присоединиться в браузере без создания аккаунта. Они играют как гости вместе с вашими ИИ-персонажами. В одной игре можно смешивать людей и ИИ-игроков как угодно." },
    { question: "Какие шаблоны доступны?", answer: "Более 10 шаблонов: Оборотень (социальная дедукция), Кто шпион (словесная игра), Мафия, Тайна убийства, Секретный Гитлер и Гадание на Таро. Запускайте одним кликом в разделе «Обзор». Также можно создать полностью свою игру, описав правила и роли Мастеру Игры." },
    { question: "Нужно ли входить? Это бесплатно?", answer: "Для создания игр войдите через Google — это занимает секунды. Новые аккаунты получают бесплатные начальные кредиты, чтобы сразу попробовать платформу. Друзьям, которые присоединяются к вашей игре, аккаунт не нужен." },
    { question: "Можно создать любой тип игры?", answer: "Конечно! Хотя мы предлагаем 10+ шаблонов популярных игр, у вас полная свобода для создания пользовательских игр с уникальными правилами, ролями и условиями победы. Просто опишите идею Мастеру Игры на естественном языке." },
    { question: "Сколько это стоит?", answer: "Новые аккаунты начинают с бесплатных кредитов. Затем можно покупать дополнительные кредиты по мере необходимости — цены прозрачные, основаны на реальном использовании. Никаких подписок или скрытых сборов." },
  ],
  it: [
    { question: "Come creo un gioco?", answer: "Accedi con Google, poi sfoglia i modelli su Scopri — scegli un gioco come Lupo Mannaro, Chi è la Spia o Mafia. Clicca sul modello e sei in una stanza di gioco in pochi secondi. I giocatori IA vengono aggiunti automaticamente. Nessuna configurazione o programmazione necessaria." },
    { question: "Cos'è il Game Master?", answer: "Il Game Master è un host IA che gestisce il tuo gioco: spiega le regole, conduce le fasi giorno/notte o di discussione, e mantiene il ritmo. Puoi anche aggiungere giocatori IA per riempire la stanza anche giocando da solo. L'host e i giocatori usano un dialogo naturale, così sembra una vera sessione da tavolo." },
    { question: "Posso giocare con gli amici?", answer: "Certo! Condividi un link di invito dalla tua stanza di gioco — gli amici possono unirsi istantaneamente nel browser senza creare un account. Giocano come ospiti accanto ai tuoi personaggi IA. Puoi avere qualsiasi mix di giocatori umani e IA nella stessa partita." },
    { question: "Quali modelli sono disponibili?", answer: "Offriamo più di 10 modelli: Lupo Mannaro (deduzione sociale), Chi è la Spia (gioco di parole), Mafia, Mistero dell'Omicidio, Secret Hitler e Lettura dei Tarocchi. Avviali con un clic su Scopri. Puoi anche creare un gioco completamente personalizzato descrivendo le tue regole e ruoli al Game Master." },
    { question: "Devo accedere? È gratuito?", answer: "Accedi con Google per creare giochi — ci vogliono solo pochi secondi. I nuovi account ricevono crediti gratuiti iniziali per provare subito la piattaforma. Gli amici che si uniscono al tuo gioco non hanno bisogno di un account." },
    { question: "Posso creare qualsiasi tipo di gioco?", answer: "Assolutamente! Sebbene offriamo più di 10 modelli, hai completa libertà di progettare giochi personalizzati con regole, ruoli e condizioni di vittoria unici. Basta descrivere la tua idea al Game Master in linguaggio naturale." },
    { question: "Quanto costa?", answer: "I nuovi account iniziano con crediti gratuiti. Poi puoi acquistare crediti aggiuntivi secondo necessità — i prezzi sono trasparenti e basati sull'uso effettivo. Nessun abbonamento o costo nascosto." },
  ],
  ar: [
    { question: "كيف أنشئ لعبة؟", answer: "سجّل الدخول بحساب Google، ثم تصفّح القوالب في صفحة الاستكشاف — اختر لعبة مثل المستذئب أو من هو الجاسوس أو المافيا. انقر على القالب وستكون في غرفة اللعب خلال ثوانٍ. يُضاف لاعبو الذكاء الاصطناعي تلقائياً. لا حاجة لأي إعداد أو برمجة." },
    { question: "ما هو مدير اللعبة؟", answer: "مدير اللعبة هو مضيف ذكاء اصطناعي يدير لعبتك: يشرح القواعد، ويدير مراحل الليل/النهار أو النقاش، ويحافظ على انسيابية اللعب. يمكنك أيضاً إضافة لاعبي ذكاء اصطناعي لملء الغرفة حتى عند اللعب وحدك. يستخدم المضيف واللاعبون حواراً طبيعياً ليبدو الأمر كجلسة ألعاب طاولة حقيقية." },
    { question: "هل يمكنني اللعب مع الأصدقاء؟", answer: "بالطبع! شارك رابط دعوة من غرفة اللعب — يمكن لأصدقائك الانضمام فوراً من متصفحهم دون إنشاء حساب. يلعبون كضيوف بجانب شخصيات الذكاء الاصطناعي. يمكنك مزج أي عدد من اللاعبين البشريين والذكاء الاصطناعي في نفس اللعبة." },
    { question: "ما القوالب المتاحة؟", answer: "نوفر أكثر من 10 قوالب: المستذئب (استنتاج اجتماعي)، من هو الجاسوس (لعبة كلمات)، المافيا، لغز الجريمة، هتلر السري وقراءة التاروت. ابدأها بنقرة واحدة في صفحة الاستكشاف. يمكنك أيضاً إنشاء لعبة مخصصة بالكامل بوصف قواعدك وأدوارك لمدير اللعبة." },
    { question: "هل يجب تسجيل الدخول؟ هل هو مجاني؟", answer: "سجّل الدخول بحساب Google لإنشاء الألعاب — لا يستغرق سوى ثوانٍ. تحصل الحسابات الجديدة على رصيد مجاني للبدء لتجربة المنصة فوراً. الأصدقاء الذين ينضمون إلى لعبتك لا يحتاجون لإنشاء حساب." },
    { question: "هل يمكنني إنشاء أي نوع من الألعاب؟", answer: "بالتأكيد! على الرغم من أننا نقدم أكثر من 10 قوالب لألعاب شائعة، لديك الحرية الكاملة لتصميم ألعاب مخصصة بقواعد وأدوار وشروط فوز فريدة. فقط صِف فكرتك لمدير اللعبة بلغة طبيعية." },
    { question: "كم تكلفتها؟", answer: "تبدأ الحسابات الجديدة برصيد مجاني. بعد ذلك، يمكنك شراء رصيد إضافي حسب الحاجة — التسعير شفاف ويعتمد على الاستخدام الفعلي. لا اشتراكات أو رسوم خفية." },
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

const STEPS_I18N: Record<string, StepOverlay[]> = {
  zh: [
    { title: "与GM设计", heading: "向GM描述你的游戏创意", description: "用自然语言和游戏主持人聊天。描述你想要的——无论是经典狼人杀还是你最疯狂的自定义创意。GM会帮你设计规则、角色和胜利条件。", messages: ["我们来做一个狼人杀游戏，但设定在太空站。船员们要找出一个破坏者。", "明白了——太空站叛徒游戏。多少名玩家？需要特殊角色吗？工程师、安全主管之类的？", "总共6人，1个叛徒。加一个能扫描系统的工程师。", "搞定。我会私下分配角色，准备好了就开始。"] },
    { title: "AI主持", heading: "AI主持人掌控全局", description: "AI主持人管理一切——分配秘密角色、宣布游戏阶段、追踪投票、在合适的时机揭示信息，并推动故事发展。你只需要专注于游戏。", messages: ["夜幕降临火星站。所有人闭眼……叛徒，选择你的破坏目标。", "早安。通信阵列已瘫痪。工程师Nova，你可以检查一个系统。", "投票时间。讨论你认为谁是叛徒——3分钟后淘汰。"] },
    { title: "AI玩家", heading: "AI玩家会思考和反应", description: "每个AI玩家都有自己的个性、角色和目标。他们观察发生的事情，形成观点，做出战略决策，并对你的行动做出自然反应。他们会撒谎、为自己辩护或结盟——就像真人玩家一样。", messages: ["我昨晚一直在医疗舱。有人能作证吗？我开始怀疑当时在通信阵列附近的人了……", "Dr. Chen表现得很防备——这是个危险信号！我看到她在破坏发生前后离开了工程甲板。", "等一下——我对通信阵列做了系统检查。损坏模式表明是具有医学知识的人所为。这缩小了范围。"] },
    { title: "你来玩", heading: "你扮演角色——AI做出反应", description: "以你的角色身份输入任何内容。指控、辩护、投票，或保持沉默。主持人和AI玩家会对你说的话做出反应，并实时调整游戏。", messages: ["我昨晚使用了预言家能力。Gideon是狼人——我确定。", "胡说。预言家绝不会这么早暴露自己。你是在绝望中乱指。", "村庄已经投票。Gideon Hale被淘汰——他的角色揭示为：狼人。村庄存活了。"] },
  ],
  ja: [
    { title: "GMと設計", heading: "GMにゲームのアイデアを伝えよう", description: "ゲームマスターと自然な言葉でチャットするだけ。クラシックな人狼でも最も奇抜なカスタムアイデアでも、やりたいことを説明してください。GMがルール、役割、勝利条件の設計を手伝います。", messages: ["人狼ゲームをやろう。でも舞台は宇宙ステーション。クルーが破壊工作員を見つけるんだ。", "了解——宇宙ステーションの裏切り者ゲームだね。何人でプレイする？特殊な役割は欲しい？エンジニア、セキュリティチーフとか。", "合計6人、裏切り者1人。システムをスキャンできるエンジニアを追加して。", "できた。役割は秘密裏に割り当てる。準備ができたら始めよう。"] },
    { title: "AIホスト", heading: "AIホストがショーを仕切る", description: "ホストAIがすべてを管理します——秘密の役割の割り当て、ゲームフェーズの発表、投票の追跡、適切なタイミングでの情報公開、ストーリーの進行。あなたはプレイに集中するだけです。", messages: ["火星ステーションに夜が訪れた。全員目を閉じろ……裏切り者よ、破壊工作のターゲットを選べ。", "おはよう。通信アレイがダウンした。エンジニアNova、システムを1つ調査できる。", "投票の時間だ。誰が裏切り者か議論しろ——3分後に追放する。"] },
    { title: "AIプレイヤー", heading: "AIプレイヤーが考え、反応する", description: "各AIプレイヤーには独自の個性、役割、目標があります。起きたことを観察し、意見を形成し、戦略的な判断を下し、あなたの行動に自然に反応します。嘘をつき、自分を守り、チームを組む——本物のプレイヤーのように。", messages: ["昨夜はずっと医療室にいました。誰か証明できる人は？通信アレイの近くにいた人が怪しいんですが…", "Dr. Chenは守りに入っている——それは危険信号だ！破壊工作の前後に工学デッキを離れるのを見た。", "待って——通信アレイのシステムチェックをした。損傷パターンから、医学知識を持つ人物の犯行と分かる。容疑者が絞られた。"] },
    { title: "あなたがプレイ", heading: "あなたが役を演じ——AIが反応する", description: "キャラクターとして何でも入力できます。告発、弁護、投票、沈黙——何でも。ホストとAIプレイヤーはあなたの発言に反応し、リアルタイムでゲームを適応させます。", messages: ["昨夜、予言者の能力を使った。Gideonは人狼だ——確実だ。", "嘘だ。予言者がこんなに早く正体を明かすはずがない。必死になって人を指さしているだけだ。", "村が投票した。Gideon Haleは追放——役職は人狼と判明。村は生き残った。"] },
  ],
  ko: [
    { title: "GM과 설계", heading: "GM에게 게임 아이디어를 말해보세요", description: "게임 마스터와 자연어로 채팅하세요. 원하는 것을 설명하면 됩니다 — 클래식 늑대인간이든 가장 독특한 커스텀 아이디어든. GM이 규칙, 역할, 승리 조건 설계를 도와줍니다.", messages: ["늑대인간 게임을 하되, 우주 정거장이 배경이에요. 승무원들이 파괴공작원을 찾는 거예요.", "알겠어요 — 우주 정거장 배신자 게임이군요. 몇 명이 플레이하나요? 특수 역할이 필요한가요? 엔지니어, 보안 책임자 같은?", "총 6명, 배신자 1명. 시스템을 스캔할 수 있는 엔지니어를 추가해주세요.", "완료. 역할은 비공개로 배정하겠습니다. 준비되면 시작해요."] },
    { title: "AI 호스트", heading: "AI 호스트가 진행을 맡습니다", description: "호스트 AI가 모든 것을 관리합니다 — 비밀 역할 배정, 게임 단계 발표, 투표 추적, 적절한 시점에 정보 공개, 스토리 진행. 당신은 플레이에만 집중하면 됩니다.", messages: ["화성 정거장에 밤이 찾아왔습니다. 모두 눈을 감으세요... 배신자여, 파괴 대상을 선택하세요.", "좋은 아침. 통신 배열이 다운되었습니다. 엔지니어 Nova, 시스템 하나를 점검할 수 있습니다.", "투표 시간입니다. 누가 배신자인지 토론하세요 — 3분 후 퇴출합니다."] },
    { title: "AI 플레이어", heading: "AI 플레이어가 생각하고 반응합니다", description: "각 AI 플레이어는 고유한 개성, 역할, 목표를 가지고 있습니다. 일어나는 일을 관찰하고, 의견을 형성하고, 전략적 결정을 내리며, 당신의 행동에 자연스럽게 반응합니다. 거짓말하고, 자신을 방어하고, 팀을 짜기도 합니다 — 진짜 플레이어처럼.", messages: ["어젯밤에 의료실에 계속 있었어요. 누가 확인해줄 수 있나요? 통신 배열 근처에 있던 사람이 의심됩니다...", "Dr. Chen이 방어적이에요 — 위험 신호입니다! 파괴 사건 전후로 공학 데크를 떠나는 걸 봤어요.", "잠깐요 — 통신 배열 시스템 점검을 했어요. 손상 패턴으로 보아 의학 지식을 가진 사람의 소행입니다. 범위가 좁혀졌어요."] },
    { title: "당신이 플레이", heading: "당신이 역할을 수행하면 — AI가 반응합니다", description: "캐릭터로서 무엇이든 입력하세요. 고발, 방어, 투표, 또는 침묵. 호스트와 AI 플레이어가 당신의 말에 반응하고 실시간으로 게임을 조정합니다.", messages: ["어젯밤 예언자 능력을 사용했습니다. Gideon이 늑대인간이에요 — 확실해요.", "거짓말이야. 예언자라면 이렇게 일찍 자신을 드러내지 않아. 필사적으로 남을 지목하는 거잖아.", "마을이 투표했습니다. Gideon Hale이 추방되었습니다 — 역할 공개: 늑대인간. 마을이 생존했습니다."] },
  ],
  de: [
    { title: "Mit GM designen", heading: "Erzähle dem GM deine Spielidee", description: "Chatte einfach in natürlicher Sprache mit dem Game Master. Beschreibe, was du willst — ob klassischer Werwolf oder deine wildeste eigene Idee. Der GM hilft dir bei Regeln, Rollen und Siegbedingungen.", messages: ["Lass uns ein Werwolf-Spiel machen, aber auf einer Raumstation. Die Crew sucht einen Saboteur.", "Verstanden — Raumstation-Verräter-Spiel. Wie viele Spieler, und willst du Spezialrollen? Ingenieur, Sicherheitschef, so was?", "Insgesamt 6, 1 Verräter. Füge einen Ingenieur hinzu, der Systeme scannen kann.", "Erledigt. Ich weise die Rollen privat zu und starte, wenn du bereit bist."] },
    { title: "Der Host", heading: "KI-Host leitet die Show", description: "Der Host-KI verwaltet alles — weist geheime Rollen zu, kündigt Spielphasen an, verfolgt Abstimmungen, enthüllt Informationen zum richtigen Zeitpunkt und hält die Geschichte am Laufen. Du konzentrierst dich einfach aufs Spielen.", messages: ["Nacht bricht über die Mars-Station herein. Alle schließen die Augen… Verräter, wähle dein Sabotageziel.", "Guten Morgen. Die Kommunikationsanlage ist ausgefallen. Ingenieur Nova, du darfst ein System überprüfen.", "Zeit für die Abstimmung. Diskutiert, wer der Verräter ist — in 3 Minuten wird eliminiert."] },
    { title: "KI-Spieler", heading: "KI-Spieler denken und reagieren", description: "Jeder KI-Spieler hat eine eigene Persönlichkeit, Rolle und Ziele. Sie beobachten, bilden sich Meinungen, treffen strategische Entscheidungen und reagieren natürlich auf deine Aktionen. Sie lügen, verteidigen sich oder verbünden sich — wie echte Spieler.", messages: ["Ich war die ganze Nacht in der Krankenstation. Kann das jemand bestätigen? Ich werde misstrauisch gegenüber dem, der in der Nähe der Kommunikationsanlage war…", "Dr. Chen wird defensiv — das ist ein Warnsignal! Ich habe sie das Ingenieursdeck verlassen sehen, genau zur Zeit der Sabotage.", "Moment — ich habe einen Systemcheck an der Kommunikationsanlage durchgeführt. Das Schadensmuster deutet auf jemanden mit medizinischem Wissen hin. Das grenzt es ein."] },
    { title: "Du spielst", heading: "Du spielst deine Rolle — die KI reagiert", description: "Tippe als dein Charakter alles ein. Beschuldige, verteidige, stimme ab oder schweige. Der Host und die KI-Spieler reagieren auf das, was du sagst, und passen das Spiel in Echtzeit an.", messages: ["Ich habe letzte Nacht meine Seher-Fähigkeit benutzt. Gideon ist ein Werwolf — ich bin sicher.", "Lügen. Der Seher würde sich niemals so früh offenbaren. Du zeigst verzweifelt mit dem Finger.", "Das Dorf hat abgestimmt. Gideon Hale wird eliminiert — seine Rolle: Werwolf. Das Dorf überlebt."] },
  ],
  fr: [
    { title: "Concevoir avec le GM", heading: "Décrivez votre idée au GM", description: "Chattez simplement avec le Game Master en langage naturel. Décrivez ce que vous voulez — que ce soit un Loup-garou classique ou votre idée la plus folle. Le GM vous aide à concevoir les règles, rôles et conditions de victoire.", messages: ["Faisons un jeu de Loup-garou mais dans une station spatiale. L'équipage doit trouver un saboteur.", "Compris — jeu de traître en station spatiale. Combien de joueurs, et voulez-vous des rôles spéciaux ? Ingénieur, Chef de sécurité, ce genre de chose ?", "6 au total, 1 traître. Ajoutez un Ingénieur qui peut scanner les systèmes.", "C'est fait. J'attribuerai les rôles en privé et on commence quand vous êtes prêt."] },
    { title: "L'Hôte", heading: "L'hôte IA dirige le spectacle", description: "L'IA hôte gère tout — attribue les rôles secrets, annonce les phases de jeu, suit les votes, révèle les informations au bon moment et fait avancer l'histoire. Vous n'avez qu'à vous concentrer sur le jeu.", messages: ["La nuit tombe sur la station Mars. Tout le monde ferme les yeux… Traître, choisis ta cible de sabotage.", "Bonjour. Le réseau de communication est hors service. Ingénieur Nova, vous pouvez inspecter un système.", "C'est l'heure du vote. Discutez de qui est le traître — élimination dans 3 minutes."] },
    { title: "Joueurs IA", heading: "Les joueurs IA réfléchissent et réagissent", description: "Chaque joueur IA a sa propre personnalité, son rôle et ses objectifs. Ils observent, forment des opinions, prennent des décisions stratégiques et réagissent naturellement à vos actions. Ils mentent, se défendent ou s'allient — comme de vrais joueurs.", messages: ["J'étais dans l'infirmerie toute la nuit. Quelqu'un peut confirmer ? Je commence à soupçonner celui qui était près du réseau de communication…", "Dr. Chen est sur la défensive — c'est un signal d'alarme ! Je l'ai vue quitter le pont d'ingénierie juste au moment du sabotage.", "Attendez — j'ai fait une vérification du système de communication. Le schéma de dommages suggère quelqu'un avec des connaissances médicales. Ça réduit les suspects."] },
    { title: "À vous de jouer", heading: "Vous jouez votre rôle — l'IA réagit", description: "Tapez n'importe quoi en tant que votre personnage. Accusez, défendez, votez ou gardez le silence. L'hôte et les joueurs IA répondent à vos paroles et adaptent le jeu en temps réel.", messages: ["J'ai utilisé mon pouvoir de Voyant cette nuit. Gideon est un Loup-garou — j'en suis certain.", "Mensonges. Le Voyant ne se dévoilerait jamais aussi tôt. Tu es désespéré et tu accuses au hasard.", "Le village a voté. Gideon Hale est éliminé — son rôle : Loup-garou. Le village survit."] },
  ],
  es: [
    { title: "Diseñar con el GM", heading: "Cuéntale tu idea al GM", description: "Solo chatea con el Game Master en lenguaje natural. Describe lo que quieres — ya sea un Hombre Lobo clásico o tu idea más alocada. El GM te ayuda a diseñar reglas, roles y condiciones de victoria.", messages: ["Hagamos un juego de Hombre Lobo pero en una estación espacial. La tripulación busca un saboteador.", "Entendido — juego de traidor en estación espacial. ¿Cuántos jugadores y quieres roles especiales? ¿Ingeniero, Jefe de Seguridad, cosas así?", "6 en total, 1 traidor. Añade un Ingeniero que pueda escanear sistemas.", "Hecho. Asignaré los roles en privado y empezamos cuando estés listo."] },
    { title: "El Anfitrión", heading: "El anfitrión IA dirige el show", description: "La IA anfitriona lo gestiona todo — asigna roles secretos, anuncia fases de juego, rastrea votos, revela información en el momento adecuado y mantiene la historia fluyendo. Tú solo concéntrate en jugar.", messages: ["La noche cae sobre la Estación Marte. Todos cierren los ojos… Traidor, elige tu objetivo de sabotaje.", "Buenos días. La red de comunicaciones ha caído. Ingeniero Nova, puedes inspeccionar un sistema.", "Hora de votar. Discutan quién creen que es el traidor — eliminación en 3 minutos."] },
    { title: "Jugadores IA", heading: "Los jugadores IA piensan y reaccionan", description: "Cada jugador IA tiene su propia personalidad, rol y objetivos. Observan lo que sucede, forman opiniones, toman decisiones estratégicas y responden naturalmente a tus acciones. Mienten, se defienden o se alían — como jugadores reales.", messages: ["Estuve en la enfermería toda la noche. ¿Alguien puede confirmarlo? Empiezo a sospechar de quien estaba cerca de la red de comunicaciones…", "Dr. Chen está a la defensiva — ¡eso es una señal de alarma! La vi salir de la cubierta de ingeniería justo en el momento del sabotaje.", "Esperen — hice una revisión del sistema de comunicaciones. El patrón de daño sugiere a alguien con conocimientos médicos. Eso reduce las opciones."] },
    { title: "Tú juegas", heading: "Tú interpretas tu rol — la IA reacciona", description: "Escribe cualquier cosa como tu personaje. Acusa, defiende, vota o guarda silencio. El anfitrión y los jugadores IA responden a lo que dices y adaptan el juego en tiempo real.", messages: ["Usé mi habilidad de Vidente anoche. Gideon es un Hombre Lobo — estoy seguro.", "Mentiras. El Vidente nunca se expondría tan pronto. Estás desesperado y señalando al azar.", "El pueblo ha votado. Gideon Hale es eliminado — su rol: Hombre Lobo. El pueblo sobrevive."] },
  ],
  pt: [
    { title: "Projetar com o GM", heading: "Conte sua ideia ao GM", description: "Basta conversar com o Game Master em linguagem natural. Descreva o que você quer — seja um Lobisomem clássico ou sua ideia mais criativa. O GM ajuda a projetar regras, papéis e condições de vitória.", messages: ["Vamos fazer um jogo de Lobisomem, mas numa estação espacial. A tripulação tenta encontrar um sabotador.", "Entendi — jogo de traidor na estação espacial. Quantos jogadores e quer papéis especiais? Engenheiro, Chefe de Segurança, esse tipo de coisa?", "6 no total, 1 traidor. Adicione um Engenheiro que possa escanear sistemas.", "Pronto. Vou atribuir os papéis em privado e começamos quando você estiver pronto."] },
    { title: "O Anfitrião", heading: "O anfitrião IA comanda o show", description: "A IA anfitriã gerencia tudo — atribui papéis secretos, anuncia fases do jogo, rastreia votos, revela informações no momento certo e mantém a história fluindo. Você só precisa focar em jogar.", messages: ["A noite cai sobre a Estação Marte. Todos fechem os olhos… Traidor, escolha seu alvo de sabotagem.", "Bom dia. A rede de comunicações caiu. Engenheiro Nova, você pode inspecionar um sistema.", "Hora de votar. Discutam quem acham que é o traidor — eliminação em 3 minutos."] },
    { title: "Jogadores IA", heading: "Jogadores IA pensam e reagem", description: "Cada jogador IA tem personalidade, papel e objetivos próprios. Eles observam o que acontece, formam opiniões, tomam decisões estratégicas e respondem naturalmente às suas ações. Mentem, se defendem ou se aliam — como jogadores reais.", messages: ["Estive na enfermaria a noite toda. Alguém pode confirmar? Estou ficando desconfiado de quem estava perto da rede de comunicações…", "Dr. Chen está na defensiva — isso é um sinal de alerta! Eu a vi saindo do convés de engenharia na hora da sabotagem.", "Esperem — fiz uma verificação no sistema de comunicações. O padrão de dano sugere alguém com conhecimento médico. Isso reduz os suspeitos."] },
    { title: "Você joga", heading: "Você interpreta seu papel — a IA reage", description: "Digite qualquer coisa como seu personagem. Acuse, defenda, vote ou fique em silêncio. O anfitrião e os jogadores IA respondem ao que você diz e adaptam o jogo em tempo real.", messages: ["Usei minha habilidade de Vidente ontem à noite. Gideon é um Lobisomem — tenho certeza.", "Mentiras. O Vidente nunca se exporia tão cedo. Você está desesperado e apontando dedos.", "A aldeia votou. Gideon Hale é eliminado — seu papel: Lobisomem. A aldeia sobrevive."] },
  ],
  ru: [
    { title: "Дизайн с ГМ", heading: "Расскажите ГМ свою идею игры", description: "Просто общайтесь с Мастером Игры на естественном языке. Опишите, что хотите — будь то классический Оборотень или самая безумная идея. ГМ поможет с правилами, ролями и условиями победы.", messages: ["Давайте сделаем Оборотня, но на космической станции. Экипаж ищет саботажника.", "Понял — игра с предателем на космической станции. Сколько игроков, нужны особые роли? Инженер, Начальник охраны?", "Всего 6, 1 предатель. Добавь Инженера, который может сканировать системы.", "Готово. Роли распределю тайно, начнём по готовности."] },
    { title: "Ведущий", heading: "ИИ-ведущий управляет игрой", description: "ИИ-ведущий управляет всем — назначает тайные роли, объявляет фазы игры, отслеживает голоса, раскрывает информацию в нужный момент и ведёт историю. Вы просто сосредоточьтесь на игре.", messages: ["Ночь опускается на Марсианскую станцию. Все закройте глаза… Предатель, выбери цель для саботажа.", "Доброе утро. Коммуникационная антенна выведена из строя. Инженер Нова, можешь проверить одну систему.", "Время голосования. Обсудите, кто предатель — через 3 минуты будет изгнание."] },
    { title: "ИИ-игроки", heading: "ИИ-игроки думают и реагируют", description: "У каждого ИИ-игрока своя личность, роль и цели. Они наблюдают за происходящим, формируют мнения, принимают стратегические решения и естественно реагируют на ваши действия. Они лгут, защищаются или объединяются — как настоящие игроки.", messages: ["Я всю ночь был в медблоке. Кто-нибудь может подтвердить? Меня настораживает тот, кто был рядом с антенной…", "Доктор Чен ведёт себя оборонительно — это тревожный знак! Я видел, как она уходила с инженерной палубы прямо во время саботажа.", "Подождите — я провёл проверку системы связи. По характеру повреждений видно, что это сделал кто-то с медицинскими знаниями. Круг сужается."] },
    { title: "Ваш ход", heading: "Вы играете свою роль — ИИ реагирует", description: "Пишите что угодно от лица персонажа. Обвиняйте, защищайтесь, голосуйте или молчите. Ведущий и ИИ-игроки реагируют на ваши слова и адаптируют игру в реальном времени.", messages: ["Прошлой ночью я использовал способность Провидца. Гидеон — Оборотень, я уверен.", "Ложь. Провидец никогда не раскроется так рано. Ты в отчаянии и тычешь пальцем.", "Деревня проголосовала. Гидеон Хейл изгнан — его роль: Оборотень. Деревня выжила."] },
  ],
  it: [
    { title: "Progetta con il GM", heading: "Racconta al GM la tua idea", description: "Chatta con il Game Master in linguaggio naturale. Descrivi cosa vuoi — che sia un classico Lupo Mannaro o la tua idea più folle. Il GM ti aiuta a progettare regole, ruoli e condizioni di vittoria.", messages: ["Facciamo un gioco del Lupo Mannaro ma su una stazione spaziale. L'equipaggio cerca un sabotatore.", "Capito — gioco del traditore sulla stazione spaziale. Quanti giocatori, e vuoi ruoli speciali? Ingegnere, Capo della Sicurezza, quel genere di cose?", "6 in totale, 1 traditore. Aggiungi un Ingegnere che può scansionare i sistemi.", "Fatto. Assegnerò i ruoli in privato e inizieremo quando sei pronto."] },
    { title: "L'Host", heading: "L'host IA dirige lo spettacolo", description: "L'IA host gestisce tutto — assegna ruoli segreti, annuncia le fasi di gioco, tiene traccia dei voti, rivela informazioni al momento giusto e mantiene la storia in movimento. Tu devi solo concentrarti sul giocare.", messages: ["La notte cala sulla Stazione Marte. Tutti chiudete gli occhi… Traditore, scegli il tuo bersaglio di sabotaggio.", "Buongiorno. L'antenna di comunicazione è fuori uso. Ingegnere Nova, puoi ispezionare un sistema.", "È ora di votare. Discutete chi pensate sia il traditore — eliminazione tra 3 minuti."] },
    { title: "Giocatori IA", heading: "I giocatori IA pensano e reagiscono", description: "Ogni giocatore IA ha personalità, ruolo e obiettivi propri. Osservano ciò che accade, formano opinioni, prendono decisioni strategiche e rispondono naturalmente alle tue azioni. Mentono, si difendono o si alleano — come giocatori veri.", messages: ["Ero nell'infermeria tutta la notte. Qualcuno può confermarlo? Comincio a sospettare di chi era vicino all'antenna di comunicazione…", "Dr. Chen è sulla difensiva — è un campanello d'allarme! L'ho vista lasciare il ponte ingegneria proprio al momento del sabotaggio.", "Aspettate — ho fatto un controllo del sistema di comunicazione. Lo schema dei danni suggerisce qualcuno con conoscenze mediche. Si restringe il cerchio."] },
    { title: "Tocca a te", heading: "Tu interpreti il tuo ruolo — l'IA reagisce", description: "Scrivi qualsiasi cosa come il tuo personaggio. Accusa, difendi, vota o resta in silenzio. L'host e i giocatori IA rispondono a ciò che dici e adattano il gioco in tempo reale.", messages: ["Ho usato la mia abilità da Veggente ieri notte. Gideon è un Lupo Mannaro — ne sono certo.", "Bugie. Il Veggente non si esporrebbe mai così presto. Sei disperato e punti il dito a caso.", "Il villaggio ha votato. Gideon Hale è eliminato — il suo ruolo: Lupo Mannaro. Il villaggio sopravvive."] },
  ],
  ar: [
    { title: "التصميم مع المدير", heading: "أخبر مدير اللعبة بفكرتك", description: "تحدث مع مدير اللعبة بلغة طبيعية. صِف ما تريده — سواء كان لعبة مستذئب كلاسيكية أو أكثر أفكارك جنوناً. سيساعدك المدير في تصميم القواعد والأدوار وشروط الفوز.", messages: ["لنلعب لعبة مستذئب لكن في محطة فضائية. الطاقم يبحث عن مخرّب.", "فهمت — لعبة خائن في محطة فضائية. كم عدد اللاعبين؟ هل تريد أدواراً خاصة؟ مهندس، رئيس أمن، هذا النوع؟", "6 إجمالاً، خائن واحد. أضف مهندساً يمكنه فحص الأنظمة.", "تم. سأوزع الأدوار سراً وأبدأ عندما تكون جاهزاً."] },
    { title: "المضيف", heading: "مضيف الذكاء الاصطناعي يدير العرض", description: "يدير مضيف الذكاء الاصطناعي كل شيء — يوزع الأدوار السرية، ويعلن مراحل اللعب، ويتتبع التصويت، ويكشف المعلومات في الوقت المناسب، ويدفع القصة للأمام. أنت فقط ركّز على اللعب.", messages: ["يحل الليل على محطة المريخ. الجميع أغمضوا أعينكم... أيها الخائن، اختر هدف تخريبك.", "صباح الخير. منظومة الاتصالات تعطلت. المهندسة Nova، يمكنك فحص نظام واحد.", "وقت التصويت. ناقشوا من تعتقدون أنه الخائن — الإقصاء بعد 3 دقائق."] },
    { title: "لاعبو الذكاء الاصطناعي", heading: "لاعبو الذكاء الاصطناعي يفكرون ويتفاعلون", description: "كل لاعب ذكاء اصطناعي لديه شخصيته ودوره وأهدافه الخاصة. يراقبون ما يحدث، يكوّنون آراء، يتخذون قرارات استراتيجية، ويستجيبون بشكل طبيعي لتصرفاتك. يكذبون ويدافعون عن أنفسهم أو يتحالفون — تماماً مثل اللاعبين الحقيقيين.", messages: ["كنت في الجناح الطبي طوال الليل. هل يمكن لأحد أن يؤكد ذلك؟ بدأت أشك بمن كان بالقرب من منظومة الاتصالات...", "Dr. Chen تتصرف بشكل دفاعي — هذه علامة خطر! رأيتها تغادر سطح الهندسة وقت التخريب تماماً.", "انتظروا — أجريت فحصاً لمنظومة الاتصالات. نمط الضرر يشير إلى شخص لديه معرفة طبية. هذا يضيّق نطاق المشتبهين."] },
    { title: "دورك", heading: "أنت تلعب دورك — والذكاء الاصطناعي يتفاعل", description: "اكتب أي شيء بصفة شخصيتك. اتّهم، دافع، صوّت، أو التزم الصمت. المضيف ولاعبو الذكاء الاصطناعي يستجيبون لما تقوله ويكيّفون اللعبة في الوقت الفعلي.", messages: ["استخدمت قدرة العرّاف الليلة الماضية. Gideon مستذئب — أنا متأكد.", "أكاذيب. العرّاف لن يكشف نفسه بهذه السرعة. أنت يائس وتشير بأصابع الاتهام عشوائياً.", "القرية صوّتت. Gideon Hale تمّ إقصاؤه — دوره كُشف: مستذئب. القرية نجت."] },
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

// ─── Blog links ───────────────────────────────────────────────────────────────

const BLOG_LABELS: Record<string, L> = {
  "/blog/play-werewolf-online":         { zh: "如何在线玩狼人杀", ja: "オンラインで人狼をプレイする方法", ko: "온라인 늑대인간 플레이 방법", de: "Werwolf online spielen", fr: "Comment jouer au Loup-garou en ligne", es: "Cómo jugar Hombre Lobo en línea", pt: "Como jogar Lobisomem online", ru: "Как играть в Оборотня онлайн", it: "Come giocare a Lupo Mannaro online", ar: "كيف تلعب المستذئب أونلاين" },
  "/blog/play-mafia-online":            { zh: "和AI在线玩黑手党", ja: "AIとオンラインでマフィアをプレイ", ko: "AI와 온라인 마피아 플레이", de: "Mafia online mit KI spielen", fr: "Jouer à Mafia en ligne avec l'IA", es: "Jugar Mafia en línea con IA", pt: "Jogar Máfia online com IA", ru: "Играть в Мафию онлайн с ИИ", it: "Gioca a Mafia online con l'IA", ar: "العب المافيا أونلاين مع الذكاء الاصطناعي" },
  "/blog/best-online-party-games":      { zh: "最佳在线派对游戏", ja: "最高のオンラインパーティーゲーム", ko: "최고의 온라인 파티 게임", de: "Beste Online-Partyspiele", fr: "Meilleurs jeux de fête en ligne", es: "Mejores juegos de fiesta en línea", pt: "Melhores jogos de festa online", ru: "Лучшие онлайн-игры для вечеринок", it: "Migliori giochi di società online", ar: "أفضل ألعاب الحفلات أونلاين" },
  "/blog/best-social-deduction-games":  { zh: "最佳社交推理游戏", ja: "最高の社会的推理ゲーム", ko: "최고의 사회적 추리 게임", de: "Beste Social-Deduction-Spiele", fr: "Meilleurs jeux de déduction sociale", es: "Mejores juegos de deducción social", pt: "Melhores jogos de dedução social", ru: "Лучшие игры на социальную дедукцию", it: "Migliori giochi di deduzione sociale", ar: "أفضل ألعاب الاستنتاج الاجتماعي" },
  "/blog/jackbox-alternatives":         { zh: "Jackbox 替代品", ja: "Jackbox の代替", ko: "Jackbox 대안", de: "Jackbox-Alternativen", fr: "Alternatives à Jackbox", es: "Alternativas a Jackbox", pt: "Alternativas ao Jackbox", ru: "Альтернативы Jackbox", it: "Alternative a Jackbox", ar: "بدائل Jackbox" },
  "/blog/ai-game-master-guide":         { zh: "什么是AI游戏主持人？", ja: "AIゲームマスターとは？", ko: "AI 게임 마스터란?", de: "Was ist ein KI-Game-Master?", fr: "Qu'est-ce qu'un Game Master IA ?", es: "¿Qué es un Game Master IA?", pt: "O que é um Game Master IA?", ru: "Что такое ИИ-Мастер Игры?", it: "Cos'è un Game Master IA?", ar: "ما هو مدير اللعبة بالذكاء الاصطناعي؟" },
  "/blog/play-secret-hitler-online":    { zh: "在线玩秘密希特勒", ja: "シークレットヒトラーをオンラインでプレイ", ko: "시크릿 히틀러 온라인 플레이", de: "Secret Hitler online spielen", fr: "Jouer à Secret Hitler en ligne", es: "Jugar Secret Hitler en línea", pt: "Jogar Secret Hitler online", ru: "Играть в Секретного Гитлера онлайн", it: "Gioca a Secret Hitler online", ar: "العب هتلر السري أونلاين" },
  "/blog/character-ai-alternatives":    { zh: "Character.AI 替代品", ja: "Character.AI の代替", ko: "Character.AI 대안", de: "Character.AI-Alternativen", fr: "Alternatives à Character.AI", es: "Alternativas a Character.AI", pt: "Alternativas ao Character.AI", ru: "Альтернативы Character.AI", it: "Alternative a Character.AI", ar: "بدائل Character.AI" },
  "/blog/among-us-alternatives":        { zh: "Among Us 替代品", ja: "Among Us の代替", ko: "Among Us 대안", de: "Among-Us-Alternativen", fr: "Alternatives à Among Us", es: "Alternativas a Among Us", pt: "Alternativas ao Among Us", ru: "Альтернативы Among Us", it: "Alternative a Among Us", ar: "بدائل Among Us" },
};

export function localizeBlogLabel(
  href: string,
  defaultLabel: string,
  lang: string,
): string {
  const map = BLOG_LABELS[href];
  if (!map) return defaultLabel;
  return pick(map, lang) ?? defaultLabel;
}
