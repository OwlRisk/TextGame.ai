import type { MysteryCase } from "@/types/mystery-case";

/** Beginner case — 3 suspects, 4 evidence items, ~8-10 min */
export const moonlightInn: MysteryCase = {
  id: "moonlight-inn",
  title: "The Moonlight Inn Murder",
  difficulty: 1,
  estimatedMinutes: 10,
  setting: `A remote countryside inn on a stormy night. The power went out at 10:15 PM and came back at 10:40 PM. During those 25 dark minutes, the inn's owner, Gerald Price, was found dead in his private study on the second floor — stabbed with a letter opener from his own desk. The study door was locked from inside; the only window was found open, curtains soaked by rain. Five guests were staying at the inn that night, but only three had any connection to the victim.`,

  victim: {
    name: "Gerald Price",
    description: "68-year-old inn owner, retired banker. Known for being secretive about his past. Recently changed his will.",
    causeOfDeath: "Single stab wound to the chest with a brass letter opener",
  },

  timeline: [
    { time: "9:00 PM", actor: "All", action: "Dinner in the common room. Gerald announces he's feeling unwell and retires early.", isPublic: true },
    { time: "9:30 PM", actor: "Gerald", action: "Locks himself in his study. Heard arguing on the phone by the housekeeper.", isPublic: false },
    { time: "10:00 PM", actor: "Diana Cole", action: "Goes to the second floor, claiming a headache. Actually visits Gerald's study to confront him about the will.", isPublic: false },
    { time: "10:10 PM", actor: "Diana Cole", action: "Leaves Gerald's study after a heated argument. Gerald is alive.", isPublic: false },
    { time: "10:15 PM", actor: "Storm", action: "Lightning strikes the transformer. Power goes out.", isPublic: true },
    { time: "10:18 PM", actor: "Marcus Webb", action: "Climbs to the study via the drainpipe and open window. Stabs Gerald with the letter opener. Exits through the window.", isPublic: false },
    { time: "10:20 PM", actor: "Marcus Webb", action: "Returns to the common room, claiming he was in the bathroom.", isPublic: false },
    { time: "10:25 PM", actor: "Lionel Sharpe", action: "Tries Gerald's study door, finds it locked. Knocks, no answer.", isPublic: false },
    { time: "10:40 PM", actor: "Storm", action: "Power restored.", isPublic: true },
    { time: "10:45 PM", actor: "Housekeeper", action: "Finds Gerald dead when bringing tea. Study door still locked — opened with master key.", isPublic: true },
  ],

  evidence: [
    {
      id: "mud-on-drainpipe",
      name: "Fresh mud on the drainpipe",
      description: "The drainpipe outside Gerald's study window has fresh scrape marks and muddy handprints, despite the rain washing most surfaces clean. Someone climbed it recently.",
      revealAct: 1,
      type: "physical",
      pointsTo: "marcus-webb",
      isRedHerring: false,
    },
    {
      id: "will-change",
      name: "Gerald's revised will",
      description: "A draft will found on Gerald's desk removes Diana Cole as primary beneficiary and leaves everything to a charity. Dated today, unsigned.",
      revealAct: 1,
      type: "document",
      pointsTo: "diana-cole",
      isRedHerring: false,
    },
    {
      id: "torn-cuff",
      name: "Torn shirt cuff with blood",
      description: "A torn piece of blue fabric found snagged on the window latch. It has a small bloodstain. Marcus Webb was wearing a blue shirt at dinner.",
      revealAct: 2,
      type: "physical",
      pointsTo: "marcus-webb",
      isRedHerring: false,
    },
    {
      id: "phone-records",
      name: "Gerald's phone log",
      description: "Gerald's last call at 9:30 PM was to a London solicitor. The call lasted 8 minutes. The solicitor confirms Gerald was finalizing the will change and mentioned 'someone from his past showing up.'",
      revealAct: 2,
      type: "digital",
      pointsTo: "marcus-webb",
      isRedHerring: false,
    },
  ],

  suspects: [
    {
      id: "diana-cole",
      name: "Diana Cole",
      personality: "Composed, sharp-tongued woman in her 40s. Speaks precisely and deflects with wit. Cracks when emotionally cornered.",
      relationship: "Gerald's estranged niece and current primary beneficiary of his will",
      alibi: "Claims she was in her room all evening after dinner, reading a novel.",
      alibiTruth: false,
      secrets: [
        "She visited Gerald's study at 10 PM to argue about the will change",
        "She has massive gambling debts and desperately needs the inheritance",
      ],
      lies: [
        "I never left my room after dinner",
        "I didn't know about any will changes",
      ],
      breakpoints: [
        "will-change",
        "Mentioning that the housekeeper heard arguing from the study before the blackout",
      ],
    },
    {
      id: "marcus-webb",
      name: "Marcus Webb",
      personality: "Quiet, polite man in his 30s. Fidgets when nervous. Overly helpful and eager to appear cooperative. Answers get shorter when pressed.",
      relationship: "Claims to be a travel writer passing through. Actually Gerald's illegitimate son, abandoned at birth.",
      alibi: "Says he was in the common room all evening, then went to the bathroom during the blackout.",
      alibiTruth: false,
      secrets: [
        "He is Gerald's illegitimate son who tracked him down",
        "He climbed the drainpipe during the blackout and killed Gerald",
        "His real name is Marcus Price, changed to Webb years ago",
      ],
      lies: [
        "I'm just a travel writer, never met Gerald before checking in yesterday",
        "I was in the bathroom during the entire blackout",
        "I have no connection to this place or its owner",
      ],
      breakpoints: [
        "torn-cuff",
        "mud-on-drainpipe",
        "Asking why a 'travel writer' has no published articles",
        "Confronting him about his shirt cuff being torn",
      ],
    },
    {
      id: "lionel-sharpe",
      name: "Lionel Sharpe",
      personality: "Loud, blustering retired colonel. Speaks in declarations. Gets defensive and red-faced when challenged but is fundamentally honest.",
      relationship: "Gerald's old business partner from his banking days. They had a falling out 10 years ago over a failed investment.",
      alibi: "Says he was in the common room drinking whiskey, then went upstairs during the blackout to check on Gerald.",
      alibiTruth: true,
      secrets: [
        "He came to the inn specifically to reconcile with Gerald and discuss a new business venture",
        "He tried Gerald's study door during the blackout and found it locked",
      ],
      lies: [
        "I was just passing through, coincidence we ended up at the same inn",
      ],
      breakpoints: [
        "Asking directly about his history with Gerald",
        "Pointing out that his booking was made after Gerald's was confirmed",
      ],
    },
  ],

  solution: {
    culpritId: "marcus-webb",
    motive: "Gerald abandoned Marcus at birth. Marcus tracked him down, discovered Gerald was about to donate his entire fortune to charity rather than acknowledge his son. Rage and a lifetime of resentment drove him to kill.",
    method: "During the 25-minute blackout, Marcus climbed the drainpipe to Gerald's open study window, entered the room, and stabbed him with the letter opener on the desk. He exited through the window and returned to the common room.",
    keyEvidence: ["mud-on-drainpipe", "torn-cuff", "phone-records"],
  },
};
