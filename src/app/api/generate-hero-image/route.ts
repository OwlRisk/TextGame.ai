import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

const limiter = createRateLimiter("hero-image", { limit: 2, windowSeconds: 3600 });

const HERO_PROMPT =
  "A friendly fantasy game master character, warm and welcoming, standing beside a glowing tabletop game board with dice and cards, soft ambient lighting, cozy tavern atmosphere, digital illustration style, no text, suitable for a game creation app hero image.";

/** Local save path: public/hero.png in project root; Next.js serves it at /hero.png */
const HERO_FILENAME = "hero.png";

function getHeroPath(): string {
  return join(process.cwd(), "public", HERO_FILENAME);
}

function getPublicUrl(): string {
  return `/${HERO_FILENAME}`;
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey });
}

export async function GET(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = limiter.check(user.id);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const heroPath = getHeroPath();
    const publicUrl = getPublicUrl();

    // Return URL directly if local file already exists; skip DALL-E call
    if (existsSync(heroPath)) {
      return NextResponse.json({ image: publicUrl });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const openai = getOpenAI();
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: HERO_PROMPT,
      size: "512x512",
      response_format: "b64_json",
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data from DALL-E");

    const buffer = Buffer.from(b64, "base64");
    const publicDir = join(process.cwd(), "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }
    writeFileSync(heroPath, buffer);

    return NextResponse.json({ image: publicUrl });
  } catch (e) {
    console.error("[generate-hero-image]", e);
    return NextResponse.json(
      { error: "Failed to generate hero image" },
      { status: 500 }
    );
  }
}
