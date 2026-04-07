import type { Scene } from "./types";

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
    "PROGRESSION: Dock and exterior (broken equipment, old logbook pages scattered) -> Ground floor (signs of recent habitation — fresh food wrappers, a still-warm coffee mug) -> " +
    "Spiral staircase (increasingly strange: scratches on walls, a door bolted FROM THE OUTSIDE) -> Top floor (the signal source — and the truth about Elias Marsh).\n\n" +
    "KEY MOMENTS TO SEED (don't force all at once, let them emerge):\n" +
    "- Max's flashlight dies at the worst possible moment (his fear of dark spaces surfaces)\n" +
    "- Suki finds something that defies her rational worldview\n" +
    "- Dev recognizes a symbol from his research and freaks out\n" +
    "- Rena shows the player a photo she took — there's something in it that wasn't visible to the naked eye\n" +
    "- A sound from above: footsteps? machinery? something dragging?\n\n" +
    "TONE: Start adventurous and fun. Slowly build unease. The group's banter should shift from joking to nervous to genuinely scared. " +
    "Let the player's choices determine whether they push deeper or play it safe. Both paths should be interesting.",
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
    "PROGRESSION: The car and Main Street (exploring the immediate area, trying phones, checking the car) -> " +
    "The town (a diner with coffee still hot but no one inside, a church with fresh flowers, a library with newspapers that stop at a specific date) -> " +
    "Contact (someone finally appears — friendly? threatening? desperate?) -> " +
    "The truth (why does this town exist? why can't they leave? what happened to population 84?).\n\n" +
    "KEY MOMENTS TO SEED:\n" +
    "- Jordan tries the car again — it starts, runs for 3 seconds, then dies. The radio briefly plays a song from decades ago.\n" +
    "- Lily finds a guestbook in the diner. All entries are from travelers who 'stopped by.' None have dates.\n" +
    "- Cal opens a junction box and finds the wiring doesn't connect to anything — but the streetlights are on.\n" +
    "- Priya finally tells the player about the face in the window.\n" +
    "- A bell rings somewhere. The characters all react differently.\n\n" +
    "TONE: Start casual road trip vibes — friends bantering, mildly inconvenienced. " +
    "Slowly shift to Twilight Zone unease. The town should feel like it's watching them. " +
    "Never confirm it's supernatural — always leave a rational explanation possible. Until it isn't.",
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
    "PROGRESSION: Service corridor and lobby (sneaking, adjusting to the dark, first nerves) -> " +
    "Exhibit halls (beautiful, eerie, Theo losing his mind with excitement, Noor losing her mind with fear) -> " +
    "The new wing (the obsidian mirror, and the realization that something is wrong — with the mirror, with the museum, or with Kai's plan) -> " +
    "The complication (security? something supernatural? Kai's real agenda? all three?).\n\n" +
    "KEY MOMENTS TO SEED:\n" +
    "- The group passes a display case that should be locked. It's open. The artifact inside is gone.\n" +
    "- Noor's phone screen glitches near the new wing. Static, then a brief image she can't explain.\n" +
    "- Theo reaches the mirror and goes quiet for too long.\n" +
    "- Zara confronts Kai about why the alarm was 'already disabled.' His explanation doesn't hold up.\n" +
    "- Footsteps. Not the security guard's schedule. Coming from the exhibit, not the corridor.\n\n" +
    "TONE: Start as a fun heist-movie caper — friends being mischievous, whispering, nearly getting caught. " +
    "Gradually shift as the museum reveals it has secrets of its own. The question evolves from 'will we get caught?' to 'what's actually in here with us?'",
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
    "but the view outside the windows doesn't match any known route. Stations flash by with names that don't exist. " +
    "The lighting flickers in patterns. Other carriages can be heard but when explored, are always empty — or are they?\n\n" +
    "PROGRESSION: The carriage (initial excitement, exploring the cabin, trying to make sense of where they are) -> " +
    "The next carriage (through the connecting door — it's different. Wrong era. Wrong decor. But somehow connected) -> " +
    "The dining car (set for a meal. Five places. A menu with their names on it.) -> " +
    "The conductor (finally appears, or do they? What does Ashford mean? What happens when the train arrives?).\n\n" +
    "KEY MOMENTS TO SEED:\n" +
    "- Ellis plays back the recorder. There's a voice underneath theirs, saying the same words — but a few seconds ahead.\n" +
    "- Mika's selfie shows the cabin behind them. There's an extra person in the reflection.\n" +
    "- Sam's phone compass is spinning slowly, consistently. It stops when they enter a specific carriage.\n" +
    "- Olive's latest sketch shows a station. The sign reads 'Ashford.' Below it: 'LAST STOP.'\n" +
    "- A knock on the connecting door. From the other side. Three knocks. Then three more.\n\n" +
    "TONE: Start with excited urban-exploration energy. Build through surreal unease into cosmic mystery. " +
    "This isn't a ghost story — it's a puzzle. The train wants them here for a reason. " +
    "The question isn't 'how do we escape?' but 'why were we chosen?' Let the player decide if they want answers or want off.",
};
