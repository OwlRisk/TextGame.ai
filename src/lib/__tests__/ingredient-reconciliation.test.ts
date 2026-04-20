import { describe, it, expect } from "vitest";
import { reconcileIngredients, type GmState } from "../gm-state";

function makeState(overrides: Partial<GmState> = {}): GmState {
  return {
    act: 1,
    tension: 1,
    ingredientsUsed: [],
    ingredientsAvailable: [],
    playerKnows: [],
    playerDoesntKnow: [],
    activeThreats: [],
    mood: "curious",
    ...overrides,
  };
}

describe("reconcileIngredients — auto-migration", () => {
  it("moves a 2-token ingredient from available → used when narration mentions both tokens", () => {
    const previous = makeState({
      ingredientsAvailable: ["coffee_mug", "rising_tide"],
    });
    const parsed = makeState({
      ingredientsAvailable: ["coffee_mug", "rising_tide"],
    });

    const result = reconcileIngredients({
      narration: "On the table sits a fresh coffee mug, still warm to the touch.",
      previousState: previous,
      parsedState: parsed,
    });

    expect(result.autoMarked).toEqual(["coffee_mug"]);
    expect(result.state.ingredientsAvailable).toEqual(["rising_tide"]);
    expect(result.state.ingredientsUsed).toContain("coffee_mug");
  });

  it("requires BOTH tokens of a 2-token ingredient to count as used", () => {
    const parsed = makeState({
      ingredientsAvailable: ["coffee_mug"],
    });

    // Only "coffee" appears, not "mug"
    const result = reconcileIngredients({
      narration: "Someone left coffee brewing on the stove.",
      previousState: null,
      parsedState: parsed,
    });

    expect(result.autoMarked).toEqual([]);
    expect(result.state.ingredientsAvailable).toEqual(["coffee_mug"]);
  });

  it("requires ≥2/3 tokens for a 3-token ingredient", () => {
    const parsed = makeState({
      ingredientsAvailable: ["Suki_rational_break"],
    });

    // 2/3 tokens present (Suki + rational) → counts
    const result = reconcileIngredients({
      narration: "Suki's careful, rational worldview wavers.",
      previousState: null,
      parsedState: parsed,
    });

    expect(result.autoMarked).toEqual(["Suki_rational_break"]);
  });

  it("does NOT count a 3-token ingredient when only 1/3 tokens appear", () => {
    const parsed = makeState({
      ingredientsAvailable: ["Suki_rational_break"],
    });

    const result = reconcileIngredients({
      narration: "Suki adjusts her glasses and watches the door.",
      previousState: null,
      parsedState: parsed,
    });

    expect(result.autoMarked).toEqual([]);
  });

  it("returns the parsed state unchanged when narration is empty", () => {
    const parsed = makeState({
      ingredientsAvailable: ["coffee_mug"],
    });

    const result = reconcileIngredients({
      narration: "",
      previousState: null,
      parsedState: parsed,
    });

    expect(result.state).toBe(parsed); // identity check (no allocation)
    expect(result.autoMarked).toEqual([]);
  });
});

describe("reconcileIngredients — repeat detection", () => {
  it("flags an ingredient that was previously used and re-appears in narration", () => {
    const previous = makeState({
      ingredientsUsed: ["coffee_mug"],
      ingredientsAvailable: ["rising_tide"],
    });
    const parsed = makeState({
      ingredientsUsed: ["coffee_mug"], // GM didn't try to "re-use" in state, but DID in narration
      ingredientsAvailable: ["rising_tide"],
    });

    const result = reconcileIngredients({
      narration: "He picks up the coffee mug again, hands trembling.",
      previousState: previous,
      parsedState: parsed,
    });

    expect(result.repeatedIngredients).toEqual(["coffee_mug"]);
    expect(result.autoMarked).toEqual([]); // already used, not re-marked
  });

  it("does not flag previously-used ingredients that are not mentioned this turn", () => {
    const previous = makeState({
      ingredientsUsed: ["coffee_mug", "rising_tide"],
    });
    const parsed = makeState({
      ingredientsUsed: ["coffee_mug", "rising_tide"],
    });

    const result = reconcileIngredients({
      narration: "The wind howls across the cliffs.",
      previousState: previous,
      parsedState: parsed,
    });

    expect(result.repeatedIngredients).toEqual([]);
  });
});

describe("reconcileIngredients — both signals together", () => {
  it("auto-migrates new uses AND flags repeats in the same turn", () => {
    const previous = makeState({
      ingredientsUsed: ["coffee_mug"],
      ingredientsAvailable: ["rising_tide", "wall_symbols"],
    });
    const parsed = makeState({
      ingredientsUsed: ["coffee_mug"],
      ingredientsAvailable: ["rising_tide", "wall_symbols"],
    });

    const result = reconcileIngredients({
      narration: "The rising tide laps at the steps. He grips the coffee mug, knuckles white.",
      previousState: previous,
      parsedState: parsed,
    });

    expect(result.autoMarked).toEqual(["rising_tide"]);
    expect(result.repeatedIngredients).toEqual(["coffee_mug"]);
    expect(result.state.ingredientsAvailable).toEqual(["wall_symbols"]);
    expect(result.state.ingredientsUsed).toContain("coffee_mug");
    expect(result.state.ingredientsUsed).toContain("rising_tide");
  });
});
