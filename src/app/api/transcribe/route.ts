import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { deductTokens, hasTokens } from "@/lib/tokens";

const limiter = createRateLimiter("transcribe", { limit: 10, windowSeconds: 60 });
const TRANSCRIBE_COST_COINS = 3;

/**
 * POST /api/transcribe
 * Body: multipart/form-data with "file" (audio blob) and optional "language" (e.g. en, zh).
 * Uses OpenAI Whisper for speech-to-text. Requires auth.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = limiter.check(user.id);
  if (!rl.success) return rateLimitResponse(rl);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!(await hasTokens(user.id, TRANSCRIBE_COST_COINS))) {
    return NextResponse.json(
      { error: "Insufficient tokens", code: "INSUFFICIENT_TOKENS" },
      { status: 402 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as string) || undefined;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Missing or invalid audio file" },
        { status: 400 }
      );
    }

    // Ensure we have a Blob/File with a name (Whisper requires filename with extension)
    const blob = file instanceof Blob ? file : new Blob([], { type: "audio/webm" });
    const name = file instanceof File && file.name ? file.name : "audio.webm";
    const fileForApi = blob instanceof File ? blob : new File([blob], name, { type: blob.type || "audio/webm" });

    const body = new FormData();
    body.append("file", fileForApi);
    body.append("model", "whisper-1");
    if (language) body.append("language", language);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[transcribe] upstream error:", response.status, err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }

    const data = (await response.json()) as { text?: string };
    const text = typeof data?.text === "string" ? data.text.trim() : "";

    await deductTokens(user.id, TRANSCRIBE_COST_COINS, "transcription", "Whisper transcription").catch(() => {});

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Transcribe error:", e);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
