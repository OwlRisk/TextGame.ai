import type { MysteryCase } from "@/types/mystery-case";

/** Standard case — 4 suspects, 6 evidence items (1 red herring), ~15 min */
export const poisonBanquet: MysteryCase = {
  id: "poison-banquet",
  title: "The Last Toast",
  difficulty: 2,
  estimatedMinutes: 15,
  setting: `The Belmont family's annual New Year's dinner at their Manhattan penthouse ended in tragedy. At exactly midnight, patriarch Victor Belmont raised his champagne glass for a toast, took a sip, and collapsed. He was dead within minutes. The toxicology report revealed cyanide in his champagne flute — and only his flute. The penthouse was locked, the staff had been dismissed for the night, and only four family members were present. The champagne bottle itself was clean.`,

  victim: {
    name: "Victor Belmont",
    description: "72-year-old real estate mogul worth $400 million. Controlling, manipulative patriarch who wielded his fortune as leverage over his family. Was about to announce major changes to his will at midnight.",
    causeOfDeath: "Acute cyanide poisoning delivered via his champagne flute",
  },

  timeline: [
    { time: "8:00 PM", actor: "All", action: "New Year's dinner begins. Staff serves a five-course meal, then is dismissed for the night at 10:30 PM.", isPublic: true },
    { time: "10:30 PM", actor: "Staff", action: "All catering staff leave. The four family members are alone in the penthouse.", isPublic: true },
    { time: "10:45 PM", actor: "Isabelle Belmont", action: "Goes to the kitchen to prepare the champagne service herself, as is family tradition. She sets out five crystal flutes on a silver tray.", isPublic: true },
    { time: "11:00 PM", actor: "Marcus Belmont", action: "Visits the kitchen to 'get ice'. While there, applies a thin film of potassium cyanide paste to the inside rim of his father's flute (the one with Victor's monogrammed 'VB' initial). He prepared the paste earlier using chemicals from his photography darkroom.", isPublic: false },
    { time: "11:15 PM", actor: "Claire Belmont", action: "Goes to the bathroom. On her way back, she stops in Victor's study and photographs the new will draft on his desk with her phone.", isPublic: false },
    { time: "11:30 PM", actor: "Isabelle Belmont", action: "Carries the tray of champagne flutes to the living room and distributes them. Victor receives his monogrammed flute.", isPublic: true },
    { time: "11:45 PM", actor: "Victor Belmont", action: "Announces he will reveal changes to his will at midnight.", isPublic: true },
    { time: "11:50 PM", actor: "Thomas Belmont", action: "Argues loudly with Victor about the will, shouting 'You'll regret this.' Other family members pull them apart.", isPublic: true },
    { time: "12:00 AM", actor: "Victor Belmont", action: "Raises his glass, says 'To the family,' drinks, and collapses within 60 seconds.", isPublic: true },
    { time: "12:03 AM", actor: "Marcus Belmont", action: "Calls 911. While others attend to Victor, Marcus quietly rinses Victor's flute in the kitchen sink.", isPublic: false },
    { time: "12:15 AM", actor: "Police", action: "Arrive. Victor is pronounced dead. The flute is found in the kitchen sink, partially rinsed but still containing trace cyanide residue.", isPublic: true },
  ],

  evidence: [
    {
      id: "monogrammed-flute",
      name: "Victor's monogrammed champagne flute",
      description: "Victor's flute has his initials 'VB' etched on the base. It was found in the kitchen sink, partially rinsed. Lab analysis found cyanide residue concentrated on the inner rim, suggesting the poison was applied to the glass, not dissolved in liquid.",
      revealAct: 1,
      type: "physical",
      pointsTo: "marcus-belmont",
      isRedHerring: false,
    },
    {
      id: "kitchen-access",
      name: "Kitchen visit timeline",
      description: "Isabelle prepared the flutes at 10:45 PM. Marcus visited the kitchen for 'ice' at 11:00 PM. No one else entered the kitchen until Isabelle brought the tray out at 11:30 PM.",
      revealAct: 1,
      type: "testimony",
      pointsTo: "marcus-belmont",
      isRedHerring: false,
    },
    {
      id: "darkroom-chemicals",
      name: "Marcus's photography darkroom",
      description: "Marcus is an amateur photographer with a darkroom in his apartment. A search reveals potassium ferricyanide (a legitimate photographic chemical) and an almost-empty container of potassium cyanide hidden behind developing trays. His internet history shows searches for 'cyanide lethal dose champagne' from three weeks ago, accessed via a VPN he thought was untraceable.",
      revealAct: 3,
      type: "digital",
      pointsTo: "marcus-belmont",
      isRedHerring: false,
    },
    {
      id: "will-changes",
      name: "Draft of Victor's new will",
      description: "Found on Victor's desk. The new will cuts Marcus's share from 30% to 5%, citing 'irresponsible financial behavior.' Thomas's share increases. Claire and Isabelle remain unchanged. Marcus had learned about this change two weeks ago when he overheard Victor's lawyer on a call.",
      revealAct: 2,
      type: "document",
      pointsTo: "marcus-belmont",
      isRedHerring: false,
    },
    {
      id: "thomas-argument",
      name: "Thomas's heated argument",
      description: "Multiple witnesses (family members) confirm Thomas shouted 'You'll regret this!' at Victor just 10 minutes before the toast. Thomas had gambling debts of $2 million that he hoped the original will would cover.",
      revealAct: 1,
      type: "testimony",
      pointsTo: "thomas-belmont",
      isRedHerring: true,
    },
    {
      id: "claire-photos",
      name: "Claire's phone photos",
      description: "Claire's phone contains photographs of the draft will taken at 11:15 PM. She claims she was checking the will to 'protect her interests' but didn't share the content with anyone that night.",
      revealAct: 2,
      type: "digital",
      pointsTo: "claire-belmont",
      isRedHerring: true,
    },
  ],

  suspects: [
    {
      id: "marcus-belmont",
      name: "Marcus Belmont",
      personality: "Smooth, charming man in his late 30s. Speaks with practiced ease, casually deflects with humor and family anecdotes. Becomes cold and calculating when cornered. A skilled liar.",
      relationship: "Victor's eldest son. Vice president at Belmont Real Estate, though largely a figurehead. Known for lavish spending and failed side ventures.",
      alibi: "Says he was in the living room the entire evening. Admits going to the kitchen for ice but 'was only there for a minute.'",
      alibiTruth: false,
      secrets: [
        "He knew about the will changes two weeks ago",
        "He prepared cyanide paste from chemicals in his photography darkroom",
        "He applied the poison to Victor's monogrammed flute during his kitchen visit",
        "He rinsed the flute after Victor collapsed, thinking he could destroy evidence",
      ],
      lies: [
        "I only went to the kitchen for ice, I didn't touch any glasses",
        "I had no idea Father was changing the will",
        "The darkroom chemicals are all standard photography supplies",
      ],
      breakpoints: [
        "monogrammed-flute",
        "kitchen-access",
        "darkroom-chemicals",
        "Confronting him about the VPN search history for cyanide dosage",
        "Asking why he rinsed Victor's flute instead of preserving evidence",
      ],
    },
    {
      id: "isabelle-belmont",
      name: "Isabelle Belmont",
      personality: "Poised, elegant woman in her late 60s. Speaks deliberately and with authority. Protective of the family image. Shows genuine grief but maintains composure.",
      relationship: "Victor's wife of 42 years. Endured his controlling nature for decades. Stood to inherit the majority of the estate regardless of will changes.",
      alibi: "Was in the kitchen preparing champagne flutes (10:45 PM), then in the living room. Did not leave the group after 11:30 PM.",
      alibiTruth: true,
      secrets: [
        "She knew Victor was seeing another woman",
        "She had consulted a divorce lawyer but decided against it for financial reasons",
      ],
      lies: [
        "Our marriage was perfectly fine",
      ],
      breakpoints: [
        "Mentioning divorce proceedings or the other woman",
      ],
    },
    {
      id: "thomas-belmont",
      name: "Thomas Belmont",
      personality: "Hot-tempered, blunt younger son in his early 30s. Speaks impulsively, raises his voice easily. Wears his emotions on his sleeve. Despite the temper, genuinely loved his father.",
      relationship: "Victor's younger son. Works as a sports agent. Has significant gambling debts ($2M) that he was counting on his inheritance to cover.",
      alibi: "Was in the living room all evening. The argument with Victor at 11:50 PM is well-documented by all present.",
      alibiTruth: true,
      secrets: [
        "His gambling debts are worse than anyone knows — $2M to dangerous people",
        "The new will actually increases his share, but he didn't know that when he argued with Victor",
      ],
      lies: [
        "My finances are fine, the debts are exaggerated",
      ],
      breakpoints: [
        "Revealing the exact amount of his gambling debts",
        "Pointing out the new will actually benefits him",
      ],
    },
    {
      id: "claire-belmont",
      name: "Claire Belmont",
      personality: "Sharp, analytical daughter in her mid-30s. Corporate lawyer. Speaks precisely and measures every word. Cooperative but guarded — treats the interrogation like a deposition.",
      relationship: "Victor's only daughter. Successful attorney who distanced herself from the family business. Has a complicated respect for her father.",
      alibi: "Was in the living room most of the evening. Admits she stepped away to use the bathroom around 11:15 PM.",
      alibiTruth: true,
      secrets: [
        "She photographed the new will during her bathroom break",
        "She knew about Marcus's financial troubles and suspected him immediately",
      ],
      lies: [
        "I only went to the bathroom, I didn't go into Father's study",
      ],
      breakpoints: [
        "claire-photos",
        "Asking her directly what she observed about Marcus's behavior that night",
      ],
    },
  ],

  solution: {
    culpritId: "marcus-belmont",
    motive: "Victor's new will slashed Marcus's inheritance from 30% to just 5%, citing irresponsible financial behavior. Marcus learned this two weeks before the dinner. Facing mounting debts and the loss of his lifestyle, he planned the murder to ensure the original will — with his 30% share — would remain in effect.",
    method: "Marcus prepared a potassium cyanide paste using chemicals from his photography darkroom. During his 'ice run' to the kitchen at 11:00 PM, he applied the paste to the inner rim of Victor's monogrammed 'VB' champagne flute. When Victor drank the midnight toast, the champagne dissolved the paste. After Victor collapsed, Marcus rinsed the flute in the kitchen sink, but trace cyanide residue remained.",
    keyEvidence: ["monogrammed-flute", "darkroom-chemicals", "will-changes"],
  },
};
