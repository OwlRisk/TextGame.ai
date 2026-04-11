import type { MysteryCase } from "@/types/mystery-case";

/** Hard case — 5 suspects, 7 evidence items, ~15-20 min */
export const midnightExpress: MysteryCase = {
  id: "midnight-express",
  title: "Murder on the Midnight Express",
  difficulty: 3,
  estimatedMinutes: 20,
  setting: `The Midnight Express, a luxury overnight train from Vienna to Istanbul, departed at 11:00 PM. At 2:15 AM, conductor Heinrich discovered the body of Professor Elias Krone in his private sleeper compartment — Car 3, Room 7. The professor had been strangled with a silk cord. The train was between stations with no stops until 6:00 AM, meaning the killer is still on board. Five passengers in the adjacent compartments are suspects. The corridor security camera shows all five entered Car 3's corridor between midnight and 2:00 AM.`,

  victim: {
    name: "Professor Elias Krone",
    description: "64-year-old historian specializing in World War II-era art looting. Was en route to Istanbul to present evidence that would expose a major art restitution fraud worth $80 million. Carried a briefcase of original documents.",
    causeOfDeath: "Strangulation with a braided silk cord",
  },

  timeline: [
    { time: "11:00 PM", actor: "All", action: "Train departs Vienna. Passengers settle into their compartments.", isPublic: true },
    { time: "11:30 PM", actor: "Professor Krone", action: "Dines in the restaurant car. Mentions his Istanbul presentation to the waiter.", isPublic: true },
    { time: "12:00 AM", actor: "Nadine Richter", action: "Visits Krone in his compartment. They argue about her grandfather's wartime collection. She leaves after 15 minutes.", isPublic: false },
    { time: "12:20 AM", actor: "Oleg Petrov", action: "Passes through Car 3 corridor. Stops at Krone's door, listens, then continues to the bar car.", isPublic: false },
    { time: "12:45 AM", actor: "Theo Adler", action: "Knocks on Krone's door. Brief conversation about the documents. Krone refuses to show them. Theo leaves.", isPublic: false },
    { time: "1:10 AM", actor: "Yuki Tanaka", action: "Walks through Car 3 corridor to get water from the service station. Sees Krone's light on through the gap under the door.", isPublic: false },
    { time: "1:30 AM", actor: "Oleg Petrov", action: "Returns from bar car through Car 3 corridor. Enters Krone's compartment with a stolen master key. Strangles Krone. Takes the briefcase documents.", isPublic: false },
    { time: "1:40 AM", actor: "Oleg Petrov", action: "Returns to his own compartment with documents hidden in his coat lining.", isPublic: false },
    { time: "1:50 AM", actor: "Margaux Duval", action: "Passes through Car 3 corridor on her way back from the bathroom. Notices Krone's door slightly ajar.", isPublic: false },
    { time: "2:15 AM", actor: "Conductor", action: "Finds Krone dead during routine check. Briefcase is open and empty. Alerts the authorities via radio.", isPublic: true },
  ],

  evidence: [
    {
      id: "silk-cord",
      name: "Braided silk cord",
      description: "The murder weapon is a distinctive braided silk cord, 80cm long. It matches the cord style used as bookmark ribbons in antique Ottoman manuscripts — a specialty of certain rare book dealers.",
      revealAct: 1,
      type: "physical",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
    {
      id: "corridor-camera",
      name: "Car 3 corridor camera footage",
      description: "Timestamp log shows five people entered the Car 3 corridor between midnight and 2 AM: Nadine (12:00), Oleg (12:20 and 1:30), Theo (12:45), Yuki (1:10), Margaux (1:50). Oleg is the only person who entered twice.",
      revealAct: 1,
      type: "digital",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
    {
      id: "nadine-letter",
      name: "Threatening letter from Nadine",
      description: "A letter in Krone's compartment, sent by Nadine Richter two weeks ago: 'If you publish that report, you'll destroy my family's name. I won't allow it. Meet me on the train or face consequences.'",
      revealAct: 1,
      type: "document",
      pointsTo: "nadine-richter",
      isRedHerring: true,
    },
    {
      id: "master-key",
      name: "Missing master key",
      description: "The conductor reports that a spare master key for Car 3 went missing from the service closet earlier that evening. The closet was unlocked between 11:00 PM and midnight.",
      revealAct: 2,
      type: "physical",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
    {
      id: "olegs-passport",
      name: "Oleg's second passport",
      description: "Hidden in Oleg's luggage: a second passport under the name 'Alexei Volkov', with visas to Turkey and Switzerland — both countries with major art auction houses. The passport photo matches Oleg.",
      revealAct: 2,
      type: "document",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
    {
      id: "theo-recording",
      name: "Theo's secret audio recording",
      description: "Theo admits he was secretly recording his conversation with Krone. The recording (on his phone) captures Krone saying: 'The Volkov family is at the center of the fraud. I have proof.' Krone was alive and lucid at 12:50 AM.",
      revealAct: 2,
      type: "digital",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
    {
      id: "hidden-documents",
      name: "Documents in Oleg's coat lining",
      description: "A thorough search of Oleg's compartment reveals Krone's missing documents sewn into the lining of Oleg's winter coat. The documents detail the Volkov family's $80M art fraud scheme.",
      revealAct: 3,
      type: "physical",
      pointsTo: "oleg-petrov",
      isRedHerring: false,
    },
  ],

  suspects: [
    {
      id: "nadine-richter",
      gender: "female",
      name: "Nadine Richter",
      personality: "Aristocratic German woman in her 40s. Poised and articulate but barely containing fury. Speaks with cutting precision. Breaks down when her family honor is questioned.",
      relationship: "Granddaughter of a WWII-era art collector accused in Krone's research of acquiring looted artwork",
      alibi: "Says she visited Krone at midnight to have a civil discussion about her family's collection, then returned to her compartment and slept.",
      alibiTruth: true,
      secrets: [
        "Her visit to Krone was far from civil — she threatened legal action and they shouted at each other",
        "She knows her grandfather did acquire looted art but refuses to admit it publicly",
        "She was planning to offer Krone money to suppress parts of his report",
      ],
      lies: [
        "Our conversation was perfectly civil and academic",
        "I have nothing to hide about my family's art collection",
      ],
      breakpoints: [
        "nadine-letter",
        "Asking what exactly was discussed behind the closed door",
        "Mentioning that the conductor heard raised voices from Krone's room around midnight",
      ],
    },
    {
      id: "oleg-petrov",
      gender: "male",
      name: "Oleg Petrov",
      personality: "Smooth, urbane Russian antiquarian book dealer in his 50s. Impeccable manners, dry humor, never rushed. Maintains perfect composure until physical evidence is presented — then turns ice-cold and calculating.",
      relationship: "Rare book dealer whose family (the Volkovs) is implicated in the art fraud Krone was about to expose",
      alibi: "Claims he walked through Car 3 corridor once at 12:20 AM on the way to the bar car, returned around 1:30 AM, and went straight to his compartment to sleep.",
      alibiTruth: false,
      secrets: [
        "His real family name is Volkov — Petrov is his mother's maiden name adopted to hide the connection",
        "He stole the conductor's spare master key to enter Krone's locked compartment",
        "He strangled Krone and took the incriminating documents",
        "The silk cord he used was from his own collection of Ottoman manuscript accessories",
      ],
      lies: [
        "I am a simple book dealer with no connection to the art world's controversies",
        "I walked past Krone's compartment without stopping on my way back from the bar",
        "I have never heard the name Volkov in any professional context",
      ],
      breakpoints: [
        "olegs-passport",
        "silk-cord",
        "hidden-documents",
        "Mentioning the name 'Volkov' and watching his reaction",
        "Asking about his second visit to Car 3 corridor at 1:30 AM",
      ],
    },
    {
      id: "theo-adler",
      gender: "male",
      name: "Theo Adler",
      personality: "Intense, disheveled investigative journalist in his 30s. Speaks rapidly, interrupts himself, and jumps between topics. Passionate about truth but ethically flexible about how he gets it.",
      relationship: "Journalist who was working with Krone to publish the art fraud exposé",
      alibi: "Says he knocked on Krone's door at 12:45 AM to discuss their collaboration, was turned away, and went back to his compartment.",
      alibiTruth: true,
      secrets: [
        "He secretly recorded his conversation with Krone through the door",
        "He was planning to publish the story before Krone's presentation to scoop him",
        "The recording captures Krone mentioning the Volkov family by name",
      ],
      lies: [
        "I didn't record anything — that would be unethical",
        "Krone and I had a purely professional relationship with no tension",
      ],
      breakpoints: [
        "Asking why he seemed so eager to see the documents that night",
        "Pointing out that journalists often record conversations",
        "Mentioning that his phone shows a large audio file from that night",
      ],
    },
    {
      id: "yuki-tanaka",
      gender: "female",
      name: "Yuki Tanaka",
      personality: "Calm, observant Japanese art restorer in her 30s. Speaks softly with precise word choices. Extremely detail-oriented — notices things others miss. Reluctant to share observations unless directly asked.",
      relationship: "Art restorer hired by a Swiss auction house to authenticate pieces from the collection Krone was investigating",
      alibi: "Says she walked through Car 3 to get water at 1:10 AM and noticed light under Krone's door. Did not interact with anyone.",
      alibiTruth: true,
      secrets: [
        "Her employer, the Swiss auction house, is complicit in the art fraud",
        "She was on the train to monitor what Krone knew, but not to harm him",
        "She noticed a faint smell of sandalwood in the corridor at 1:10 AM — Oleg wears sandalwood cologne",
        "She saw Oleg's compartment door slightly open as she passed it at 1:10 AM — meaning he was awake, contradicting his claim of sleeping",
      ],
      lies: [
        "I'm traveling for personal reasons, not work",
      ],
      breakpoints: [
        "Asking specifically what she noticed in the corridor — smells, sounds, open doors",
        "Asking about her employer's connection to the disputed artworks",
      ],
    },
    {
      id: "margaux-duval",
      gender: "female",
      name: "Margaux Duval",
      personality: "Theatrical French socialite in her 60s. Speaks in dramatic, sweeping statements. Loves gossip and attention. Will share observations freely if she feels important. Exaggerates but rarely outright lies.",
      relationship: "Old acquaintance of both Krone and the Richter family. Patron of the arts with connections to every major gallery in Europe.",
      alibi: "Says she was returning from the bathroom at 1:50 AM and noticed Krone's door was slightly open. Assumed he stepped out.",
      alibiTruth: true,
      secrets: [
        "She brokered the original sale of several disputed artworks decades ago and fears Krone's report would implicate her",
        "She saw what she now realizes was a shadow moving inside Krone's compartment as she passed — at the time she thought it was Krone",
        "She had been drinking heavily and is unsure of exact timings",
      ],
      lies: [
        "I barely knew the professor — we moved in very different circles",
      ],
      breakpoints: [
        "Asking in detail what she saw through the slightly open door",
        "Flattering her observation skills and asking her to think harder about that shadow",
        "Mentioning her role in past art sales connected to the disputed collection",
      ],
    },
  ],

  solution: {
    culpritId: "oleg-petrov",
    motive: "Oleg Petrov is actually Oleg Volkov. Krone's Istanbul presentation would have exposed the Volkov family's $80 million art restitution fraud — forging provenance documents to legitimize looted WWII artwork and selling it through Swiss auction houses. The exposure would mean criminal prosecution and the loss of everything.",
    method: "Oleg stole the conductor's spare master key during the evening. At 1:30 AM, he used it to enter Krone's locked compartment and strangled the professor with a silk cord from his own Ottoman manuscript collection. He took the incriminating documents from Krone's briefcase and hid them in his coat lining. He returned to his compartment by 1:40 AM.",
    keyEvidence: ["corridor-camera", "olegs-passport", "silk-cord", "hidden-documents", "theo-recording"],
  },

  translations: {
    zh: {
      title: "午夜快车谋杀案",
      victim: { causeOfDeath: "被编织丝绳勒死" },
      evidence: {
        "silk-cord": {
          name: "编织丝绳",
          description:
            "凶器是一条醒目的编织丝绳，长约 80 厘米。其编法与古奥斯曼手稿中用作书签丝带的绳式一致——这是部分珍本书商专攻的领域。",
        },
        "corridor-camera": {
          name: "3号车厢走廊监控录像",
          description:
            "时间戳记录显示午夜至凌晨 2 点间共有五人进入 3 号车厢走廊：Nadine（0:00）、Oleg（0:20 与 1:30）、Theo（0:45）、Yuki（1:10）、Margaux（1:50）。Oleg 是唯一进出过两次的人。",
        },
        "nadine-letter": {
          name: "Nadine的威胁信",
          description:
            "Krone 车厢内的一封信，两周前由 Nadine Richter 寄出：「若你发表那份报告，会毁了我家声誉。我绝不允许。到火车上见我，否则后果自负。」",
        },
        "master-key": {
          name: "丢失的万能钥匙",
          description:
            "列车员报告称，当晚早些时候 3 号车厢的一把备用万能钥匙在服务柜中失踪。晚上 11 点至午夜之间该服务柜未上锁。",
        },
        "olegs-passport": {
          name: "Oleg的第二本护照",
          description:
            "藏在 Oleg 行李中：以「Alexei Volkov」为名的第二本护照，上有土耳其与瑞士签证——两国均有大型艺术品拍卖行。照片与 Oleg 相符。",
        },
        "theo-recording": {
          name: "Theo的秘密录音",
          description:
            "Theo 承认他曾偷偷录下与 Krone 的对话。手机中的录音录到 Krone 说：「Volkov 家族才是诈骗的核心。我有证据。」凌晨 12:50 时 Krone 仍清醒活着。",
        },
        "hidden-documents": {
          name: "Oleg大衣夹层中的文件",
          description:
            "彻底搜查 Oleg 的包间后发现，Krone 失踪的文件缝在 Oleg 冬大衣的夹层里。文件详述了 Volkov 家族涉案金额 8000 万美元的艺术品归还诈骗计划。",
        },
      },
      suspects: {
        "nadine-richter": {
          relationship:
            "二战时期艺术品收藏家的孙女；Krone 的研究指控其祖父曾收购被掠夺的艺术品",
          alibi:
            "称她午夜拜访 Krone 是为了就家族藏品进行文明讨论，随后回到自己的包间入睡。",
        },
        "oleg-petrov": {
          relationship:
            "珍本书商；其家族（Volkovs）被卷入 Krone 即将揭发的艺术品诈骗案",
          alibi:
            "称凌晨 0:20 去酒吧车厢时曾走过一次 3 号车厢走廊，约凌晨 1:30 返回后便直接回包间睡觉。",
        },
        "theo-adler": {
          relationship: "与 Krone 合作准备发表艺术品诈骗曝光报道的记者",
          alibi:
            "称凌晨 0:45 敲 Krone 的门讨论合作事宜，被拒后回到自己的包间。",
        },
        "yuki-tanaka": {
          relationship:
            "受瑞士一家拍卖行委托，为 Krone 正在调查的藏品中的作品做鉴定的艺术品修复师",
          alibi:
            "称凌晨 1:10 走过 3 号车厢去接水，注意到 Krone 门缝下有灯光。未与任何人交谈。",
        },
        "margaux-duval": {
          relationship:
            "与 Krone 及 Richter 家族均为旧识。资助艺术的赞助人，与欧洲各大画廊都有往来。",
          alibi:
            "称凌晨 1:50 从洗手间返回时路过，注意到 Krone 的门微开，以为他暂时离开。",
        },
      },
    },
  },
};
