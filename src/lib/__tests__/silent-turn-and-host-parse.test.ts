import { describe, it, expect } from "vitest";
import { splitHostOutput, getStreamingDisplay } from "@/lib/game-host-utils";

/**
 * Tests for GM "silent turn" scenarios — where the Host outputs only directives
 * without a public message, allowing players to converse without GM interruption.
 */

describe("splitHostOutput — silent turn (empty public message)", () => {
  it("returns empty message when content starts with ---", () => {
    const raw = "\n---\nNEXT_SPEAKER: Juno, Edda";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toContain("NEXT_SPEAKER: Juno, Edda");
  });

  it("returns empty message for just a newline + separator", () => {
    const raw = "\n---\nNEXT_SPEAKER: Everyone";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toBe("NEXT_SPEAKER: Everyone");
  });

  it("returns public message when present before ---", () => {
    const raw = "The night falls. Close your eyes.\n---\nNEXT_SPEAKER: Mira";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("The night falls. Close your eyes.");
    expect(directives).toBe("NEXT_SPEAKER: Mira");
  });

  it("treats entire content as directives when no --- separator", () => {
    const raw = "NEXT_SPEAKER: Juno";
    const { message, directives } = splitHostOutput(raw);
    expect(message).toBe("");
    expect(directives).toBe("NEXT_SPEAKER: Juno");
  });
});

describe("getStreamingDisplay — silent turn", () => {
  it("returns empty string when --- is at the start", () => {
    const raw = "\n---\nNEXT_SPEAKER: Juno";
    expect(getStreamingDisplay(raw)).toBe("");
  });

  it("returns public portion when present", () => {
    const raw = "Hello everyone!\n---\nNEXT_SPEAKER: You";
    expect(getStreamingDisplay(raw)).toBe("Hello everyone!");
  });

  it("strips BOARD blocks when no separator yet (streaming)", () => {
    const raw = "Welcome![BOARD:Alice]Secret info[/BOARD]";
    const display = getStreamingDisplay(raw);
    expect(display).toBe("Welcome!");
    expect(display).not.toContain("Secret info");
  });
});

/**
 * Replicate the NEXT_SPEAKER parsing logic from page.tsx for unit testing.
 */
type SpeakerQueueItem =
  | { type: "human" }
  | { type: "everyone" }
  | { type: "ai"; name: string };

function parseNextSpeaker(
  directives: string,
  humanName: string,
  aiPlayerNames: string[]
): { who: string | null; speakerQueue: SpeakerQueueItem[] } {
  const match = directives.match(/\nNEXT_SPEAKER:\s*(.+?)\s*$/im)
    ?? directives.match(/^NEXT_SPEAKER:\s*(.+?)\s*$/im);
  if (!match) return { who: null, speakerQueue: [] };

  const who = match[1].trim();
  const speakerQueue: SpeakerQueueItem[] = [];
  const names = who.split(",").map((n) => n.trim()).filter(Boolean);

  for (const name of names) {
    const nameLower = name.toLowerCase();
    if (nameLower === "you" || nameLower === humanName.toLowerCase()) {
      speakerQueue.push({ type: "human" });
      break;
    } else if (nameLower === "everyone") {
      speakerQueue.push({ type: "everyone" });
      break;
    } else {
      const found = aiPlayerNames.find((n) => n.toLowerCase() === nameLower);
      if (found) speakerQueue.push({ type: "ai", name: found });
    }
  }
  return { who, speakerQueue };
}

describe("parseNextSpeaker", () => {
  const humanName = "Alice";
  const aiNames = ["Juno", "Edda", "Garrick"];

  it("parses single AI speaker", () => {
    const { who, speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: Juno", humanName, aiNames);
    expect(who).toBe("Juno");
    expect(speakerQueue).toEqual([{ type: "ai", name: "Juno" }]);
  });

  it("parses multiple AI speakers", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: Juno, Edda, Garrick", humanName, aiNames);
    expect(speakerQueue).toEqual([
      { type: "ai", name: "Juno" },
      { type: "ai", name: "Edda" },
      { type: "ai", name: "Garrick" },
    ]);
  });

  it("stops at human player", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: Juno, Edda, Alice", humanName, aiNames);
    expect(speakerQueue).toEqual([
      { type: "ai", name: "Juno" },
      { type: "ai", name: "Edda" },
      { type: "human" },
    ]);
  });

  it("recognizes 'You' as human", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: You", humanName, aiNames);
    expect(speakerQueue).toEqual([{ type: "human" }]);
  });

  it("recognizes 'Everyone'", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: Everyone", humanName, aiNames);
    expect(speakerQueue).toEqual([{ type: "everyone" }]);
  });

  it("returns empty queue when no NEXT_SPEAKER", () => {
    const { who, speakerQueue } = parseNextSpeaker("ASSIGN_ROLE: Alice -> Seer", humanName, aiNames);
    expect(who).toBeNull();
    expect(speakerQueue).toEqual([]);
  });

  it("skips unknown names", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: Unknown, Juno", humanName, aiNames);
    expect(speakerQueue).toEqual([{ type: "ai", name: "Juno" }]);
  });

  it("case-insensitive matching", () => {
    const { speakerQueue } = parseNextSpeaker("NEXT_SPEAKER: juno, ALICE", humanName, aiNames);
    expect(speakerQueue).toEqual([
      { type: "ai", name: "Juno" },
      { type: "human" },
    ]);
  });
});

/**
 * Test the isSilentTurn logic used in handleSendMessage.
 */
describe("isSilentTurn flow decision", () => {
  function shouldContinue(hostContent: string, imageUrl: string | undefined, speakerQueueLen: number): "continue" | "bail" {
    const isSilentTurn = !hostContent && !imageUrl;
    if (isSilentTurn && speakerQueueLen === 0) return "bail";
    return "continue";
  }

  it("continues when hostContent is present", () => {
    expect(shouldContinue("Hello", undefined, 0)).toBe("continue");
  });

  it("continues when image is present", () => {
    expect(shouldContinue("", "http://img.png", 0)).toBe("continue");
  });

  it("continues on silent turn with valid speaker queue", () => {
    expect(shouldContinue("", undefined, 2)).toBe("continue");
  });

  it("bails on silent turn with empty speaker queue", () => {
    expect(shouldContinue("", undefined, 0)).toBe("bail");
  });
});
