import type { MysteryCase } from "@/types/mystery-case";

/** Standard case — 4 suspects, 7 evidence items (2 red herrings), ~15 min */
export const arcticStation: MysteryCase = {
  id: "arctic-station",
  title: "Whiteout",
  difficulty: 2,
  estimatedMinutes: 15,
  setting: `Arctic Research Station Erebus sits 200 miles from the nearest settlement on the Svalbard archipelago. During a week-long blizzard that grounded all helicopters, lead climatologist Dr. Yuki Tanaka was found dead in the equipment shed at 6:00 AM — electrocuted by a sabotaged power coupling. The station's satellite uplink was also destroyed, cutting off all communication. Five researchers are stranded: one is dead, one is the killer, and no help is coming for at least three days.`,

  victim: {
    name: "Dr. Yuki Tanaka",
    description: "38-year-old Japanese-Canadian climatologist and station lead. Meticulous, disciplined, and respected. Had recently discovered irregularities in the station's data logs and was preparing a formal report to the university.",
    causeOfDeath: "Electrocution from a sabotaged 480V power coupling in the equipment shed",
  },

  timeline: [
    { time: "Day -3", actor: "Dr. Yuki Tanaka", action: "Discovers that climate data from Sensors 7-12 has been fabricated for the past eight months. Confronts the team about 'data quality issues' without naming anyone.", isPublic: true },
    { time: "Day -2", actor: "Dr. Yuki Tanaka", action: "Privately tells Sven Eriksen she knows someone is falsifying data and she'll report it when communications are restored.", isPublic: false },
    { time: "Day -1, 9:00 PM", actor: "Sven Eriksen", action: "Goes to the equipment shed and modifies the power coupling on Junction Box C — stripping insulation and rerouting the ground wire so the housing becomes live when switched on. He knows Yuki always does the morning power check.", isPublic: false },
    { time: "Day -1, 10:30 PM", actor: "Dr. Amara Osei", action: "Is in the lab reviewing Yuki's data audit notes. Makes copies for her own reference because she suspects Sven.", isPublic: false },
    { time: "Day 0, 5:45 AM", actor: "Dr. Yuki Tanaka", action: "Goes to the equipment shed for the daily power systems check, as she always does. Touches Junction Box C and is electrocuted.", isPublic: false },
    { time: "Day 0, 6:00 AM", actor: "Lena Marsh", action: "Finds Yuki dead in the equipment shed when she goes to refuel the backup generator.", isPublic: true },
    { time: "Day 0, 6:15 AM", actor: "All", action: "Station alarm is raised. The team discovers the satellite uplink has also been physically destroyed — someone cut the cables during the night.", isPublic: true },
  ],

  evidence: [
    {
      id: "sabotaged-coupling",
      name: "Modified Junction Box C",
      description: "The power coupling on Junction Box C had its ground wire deliberately rerouted and insulation stripped, making the metal housing carry 480 volts when the circuit was active. The modification required knowledge of the station's electrical system and at least 20 minutes of work.",
      revealAct: 1,
      type: "physical",
      pointsTo: "sven-eriksen",
      isRedHerring: false,
    },
    {
      id: "fabricated-data",
      name: "Falsified sensor data",
      description: "Sensors 7-12 show climate readings that don't match satellite cross-reference data for the past 8 months. The fabricated entries were made using the workstation in the data lab, which requires a personal login. The login records show all entries were made under Sven Eriksen's credentials.",
      revealAct: 2,
      type: "digital",
      pointsTo: "sven-eriksen",
      isRedHerring: false,
    },
    {
      id: "cut-uplink",
      name: "Destroyed satellite uplink",
      description: "The satellite communication cables were physically severed with wire cutters sometime between midnight and 5 AM. A pair of wire cutters with fresh copper residue was found in the tool chest — all team members have access.",
      revealAct: 1,
      type: "physical",
      pointsTo: "sven-eriksen",
      isRedHerring: false,
    },
    {
      id: "sven-gloves",
      name: "Sven's insulated gloves",
      description: "A pair of high-voltage insulated gloves were found under Sven's bunk, still dusty from the equipment shed. These gloves are normally stored in the shed and would be necessary to safely modify a live junction box.",
      revealAct: 2,
      type: "physical",
      pointsTo: "sven-eriksen",
      isRedHerring: false,
    },
    {
      id: "amara-notes",
      name: "Amara's copies of audit notes",
      description: "Dr. Osei has detailed copies of Yuki's data audit on her personal tablet, made the night before the murder. She also has a drafted email to the university board about the data fraud, addressed to the department chair.",
      revealAct: 2,
      type: "document",
      pointsTo: "amara-osei",
      isRedHerring: true,
    },
    {
      id: "lena-insurance",
      name: "Lena's life insurance query",
      description: "Lena's email (cached locally before the uplink was cut) shows she recently inquired about the station's accidental death insurance policy. She asked HR 'what happens if someone dies at a remote station during a comms blackout.'",
      revealAct: 2,
      type: "digital",
      pointsTo: "lena-marsh",
      isRedHerring: true,
    },
    {
      id: "yuki-private-log",
      name: "Yuki's private journal",
      description: "Yuki kept a personal encrypted journal on her laptop. The entry from Day -2 reads: 'Told Sven I know about the data. He went pale. I shouldn't have warned him but I wanted to give him a chance to come clean before I file the report.'",
      revealAct: 3,
      type: "document",
      pointsTo: "sven-eriksen",
      isRedHerring: false,
    },
  ],

  suspects: [
    {
      id: "sven-eriksen",
      gender: "male",
      name: "Sven Eriksen",
      personality: "Quiet, methodical Norwegian engineer in his mid-40s. Speaks slowly and carefully, projecting calm competence. Under pressure, he becomes evasive rather than aggressive — pauses lengthen, answers become vague. A planner, not an improviser.",
      relationship: "Station electrical engineer and data systems manager. Had been at the station for 3 years. Responsible for maintaining both the power grid and the sensor data collection system.",
      alibi: "Claims he was asleep from 10 PM until the alarm at 6:15 AM. Says he's a heavy sleeper and didn't hear anything.",
      alibiTruth: false,
      secrets: [
        "He fabricated 8 months of climate data to support his upcoming grant renewal — without compelling data his funding and career are finished",
        "Yuki privately confronted him about the data fraud on Day -2",
        "He sabotaged Junction Box C the night before, knowing Yuki always did the morning power check",
        "He cut the satellite uplink cables to delay any report reaching the university",
      ],
      lies: [
        "The data irregularities must be a sensor malfunction, not fabrication",
        "I was asleep from 10 PM to 6:15 AM",
        "I have no idea how the junction box was modified — anyone could have done it",
        "I didn't know Yuki was planning to file a report",
      ],
      breakpoints: [
        "fabricated-data",
        "sven-gloves",
        "yuki-private-log",
        "Pointing out that only someone with electrical expertise could safely modify a live 480V coupling",
        "Asking why insulated gloves from the shed were under his bunk",
      ],
    },
    {
      id: "amara-osei",
      gender: "female",
      name: "Dr. Amara Osei",
      personality: "Direct, confident Ghanaian-British atmospheric scientist in her early 30s. Speaks with precision, doesn't tolerate vagueness. Fiercely protective of scientific integrity. Cooperative but becomes frustrated when she feels she's being suspected instead of helped.",
      relationship: "Junior researcher on the team. Respected Yuki deeply and was informally her protégée. Suspected the data fraud independently and was building her own case.",
      alibi: "Was in the data lab until 11 PM reviewing Yuki's notes, then went to bed. Woke up to the alarm at 6:15 AM.",
      alibiTruth: true,
      secrets: [
        "She copied Yuki's audit notes and drafted her own report to the university, ready to send if Yuki's report was suppressed",
        "She suspects Sven strongly but has no proof beyond the data logs",
      ],
      lies: [],
      breakpoints: [
        "amara-notes",
        "Asking about her drafted email to the university board",
      ],
    },
    {
      id: "lena-marsh",
      gender: "female",
      name: "Lena Marsh",
      personality: "Tough, practical Canadian logistics coordinator in her late 30s. Former military. Blunt, no-nonsense communicator. Gets annoyed by theoretical discussions — wants facts and action. Surprisingly emotional when discussing Yuki.",
      relationship: "Station logistics and safety officer. She and Yuki had become close friends over two Arctic winters. She found the body.",
      alibi: "Went to bed at 9:30 PM (early riser). Woke at 5:50 AM for her usual generator maintenance. Found Yuki in the shed at 6:00 AM.",
      alibiTruth: true,
      secrets: [
        "She asked about the insurance policy because she was worried about safety during the extended blizzard, not because she was planning anything",
        "She noticed Sven acting strangely the day before but didn't connect it to anything at the time",
      ],
      lies: [],
      breakpoints: [
        "lena-insurance",
        "Asking her to describe exactly how she found the body and what seemed wrong",
      ],
    },
    {
      id: "pavel-volkov",
      gender: "male",
      name: "Pavel Volkov",
      personality: "Gruff, sardonic Russian glaciologist in his 50s. Speaks in short, blunt sentences. Dark humor. Outwardly indifferent but deeply unsettled by the murder. Distrustful of authority and institutions.",
      relationship: "Senior researcher, been at Arctic stations for 15 years. Knew Yuki professionally, respected her work. Had little interaction with Sven and openly considered him 'mediocre.'",
      alibi: "Was in his quarters reading from 8 PM onward. 'I'm old, I go to bed early. I heard nothing.' He sleeps with earplugs due to generator noise.",
      alibiTruth: true,
      secrets: [
        "He noticed Sven accessing the data lab at unusual hours weeks ago but didn't report it because 'it's not my business'",
        "He privately thinks Sven is the killer but refuses to accuse without proof — 'In Russia, we learn not to point fingers without evidence'",
      ],
      lies: [],
      breakpoints: [
        "Asking about unusual activity at the data lab in recent weeks",
        "Pressing him on what he's observed about Sven's behavior",
      ],
    },
  ],

  solution: {
    culpritId: "sven-eriksen",
    motive: "Sven had been fabricating climate data for 8 months to secure a critical grant renewal. When Yuki discovered the fraud and told him she would file a formal report once communications were restored, he faced the complete destruction of his career, reputation, and potential criminal charges for scientific fraud. He decided to kill Yuki and destroy the satellite uplink to buy time.",
    method: "The night before, Sven used high-voltage insulated gloves to sabotage Junction Box C in the equipment shed — stripping insulation and rerouting the ground wire so the housing would carry 480 volts. He knew Yuki always performed the morning power check and would touch the junction box. He also cut the satellite communication cables to prevent anyone from reporting the murder or the data fraud.",
    keyEvidence: ["sabotaged-coupling", "fabricated-data", "sven-gloves", "yuki-private-log"],
  },

  translations: {
    zh: {
      title: "白茫茫",
      victim: {
        causeOfDeath: "在设备棚中因被蓄意破坏的480伏电力接头触电身亡",
      },
      evidence: {
        "sabotaged-coupling": {
          name: "被改装的C号接线盒",
          description:
            "C号接线盒上的电力接头被故意改接：地线被改路、绝缘被剥除，电路接通时金属外壳会带有480伏电压。这种改装需要对站内电气系统有所了解，且至少需要约20分钟操作。",
        },
        "fabricated-data": {
          name: "伪造的传感器数据",
          description:
            "过去8个月内，7至12号传感器的气候读数与卫星交叉校验数据不符。伪造记录通过数据实验室的工作站录入，需个人账号登录。登录记录显示，所有条目均使用Sven Eriksen的凭据。",
        },
        "cut-uplink": {
          name: "被切断的卫星通信线路",
          description:
            "卫星通信线缆在午夜至凌晨5点之间被钢丝钳剪断。工具箱中发现一把沾有新鲜铜屑的钢丝钳——全体队员均可取用工具。",
        },
        "sven-gloves": {
          name: "Sven的绝缘手套",
          description:
            "在Sven铺位下发现一双高压绝缘手套，上面仍沾有设备棚的灰尘。这类手套通常存放在棚内，要对带电的接线盒进行安全改装时必须使用。",
        },
        "amara-notes": {
          name: "Amara复制的审计笔记",
          description:
            "Osei博士的个人平板上有案发前夜制作的Yuki数据审计详细副本。她还草拟了一封致系主任、发往大学董事会的邮件，内容是关于数据造假。",
        },
        "lena-insurance": {
          name: "Lena的人身保险查询",
          description:
            "通信被切断前本地缓存的Lena邮件显示，她最近询问了站点的意外身故保险。她曾向人事询问：“若在通讯中断期间有人在偏远站点死亡会怎样。”",
        },
        "yuki-private-log": {
          name: "Yuki的私人日记",
          description:
            "Yuki在笔记本电脑上保留私人加密日记。案发两天前的条目写道：“我告诉Sven我知道数据的事。他脸色煞白。我不该警告他，但我想在正式提交报告前给他自首的机会。”",
        },
      },
      suspects: {
        "sven-eriksen": {
          name: "Sven Eriksen",
          relationship:
            "站内电力工程师兼数据系统主管。已在站三年。负责维护电网与传感器数据采集系统。",
          alibi:
            "声称从晚上10点到早晨6点15分警报响起一直在睡觉。自称睡得很沉，什么也没听见。",
        },
        "amara-osei": {
          name: "Dr. Amara Osei",
          relationship:
            "团队中的初级研究员。非常敬重Yuki，非正式上算是她的门生。独立怀疑数据造假并正在自行搜集证据。",
          alibi:
            "在数据实验室审阅Yuki的笔记直到晚上11点，然后上床睡觉。早晨6点15分被警报叫醒。",
        },
        "lena-marsh": {
          name: "Lena Marsh",
          relationship:
            "站内后勤与安全负责人。她与Yuki经过两个北极冬季已成为密友。是她发现了尸体。",
          alibi:
            "晚上9点30分就寝（习惯早起）。早晨5点50分照常醒来准备发电机维护。6点在棚内发现Yuki遗体。",
        },
        "pavel-volkov": {
          name: "Pavel Volkov",
          relationship:
            "资深研究员，在北极考察站工作已15年。与Yuki是专业上的相识，敬重她的工作。与Sven往来不多，曾公开认为他“能力平平”。",
          alibi:
            "从晚上8点起就在舱室阅读。“我老了，睡得早。什么都没听见。”因发电机噪音睡觉时戴耳塞。",
        },
      },
    },
  },
};
