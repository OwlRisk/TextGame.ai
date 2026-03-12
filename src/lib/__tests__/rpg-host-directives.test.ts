import { describe, it, expect } from "vitest";
import { parseHostActions } from "../host-actions";

describe("parseHostActions — RPG directives", () => {

  // ── DICE directive ───────────────────────────────────────────────────

  describe("DICE directive", () => {
    it("parses a full dice roll", () => {
      const { cleanContent, actions } = parseHostActions(
        "The rogue rolls for stealth.\nDICE: Kael | d20 | 15 | +3 | = 18 | Stealth check\nNice roll!"
      );
      const dice = actions.find((a) => a.type === "dice_roll");
      expect(dice).toBeDefined();
      expect(dice).toMatchObject({
        type: "dice_roll",
        character: "Kael",
        diceType: "d20",
        roll: 15,
        modifier: 3,
        total: 18,
        context: "Stealth check",
      });
      expect(cleanContent).not.toContain("DICE:");
      expect(cleanContent).toContain("The rogue rolls for stealth.");
      expect(cleanContent).toContain("Nice roll!");
    });

    it("handles dice roll without context", () => {
      const { actions } = parseHostActions("DICE: Hero | d20 | 12 | +2 | = 14");
      const dice = actions.find((a) => a.type === "dice_roll");
      expect(dice).toBeDefined();
      expect((dice as any).context).toBe("");
    });

    it("handles negative modifiers", () => {
      const { actions } = parseHostActions("DICE: Mage | d20 | 8 | -2 | = 6 | Save");
      const dice = actions.find((a) => a.type === "dice_roll");
      expect(dice).toBeDefined();
      expect((dice as any).modifier).toBe(-2);
      expect((dice as any).total).toBe(6);
    });
  });

  // ── MP directive ─────────────────────────────────────────────────────

  describe("MP directive", () => {
    it("parses MP drain", () => {
      const { cleanContent, actions } = parseHostActions("The mage casts Fireball!\nMP: Aria | -12\nFlames erupt!");
      const mp = actions.find((a) => a.type === "mp_change");
      expect(mp).toMatchObject({
        type: "mp_change",
        playerRef: "Aria",
        delta: -12,
      });
      expect(cleanContent).not.toContain("MP:");
    });

    it("parses MP recovery", () => {
      const { actions } = parseHostActions("MP: Hero | +20");
      const mp = actions.find((a) => a.type === "mp_change");
      expect(mp).toMatchObject({ playerRef: "Hero", delta: 20 });
    });
  });

  // ── XP directive ─────────────────────────────────────────────────────

  describe("XP directive", () => {
    it("parses XP with reason", () => {
      const { cleanContent, actions } = parseHostActions("Victory!\nXP: 50 | Defeated the Shadow Wraith");
      const xp = actions.find((a) => a.type === "xp_gain");
      expect(xp).toMatchObject({
        type: "xp_gain",
        amount: 50,
        reason: "Defeated the Shadow Wraith",
      });
      expect(cleanContent).not.toContain("XP:");
    });

    it("parses XP without reason", () => {
      const { actions } = parseHostActions("XP: 25");
      const xp = actions.find((a) => a.type === "xp_gain");
      expect(xp).toMatchObject({ amount: 25, reason: "" });
    });
  });

  // ── LOOT directive ───────────────────────────────────────────────────

  describe("LOOT directive", () => {
    it("parses loot drop with all fields", () => {
      const { cleanContent, actions } = parseHostActions(
        "The chest opens!\nLOOT: Dragon Scale Shield | epic | Forged from dragon scales"
      );
      const loot = actions.find((a) => a.type === "loot_drop");
      expect(loot).toMatchObject({
        type: "loot_drop",
        itemName: "Dragon Scale Shield",
        rarity: "epic",
        description: "Forged from dragon scales",
      });
      expect(cleanContent).not.toContain("LOOT:");
    });

    it("parses loot without description", () => {
      const { actions } = parseHostActions("LOOT: Iron Sword | common");
      const loot = actions.find((a) => a.type === "loot_drop");
      expect(loot).toMatchObject({
        itemName: "Iron Sword",
        rarity: "common",
        description: "",
      });
    });

    it("lowercases rarity", () => {
      const { actions } = parseHostActions("LOOT: Magic Ring | LEGENDARY | Shiny");
      const loot = actions.find((a) => a.type === "loot_drop");
      expect((loot as any).rarity).toBe("legendary");
    });
  });

  // ── LEVEL_UP directive ───────────────────────────────────────────────

  describe("LEVEL_UP directive", () => {
    it("parses a level up event", () => {
      const { cleanContent, actions } = parseHostActions(
        "Congratulations!\nLEVEL_UP: Hero | 5\nYou feel stronger."
      );
      const lu = actions.find((a) => a.type === "level_up");
      expect(lu).toMatchObject({
        type: "level_up",
        playerRef: "Hero",
        newLevel: 5,
      });
      expect(cleanContent).not.toContain("LEVEL_UP:");
      expect(cleanContent).toContain("Congratulations!");
    });
  });

  // ── SHOP directive ───────────────────────────────────────────────────

  describe("SHOP directive", () => {
    it("parses shop open with items", () => {
      const { actions } = parseHostActions("SHOP: open | Potion:50, Sword:200, Shield:150");
      const shop = actions.find((a) => a.type === "shop");
      expect(shop).toMatchObject({
        type: "shop",
        action: "open",
        items: "Potion:50, Sword:200, Shield:150",
      });
    });

    it("parses shop close", () => {
      const { actions } = parseHostActions("SHOP: close");
      const shop = actions.find((a) => a.type === "shop");
      expect(shop).toMatchObject({ type: "shop", action: "close" });
    });

    it("is case-insensitive", () => {
      const { actions } = parseHostActions("SHOP: Open | stuff");
      const shop = actions.find((a) => a.type === "shop");
      expect((shop as any).action).toBe("open");
    });
  });

  // ── EQUIP directive ──────────────────────────────────────────────────

  describe("EQUIP directive", () => {
    it("parses equip action", () => {
      const { cleanContent, actions } = parseHostActions("EQUIP: Hero | Dragon Sword | weapon");
      const equip = actions.find((a) => a.type === "equip");
      expect(equip).toMatchObject({
        type: "equip",
        playerRef: "Hero",
        item: "Dragon Sword",
        slot: "weapon",
      });
      expect(cleanContent).not.toContain("EQUIP:");
    });

    it("lowercases the slot", () => {
      const { actions } = parseHostActions("EQUIP: Aria | Crystal Crown | ACCESSORY");
      const equip = actions.find((a) => a.type === "equip");
      expect((equip as any).slot).toBe("accessory");
    });
  });

  // ── WORLD_EVENT directive ────────────────────────────────────────────

  describe("WORLD_EVENT directive", () => {
    it("parses a world event", () => {
      const { cleanContent, actions } = parseHostActions(
        "The earth shakes!\nWORLD_EVENT: earthquake_1 | A massive earthquake has reshaped the mountain pass"
      );
      const we = actions.find((a) => a.type === "world_event");
      expect(we).toMatchObject({
        type: "world_event",
        eventId: "earthquake_1",
        description: "A massive earthquake has reshaped the mountain pass",
      });
      expect(cleanContent).not.toContain("WORLD_EVENT:");
    });
  });

  // ── Enhanced COMBAT directive ────────────────────────────────────────

  describe("COMBAT directive (enhanced with stats)", () => {
    it("parses combat start with enemy stats", () => {
      const { actions } = parseHostActions("COMBAT: start | Shadow Wraith | hp:150 | atk:25 | def:12");
      const combat = actions.find((a) => a.type === "combat");
      expect(combat).toMatchObject({
        type: "combat",
        action: "start",
        enemy: "Shadow Wraith",
        hp: 150,
        atk: 25,
        def: 12,
      });
    });

    it("parses combat start with partial stats", () => {
      const { actions } = parseHostActions("COMBAT: start | Wolf | hp:30");
      const combat = actions.find((a) => a.type === "combat");
      expect(combat).toMatchObject({
        action: "start",
        enemy: "Wolf",
        hp: 30,
      });
    });

    it("parses combat end", () => {
      const { actions } = parseHostActions("COMBAT: end");
      const combat = actions.find((a) => a.type === "combat");
      expect(combat).toMatchObject({ type: "combat", action: "end" });
    });
  });

  // ── Multiple directives in one message ───────────────────────────────

  describe("multiple RPG directives in one message", () => {
    it("parses a complex combat message with multiple directives", () => {
      const msg = [
        "The Shadow Wraith emerges from the darkness!",
        "COMBAT: start | Shadow Wraith | hp:150 | atk:25 | def:12",
        "MOOD: dark",
        "DICE: Kael | d20 | 18 | +3 | = 21 | Initiative",
        "HP: Kael | -15",
        "MP: Aria | -12",
        "The battle rages on!",
      ].join("\n");

      const { cleanContent, actions } = parseHostActions(msg);

      expect(actions.filter((a) => a.type === "combat")).toHaveLength(1);
      expect(actions.filter((a) => a.type === "mood")).toHaveLength(1);
      expect(actions.filter((a) => a.type === "dice_roll")).toHaveLength(1);
      expect(actions.filter((a) => a.type === "hp_change")).toHaveLength(1);
      expect(actions.filter((a) => a.type === "mp_change")).toHaveLength(1);

      expect(cleanContent).toContain("The Shadow Wraith emerges");
      expect(cleanContent).toContain("The battle rages on!");
      expect(cleanContent).not.toContain("COMBAT:");
      expect(cleanContent).not.toContain("DICE:");
      expect(cleanContent).not.toContain("HP:");
      expect(cleanContent).not.toContain("MP:");
    });

    it("parses victory sequence with XP, loot, and quest update", () => {
      const msg = [
        "The wraith dissolves into mist!",
        "COMBAT: end",
        "XP: 100 | Shadow Wraith defeated",
        "LOOT: Shadow Cloak | rare | A cloak woven from shadow",
        "QUEST: Break the Curse | progress | Defeated the Shadow Wraith guardian",
        "LEVEL_UP: Hero | 3",
      ].join("\n");

      const { actions } = parseHostActions(msg);

      expect(actions.find((a) => a.type === "combat")).toMatchObject({ action: "end" });
      expect(actions.find((a) => a.type === "xp_gain")).toMatchObject({ amount: 100 });
      expect(actions.find((a) => a.type === "loot_drop")).toMatchObject({ itemName: "Shadow Cloak", rarity: "rare" });
      expect(actions.find((a) => a.type === "quest_update")).toMatchObject({ questId: "Break the Curse", status: "progress" });
      expect(actions.find((a) => a.type === "level_up")).toMatchObject({ playerRef: "Hero", newLevel: 3 });
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("does not match mid-line directives", () => {
      const { actions } = parseHostActions("The player said DICE: something | d20 | 10 | +1 | = 11 in chat");
      expect(actions.filter((a) => a.type === "dice_roll")).toHaveLength(0);
    });

    it("handles whitespace around pipe separators", () => {
      const { actions } = parseHostActions("EQUIP:   Hero   |   Magic Sword   |   weapon");
      const equip = actions.find((a) => a.type === "equip");
      expect(equip).toMatchObject({ playerRef: "Hero", item: "Magic Sword", slot: "weapon" });
    });

    it("empty message produces no RPG actions", () => {
      const { actions } = parseHostActions("");
      expect(actions.filter((a) => ["dice_roll", "mp_change", "xp_gain", "loot_drop", "level_up", "shop", "equip", "world_event"].includes(a.type))).toHaveLength(0);
    });
  });
});
