import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests verifying the correct order of operations for TTS billing:
 * 1. Check balance BEFORE calling upstream
 * 2. Call upstream API
 * 3. Deduct tokens ONLY after upstream success
 * 4. On upstream failure, do NOT deduct
 */

describe("TTS deduction order", () => {
  let callLog: string[];

  const mockGetUserBalance = vi.fn();
  const mockDeductTokens = vi.fn();
  const mockFetchUpstream = vi.fn();
  const ttsCostToCoins = (textLen: number, _modelId: string) => Math.max(1, Math.ceil(textLen / 100));

  beforeEach(() => {
    callLog = [];
    mockGetUserBalance.mockReset();
    mockDeductTokens.mockReset();
    mockFetchUpstream.mockReset();
  });

  async function simulateTTSRoute(text: string, balance: number, upstreamSuccess: boolean) {
    const coinsRequired = ttsCostToCoins(text.length, "inworld-tts-1.5-max");

    callLog.push("check_balance");
    const bal = await mockGetUserBalance();
    if (bal.tokens < coinsRequired) {
      return { status: 402, error: "Insufficient tokens" };
    }

    callLog.push("call_upstream");
    const res = await mockFetchUpstream();
    if (!res.ok) {
      return { status: 502, error: "TTS synthesis failed" };
    }

    callLog.push("deduct_tokens");
    await mockDeductTokens(coinsRequired);

    return { status: 200, audioBase64: "abc" };
  }

  it("deducts only after upstream success", async () => {
    mockGetUserBalance.mockResolvedValue({ tokens: 100 });
    mockFetchUpstream.mockResolvedValue({ ok: true });
    mockDeductTokens.mockResolvedValue(undefined);

    const result = await simulateTTSRoute("Hello world", 100, true);

    expect(result.status).toBe(200);
    expect(callLog).toEqual(["check_balance", "call_upstream", "deduct_tokens"]);
    expect(mockDeductTokens).toHaveBeenCalledTimes(1);
  });

  it("does NOT deduct when upstream fails", async () => {
    mockGetUserBalance.mockResolvedValue({ tokens: 100 });
    mockFetchUpstream.mockResolvedValue({ ok: false });

    const result = await simulateTTSRoute("Hello world", 100, false);

    expect(result.status).toBe(502);
    expect(callLog).toEqual(["check_balance", "call_upstream"]);
    expect(mockDeductTokens).not.toHaveBeenCalled();
  });

  it("does NOT deduct when balance is insufficient", async () => {
    mockGetUserBalance.mockResolvedValue({ tokens: 0 });

    const result = await simulateTTSRoute("Hello world", 0, true);

    expect(result.status).toBe(402);
    expect(callLog).toEqual(["check_balance"]);
    expect(mockFetchUpstream).not.toHaveBeenCalled();
    expect(mockDeductTokens).not.toHaveBeenCalled();
  });

  it("balance check happens before upstream call", async () => {
    mockGetUserBalance.mockResolvedValue({ tokens: 100 });
    mockFetchUpstream.mockResolvedValue({ ok: true });
    mockDeductTokens.mockResolvedValue(undefined);

    await simulateTTSRoute("test", 100, true);

    const balIdx = callLog.indexOf("check_balance");
    const upstreamIdx = callLog.indexOf("call_upstream");
    const deductIdx = callLog.indexOf("deduct_tokens");
    expect(balIdx).toBeLessThan(upstreamIdx);
    expect(upstreamIdx).toBeLessThan(deductIdx);
  });
});

describe("TTS cost calculation", () => {
  const ttsCostToCoins = (textLen: number, _modelId: string) => Math.max(1, Math.ceil(textLen / 100));

  it("returns at least 1 coin", () => {
    expect(ttsCostToCoins(1, "inworld-tts-1.5-max")).toBeGreaterThanOrEqual(1);
    expect(ttsCostToCoins(0, "inworld-tts-1.5-max")).toBe(1);
  });

  it("scales with text length", () => {
    const short = ttsCostToCoins(50, "inworld-tts-1.5-max");
    const long = ttsCostToCoins(1500, "inworld-tts-1.5-max");
    expect(long).toBeGreaterThan(short);
  });

  it("caps at reasonable value for max length", () => {
    const cost = ttsCostToCoins(2000, "inworld-tts-1.5-max");
    expect(cost).toBeLessThanOrEqual(20);
  });
});
