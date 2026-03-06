import { describe, it, expect } from "vitest";
import type {
  ChatMessage,
  GameSession,
  ConversationState,
  GameMasterChatProps,
  ChannelRoomType,
} from "@/types/game-master";

/**
 * Type-level tests: ensure the interfaces are structurally sound
 * by constructing valid instances and verifying key properties.
 */

describe("ChatMessage interface", () => {
  it("can construct a valid gm message", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      role: "gm",
      content: "Welcome to the game!",
      timestamp: new Date(),
    };
    expect(msg.role).toBe("gm");
    expect(msg.id).toBeTruthy();
    expect(msg.content).toBeTruthy();
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it("can construct a valid user message", () => {
    const msg: ChatMessage = {
      id: "msg-2",
      role: "user",
      content: "I want to play werewolf",
      timestamp: new Date(),
    };
    expect(msg.role).toBe("user");
  });
});

describe("GameSession interface", () => {
  it("can construct a minimal valid session", () => {
    const session: GameSession = {
      id: "session-1",
      title: "New Game",
      messages: [],
      conversationState: "greeting",
      selectedTemplate: null,
      playerCount: 5,
      customRules: "",
      gameName: "",
      selectedHostId: "default",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(session.id).toBeTruthy();
    expect(session.messages).toHaveLength(0);
    expect(session.conversationState).toBe("greeting");
  });

  it("can construct a session with generated host", () => {
    const session: GameSession = {
      id: "session-2",
      title: "Werewolf Game",
      messages: [
        { id: "m1", role: "gm", content: "Hello!", timestamp: new Date() },
      ],
      conversationState: "rules-discussion",
      selectedTemplate: null,
      playerCount: 6,
      customRules: "# Werewolf Rules",
      gameName: "Night Wolves",
      selectedHostId: "generated",
      generatedHost: {
        name: "Luna",
        personality: "Mysterious and wise",
        voiceStyle: "Calm and ethereal",
        systemPrompt: "You are Luna, a wise game host.",
        icon: "🌙",
        color: "#7c3aed",
        gender: "female",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(session.generatedHost).toBeDefined();
    expect(session.generatedHost!.name).toBe("Luna");
    expect(session.generatedHost!.gender).toBe("female");
  });
});

describe("ConversationState type", () => {
  it("accepts all valid states", () => {
    const states: ConversationState[] = [
      "greeting",
      "game-type",
      "player-count",
      "rules-discussion",
      "confirmation",
      "completed",
    ];
    expect(states).toHaveLength(6);
    for (const s of states) {
      expect(typeof s).toBe("string");
    }
  });
});

describe("ChannelRoomType type", () => {
  it("accepts all valid room types", () => {
    const types: ChannelRoomType[] = [
      "public",
      "private_ai",
      "decision",
      "broadcast",
    ];
    expect(types).toHaveLength(4);
  });
});

describe("GameMasterChatProps interface", () => {
  it("can construct valid props", () => {
    const props: GameMasterChatProps = {
      onBack: () => {},
      onCreateGame: () => {},
    };
    expect(typeof props.onBack).toBe("function");
    expect(typeof props.onCreateGame).toBe("function");
    expect(props.initialPreset).toBeUndefined();
  });

  it("can include optional preset", () => {
    const props: GameMasterChatProps = {
      onBack: () => {},
      onCreateGame: () => {},
      initialPreset: {
        id: "werewolf",
        name: "Werewolf",
        rules: "Classic werewolf rules",
        templateId: "werewolf",
        playerCount: 6,
      },
      onPresetApplied: () => {},
    };
    expect(props.initialPreset).toBeDefined();
    expect(props.initialPreset!.id).toBe("werewolf");
  });
});
