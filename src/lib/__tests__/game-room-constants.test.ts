import { describe, it, expect } from "vitest";
import {
  INITIAL_PLAYER_REPLIES,
  MEMBERS_POLL_INTERVAL_MS,
  MEMBERS_MAX_ERRORS,
  MAX_AUTO_ADVANCES,
  GAME_INACTIVITY_TIMEOUT_MS,
  HOST_CONTEXT_WINDOW,
  MAX_STREAM_TOKENS,
  BASE_STREAM_TOKENS,
  TOKENS_PER_PLAYER,
} from "../game-room-constants";

describe("game-room-constants", () => {
  it("INITIAL_PLAYER_REPLIES is a small positive integer", () => {
    expect(INITIAL_PLAYER_REPLIES).toBeGreaterThan(0);
    expect(Number.isInteger(INITIAL_PLAYER_REPLIES)).toBe(true);
    expect(INITIAL_PLAYER_REPLIES).toBeLessThanOrEqual(10);
  });

  it("MEMBERS_POLL_INTERVAL_MS is at least 1 second", () => {
    expect(MEMBERS_POLL_INTERVAL_MS).toBeGreaterThanOrEqual(1000);
  });

  it("MEMBERS_MAX_ERRORS is a positive integer", () => {
    expect(MEMBERS_MAX_ERRORS).toBeGreaterThan(0);
    expect(Number.isInteger(MEMBERS_MAX_ERRORS)).toBe(true);
  });

  it("MAX_AUTO_ADVANCES is a positive integer within a sane range", () => {
    expect(MAX_AUTO_ADVANCES).toBeGreaterThan(0);
    expect(MAX_AUTO_ADVANCES).toBeLessThanOrEqual(50);
  });

  it("GAME_INACTIVITY_TIMEOUT_MS is at least 30 minutes", () => {
    const thirtyMinutes = 30 * 60 * 1000;
    expect(GAME_INACTIVITY_TIMEOUT_MS).toBeGreaterThanOrEqual(thirtyMinutes);
  });

  it("HOST_CONTEXT_WINDOW is a positive integer", () => {
    expect(HOST_CONTEXT_WINDOW).toBeGreaterThan(0);
    expect(Number.isInteger(HOST_CONTEXT_WINDOW)).toBe(true);
  });

  it("MAX_STREAM_TOKENS is greater than BASE_STREAM_TOKENS", () => {
    expect(MAX_STREAM_TOKENS).toBeGreaterThan(BASE_STREAM_TOKENS);
  });

  it("BASE_STREAM_TOKENS is a positive number", () => {
    expect(BASE_STREAM_TOKENS).toBeGreaterThan(0);
  });

  it("TOKENS_PER_PLAYER is a positive number", () => {
    expect(TOKENS_PER_PLAYER).toBeGreaterThan(0);
  });

  it("token budget can accommodate at least 10 players within MAX_STREAM_TOKENS", () => {
    const budgetFor10 = BASE_STREAM_TOKENS + TOKENS_PER_PLAYER * 10;
    expect(budgetFor10).toBeLessThanOrEqual(MAX_STREAM_TOKENS);
  });
});
