/**
 * Localized overrides for landing page structured data.
 *
 * English text lives in landing-content.ts (the source of truth).
 * This file provides overlay translations — only text fields are
 * replaced; structural fields (icons, images, etc.) come from the
 * English originals.
 */

import type {
  GameScenario,
  MarqueeCharacter,
  Feature,
  FAQItem,
  InsideGameStep,
} from "./landing-content";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveKey(lang: string): string {
  if (!lang) return "en";
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  return lower.split("-")[0];
}

// ─── Game Scenarios ───────────────────────────────────────────────────────────

type ScenarioOverlay = { title: string; messages: string[] };

const SCENARIOS_ZH: Record<string, ScenarioOverlay> = {
  werewolf: {
    title: "狼人杀",
    messages: [
      "夜幕降临村庄。狼人们蠢蠢欲动……狼人们，睁开眼睛，选择你们的目标。",
      "Blake整晚几乎一言不发。这种沉默很可疑——我必须指出来。",
      "不可能是Blake。昨晚我保护了他——如果他是狼人，我们早就知道了。",
      "等等……Casey刚暴露了自己的能力。为什么医生要暴露自己，除非是在转移注意力？",
    ],
  },
  mafia: {
    title: "黑手党",
    messages: [
      "城市陷入沉寂。黑手党——睁开眼睛。在天亮前选择你们的目标。",
      "Marco午夜时在面包店外面。那不是巧合——我查过记录了。",
      "我发誓我只是去给家人买面包！！我为什么要在这种事上撒谎？",
      "因为这正是黑手党成员会说的话。太巧了，Marco。",
    ],
  },
  spy: {
    title: "谁是卧底",
    messages: [
      "暗号已发送。除了一个人之外，每个人都有相同的词。描述你的词，但不要暴露它。",
      "我的是一种温暖的东西，人们在悠闲的早晨会去寻找它……非常舒适。",
      "这也太模糊了吧，Jordan。你要么是间谍，要么就是在故意装作间谍。",
      "也许我只是不想让答案太明显？你才是在转移注意力的那个人，Riley。",
    ],
  },
  mystery: {
    title: "谋杀之谜",
    messages: [
      "一颗价值连城的钻石从上锁的博物馆保险库中消失了。在场的每个人都是嫌疑人。",
      "我……大概晚上9点左右看到有人在展柜附近。当时没太在意。",
      "这不可能——博物馆8点就关门了。谁在闭馆后让你进去的，Morgan？",
      "我有钥匙。不是我干的，我保证……我只是在做盘点工作。",
    ],
  },
};

export function localizeScenarios(
  scenarios: Record<string, GameScenario>,
  lang: string,
): Record<string, GameScenario> {
  const key = resolveKey(lang);
  const overlay = key === "zh" ? SCENARIOS_ZH : null;
  if (!overlay) return scenarios;

  const result: Record<string, GameScenario> = {};
  for (const [id, scenario] of Object.entries(scenarios)) {
    const zh = overlay[id];
    if (!zh) { result[id] = scenario; continue; }
    result[id] = {
      title: zh.title,
      messages: scenario.messages.map((msg, i) => ({
        ...msg,
        text: zh.messages[i] ?? msg.text,
      })),
    };
  }
  return result;
}

// ─── Marquee Characters ──────────────────────────────────────────────────────

const ROLE_ZH: Record<string, string> = {
  Villager: "村民",
  Doctor: "医生",
  Detective: "侦探",
  Civilian: "平民",
  Spy: "间谍",
  Witness: "目击者",
  Suspect: "嫌疑人",
};

const PERSONALITY_ZH: Record<string, string> = {
  "Outspoken and analytical": "直言不讳，善于分析",
  "Calm, protective instincts": "冷静沉着，保护本能",
  "Sharp, suspicious of everyone": "敏锐多疑，怀疑一切",
  "Nervous, eager to prove innocence": "紧张不安，急于自证清白",
  "Clever, deliberately vague": "聪明机智，故意含糊",
  "Paranoid, accuses to deflect": "多疑偏执，指控以转移注意",
  "Nervous, detail-oriented": "紧张敏感，注重细节",
  "Confrontational, quick to contradict": "对抗性强，反应迅速",
  "Quiet, watchful observer": "沉默寡言，善于观察",
};

const GAME_ZH: Record<string, string> = {
  Werewolf: "狼人杀",
  Mafia: "黑手党",
  "Who's the Spy": "谁是卧底",
  Mystery: "谜案",
};

export function localizeMarqueeCharacters(
  characters: MarqueeCharacter[],
  lang: string,
): MarqueeCharacter[] {
  const key = resolveKey(lang);
  if (key !== "zh") return characters;

  return characters.map((c) => ({
    ...c,
    role: ROLE_ZH[c.role] ?? c.role,
    personality: PERSONALITY_ZH[c.personality] ?? c.personality,
    game: GAME_ZH[c.game] ?? c.game,
  }));
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES_ZH: { title: string; description: string }[] = [
  { title: "AI主持全场", description: "角色分配、阶段推进、投票、揭示——主持人让游戏流畅进行，无需任何人手动管理。" },
  { title: "永远不缺玩家", description: "独自玩、和朋友玩，或混合搭配。AI角色自动填满每个空位。" },
  { title: "AI角色真正在玩", description: "他们会虚张声势、指控他人、为自己辩护，反应就像真人玩家——不是沉默的机器人。" },
  { title: "轻松和朋友开始", description: "分享链接，几分钟内开始。无需下载，无需设置，不用等人凑齐。" },
];

export function localizeFeatures(
  features: Feature[],
  lang: string,
): Feature[] {
  const key = resolveKey(lang);
  if (key !== "zh") return features;

  return features.map((f, i) => ({
    ...f,
    title: FEATURES_ZH[i]?.title ?? f.title,
    description: FEATURES_ZH[i]?.description ?? f.description,
  }));
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ZH: FAQItem[] = [
  {
    question: "如何创建游戏？",
    answer: "用Google登录，然后在探索页面浏览模板——选一个像狼人杀、谁是卧底或黑手党这样的游戏。点击模板，几秒钟内就能进入游戏房间。AI玩家会自动加入。无需任何设置或编程。",
  },
  {
    question: "什么是游戏主持人，它是如何工作的？",
    answer: "游戏主持人是一个AI主持，负责运行你的游戏：解释规则、推进白天/黑夜或讨论阶段，保持游戏流畅。你还可以添加AI玩家，这样即使独自玩也能坐满房间。主持人和玩家使用自然对话，让你感觉像真正的桌游聚会。",
  },
  {
    question: "可以和朋友一起玩吗？",
    answer: "当然可以！从游戏房间分享邀请链接——朋友们可以在浏览器中即时加入，无需创建账号。他们以访客身份与你的AI角色一起游戏。同一局游戏中可以任意混搭真人和AI玩家。",
  },
  {
    question: "有哪些模板或游戏类型？",
    answer: "我们提供10+模板，包括狼人杀（社交推理）、谁是卧底（文字游戏）、黑手党、谋杀之谜、秘密希特勒和塔罗占卜。在探索页面一键开始。你也可以通过向游戏主持人描述自己的规则和角色来创建完全自定义的游戏。",
  },
  {
    question: "需要登录吗？是免费的吗？",
    answer: "用Google登录来创建游戏——只需几秒钟。新账号会获得免费初始额度，让你立即体验平台。加入你游戏的朋友完全不需要注册账号。",
  },
  {
    question: "AI角色有语音吗？",
    answer: "有。每个AI角色都有独特的语音，由文字转语音技术驱动。你可以在任何游戏中开启或关闭语音。它增加了一层沉浸感，让游戏感觉像真正的桌游聚会。",
  },
  {
    question: "可以创建任何类型的游戏吗？",
    answer: "完全可以！虽然我们提供10+热门游戏模板，但你有完全的自由来设计具有独特规则、角色和胜利条件的自定义游戏。只需用自然语言向游戏主持人描述你的想法。",
  },
  {
    question: "费用是多少？",
    answer: "新账号自带免费额度。之后，你可以根据需要购买额外额度——定价透明，基于实际使用量。没有订阅费或隐藏费用。",
  },
];

export function localizeFAQ(
  items: FAQItem[],
  lang: string,
): FAQItem[] {
  const key = resolveKey(lang);
  if (key !== "zh") return items;
  return FAQ_ZH.length === items.length ? FAQ_ZH : items;
}

// ─── Inside Game Steps ────────────────────────────────────────────────────────

type StepOverlay = {
  title: string;
  heading: string;
  description: string;
  messages: string[];
};

const STEPS_ZH: StepOverlay[] = [
  {
    title: "与GM设计",
    heading: "向GM描述你的游戏创意",
    description: "用自然语言和游戏主持人聊天。描述你想要的——无论是经典狼人杀还是你最疯狂的自定义创意。GM会帮你设计规则、角色和胜利条件。",
    messages: [
      "我们来做一个狼人杀游戏，但设定在太空站。船员们要找出一个破坏者。",
      "明白了——太空站叛徒游戏。多少名玩家？需要特殊角色吗？工程师、安全主管之类的？",
      "总共6人，1个叛徒。加一个能扫描系统的工程师。",
      "搞定。我会私下分配角色，准备好了就开始。",
    ],
  },
  {
    title: "AI主持",
    heading: "AI主持人掌控全局",
    description: "AI主持人管理一切——分配秘密角色、宣布游戏阶段、追踪投票、在合适的时机揭示信息，并推动故事发展。你只需要专注于游戏。",
    messages: [
      "夜幕降临火星站。所有人闭眼……叛徒，选择你的破坏目标。",
      "早安。通信阵列已瘫痪。工程师Nova，你可以检查一个系统。",
      "投票时间。讨论你认为谁是叛徒——3分钟后淘汰。",
    ],
  },
  {
    title: "AI玩家",
    heading: "AI玩家会思考和反应",
    description: "每个AI玩家都有自己的个性、角色和目标。他们观察发生的事情，形成观点，做出战略决策，并对你的行动做出自然反应。他们会撒谎、为自己辩护或结盟——就像真人玩家一样。",
    messages: [
      "我昨晚一直在医疗舱。有人能作证吗？我开始怀疑当时在通信阵列附近的人了……",
      "Dr. Chen表现得很防备——这是个危险信号！我看到她在破坏发生前后离开了工程甲板。",
      "等一下——我对通信阵列做了系统检查。损坏模式表明是具有医学知识的人所为。这缩小了范围。",
    ],
  },
  {
    title: "你来玩",
    heading: "你扮演角色——AI做出反应",
    description: "以你的角色身份输入任何内容。指控、辩护、投票，或保持沉默。主持人和AI玩家会对你说的话做出反应，并实时调整游戏。",
    messages: [
      "我昨晚使用了预言家能力。Gideon是狼人——我确定。",
      "胡说。预言家绝不会这么早暴露自己。你是在绝望中乱指。",
      "村庄已经投票。Gideon Hale被淘汰——他的角色揭示为：狼人。村庄存活了。",
    ],
  },
];

export function localizeInsideGameSteps(
  steps: InsideGameStep[],
  lang: string,
): InsideGameStep[] {
  const key = resolveKey(lang);
  if (key !== "zh") return steps;

  return steps.map((step, i) => {
    const zh = STEPS_ZH[i];
    if (!zh) return step;
    return {
      ...step,
      title: zh.title,
      heading: zh.heading,
      description: zh.description,
      messages: step.messages.map((msg, j) => ({
        ...msg,
        text: zh.messages[j] ?? msg.text,
      })),
    };
  });
}

// ─── Blog links ───────────────────────────────────────────────────────────────

const BLOG_LABELS_ZH: Record<string, string> = {
  "/blog/play-werewolf-online": "如何在线玩狼人杀",
  "/blog/play-mafia-online": "和AI在线玩黑手党",
  "/blog/best-online-party-games": "最佳在线派对游戏",
  "/blog/best-social-deduction-games": "最佳社交推理游戏",
  "/blog/jackbox-alternatives": "Jackbox 替代品",
  "/blog/ai-game-master-guide": "什么是AI游戏主持人？",
  "/blog/play-secret-hitler-online": "在线玩秘密希特勒",
  "/blog/character-ai-alternatives": "Character.AI 替代品",
  "/blog/among-us-alternatives": "Among Us 替代品",
};

export function localizeBlogLabel(
  href: string,
  defaultLabel: string,
  lang: string,
): string {
  const key = resolveKey(lang);
  if (key !== "zh") return defaultLabel;
  return BLOG_LABELS_ZH[href] ?? defaultLabel;
}
