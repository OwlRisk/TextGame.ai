import type { MysteryCase } from "@/types/mystery-case";

/** Beginner case — 3 suspects, 4 evidence items, ~8-10 min */
export const hauntedCampus: MysteryCase = {
  id: "haunted-campus",
  title: "Death in the Drama Room",
  difficulty: 1,
  estimatedMinutes: 10,
  setting: `Whitmore University's old theater building was supposed to be empty at midnight. But when campus security responded to a triggered alarm at 12:30 AM, they found drama professor Helen Marsh dead in the prop storage room backstage — struck on the head with a heavy brass candlestick from the school's production of Macbeth. The backstage door was propped open with a brick. Three people had keys to the theater building and were known to be on campus that night.`,

  victim: {
    name: "Helen Marsh",
    description: "55-year-old drama professor, beloved by students but feared by colleagues. Known for harsh grading and departmental politics. Was about to publish a book exposing plagiarism in the arts faculty.",
    causeOfDeath: "Blunt force trauma to the back of the head from a brass candlestick",
  },

  timeline: [
    { time: "9:00 PM", actor: "Helen Marsh", action: "Seen entering the theater building alone, carrying a laptop bag.", isPublic: true },
    { time: "10:15 PM", actor: "Ryan Calder", action: "Enters the theater through the backstage door using his key. Goes to the lighting booth to retrieve equipment he forgot.", isPublic: false },
    { time: "10:30 PM", actor: "Ryan Calder", action: "Hears Helen on the phone in the prop room, arguing about 'the manuscript'. Leaves quietly through the backstage door, propping it open with a brick because his key sometimes jams.", isPublic: false },
    { time: "11:00 PM", actor: "Nora Bishop", action: "Enters through the propped-open backstage door. Confronts Helen about the plagiarism allegations.", isPublic: false },
    { time: "11:20 PM", actor: "Nora Bishop", action: "Argument escalates. Nora grabs the candlestick in a rage and strikes Helen. Helen collapses. Nora panics, wipes the candlestick with her sleeve, and flees through the backstage door.", isPublic: false },
    { time: "11:25 PM", actor: "Dex Okafor", action: "Arrives at the theater for a late rehearsal. Finds the backstage door propped open. Enters and discovers Helen's body.", isPublic: false },
    { time: "11:30 PM", actor: "Dex Okafor", action: "Panics. Instead of calling 911, he takes Helen's laptop from her bag (it contains his plagiarized thesis). Leaves through the backstage door.", isPublic: false },
    { time: "12:15 AM", actor: "Security", action: "Motion alarm triggers in the prop room (delayed sensor).", isPublic: true },
    { time: "12:30 AM", actor: "Security", action: "Guard finds Helen dead. Backstage door open, no sign of forced entry.", isPublic: true },
  ],

  evidence: [
    {
      id: "propped-door",
      name: "Propped backstage door",
      description: "The backstage door was held open with a standard red brick. No fingerprints on the brick — it was raining that night and the brick was wet.",
      revealAct: 1,
      type: "physical",
      pointsTo: "ryan-calder",
      isRedHerring: false,
    },
    {
      id: "candlestick-wiped",
      name: "Wiped candlestick",
      description: "The brass candlestick (murder weapon) was found next to the body. It had been partially wiped — most prints removed, but a faint palm print remains on the base. It doesn't match Helen or Ryan.",
      revealAct: 1,
      type: "physical",
      pointsTo: "nora-bishop",
      isRedHerring: false,
    },
    {
      id: "missing-laptop",
      name: "Helen's missing laptop",
      description: "Helen's laptop bag was found unzipped on a chair, but the laptop itself is gone. Helen was known to carry her plagiarism manuscript on it.",
      revealAct: 2,
      type: "physical",
      pointsTo: "dex-okafor",
      isRedHerring: false,
    },
    {
      id: "security-footage",
      name: "Parking lot camera footage",
      description: "The parking lot camera (the only exterior camera) shows: Ryan's car arriving at 10:12 PM and leaving at 10:35 PM. Nora's car arriving at 10:55 PM and leaving at 11:22 PM. Dex's car arriving at 11:24 PM and leaving at 11:33 PM.",
      revealAct: 2,
      type: "digital",
      pointsTo: "nora-bishop",
      isRedHerring: false,
    },
  ],

  suspects: [
    {
      id: "ryan-calder",
      gender: "male",
      name: "Ryan Calder",
      personality: "Laid-back theater tech in his late 20s. Speaks casually, uses humor to deflect. Gets serious and defensive when pressed about his timeline.",
      relationship: "Theater technician and Helen's former student, now staff. Had a friendly but complicated relationship with Helen.",
      alibi: "Says he was home all evening watching TV. Didn't go to campus.",
      alibiTruth: false,
      secrets: [
        "He was at the theater that night to retrieve a lighting controller he forgot",
        "He heard Helen arguing on the phone about a manuscript",
        "He propped the backstage door open because his key jams in the cold",
      ],
      lies: [
        "I was at home the entire night",
        "I haven't been to the theater building since last Friday",
      ],
      breakpoints: [
        "propped-door",
        "Mentioning that his car was seen in the parking lot at 10:12 PM",
        "Asking about his key to the theater building",
      ],
    },
    {
      id: "nora-bishop",
      gender: "female",
      name: "Nora Bishop",
      personality: "Tense, articulate literature professor in her 40s. Speaks in measured, academic sentences. Becomes increasingly agitated when the conversation turns to plagiarism or her career.",
      relationship: "Colleague in the English department. Helen's plagiarism book was about to name Nora's early published papers as containing unattributed passages.",
      alibi: "Claims she was at a faculty dinner off-campus until midnight, then went straight home.",
      alibiTruth: false,
      secrets: [
        "She went to the theater to beg Helen to remove her name from the manuscript",
        "She killed Helen in a moment of rage when Helen refused",
        "She wiped the candlestick but missed a palm print on the base",
      ],
      lies: [
        "I was at the faculty dinner until midnight",
        "I haven't spoken to Helen in weeks",
        "I didn't know about any plagiarism book",
      ],
      breakpoints: [
        "candlestick-wiped",
        "security-footage",
        "Mentioning the specific plagiarism allegations against her early papers",
      ],
    },
    {
      id: "dex-okafor",
      gender: "male",
      name: "Dex Okafor",
      personality: "Nervous, earnest graduate student in his early 20s. Speaks quickly, rambles when anxious. Genuinely remorseful but terrified of being accused of murder.",
      relationship: "Helen's graduate advisee. She had recently discovered his master's thesis contained plagiarized sections and was threatening to expel him.",
      alibi: "Says he was in the graduate library all night working on revisions to his thesis.",
      alibiTruth: false,
      secrets: [
        "He went to the theater to talk Helen out of reporting his plagiarism",
        "He found Helen already dead and stole her laptop to destroy evidence of his plagiarism",
        "He didn't kill her but he tampered with a crime scene",
      ],
      lies: [
        "I was in the library until 1 AM",
        "I don't know anything about Helen's laptop",
      ],
      breakpoints: [
        "missing-laptop",
        "Pointing out his car was in the parking lot at 11:24 PM",
        "Asking why his thesis advisor's laptop would concern him",
      ],
    },
  ],

  solution: {
    culpritId: "nora-bishop",
    motive: "Helen's upcoming book would have publicly exposed Nora's early academic work as containing plagiarized passages, destroying her career and reputation. When Helen refused to remove the allegations during their confrontation, Nora snapped.",
    method: "Nora entered through the backstage door that Ryan had propped open, confronted Helen in the prop room, and in a moment of rage struck her with a brass candlestick from the Macbeth production. She wiped the weapon but left a partial palm print.",
    keyEvidence: ["candlestick-wiped", "security-footage"],
  },

  translations: {
    zh: {
      title: "话剧室之死",
      victim: { causeOfDeath: "被黄铜烛台击中后脑，钝性创伤致死" },
      evidence: {
        "propped-door": {
          name: "被撑开的后台门",
          description:
            "后台门被一块普通红砖撑开。砖上没有指纹——当晚下着雨，砖块是湿的。",
        },
        "candlestick-wiped": {
          name: "被擦拭过的烛台",
          description:
            "黄铜烛台（凶器）在尸体旁被发现。曾被部分擦拭——大部分指纹已被抹去，但底座上仍留有一个淡淡的手掌印。与海伦或瑞安不符。",
        },
        "missing-laptop": {
          name: "Helen失踪的笔记本电脑",
          description:
            "海伦的电脑包在椅子上敞着口被找到，但笔记本本身不见了。大家都知道她把抄袭调查书稿存在里面。",
        },
        "security-footage": {
          name: "停车场监控录像",
          description:
            "停车场监控（唯一的外部摄像头）显示：瑞安的车于晚上10:12抵达、10:35离开；诺拉的车于10:55抵达、11:22离开；德克斯的车于11:24抵达、11:33离开。",
        },
      },
      suspects: {
        "ryan-calder": {
          relationship:
            "剧院技术员，海伦曾经的学生，现为职员。与海伦关系友好但微妙。",
          alibi: "称整晚在家看电视，没去过校园。",
        },
        "nora-bishop": {
          relationship:
            "英语系同事。海伦的抄袭调查专著即将点名诺拉早年发表论文中存在未注明出处的大段引用。",
          alibi: "声称校外的教师聚餐一直到午夜，然后直接回了家。",
        },
        "dex-okafor": {
          relationship:
            "海伦指导的研究生。她最近发现其硕士论文含抄袭片段，并威胁开除他。",
          alibi: "称整晚都在研究生图书馆改论文。",
        },
      },
    },
  },
};
