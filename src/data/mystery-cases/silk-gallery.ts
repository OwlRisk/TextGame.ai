import type { MysteryCase } from "@/types/mystery-case";

/** Standard case — 4 suspects, 5 evidence items, ~12-15 min */
export const silkGallery: MysteryCase = {
  id: "silk-gallery",
  title: "Death at the Silk Gallery",
  difficulty: 2,
  estimatedMinutes: 15,
  setting: `The Silk Gallery, a prestigious modern art gallery in downtown, hosted a private exhibition opening last night. At 11:20 PM, renowned art collector Victor Hale was found dead in the locked VIP lounge on the top floor — poisoned. His champagne glass contained traces of cyanide. The gallery's security cameras mysteriously stopped recording between 10:45 PM and 11:15 PM. 200 guests attended the opening, but only four had access to the VIP lounge that night.`,

  victim: {
    name: "Victor Hale",
    description: "52-year-old art collector and gallery patron. Extremely wealthy, with a reputation for ruthless business tactics and collecting both art and enemies.",
    causeOfDeath: "Cyanide poisoning via champagne",
  },

  timeline: [
    { time: "8:00 PM", actor: "All", action: "Exhibition opening begins. Victor arrives and mingles on the main floor.", isPublic: true },
    { time: "9:30 PM", actor: "Victor", action: "Retreats to the VIP lounge. Only keycard holders can follow.", isPublic: true },
    { time: "9:45 PM", actor: "Renata Voss", action: "Enters VIP lounge to discuss a painting sale with Victor. Argument over pricing.", isPublic: false },
    { time: "10:15 PM", actor: "Renata Voss", action: "Leaves VIP lounge, visibly upset.", isPublic: false },
    { time: "10:30 PM", actor: "Julian Park", action: "Enters VIP lounge. Pours Victor a fresh champagne. Adds cyanide capsule from his jacket pocket.", isPublic: false },
    { time: "10:40 PM", actor: "Julian Park", action: "Leaves VIP lounge after making small talk. Victor sips champagne.", isPublic: false },
    { time: "10:45 PM", actor: "Julian Park", action: "Accesses the security room using a stolen maintenance keycard. Loops the camera feed for 30 minutes.", isPublic: false },
    { time: "10:50 PM", actor: "Sable Chen", action: "Enters VIP lounge briefly to drop off a gift catalogue. Victor appears drowsy.", isPublic: false },
    { time: "11:00 PM", actor: "Ivan Drake", action: "Enters VIP lounge to settle a debt with Victor. Finds him slumped in his chair, checks pulse, panics, and leaves without telling anyone.", isPublic: false },
    { time: "11:15 PM", actor: "Julian Park", action: "Camera feed resumes.", isPublic: false },
    { time: "11:20 PM", actor: "Waiter", action: "Enters VIP lounge to collect glasses. Finds Victor dead. Calls security.", isPublic: true },
  ],

  evidence: [
    {
      id: "champagne-glass",
      name: "Victor's champagne glass",
      description: "The glass contains traces of potassium cyanide. Only one set of fingerprints on the glass besides Victor's — they belong to Julian Park.",
      revealAct: 1,
      type: "physical",
      pointsTo: "julian-park",
      isRedHerring: false,
    },
    {
      id: "angry-email",
      name: "Email from Renata to Victor",
      description: "Sent 3 days ago: 'If you try to undercut me on the Morel acquisition, I will destroy you. This is not a threat, it's a promise.' Victor replied: 'You don't have the nerve.'",
      revealAct: 1,
      type: "digital",
      pointsTo: "renata-voss",
      isRedHerring: true,
    },
    {
      id: "camera-gap",
      name: "Security camera gap",
      description: "Camera footage shows a 30-minute loop between 10:45 PM and 11:15 PM. The security room's access log shows it was opened with a maintenance keycard reported stolen last week.",
      revealAct: 2,
      type: "digital",
      pointsTo: "julian-park",
      isRedHerring: false,
    },
    {
      id: "pharmacy-receipt",
      name: "Pharmacy purchase record",
      description: "Julian Park purchased potassium cyanide-based industrial cleaner from a specialty chemical supplier 5 days ago, using his company account. The purchase was flagged but not investigated.",
      revealAct: 2,
      type: "document",
      pointsTo: "julian-park",
      isRedHerring: false,
    },
    {
      id: "debt-note",
      name: "Ivan's IOU note",
      description: "A handwritten note found in Victor's jacket: 'Ivan Drake — $340,000 outstanding. Final deadline: tonight.' Ivan's fingerprints are on the note.",
      revealAct: 3,
      type: "document",
      pointsTo: "ivan-drake",
      isRedHerring: true,
    },
  ],

  suspects: [
    {
      id: "renata-voss",
      gender: "female",
      name: "Renata Voss",
      personality: "Imperious gallery owner in her 50s. Speaks in clipped, elegant sentences. Treats everything as beneath her. Becomes venomous when her reputation is questioned.",
      relationship: "Gallery owner and Victor's longtime rival in the art collecting world",
      alibi: "Claims she left the VIP lounge at 10 PM and spent the rest of the evening with guests on the main floor.",
      alibiTruth: false,
      secrets: [
        "She was in the VIP lounge until 10:15 PM, not 10 PM — they argued about Victor undercutting her on a major acquisition",
        "She is deeply in debt and the gallery is about to go bankrupt",
      ],
      lies: [
        "I left the VIP lounge at 10 PM, everything was perfectly civil",
        "Victor and I had a perfectly professional relationship",
      ],
      breakpoints: [
        "angry-email",
        "Asking about the Morel painting acquisition",
        "Pointing out the 15-minute discrepancy in her timeline",
      ],
    },
    {
      id: "julian-park",
      gender: "male",
      name: "Julian Park",
      personality: "Charming, soft-spoken art dealer in his late 30s. Always smiling. Deflects questions with compliments and humor. When cornered, his charm drops and he becomes cold and calculating.",
      relationship: "Up-and-coming art dealer who Victor mentored — then betrayed by stealing his biggest client list",
      alibi: "Says he popped into the VIP lounge briefly to say hello around 10:30 PM, then was on the main floor for the rest of the night.",
      alibiTruth: false,
      secrets: [
        "He poured Victor the poisoned champagne",
        "He stole a maintenance keycard last week to access the security room",
        "Victor destroyed his previous gallery business by poaching all his clients — this was revenge years in the making",
      ],
      lies: [
        "I only said hello and left within five minutes",
        "I never touched Victor's glass — the waiter must have poured it",
        "I've moved on from what Victor did to my old gallery",
      ],
      breakpoints: [
        "champagne-glass",
        "camera-gap",
        "pharmacy-receipt",
        "Confronting him about his fingerprints on the champagne glass",
      ],
    },
    {
      id: "sable-chen",
      gender: "female",
      name: "Sable Chen",
      personality: "Quiet, observant young curator in her late 20s. Answers in thoughtful, measured sentences. Genuinely helpful but becomes evasive about her personal relationship with Victor.",
      relationship: "Junior curator at the gallery and Victor's secret romantic partner for the past year",
      alibi: "Says she briefly dropped off a catalogue in the VIP lounge around 10:50 PM and noticed Victor seemed tired.",
      alibiTruth: true,
      secrets: [
        "She and Victor were in a secret relationship — he was planning to leave his wife for her",
        "She saw Victor looking unwell when she entered and assumed he was drunk",
        "She noticed Julian's jacket draped over the back of a VIP chair when she entered — meaning Julian was there more recently than he claims",
      ],
      lies: [
        "My relationship with Victor was purely professional",
      ],
      breakpoints: [
        "Asking gently about her personal feelings toward Victor",
        "Asking what else she noticed in the VIP room besides Victor",
      ],
    },
    {
      id: "ivan-drake",
      gender: "male",
      name: "Ivan Drake",
      personality: "Gruff, anxious businessman in his 50s. Sweats visibly. Talks too fast. Prone to outbursts of frustration followed by deflated apologies.",
      relationship: "Property developer who owes Victor $340,000 from a failed joint investment",
      alibi: "Claims he never entered the VIP lounge that night.",
      alibiTruth: false,
      secrets: [
        "He went to the VIP lounge at 11 PM to beg Victor for more time on the debt",
        "He found Victor already dead or dying and panicked — left without telling anyone",
        "He took the IOU note from Victor's desk and tried to destroy it, but dropped it in his panic",
      ],
      lies: [
        "I never went to the VIP lounge",
        "I didn't even know Victor was up there",
      ],
      breakpoints: [
        "debt-note",
        "Pointing out that his fingerprints are on the VIP lounge door handle after 10:45 PM",
        "Asking him directly why he looks so nervous",
      ],
    },
  ],

  solution: {
    culpritId: "julian-park",
    motive: "Victor had mentored Julian early in his career, then systematically destroyed his gallery business by poaching every major client. Julian spent years rebuilding and planning revenge. He used the exhibition opening — a night he helped organize — as the perfect cover.",
    method: "Julian entered the VIP lounge at 10:30 PM and poured Victor a fresh champagne, dropping a cyanide capsule into the glass. He left at 10:40 PM, then used a stolen maintenance keycard to access the security room and loop the camera feed for 30 minutes, covering the window of the murder.",
    keyEvidence: ["champagne-glass", "camera-gap", "pharmacy-receipt"],
  },

  translations: {
    zh: {
      title: "丝绸画廊命案",
      victim: { causeOfDeath: "通过香槟投放氰化物中毒身亡" },
      evidence: {
        "champagne-glass": {
          name: "Victor的香槟酒杯",
          description:
            "酒杯中检出氰化钾残留。除Victor本人外，杯上只有一组指纹——属于Julian Park。",
        },
        "angry-email": {
          name: "Renata发给Victor的邮件",
          description:
            "三天前发出：「你若在莫雷尔画作收购上再压我的价，我会让你身败名裂。这不是威胁，是承诺。」Victor 回复：「你下不了手。」",
        },
        "camera-gap": {
          name: "监控录像空白段",
          description:
            "监控显示晚上 10:45 至 11:15 间为 30 分钟的循环画面。安保室门禁记录显示，门是以一张上周已报失的维护门卡开启的。",
        },
        "pharmacy-receipt": {
          name: "化学品采购记录",
          description:
            "Julian Park 于五天前用公司账户从特种化学品供应商处购买了含氰化钾的工业清洁剂。该笔采购曾被标记异常，但未获追查。",
        },
        "debt-note": {
          name: "Ivan的欠条",
          description:
            "在 Victor 外套中发现的手写便条：「Ivan Drake —— 欠款 34 万美元。最后期限：今晚。」便条上留有 Ivan 的指纹。",
        },
      },
      suspects: {
        "renata-voss": {
          name: "Renata Voss",
          relationship: "画廊经营者，亦是 Victor 在艺术品收藏界多年的宿敌",
          alibi: "自称晚上 10 点已离开贵宾休息室，此后一直在主展厅与宾客应酬。",
        },
        "julian-park": {
          name: "Julian Park",
          relationship:
            "曾受 Victor 指点的后起之秀艺术经纪人，随后窃取其最重要的客户名单而行背叛之举",
          alibi:
            "称约晚上 10:30 曾短暂进入贵宾休息室打招呼，之后便一直在主展厅。",
        },
        "sable-chen": {
          name: "Sable Chen",
          relationship: "画廊助理策展人，近一年来与 Victor 为秘密恋人关系",
          alibi:
            "称约晚上 10:50 曾短暂到贵宾休息室送画册，当时注意到 Victor 显得疲惫。",
        },
        "ivan-drake": {
          name: "Ivan Drake",
          relationship: "房地产开发商，因一笔失败合资项目欠 Victor 34 万美元",
          alibi: "坚称当晚从未进入贵宾休息室。",
        },
      },
    },
  },
};
