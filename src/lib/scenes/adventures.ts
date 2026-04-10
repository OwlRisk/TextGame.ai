import type { Scene, SceneOpeningMessage } from "./types";

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
    "CLUE CHAIN (reveal in order, each connects to the next):\n" +
    "1. Ground floor: fresh coffee mug still warm + radio tuned to an unknown frequency\n" +
    "2. Stairwell: scratches on walls form a pattern — tally marks that shift into symbols\n" +
    "3. Second floor: a door bolted FROM THE OUTSIDE — someone was kept in here. Cot, water bottles, scratched messages.\n" +
    "4. Top floor: the signal equipment is automated. No one is operating it. It's been running for weeks.\n" +
    "5. Truth: Elias Marsh didn't disappear. He's still in the building. Somewhere below them.\n\n" +
    "DECISION TREE (key branching points):\n" +
    "- Entrance: front door (faster but exposed) vs circle around back (slower, find supplies shed with useful tools)\n" +
    "- Ground floor: investigate the radio signal (costs time, tide rising) vs head straight upstairs (miss critical context about who's here)\n" +
    "- Second floor: open the bolted door (risky — changes everything) vs continue up (miss the key truth, weaker ending)\n" +
    "- Top floor: disable the signal and leave (safe ending) vs trace the frequency source deeper into the basement (leads to Elias — dangerous but complete ending)\n\n" +
    "CONSEQUENCES FOR WRONG CHOICES:\n" +
    "- Max's flashlight dies at the worst moment (his claustrophobia erupts — he freezes, someone must calm him)\n" +
    "- If they skip the radio: they won't understand the symbols later and Dev can't help\n" +
    "- If they open the bolted door carelessly: something inside reacts\n" +
    "- The tide is rising throughout — eventually the ground floor floods, cutting off retreat\n\n" +
    "CHARACTER FEAR TRIGGERS:\n" +
    "- Max: the spiral staircase narrows. He slows down, voice cracks. Someone must push him forward.\n" +
    "- Suki: the symbols defy physics. Her worldview cracks. She gets angry, then scared.\n" +
    "- Dev: recognizes the symbols from his research. Panics — 'We need to leave. NOW.'\n" +
    "- Rena: reviews her photos. Something is in them that wasn't visible to the eye. She goes quiet.\n\n" +
    "TONE: Act 1 adventurous and fun. Act 2 genuinely unsettling. Act 3 desperate.",
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
    "Think: a town frozen in time, or one that exists only when visitors arrive.\n\n" +
    "CLUE CHAIN (reveal in order):\n" +
    "1. Car radio briefly plays a song from 1987. Cal: 'That station doesn't exist anymore.'\n" +
    "2. Diner: coffee hot, food fresh, guestbook full of travelers. No dates on any entry.\n" +
    "3. Library: newspapers stop at June 14, 1987. Same date on every calendar in town.\n" +
    "4. Church: fresh flowers, candles lit. A list of 84 names on the wall. One name is scratched out.\n" +
    "5. Truth: the town loops. Travelers arrive, stay, and eventually become part of the 84. The scratched name was the last one who tried to leave.\n\n" +
    "DECISION TREE:\n" +
    "- Start: fix the car (Cal's plan, practical) vs explore town for help (Jordan/Lily want to, Priya uneasy)\n" +
    "- Diner: eat the food (Lily wants to — BAD idea, makes them drowsy) vs don't touch anything (Priya's instinct — correct)\n" +
    "- Library: spend time reading newspapers (reveals the date pattern — critical clue) vs move on quickly (miss the pattern)\n" +
    "- Church: read the names (triggering event — the bell rings, someone appears) vs leave immediately (safer, but they'll come to you anyway)\n" +
    "- Endgame: try to drive out before sunset (risky, car may not start) vs confront the 'welcomer' (dangerous but gets real answers)\n\n" +
    "CONSEQUENCES:\n" +
    "- Eating diner food: character gets sluggish, speaks less, wants to 'stay a while'\n" +
    "- Skipping the library: they can't figure out the loop later\n" +
    "- The sun is setting throughout. After sunset, the town 'activates' — lights come on, music plays, doors open. Getting harder to leave.\n" +
    "- Priya's secret: she saw a face in an upstairs window. If she's not prompted to share it, she'll blurt it out at the worst moment.\n\n" +
    "CHARACTER CONFLICT:\n" +
    "- Cal vs Jordan: Cal wants to fix the car. Jordan wants to explore. They'll argue. Player decides.\n" +
    "- Lily vs Priya: Lily thinks it's charming. Priya is terrified. Their tension should build.\n\n" +
    "TONE: Road trip banter -> Twilight Zone unease -> desperate escape before sunset.",
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
    "ATMOSPHERE: After-hours museum. Emergency lighting casts long shadows. Exhibits look different at night — " +
    "the dinosaur skeleton seems to watch, the ancient masks have deeper eye sockets, the dioramas feel less like displays and more like windows.\n\n" +
    "CLUE CHAIN:\n" +
    "1. Service entrance: alarm was already disabled BEFORE they arrived. Kai shrugs it off.\n" +
    "2. Main hall: a display case is open. The artifact inside is missing. Not broken — unlocked.\n" +
    "3. Egyptian wing: Noor's phone glitches. Static, then a brief image of someone standing behind them. No one is there.\n" +
    "4. New wing: the obsidian mirror. Theo goes quiet. Then whispers: 'It's not reflecting the room correctly.'\n" +
    "5. Truth: Kai has been here before. He's not here to look — he's here to take the mirror. And someone else is here to stop him.\n\n" +
    "DECISION TREE:\n" +
    "- Route: main halls (more cover, security cameras OFF) vs service corridors (Zara knows them, but narrow and loud)\n" +
    "- Missing artifact: investigate (costs time, security patrol in 20 min) vs ignore and keep moving (miss Kai's real plan)\n" +
    "- The mirror: let Theo examine it (he might not come back from what he sees) vs pull him away (he'll resist)\n" +
    "- Kai's confession: trust him and help (risky — is he lying?) vs side with Zara and abort (safer, but the mirror stays)\n" +
    "- Escape: original exit (may be blocked now) vs Zara's route through basement (unknown, dark)\n\n" +
    "CONSEQUENCES:\n" +
    "- Security patrol is a real timer: 45 minutes from entry. Guard route is predictable but they MUST stay ahead.\n" +
    "- If they're too loud: guard changes pattern, time compresses.\n" +
    "- If Theo touches the mirror: something changes about him. He speaks differently. The group notices.\n" +
    "- If they investigate the missing artifact: they find Kai's fingerprints. Zara's suspicion confirmed.\n\n" +
    "CHARACTER CONFLICT:\n" +
    "- Kai vs Zara: Zara doesn't trust Kai. She'll pull the player aside to warn them. Kai tries to keep everyone focused and moving.\n" +
    "- Theo vs Noor: Theo wants to stay and study everything. Noor wants to leave immediately. Player breaks the tie.\n\n" +
    "TONE: Heist caper -> paranoid thriller -> confrontation. The question shifts from 'will we get caught?' to 'what is Kai really doing?'",
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
    "but the view outside doesn't match any known route. Stations flash by with names that don't exist. " +
    "The lighting flickers in patterns. Other carriages can be heard but are always empty — or are they?\n\n" +
    "CLUE CHAIN:\n" +
    "1. First carriage: Ellis's recorder plays back their voice — but a few seconds AHEAD of when they spoke it.\n" +
    "2. Connecting door: the next carriage is wrong era. 1940s decor. But their bags are already on the seats.\n" +
    "3. Dining car: table set for five. Menu has their names. The dishes described are their favorite meals.\n" +
    "4. Sam's compass stops spinning in one specific carriage. The temperature drops. Olive says: 'This is where it wants us.'\n" +
    "5. Truth: the train runs on a loop. It arrives at Ashford, then resets. The only way off is to find the conductor and answer a question correctly. Wrong answer = another loop.\n\n" +
    "DECISION TREE:\n" +
    "- First carriage: stay and investigate (find recorder clue) vs push forward immediately (miss key context)\n" +
    "- Connecting door: open it (enter the 1940s carriage — no turning back, door locks) vs try to pry open the emergency exit (doesn't work, wastes time, train accelerates)\n" +
    "- Dining car: eat the food (restores energy but they hear whispers after) vs refuse (hungry, but clear-headed)\n" +
    "- The knock: answer it (meet something from the other side) vs ignore it (it gets louder, more insistent, eventually the door opens on its own)\n" +
    "- Endgame: answer the conductor's question (what is Ashford?) vs refuse to answer (the train loops — bittersweet ending)\n\n" +
    "CONSEQUENCES:\n" +
    "- Each carriage they pass through changes slightly when they look back. Can't retrace steps.\n" +
    "- Mika's selfie shows an extra person. If they compare photos: the figure gets CLOSER in each one.\n" +
    "- Eating the food: character starts hearing whispers, becomes unreliable narrator within the group.\n" +
    "- The train is decelerating. They can feel it. Ashford is approaching. Time pressure builds.\n\n" +
    "CHARACTER CONFLICT:\n" +
    "- Ellis vs Sam: Ellis thinks this is exciting content. Sam thinks they're in genuine danger. They clash.\n" +
    "- Mika vs Olive: Mika is terrified and wants off. Olive is calm and says they should stay and listen. Player chooses who to follow.\n\n" +
    "TONE: Urban exploration excitement -> surreal unease -> cosmic mystery. The question shifts from 'how do we get off?' to 'why were we chosen?'",
};
