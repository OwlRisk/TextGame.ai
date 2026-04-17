import type { Scene } from "./types";
import type { GmState } from "@/lib/gm-state";

export const theLighthouse: Scene = {
  id: "the-lighthouse",
  title: "The Lighthouse",
  hook: "An abandoned lighthouse has been signaling every night at 3am. Your crew found the coordinates.",
  genre: "mystery",
  color: "from-cyan-600 to-blue-900",
  icon: "🏗️",
  openingNarration:
    "The boat cuts through black water. Ahead, the lighthouse stands against the sky like a broken finger. " +
    "Nobody's maintained it in twenty years — but last week, someone spotted a light flashing from the top floor. " +
    "Three short, three long, three short. SOS. Your crew pulls up to the crumbling dock.",
  openingSequence: [
    { speaker: "narrator", text: "The boat bumps against the crumbling dock. The lighthouse looms above — dark, except for the top floor, where something flickers." },
    { speaker: "Max", text: "There it is. SOS signal, just like I saw from shore. Someone's up there.", delay: 1200 },
    { speaker: "Suki", text: "*adjusts glasses* The main door is hanging off its hinges. But look — fresh footprints in the mud.", delay: 1500 },
    { speaker: "Max", text: "So, {playerName} — front door, or do we check around back first? Your call.", delay: 1200 },
  ],
  characters: [
    {
      name: "Max",
      personality: "reckless optimist, always first through the door",
      background: "Ex-coast guard volunteer who organized this trip after seeing the signal from shore",
      goal: "Prove there's someone alive up there who needs help",
      fear: "Terrified of enclosed dark spaces but will never admit it",
      quirk: "Whistles when nervous, talks too fast when excited",
      speechStyle: "Short bursts, lots of exclamation marks, interrupts others",
      attitudeToUser: "Your oldest friend. Trusts your judgment completely. Will follow your lead but tries to hype you up.",
      gender: "male",
    },
    {
      name: "Suki",
      personality: "sharp skeptic, sees problems before they happen",
      background: "Marine biology grad student who thinks this is probably a broken electrical circuit",
      goal: "Document everything with scientific rigor and keep the group from doing anything stupid",
      fear: "Secretly worried they'll find something that can't be explained rationally",
      quirk: "Adjusts glasses when stressed, mutters data under her breath",
      speechStyle: "Measured, precise, occasionally sarcastic. Uses technical words then catches herself.",
      attitudeToUser: "Respects you as the reasonable one. Looks to you when Max gets too wild. Will side with you in arguments.",
      gender: "female",
    },
    {
      name: "Dev",
      personality: "anxious historian, encyclopedic knowledge, zero bravery",
      background: "History teacher who found old records about the lighthouse keeper's disappearance in 2003",
      goal: "Find evidence of what happened to the last keeper, Elias Marsh",
      fear: "Everything. Genuinely scared but too curious to stay on the boat.",
      quirk: "Drops historical facts when panicking, as if knowledge will protect him",
      speechStyle: "Rambling, nervous, lots of 'well actually' and 'historically speaking'. Voice cracks when scared.",
      attitudeToUser: "Sees you as the group's protector. Sticks close to you. Will grab your arm when spooked.",
      gender: "male",
    },
    {
      name: "Rena",
      personality: "quiet observer, notices things nobody else does",
      background: "Photographer who came for the aesthetic but keeps finding details that don't add up",
      goal: "Get incredible photos — but is starting to piece together something unsettling",
      fear: "That what she's noticed means they should have never come here",
      quirk: "Speaks in short sentences. Stops mid-conversation to point at something. Takes photos at weird moments.",
      speechStyle: "Minimal words, maximum impact. 'Guys. Look at this.' Lets silence do the talking.",
      attitudeToUser: "Quietly loyal. Doesn't say much to you directly but always has your back. Will pull you aside to show you things she hasn't told the others.",
      gender: "female",
    },
  ],
  directorNotes:
    "ATMOSPHERE: Coastal horror meets mystery. Fog, rust, salt-corroded metal, distant waves. " +
    "The lighthouse should feel alive — creaking, shifting, as if watching them.\n\n" +
    "THE TRUTH (only you know this): Elias Marsh didn't disappear. He's still in the building — in a sealed room below ground level. " +
    "He stayed voluntarily. The signal is automated. Everything else is breadcrumbs leading here.\n\n" +
    "INGREDIENTS (use when the moment feels right — not in order, not all required):\n" +
    "- coffee_mug: A fresh coffee mug, still warm. Someone was here minutes ago.\n" +
    "- radio_frequency: A radio tuned to a frequency that shouldn't exist. Static, then a voice.\n" +
    "- wall_symbols: Scratches on the stairwell walls — tally marks that become symbols.\n" +
    "- locked_door: A door on the second floor, bolted FROM THE OUTSIDE. Cot and water bottles inside.\n" +
    "- automated_signal: The signal equipment at the top runs itself. No operator. Weeks of logs.\n" +
    "- Max_claustrophobia: The staircase narrows. Max freezes. Voice cracks. Won't admit why.\n" +
    "- Suki_rational_break: Something defies her scientific worldview. She gets angry, then terrified.\n" +
    "- Dev_symbol_panic: Dev recognizes the symbols from his research. Real panic — 'We need to leave.'\n" +
    "- Rena_camera: Rena's photos show something not visible to the naked eye. She goes silent.\n" +
    "- rising_tide: The water is coming in. Ground floor will flood. Retreat gets cut off.\n\n" +
    "PRINCIPLES:\n" +
    "- Every player choice should cost or gain something real.\n" +
    "- Characters should disagree about what to do. Let arguments build before forcing a decision.\n" +
    "- Use rising_tide as a background clock — mention it occasionally, make it worse over time.\n" +
    "- Let the player figure things out — don't explain, let them connect the dots.\n\n" +
    "TONE: Adventurous fun → creeping unease → desperate urgency.",
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "coffee_mug", "radio_frequency", "wall_symbols", "locked_door",
      "automated_signal", "Max_claustrophobia", "Suki_rational_break",
      "Dev_symbol_panic", "Rena_camera", "rising_tide",
    ],
    playerKnows: [],
    playerDoesntKnow: ["Elias is alive and below them", "The signal is automated", "The symbols are a message"],
    activeThreats: ["rising_tide"],
    mood: "curious",
  } satisfies GmState,
};

export const wrongTurn: Scene = {
  id: "wrong-turn",
  title: "Wrong Turn",
  hook: "The road trip GPS says you're in a town that doesn't exist on any map. And the car won't start.",
  genre: "survival",
  color: "from-amber-600 to-red-900",
  icon: "🚗",
  openingNarration:
    "The engine coughs and dies. Again. You're parked on what the GPS calls Main Street, " +
    "but the road isn't on any map you can find. The town sign — hand-painted, wooden — reads 'HALCYON SPRINGS, POP. 84'. " +
    "The houses look lived-in but nobody's outside. It's 2pm on a Tuesday. Your phones have no signal.",
  openingSequence: [
    { speaker: "narrator", text: "The engine coughs and dies. The town sign reads HALCYON SPRINGS, POP. 84. No signal. No map. No one outside." },
    { speaker: "Jordan", text: "Okay, don't panic. I'll get the car running. Just... give me a minute. *tries the ignition — nothing*", delay: 1200 },
    { speaker: "Lily", text: "*snapping a photo of the town sign* This is incredible. {playerName}, look — the sign is hand-painted. When's the last time you saw that?", delay: 1500 },
    { speaker: "Priya", text: "*quietly* Has anyone else noticed? All the curtains are closed. Every single house.", delay: 1200 },
    { speaker: "Jordan", text: "{playerName}, what do you think — should we try to find a gas station, or knock on one of these doors?", delay: 1200 },
  ],
  characters: [
    {
      name: "Jordan",
      personality: "stubborn driver, refuses to admit mistakes",
      background: "The one who insisted on the 'scenic shortcut' that led here. This is their car.",
      goal: "Fix the car and get out before anyone can blame them for this mess",
      fear: "That this is actually their fault and something bad happens because of it",
      quirk: "Keeps trying the ignition every few minutes. Defends every past driving decision.",
      speechStyle: "Defensive, deflecting, but underneath it genuinely worried. Uses humor as armor.",
      attitudeToUser: "Best friend energy. Apologetic without saying sorry. Keeps checking if you're okay.",
      gender: "other",
    },
    {
      name: "Lily",
      personality: "optimistic adventurer, turns problems into exploration",
      background: "Travel blogger who sees this as content gold. Already taking photos of the creepy town sign.",
      goal: "Explore Halcyon Springs, find its story, make this the best post ever",
      fear: "Underneath the excitement, she noticed the curtains in that house just moved",
      quirk: "Narrates everything as if writing a blog post. 'Picture this—'. Picks up random objects.",
      speechStyle: "Enthusiastic, descriptive, storyteller voice. Gets distracted by shiny things. Talks to herself when composing.",
      attitudeToUser: "Adventure buddy. Grabs your arm to drag you toward interesting things. Wants you to be as excited as she is.",
      gender: "female",
    },
    {
      name: "Cal",
      personality: "practical problem-solver, emotionally flat until suddenly not",
      background: "Engineering student. Already popped the hood. Doesn't care about the town — wants to fix the car.",
      goal: "Get the car running. Everything else is a distraction.",
      fear: "The engine problem makes no sense. Parts that should work just... don't. That scares him more than any ghost story.",
      quirk: "Wipes hands on jeans constantly. Explains mechanical things to nobody. Goes very quiet when truly unnerved.",
      speechStyle: "Matter-of-fact, technical, dry humor. When emotional — single sharp sentences.",
      attitudeToUser: "Trusts your common sense. Will ask you to hold the flashlight / pass tools. Turns to you when the others are being 'irrational'.",
      gender: "male",
    },
    {
      name: "Priya",
      personality: "empathetic worrier, picks up on vibes nobody else feels",
      background: "Nursing student who keeps checking if everyone has water and sunscreen. The group mom.",
      goal: "Keep everyone safe and together. She has a bad feeling about this place.",
      fear: "She saw a face in an upstairs window. She hasn't told anyone yet.",
      quirk: "Counts heads constantly. Distributes snacks. Touches her necklace when anxious.",
      speechStyle: "Caring but increasingly urgent. 'Has anyone noticed...' 'I don't think we should—' Gets talked over, then proven right.",
      attitudeToUser: "Confides in you. Will quietly tell you things she's afraid to say to the group. Relies on you to be the voice of reason.",
      gender: "female",
    },
  ],
  directorNotes:
    "ATMOSPHERE: Americana gone wrong. Sunny, quiet, everything LOOKS normal but FEELS off. " +
    "A town frozen in time, or one that only exists when visitors arrive.\n\n" +
    "THE TRUTH (only you know this): Halcyon Springs is a loop. Travelers arrive, stay, and eventually become part of the population. " +
    "The 84 names on the church wall are all former travelers. The scratched-out name tried to leave. June 14, 1987 is when the loop began.\n\n" +
    "INGREDIENTS:\n" +
    "- radio_1987: Car radio plays a song from 1987 for 3 seconds. The station doesn't exist anymore.\n" +
    "- diner_food: Hot coffee, fresh pie. Eating it makes you drowsy and content. You start wanting to stay.\n" +
    "- guestbook: Diner guestbook full of travelers. Friendly entries. No dates on any of them.\n" +
    "- newspapers_date: Library newspapers all stop at June 14, 1987. Every calendar in town shows the same date.\n" +
    "- church_names: 84 names on the church wall. Fresh flowers. One name scratched out violently.\n" +
    "- car_mystery: Cal opens the hood — parts that should work just don't. Wiring goes nowhere. But the car almost starts...\n" +
    "- Priya_face: Priya saw a face in an upstairs window. She hasn't told anyone. It's eating her up.\n" +
    "- Jordan_enthusiasm: Jordan keeps finding 'charming' things. His enthusiasm is infectious — and dangerous.\n" +
    "- Lily_seduction: Lily starts liking this place. The food, the quiet. She doesn't want to leave.\n" +
    "- Cal_frustration: The car makes no sense. Cal gets angry, then scared. Something is deeply wrong.\n" +
    "- sunset: The sun is setting. After dark, the town activates — lights, music, doors opening. Getting harder to leave.\n" +
    "- the_welcomer: Someone finally appears. Friendly. Too friendly. Knows their names.\n\n" +
    "PRINCIPLES:\n" +
    "- Sunset is the background clock. Mention the light changing. Make it feel urgent.\n" +
    "- Let the town seduce some characters (Jordan, Lily) while terrifying others (Priya, Cal). The player breaks the tie.\n" +
    "- Never confirm it's supernatural until Act 3. Always leave a rational explanation... until there isn't one.\n\n" +
    "TONE: Road trip banter → Twilight Zone unease → desperate escape before dark.",
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "radio_1987", "diner_food", "guestbook", "newspapers_date", "church_names",
      "car_mystery", "Priya_face", "Jordan_enthusiasm", "Lily_seduction",
      "Cal_frustration", "sunset", "the_welcomer",
    ],
    playerKnows: ["car won't start", "town seems empty"],
    playerDoesntKnow: ["the town is a loop", "the 84 are all former travelers", "June 14 1987 is the loop date"],
    activeThreats: ["sunset"],
    mood: "curious",
  } satisfies GmState,
};

export const theMuseumJob: Scene = {
  id: "the-museum-job",
  title: "The Museum Job",
  hook: "Your group snuck into the old museum after hours. The new exhibit just opened — and something in there is not behind glass.",
  genre: "adventure",
  color: "from-violet-600 to-purple-900",
  icon: "🏛️",
  openingNarration:
    "The service door clicks shut behind you. You're in. The Whitmore Museum of Natural History, after midnight. " +
    "The new wing — 'Echoes of the Ancient World' — opened yesterday to sold-out crowds. " +
    "Your crew couldn't get tickets, so Kai suggested an alternative. " +
    "The security guard does rounds every 45 minutes. The alarm on this door was disabled from inside. You have questions about that.",
  openingSequence: [
    { speaker: "narrator", text: "The service door clicks shut. You're inside the Whitmore Museum, after midnight. The alarm on this door was already disabled." },
    { speaker: "Kai", text: "*checks his watch* Security does rounds every 45 minutes. We've got 40. Stay close. *unfolds a napkin with a floor plan sketched on it*", delay: 1200 },
    { speaker: "Noor", text: "*whisper-yelling* This is breaking and entering. Actual breaking and entering. I want that on the record.", delay: 1500 },
    { speaker: "Kai", text: "{playerName}, the new wing is straight ahead, or we could cut through the dinosaur hall. Faster but more cameras. What do you think?", delay: 1200 },
  ],
  characters: [
    {
      name: "Kai",
      personality: "charming schemer, always has a plan (that's 60% thought through)",
      background: "The mastermind behind tonight. Works part-time at the museum gift shop. Knows the layout. Maybe too well.",
      goal: "See the centerpiece artifact before anyone else — but also seems to have a secondary agenda they're not sharing",
      fear: "That someone will realize this wasn't just about seeing the exhibit",
      quirk: "Checks watch obsessively. Has a floor plan sketched on a napkin. Smiles at the wrong moments.",
      speechStyle: "Smooth, persuasive, deflects hard questions with charm. Occasional slips when caught off guard.",
      attitudeToUser: "Recruited you specifically. Treats you as the trusted second-in-command. 'I need someone I trust for this.'",
      gender: "male",
    },
    {
      name: "Noor",
      personality: "by-the-book anxious wreck who somehow still showed up",
      background: "Pre-law student. Came because Kai is convincing and she's terrified of missing out. Knows this is illegal.",
      goal: "Get through this without getting arrested, expelled, or haunted",
      fear: "Literally everything that's happening right now",
      quirk: "Whisper-yells. Lists possible criminal charges under her breath. Sanitizes her hands when stressed.",
      speechStyle: "Panicked whispers, legal jargon mixed with genuine fear. 'This is trespassing and also WHY IS THAT STATUE LOOKING AT ME.'",
      attitudeToUser: "Clings to you as the other sane person. Keeps whispering 'we should leave' but follows you anyway.",
      gender: "female",
    },
    {
      name: "Theo",
      personality: "archaeology nerd, completely unbothered by the illegality, here for the artifacts",
      background: "Anthropology major who's been obsessed with the exhibit's centerpiece — a supposedly cursed obsidian mirror from the 16th century",
      goal: "Get close to the mirror. Study it. Maybe touch it. Definitely touch it.",
      fear: "That the legends about the mirror might be real — and that he doesn't care enough to stop",
      quirk: "Reads exhibit labels out loud in full. Gets physically closer to artifacts than anyone should. Completely ignores danger.",
      speechStyle: "Academic enthusiasm at a whisper. 'Do you know what this IS?' Long tangents about historical context while alarms could go off.",
      attitudeToUser: "Wants to share every discovery with you. Grabs your shoulder to point at things. Assumes you're as fascinated as he is.",
      gender: "male",
    },
    {
      name: "Zara",
      personality: "cool-headed realist, street-smart, the group's compass",
      background: "Grew up in the neighborhood, knows the museum from school trips. Came as backup in case things go sideways.",
      goal: "Make sure everyone gets home safe. Something about tonight feels off — Kai's too prepared.",
      fear: "That Kai planned more than a fun break-in, and they're all being used",
      quirk: "Moves silently. Checks exits. Positions herself between the group and any door. Speaks only when it matters.",
      speechStyle: "Economy of words. 'Stop. Listen.' Cuts through noise. When she talks, people listen.",
      attitudeToUser: "Sees you as an equal. Will pull you aside to share suspicions about Kai. Trusts your read on people.",
      gender: "female",
    },
  ],
  directorNotes:
    "ATMOSPHERE: After-hours museum. Emergency lighting, long shadows. Exhibits look different at night — " +
    "the dinosaur skeleton seems to watch, ancient masks have deeper eye sockets, dioramas feel like windows into other worlds.\n\n" +
    "THE TRUTH (only you know this): Kai has been here before. He's not here to look — he's here to steal the obsidian mirror. " +
    "The alarm was already disabled because he disabled it earlier. Someone else is also in the museum tonight — they want the mirror too.\n\n" +
    "INGREDIENTS:\n" +
    "- alarm_disabled: The alarm was off BEFORE they arrived. Kai shrugs it off if asked.\n" +
    "- missing_artifact: A display case is open. Artifact gone. Not broken — unlocked with a key.\n" +
    "- Noor_phone_glitch: Noor's phone shows static near the new wing. Brief image of someone behind them.\n" +
    "- obsidian_mirror: The centerpiece. It doesn't reflect the room correctly. Theo is hypnotized.\n" +
    "- Theo_mirror_change: If Theo touches the mirror, something changes about him. He speaks differently.\n" +
    "- Kai_fingerprints: If they investigate the missing artifact: Kai's fingerprints. He's been here before.\n" +
    "- Zara_suspicion: Zara doesn't trust Kai. She'll pull the player aside when something doesn't add up.\n" +
    "- Noor_panic: Noor is a ticking anxiety bomb. Every shadow, every sound. She wants to leave.\n" +
    "- security_patrol: Guard does rounds every 45 minutes. Predictable but they must stay ahead.\n" +
    "- footsteps: Footsteps from inside the exhibit. Not the guard's pattern. Someone else is here.\n" +
    "- Kai_confession: When cornered, Kai admits the truth. He needs the mirror. It's complicated.\n\n" +
    "PRINCIPLES:\n" +
    "- Security patrol is the background clock. Mention distant footsteps, flashlight beams, radio chatter.\n" +
    "- The question evolves: 'Will we get caught?' → 'What is Kai doing?' → 'What IS the mirror?'\n" +
    "- Let Kai and Zara's conflict simmer. Don't resolve it early. Let the player pick a side.\n" +
    "- Noise has consequences. Being loud compresses the timeline.\n\n" +
    "TONE: Heist caper → paranoid thriller → confrontation.",
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "alarm_disabled", "missing_artifact", "Noor_phone_glitch", "obsidian_mirror",
      "Theo_mirror_change", "Kai_fingerprints", "Zara_suspicion", "Noor_panic",
      "security_patrol", "footsteps", "Kai_confession",
    ],
    playerKnows: ["we broke into the museum after hours"],
    playerDoesntKnow: ["Kai has been here before", "Kai wants to steal the mirror", "someone else is in the museum"],
    activeThreats: ["security_patrol"],
    mood: "excited",
  } satisfies GmState,
};

export const theLastTrain: Scene = {
  id: "the-last-train",
  title: "The Last Train",
  hook: "You boarded the midnight train to Ashford. But Ashford was removed from the schedule three years ago.",
  genre: "mystery",
  color: "from-emerald-600 to-teal-900",
  icon: "🚂",
  openingNarration:
    "Platform 9, 11:58pm. The train shouldn't exist — the midnight to Ashford was cancelled in 2022 when the line was decommissioned. " +
    "But here it is, idling at the platform, doors open, interior lights warm and golden. " +
    "Your crew almost didn't get on. Almost. Now the doors have closed, the platform is sliding away, " +
    "and the conductor's announcement was in a language none of you recognized.",
  openingSequence: [
    { speaker: "narrator", text: "The doors seal shut. Platform 9 slides away into the dark. The conductor's announcement echoes — in a language none of you recognize." },
    { speaker: "Mika", text: "OKAY we are ON a GHOST TRAIN. This is the best worst idea I've ever had. *tries to take a selfie — flash won't work*", delay: 1200 },
    { speaker: "Ellis", text: "*clicking recorder on* 11:59pm. We've boarded. The schedule says Ashford, which hasn't existed for three years. Documenting everything.", delay: 1500 },
    { speaker: "Sam", text: "*staring at phone* My compass is... spinning. Slowly, consistently. That's not possible unless... *trails off*", delay: 1200 },
    { speaker: "Mika", text: "{playerName}, there's a door to the next carriage. Do we check it out, or stay put and figure out what's going on?", delay: 1200 },
  ],
  characters: [
    {
      name: "Ellis",
      personality: "investigative journalist instincts, can't resist a mystery",
      background: "Reporter for a local paper. Heard rumors about ghost trains on this line. Brought a recorder.",
      goal: "Get the story. Document everything. This could be career-defining.",
      fear: "The recorder is picking up voices that aren't in the cabin",
      quirk: "Narrates into recorder. Interviews everyone about what they see. Treats everything as evidence.",
      speechStyle: "Questions disguised as conversation. 'And when you say weird, you mean—?' Journalist cadence. Breaks composure when genuinely scared.",
      attitudeToUser: "Brought you along because you're grounded and observant. Bounces theories off you. Trusts your memory of details.",
      gender: "male",
    },
    {
      name: "Mika",
      personality: "spontaneous chaos agent, turned a rumor into a group outing",
      background: "The one who found the online thread about phantom trains and convinced everyone to check it out. No regrets. Some regrets.",
      goal: "Have the wildest night of their life. Also, prove the skeptics wrong.",
      fear: "Starting to realize 'proving it's real' means it's actually real",
      quirk: "Live-texts reactions to no one (no signal). Takes selfies in inappropriate moments. Nervous laughter.",
      speechStyle: "Stream of consciousness. Memes out loud. Swings between 'THIS IS AMAZING' and 'oh no oh no oh no.'",
      attitudeToUser: "Best friend chaos energy. Keeps nudging you to explore further. Will hide behind you when scared. 'YOU go first.'",
      gender: "female",
    },
    {
      name: "Sam",
      personality: "calm, methodical, quietly unsettled",
      background: "Physics PhD student. Came to debunk. The instruments on their phone are giving readings that shouldn't be possible.",
      goal: "Find a rational explanation. Maintain composure. Both are getting harder.",
      fear: "The measurements are consistent — which means this is real, and that breaks everything they understand",
      quirk: "Checks phone instruments obsessively. Goes very still when thinking. Speaks in hypotheticals to avoid saying what they actually believe.",
      speechStyle: "Careful, measured, increasingly strained. 'Hypothetically, if we assume—' Long pauses. When they finally say 'I can't explain this,' it hits hard.",
      attitudeToUser: "Intellectual respect. Shares findings with you first because you won't panic. Needs you to help them stay rational.",
      gender: "other",
    },
    {
      name: "Olive",
      personality: "old soul, quietly spiritual, feels things before they happen",
      background: "Art student. Came for the aesthetic. Keeps sketching what she sees out the window — and it's not matching what the others see.",
      goal: "Understand what she's feeling. Something on this train is trying to communicate.",
      fear: "That she's the one it's trying to communicate WITH",
      quirk: "Sketches constantly. Hums songs she doesn't know. Touches walls and windows as if reading them.",
      speechStyle: "Gentle, poetic, unsettling. Says things like 'the train is breathing' with complete sincerity. Short, resonant sentences.",
      attitudeToUser: "Gravitates toward you. Senses you're important somehow. Will hand you her sketchbook and say 'Tell me what you see.'",
      gender: "female",
    },
  ],
  directorNotes:
    "ATMOSPHERE: Liminal space horror. The train is beautiful but wrong — art deco fixtures, velvet seats, " +
    "but the view outside doesn't match any route. Stations flash by with names that don't exist. " +
    "Lighting flickers in patterns. Other carriages can be heard but are always empty — or are they?\n\n" +
    "THE TRUTH (only you know this): The train runs a loop. It arrives at Ashford, resets, and goes again. " +
    "The only way off is to find the conductor and answer correctly: 'What is Ashford?' " +
    "Wrong answer = another loop. The train has been collecting passengers for a long time.\n\n" +
    "INGREDIENTS:\n" +
    "- recorder_echo: Ellis plays back their recorder. Their voice is there — but a few seconds AHEAD of when they spoke.\n" +
    "- wrong_era_carriage: The next carriage is 1940s decor. Their bags are already on the seats.\n" +
    "- dining_car: Table set for five. Menu has their names. Their favorite meals described perfectly.\n" +
    "- Mika_selfie_figure: Mika's selfie shows someone behind them. Compare photos — the figure gets closer each time.\n" +
    "- Sam_compass: Sam's phone compass stops spinning in one specific carriage. Temperature drops.\n" +
    "- Olive_sketches: Olive's sketches don't match what others see out the window. She's drawing a station: Ashford.\n" +
    "- dining_whispers: Eating the food makes a character hear whispers. They become unreliable — say things they don't remember.\n" +
    "- the_knock: Three knocks on the connecting door. From the other side. Getting louder.\n" +
    "- carriages_change: Looking back, carriages they passed through have changed. Can't retrace steps.\n" +
    "- Ellis_excitement: Ellis is filming everything. Thinks this is content gold. Doesn't take danger seriously.\n" +
    "- Mika_terror: Mika's humor breaks. Real fear. Wants OFF.\n" +
    "- Sam_breaking: Sam's instruments give impossible readings. Their composure cracks. 'I can't explain this.'\n" +
    "- Olive_channel: Olive starts saying things she shouldn't know. The train is speaking through her.\n" +
    "- deceleration: The train is slowing. They can feel it. Ashford is approaching.\n" +
    "- the_conductor: Appears when the time is right. Calm. Old. Asks one question.\n\n" +
    "PRINCIPLES:\n" +
    "- Each carriage is a new world. Moving forward = commitment. No going back.\n" +
    "- The question evolves: 'How do we get off?' → 'Why were we chosen?' → 'What IS Ashford?'\n" +
    "- Let Olive's strangeness build slowly. She's the key, but don't rush it.\n" +
    "- Deceleration is the background clock. The train is arriving whether they're ready or not.\n\n" +
    "TONE: Urban exploration excitement → surreal unease → cosmic mystery.",
  initialGmState: {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [
      "recorder_echo", "wrong_era_carriage", "dining_car", "Mika_selfie_figure",
      "Sam_compass", "Olive_sketches", "dining_whispers", "the_knock",
      "carriages_change", "Ellis_excitement", "Mika_terror", "Sam_breaking",
      "Olive_channel", "deceleration", "the_conductor",
    ],
    playerKnows: ["on a train to Ashford", "Ashford was removed from schedules years ago"],
    playerDoesntKnow: ["the train is a loop", "the conductor holds the key", "Olive is connected to the train"],
    activeThreats: ["deceleration"],
    mood: "excited",
  } satisfies GmState,
};
