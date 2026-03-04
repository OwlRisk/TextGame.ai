import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/config/host-config", () => ({
  getHostById: (id: string) => {
    if (id === "echo") return { name: "Echo", description: "A mysterious host", tagline: "Mysterious", voiceStyle: "Calm" };
    return undefined;
  },
}));

import { getAIChatResponse, streamAIChatResponse, type ChatRequest } from "../openai";

const BASE_REQUEST: ChatRequest = {
  messages: [{ role: "user", content: "Hello" }],
  hostId: "echo",
  authToken: "tok_test",
};

function mockFetchOk(body: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchFail(status: number, body: object) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── getAIChatResponse ──────────────────────────────────────────────────────

describe("getAIChatResponse", () => {
  it("returns data on successful response", async () => {
    const payload = { message: "Hi!", usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } };
    globalThis.fetch = mockFetchOk(payload);

    const result = await getAIChatResponse(BASE_REQUEST);
    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends correct headers and body", async () => {
    globalThis.fetch = mockFetchOk({ message: "ok" });
    await getAIChatResponse(BASE_REQUEST);

    const [url, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(opts.headers["Authorization"]).toBe("Bearer tok_test");
    const body = JSON.parse(opts.body);
    expect(body.messages[0].role).toBe("user");
    expect(body.hostPersonality.name).toBe("Echo");
  });

  it("uses hostPersonality override when provided", async () => {
    globalThis.fetch = mockFetchOk({ message: "ok" });
    await getAIChatResponse({
      ...BASE_REQUEST,
      hostPersonality: { name: "Custom", description: "desc", personality: "fun" },
    });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.hostPersonality.name).toBe("Custom");
  });

  it("retries on generic error and eventually succeeds", async () => {
    const fail = { ok: false, status: 500, json: () => Promise.resolve({ error: "Server error" }) };
    const success = { ok: true, json: () => Promise.resolve({ message: "ok" }) };
    const fn = vi.fn().mockResolvedValueOnce(fail).mockResolvedValueOnce(fail).mockResolvedValueOnce(success);
    globalThis.fetch = fn;

    const result = await getAIChatResponse(BASE_REQUEST, 3);
    expect(result).toEqual({ message: "ok" });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry on API key / authentication errors", async () => {
    globalThis.fetch = mockFetchFail(401, { error: "Invalid API key" });

    await expect(getAIChatResponse(BASE_REQUEST, 3)).rejects.toThrow("Invalid API key");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws last error after all retries exhausted", async () => {
    globalThis.fetch = mockFetchFail(500, { error: "Boom" });

    await expect(getAIChatResponse(BASE_REQUEST, 2)).rejects.toThrow("Boom");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries = 1 means no retry", async () => {
    globalThis.fetch = mockFetchFail(502, { error: "Bad Gateway" });

    await expect(getAIChatResponse(BASE_REQUEST, 1)).rejects.toThrow("Bad Gateway");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("resolves hostPersonality from hostId when no override", async () => {
    globalThis.fetch = mockFetchOk({ message: "ok" });
    await getAIChatResponse({ messages: [{ role: "user", content: "hi" }], hostId: "echo" });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.hostPersonality).toEqual({
      name: "Echo",
      description: "A mysterious host",
      personality: "Mysterious. Calm",
    });
  });

  it("sends null hostPersonality when hostId is unknown", async () => {
    globalThis.fetch = mockFetchOk({ message: "ok" });
    await getAIChatResponse({ messages: [{ role: "user", content: "hi" }], hostId: "nope" });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.hostPersonality).toBeNull();
  });

  it("serializes message timestamps to ISO strings", async () => {
    globalThis.fetch = mockFetchOk({ message: "ok" });
    const ts = new Date("2026-01-01T00:00:00Z");
    await getAIChatResponse({ messages: [{ role: "user", content: "hi", timestamp: ts }] });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.messages[0].timestamp).toBe("2026-01-01T00:00:00.000Z");
  });
});

// ─── streamAIChatResponse ───────────────────────────────────────────────────

describe("streamAIChatResponse", () => {
  function makeSSEStream(chunks: string[]) {
    let idx = 0;
    const encoder = new TextEncoder();
    return {
      getReader: () => ({
        read: () => {
          if (idx < chunks.length) {
            return Promise.resolve({ done: false, value: encoder.encode(chunks[idx++]) });
          }
          return Promise.resolve({ done: true, value: undefined });
        },
      }),
    };
  }

  it("streams chunks and calls onChunk / onComplete", async () => {
    const chunks: string[] = [];
    const stream = makeSSEStream([
      'data: {"content":"Hello "}\n',
      'data: {"content":"World"}\ndata: [DONE]\n',
    ]);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream });

    const onComplete = vi.fn();
    await streamAIChatResponse(BASE_REQUEST, (c) => chunks.push(c), onComplete);

    expect(chunks).toEqual(["Hello ", "World"]);
    expect(onComplete).toHaveBeenCalled();
  });

  it("throws INSUFFICIENT_TOKENS on 402", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ error: "Out of tokens", code: "INSUFFICIENT_TOKENS" }),
    });

    await expect(
      streamAIChatResponse(BASE_REQUEST, () => {}, undefined, undefined, 1)
    ).rejects.toThrow("INSUFFICIENT_TOKENS");
  });

  it("calls onError instead of throwing when provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ error: "no tokens", code: "INSUFFICIENT_TOKENS" }),
    });

    const onError = vi.fn();
    await streamAIChatResponse(BASE_REQUEST, () => {}, undefined, onError, 1);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "INSUFFICIENT_TOKENS" }));
  });

  it("does not retry on API key errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Invalid API key" }),
    });

    const onError = vi.fn();
    await streamAIChatResponse(BASE_REQUEST, () => {}, undefined, onError, 3);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalled();
  });

  it("friendly message for rate limit (429)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: "rate limit exceeded" }),
    });

    await expect(
      streamAIChatResponse(BASE_REQUEST, () => {}, undefined, undefined, 1)
    ).rejects.toThrow(/wait a moment/i);
  });

  it("friendly message for 502-504 gateway errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: "Service Unavailable" }),
    });

    await expect(
      streamAIChatResponse(BASE_REQUEST, () => {}, undefined, undefined, 1)
    ).rejects.toThrow(/temporarily unavailable/i);
  });

  it("handles no response body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, body: null });

    await expect(
      streamAIChatResponse(BASE_REQUEST, () => {}, undefined, undefined, 1)
    ).rejects.toThrow("No response body");
  });

  it("handles json parse failure in error response, falls back to text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
      text: () => Promise.resolve("ECONNREFUSED"),
    });

    await expect(
      streamAIChatResponse(BASE_REQUEST, () => {}, undefined, undefined, 1)
    ).rejects.toThrow(/Unable to connect/i);
  });
});
