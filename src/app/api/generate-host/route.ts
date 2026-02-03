import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { gameRules, gameName } = await req.json();

    if (!gameRules) {
      return NextResponse.json(
        { error: "Game rules are required" },
        { status: 400 }
      );
    }

    console.log(`[Generate Host] Generating host for game: ${gameName || "Unknown"}`);

    const systemPrompt = `You are a creative game design assistant. Generate a unique AI host for this game.

Based on the game's theme and rules, decide:
- What kind of name fits best (short modern name, role title, character name, etc.)
- What personality would enhance the experience
- How they should speak and interact with players
- What emoji and color represent them
- The host's gender (male/female/other) so voice and avatar match
- Which TTS voice fits best: pick ONE from exactly: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar (e.g. female host → shimmer/coral/fable/nova/ballad/marin; male → echo/onyx/sage/cedar/alloy/ash/verse)

Be creative and adaptive. For abstract games use simple names; for themed games use atmospheric names/titles that match the setting.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "name": "Host name or title that fits the game",
  "personality": "Brief personality description (20-40 words)",
  "voiceStyle": "How they sound (5-15 words)",
  "systemPrompt": "How they behave and speak (50-150 words)",
  "icon": "Single emoji",
  "color": "Hex color code",
  "gender": "male or female or other",
  "ttsVoice": "exactly one of: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar"
}`;

    const userPrompt = `Game: ${gameName || "Custom Game"}

Rules:
${gameRules}

Create a host that perfectly fits this game's theme and atmosphere.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.0, // High creativity for diverse hosts
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    console.log("[Generate Host] Raw response:", response);

    // Parse the JSON response
    let hostConfig;
    try {
      hostConfig = JSON.parse(response);
    } catch (parseError) {
      console.error("[Generate Host] Failed to parse JSON:", parseError);
      console.error("[Generate Host] Response was:", response);
      return NextResponse.json(
        { error: "Failed to parse host configuration" },
        { status: 500 }
      );
    }

    // Validate required fields
    const required = ["name", "personality", "voiceStyle", "systemPrompt", "icon", "color"];
    for (const field of required) {
      if (!hostConfig[field]) {
        console.error(`[Generate Host] Missing field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 500 }
        );
      }
    }
    const validVoices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"];
    if (hostConfig.ttsVoice && !validVoices.includes(String(hostConfig.ttsVoice).toLowerCase())) {
      delete hostConfig.ttsVoice; // fallback to gender-based selection
    }
    if (hostConfig.gender && !["male", "female", "other"].includes(String(hostConfig.gender).toLowerCase())) {
      delete hostConfig.gender;
    }

    console.log("[Generate Host] Generated host:", hostConfig.name);

    return NextResponse.json(hostConfig);
  } catch (error) {
    console.error("[Generate Host] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate host" },
      { status: 500 }
    );
  }
}
