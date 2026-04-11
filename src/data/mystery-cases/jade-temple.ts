import type { MysteryCase } from "@/types/mystery-case";

/** Hard case — 5 suspects, 8 evidence items (2 red herrings), ~20 min */
export const jadeTemple: MysteryCase = {
  id: "jade-temple",
  title: "The Jade Buddha Affair",
  difficulty: 3,
  estimatedMinutes: 20,
  setting: `The Emerald Lotus Monastery in the mountains of Yunnan province is home to a priceless 600-year-old Jade Buddha statue. During the annual Lantern Festival, the monastery opened its gates to guests. At dawn the next morning, the monastery's abbot, Master Chen Wei, was found dead in the locked Jade Hall — poisoned — and the Jade Buddha was gone, replaced with a forgery. The mountain road was blocked by a landslide since midnight, meaning everyone present is still at the monastery. The local detective must untangle a web of art forgery, spiritual betrayal, and old grudges.`,

  victim: {
    name: "Master Chen Wei",
    description: "68-year-old abbot of the Emerald Lotus Monastery. A scholar-monk respected internationally for preserving Buddhist artifacts. Had recently discovered the monastery's art collection was being looted and replaced with forgeries over the past two years. Was about to contact Interpol.",
    causeOfDeath: "Poisoning by aconitine (monkshood extract) dissolved in his nightly medicinal tea",
  },

  timeline: [
    { time: "6:00 PM", actor: "All", action: "Lantern Festival dinner. All five guests and the monastery's monks dine together in the main hall.", isPublic: true },
    { time: "8:00 PM", actor: "Master Chen Wei", action: "Retires to the Jade Hall for evening meditation, as is his nightly routine. He locks the hall from the inside with the only key.", isPublic: true },
    { time: "8:30 PM", actor: "Lin Xiaomei", action: "Delivers Chen Wei's nightly medicinal tea to the Jade Hall. He opens the door, takes the tray, and re-locks the door. This is her nightly duty.", isPublic: true },
    { time: "8:25 PM", actor: "Victor Hahn", action: "Intercepts Lin Xiaomei in the kitchen before she delivers the tea. He adds aconitine drops to the tea while she is distracted getting honey from the pantry. He obtained the poison from monkshood flowers growing in the monastery garden.", isPublic: false },
    { time: "9:00 PM", actor: "Master Chen Wei", action: "Drinks the tea. Aconitine takes effect within 30 minutes. He collapses during meditation.", isPublic: false },
    { time: "10:00 PM", actor: "Victor Hahn", action: "Uses a copy of the Jade Hall key (made weeks ago from a wax impression) to enter. Finds Chen Wei dead. Swaps the real Jade Buddha with a forgery he brought in his luggage, concealed inside a camera equipment case.", isPublic: false },
    { time: "10:30 PM", actor: "Victor Hahn", action: "Exits the Jade Hall and re-locks it. Hides the real Jade Buddha in a false bottom in his large camera case in his room.", isPublic: false },
    { time: "12:00 AM", actor: "Nature", action: "Landslide blocks the only road down the mountain.", isPublic: true },
    { time: "5:30 AM", actor: "Brother Jian", action: "Knocks on the Jade Hall for the dawn bell. No response. Uses the emergency master key (held only by senior monks) to open the hall. Finds Chen Wei dead and the Jade Buddha obviously different — the color and weight are wrong.", isPublic: true },
  ],

  evidence: [
    {
      id: "poisoned-tea",
      name: "Tainted medicinal tea",
      description: "Lab analysis of the remaining tea in Chen Wei's cup shows aconitine. The teapot also contains traces. The aconitine was added before the tea was delivered — it was in the pot, not the cup. Monkshood (aconitum) grows abundantly in the monastery's medicinal herb garden.",
      revealAct: 1,
      type: "physical",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
    {
      id: "forged-buddha",
      name: "The replacement Jade Buddha",
      description: "The forgery is expert-level but detectable: it weighs 400g less than the real statue and the jade has a slightly different hue under UV light. An art expert could produce this forgery, but would need access to detailed measurements of the original.",
      revealAct: 1,
      type: "physical",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
    {
      id: "wax-impression",
      name: "Wax residue on the Jade Hall lock",
      description: "Forensic examination of the Jade Hall lock reveals traces of modeling wax inside the keyhole, consistent with someone making a wax impression of the key. The wax matches a brand sold in European art supply stores.",
      revealAct: 2,
      type: "physical",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
    {
      id: "camera-case",
      name: "Victor's oversized camera case",
      description: "Victor Hahn brought an unusually large Pelican camera case 'for his photography equipment'. The case has a false bottom. When inspected, the real Jade Buddha is found inside, wrapped in silk padding.",
      revealAct: 3,
      type: "physical",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
    {
      id: "victor-past-thefts",
      name: "Victor's connection to missing artifacts",
      description: "An Interpol database check reveals that three other Buddhist monasteries in Southeast Asia reported similar thefts over the past two years — priceless artifacts replaced with forgeries. In each case, a 'European art historian or photographer' had visited shortly before. Descriptions match Victor Hahn.",
      revealAct: 3,
      type: "document",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
    {
      id: "lin-herbs",
      name: "Lin Xiaomei's herbal knowledge",
      description: "Lin Xiaomei is the monastery's herbalist and tea preparer. She has extensive knowledge of monkshood and its lethal properties. She prepares all of Chen Wei's medicinal teas and had unsupervised access to the teapot.",
      revealAct: 1,
      type: "testimony",
      pointsTo: "lin-xiaomei",
      isRedHerring: true,
    },
    {
      id: "mei-chen-argument",
      name: "Mei Zhao's argument with Chen Wei",
      description: "Several monks overheard Mei Zhao arguing with Chen Wei at 5:00 PM about 'selling monastery assets.' Mei wanted the monastery to sell minor artifacts to fund renovations. Chen Wei refused, calling it 'desecration.'",
      revealAct: 1,
      type: "testimony",
      pointsTo: "mei-zhao",
      isRedHerring: true,
    },
    {
      id: "chen-wei-notes",
      name: "Abbot's private investigation notes",
      description: "Hidden in Chen Wei's chambers: a notebook detailing two years of investigation into artifact thefts. He identified a pattern — a European visitor appeared at each monastery before the thefts. He had written: 'The photographer, Hahn — I must verify his credentials. Something is wrong.' He had emailed Interpol's art crime unit two days before the festival.",
      revealAct: 2,
      type: "document",
      pointsTo: "victor-hahn",
      isRedHerring: false,
    },
  ],

  suspects: [
    {
      id: "victor-hahn",
      gender: "male",
      name: "Victor Hahn",
      personality: "Cultured, multilingual Austrian 'art historian and photographer' in his early 50s. Impeccably polite, deeply knowledgeable about Buddhist art. Speaks with warm authority. When challenged, he becomes condescending, dismissing questions as 'misunderstandings.' A practiced sociopath who has done this many times.",
      relationship: "Visiting guest — claimed to be documenting Buddhist art for a European museum exhibition. In reality, an international art thief who scouts, forges, and swaps priceless artifacts.",
      alibi: "Claims he was in his guest room from 9 PM onward, reviewing photographs on his laptop. Says he 'sleeps early when at altitude.'",
      alibiTruth: false,
      secrets: [
        "He is an international art thief responsible for at least three prior monastery thefts",
        "He made a wax impression of the Jade Hall key during a 'tour' two weeks ago",
        "He poisoned Chen Wei's tea with aconitine while Lin Xiaomei was distracted in the kitchen",
        "He entered the locked Jade Hall with a copied key and swapped the Jade Buddha",
        "The real statue is in a false-bottom compartment in his camera case",
      ],
      lies: [
        "I'm a legitimate art historian affiliated with the Vienna Museum of Asian Art",
        "I was in my room from 9 PM onward",
        "I've never handled monkshood or any toxic plants",
        "The camera case is just photography equipment, the extra space is for lenses",
      ],
      breakpoints: [
        "wax-impression",
        "camera-case",
        "victor-past-thefts",
        "chen-wei-notes",
        "Asking him to explain why the wax in the lock matches European art-supply brands",
        "Requesting to inspect his camera case",
      ],
    },
    {
      id: "lin-xiaomei",
      gender: "female",
      name: "Lin Xiaomei",
      personality: "Gentle, devout young woman in her late 20s who serves as the monastery's herbalist and tea maker. Speaks softly and respectfully. Deeply grief-stricken by Chen Wei's death — he was her spiritual mentor. Becomes anxious when her knowledge of toxic plants is brought up.",
      relationship: "Monastery herbalist for 5 years. Chen Wei personally trained her. She prepared his nightly tea without fail.",
      alibi: "Delivered the tea at 8:30 PM, then went to the meditation room for evening prayers until 10 PM, after which she went to her quarters.",
      alibiTruth: true,
      secrets: [
        "She briefly left the tea unattended in the kitchen when she went to the pantry for honey — Victor was in the kitchen at that time",
        "She feels immense guilt that the poison was in tea she prepared, even though she didn't add it",
      ],
      lies: [],
      breakpoints: [
        "Asking her to describe exactly what happened in the kitchen when she prepared the tea",
        "Asking if anyone else was in the kitchen that evening",
      ],
    },
    {
      id: "mei-zhao",
      gender: "female",
      name: "Mei Zhao",
      personality: "Pragmatic, sharp-tongued businesswoman in her 40s. A major donor to the monastery. Speaks bluntly and impatiently. Sees the monastery as both a spiritual place and a business that needs modernizing. Defensive about the argument with Chen Wei but not deceitful.",
      relationship: "Primary financial patron. Has donated over ¥5 million to the monastery over the past decade. Wanted influence over how the funds were used.",
      alibi: "After the argument with Chen Wei, she had dinner, then retired to her guest room at 9 PM. Called her assistant in Shanghai at 9:30 PM (phone records confirm a 45-minute call).",
      alibiTruth: true,
      secrets: [
        "The argument was about selling minor stone carvings (worth ~¥100K) to fund a new roof — she had no interest in the Jade Buddha",
        "She genuinely cared about the monastery's survival and is devastated by the theft",
      ],
      lies: [],
      breakpoints: [
        "mei-chen-argument",
        "Asking about the specifics of the renovation funding dispute",
      ],
    },
    {
      id: "brother-jian",
      gender: "male",
      name: "Brother Jian",
      personality: "Solemn, dignified senior monk in his 60s. Speaks in measured, philosophical tones. Second in seniority at the monastery. Loyal to Chen Wei and the order. Calm under pressure — only shows anger when the desecration of the Jade Hall is discussed.",
      relationship: "Senior monk and keeper of the emergency master key. Had served alongside Chen Wei for 30 years.",
      alibi: "Attended evening prayers from 8:30 to 10 PM, then went to his cell. Woke at 5:20 AM for the dawn bell, went to the Jade Hall at 5:30 AM.",
      alibiTruth: true,
      secrets: [
        "He knew Chen Wei was investigating artifact thefts but was told to keep it confidential",
        "He once caught Victor sketching the Jade Hall lock mechanism but dismissed it as 'artistic curiosity'",
      ],
      lies: [],
      breakpoints: [
        "Asking about the emergency master key and who has access",
        "Asking if he noticed anything unusual about Victor during his stay",
      ],
    },
    {
      id: "dr-wu-li",
      gender: "female",
      name: "Dr. Wu Li",
      personality: "Academic, reserved art conservation specialist in her 50s. Invited to assess the monastery's collection for preservation needs. Speaks thoughtfully, with careful precision. Uncomfortable with conflict but intellectually honest. Will share observations if asked directly.",
      relationship: "Independent art conservator hired by the monastery to catalog and assess the collection. Has been on-site for one week.",
      alibi: "Was in the conservation workshop cataloging scrolls until midnight, then went to her room. Working late is normal for her.",
      alibiTruth: true,
      secrets: [
        "She had already noticed the Jade Buddha looked slightly different in color when she examined it three days ago, but attributed it to lighting differences and planned to UV-test it — she hadn't gotten to it yet",
        "She suspects the forgery was already in place before this visit, meaning the real one may have been swapped earlier, but the evidence shows otherwise",
      ],
      lies: [],
      breakpoints: [
        "Asking about her professional assessment of the forgery's quality",
        "Asking whether she noticed anything different about the Jade Buddha during her cataloging work",
      ],
    },
  ],

  solution: {
    culpritId: "victor-hahn",
    motive: "Victor Hahn is an international art thief who systematically targets remote Buddhist monasteries in Asia. He poses as an art historian or photographer to gain access, creates expert forgeries of priceless artifacts, and swaps them. The Jade Buddha — worth an estimated $12 million — was his most ambitious target. When he learned that Abbot Chen Wei was investigating the pattern of thefts and had contacted Interpol, he decided to eliminate Chen Wei and execute the theft immediately during the Lantern Festival.",
    method: "Victor poisoned Chen Wei's nightly medicinal tea with aconitine (extracted from monkshood in the monastery's herb garden) while the herbalist Lin Xiaomei was momentarily away from the kitchen. After Chen Wei died during his locked meditation, Victor used a duplicate key (made from a wax impression taken weeks earlier) to enter the Jade Hall, swap the real Jade Buddha with an expert forgery, and re-lock the door. He concealed the real statue in a false-bottom compartment in his oversized camera case.",
    keyEvidence: ["poisoned-tea", "wax-impression", "camera-case", "chen-wei-notes", "victor-past-thefts"],
  },

  translations: {
    zh: {
      title: "玉佛疑案",
      victim: {
        name: "陈维大师",
        causeOfDeath: "每晚药茶中被投入乌头碱（附子提取物）中毒身亡",
      },
      evidence: {
        "poisoned-tea": {
          name: "被下毒的药茶",
          description:
            "对陈维茶杯中残余茶汤的化验显示含有乌头碱，壶内也有痕迹。乌头碱是在送茶前加入的——在壶里而非杯中。寺院药草园里遍植附子（乌头）。",
        },
        "forged-buddha": {
          name: "赝品玉佛",
          description:
            "赝品水平极高但仍可辨识：比真品轻约400克，紫外线下玉的色调略有不同。艺术专家能做出此等赝品，但须掌握原物的详细尺寸。",
        },
        "wax-impression": {
          name: "玉佛堂门锁上的蜡痕",
          description:
            "对玉佛堂门锁的法医检验显示钥匙孔内留有造型蜡痕迹，与用蜡取钥匙印模的做法相符。蜡的品牌与欧洲美术用品店所售一致。",
        },
        "camera-case": {
          name: "Victor超大号的相机箱",
          description:
            "Victor Hahn 带来一只特大号 Pelican 相机箱，说是装摄影器材。箱内有夹层暗格。检查时，真品玉佛裹在丝棉垫料中被发现。",
        },
        "victor-past-thefts": {
          name: "Victor与失窃文物的关联",
          description:
            "国际刑警数据库显示，过去两年东南亚另有三座佛教寺院报告类似案件——无价文物被赝品替换。每次案发前都有一名「欧洲艺术史学家或摄影师」到访。特征与 Victor Hahn 相符。",
        },
        "lin-herbs": {
          name: "林小梅的草药学知识",
          description:
            "林小梅是寺院的草药师兼备茶人，对附子及其毒性十分熟悉。她负责陈维全部药茶，并能不受监督地接触茶壶。",
        },
        "mei-chen-argument": {
          name: "赵梅与陈维的争论",
          description:
            "多名僧人听到下午5点赵梅与陈维因「出售寺院资产」发生争执。赵梅希望出售次要石雕筹资修缮屋顶，陈维拒绝，斥之为亵渎。",
        },
        "chen-wei-notes": {
          name: "住持的私人调查笔记",
          description:
            "陈维禅房内藏有一本笔记，记录两年来对文物失窃的调查。他辨认出一种模式——每次失窃前都有一名欧洲访客。他写道：「摄影师 Hahn——我必须核实他的身份，总觉得不对。」节前两天他已向国际刑警艺术犯罪部门发邮件。",
        },
      },
      suspects: {
        "victor-hahn": {
          name: "Victor Hahn",
          relationship:
            "来访宾客——自称受欧洲博物馆展览之托记录佛教艺术。实为跨国文物盗贼，踩点、伪造并调包无价文物。",
          alibi:
            "声称当晚9点起一直在客房用笔记本电脑整理照片，并说在高海拔地区会早睡。",
        },
        "lin-xiaomei": {
          name: "林小梅",
          relationship: "寺院药草师，已任职五年。陈维亲自带她修行，她每晚为他备茶从不间断。",
          alibi: "晚8点30分送茶后前往禅堂参加晚课至晚10点，之后回房休息。",
        },
        "mei-zhao": {
          name: "赵梅",
          relationship:
            "主要出资人。过去十年向寺院捐赠超过500万元，希望资金用途有一定发言权。",
          alibi:
            "与陈维争执后共进晚餐，晚9点回客房。9点30分致电上海的助理（通话记录证实通话约45分钟）。",
        },
        "brother-jian": {
          name: "释坚法师",
          relationship: "资深僧众，保管应急万能钥匙。与陈维共事三十年。",
          alibi:
            "晚8点30分至10点参加晚课，之后回寮房。凌晨5点20分起床准备晨钟，5点30分前往玉佛堂。",
        },
        "dr-wu-li": {
          name: "吴丽博士",
          relationship: "寺院聘请的独立艺术品修复师，负责清点并评估藏品，已在寺一周。",
          alibi: "在修复工作室整理经卷至午夜，之后回房。工作到深夜对她而言是常态。",
        },
      },
    },
  },
};
