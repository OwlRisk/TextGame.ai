import { describe, it, expect } from "vitest";
import {
  normalizePlayerGender,
  inferPlayerGender,
  resolvePlayerGender,
  poolGenderBinary,
} from "../player-gender";

describe("normalizePlayerGender", () => {
  it("accepts common variants", () => {
    expect(normalizePlayerGender("Male")).toBe("male");
    expect(normalizePlayerGender("FEMALE")).toBe("female");
    expect(normalizePlayerGender("other")).toBe("other");
    expect(normalizePlayerGender("nb")).toBe("other");
  });
  it("returns undefined for junk", () => {
    expect(normalizePlayerGender("")).toBeUndefined();
    expect(normalizePlayerGender("unknown")).toBeUndefined();
  });
});

describe("inferPlayerGender", () => {
  it("uses pronouns in personality", () => {
    expect(inferPlayerGender("Alex", { personality: "She speaks quietly." })).toBe("female");
    expect(inferPlayerGender("Alex", { personality: "He runs the shop." })).toBe("male");
  });
  it("returns other when ambiguous or empty", () => {
    expect(inferPlayerGender("Riley", { personality: "Quiet and observant." })).toBe("other");
  });
});

describe("resolvePlayerGender", () => {
  it("prefers explicit normalized value", () => {
    expect(resolvePlayerGender("Pat", "female", { personality: "He is tall." })).toBe("female");
  });
  it("infers when missing", () => {
    expect(resolvePlayerGender("Sam", undefined, { personality: "Her alibi is weak." })).toBe("female");
  });
});

describe("poolGenderBinary", () => {
  it("maps male and female directly", () => {
    expect(poolGenderBinary("male", "x")).toBe("male");
    expect(poolGenderBinary("female", "x")).toBe("female");
  });
  it("splits other deterministically by name", () => {
    expect(poolGenderBinary("other", "Alice")).toBe(poolGenderBinary("other", "Alice"));
    expect(poolGenderBinary("other", "Alice")).not.toBe(poolGenderBinary("other", "Bob"));
  });
});
