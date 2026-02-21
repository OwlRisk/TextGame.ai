import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth-server";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
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
      const message = err || "Transcription failed";
      try {
        const parsed = JSON.parse(err);
        if (parsed?.error?.message) return NextResponse.json({ error: parsed.error.message }, { status: response.status });
      } catch (_) {}
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = (await response.json()) as { text?: string };
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    return NextResponse.json({ text });
  } catch (e) {
    console.error("Transcribe error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
