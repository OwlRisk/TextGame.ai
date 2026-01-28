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

    const systemPrompt = `You are a creative game design assistant. Your task is to generate a unique AI host personality based on the provided game rules.

The host should:
- Have a unique name that fits the game's theme
- Have a distinctive personality that enhances the game experience
- Have an appropriate voice style for the game type
- Have a system prompt that defines how they interact with players

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "name": "Host name (2-8 characters)",
  "personality": "Brief personality description (20-40 words)",
  "voiceStyle": "Voice style description (5-15 words)",
  "systemPrompt": "Detailed system prompt for the host's behavior (50-150 words)",
  "icon": "Single emoji that represents the host",
  "color": "Hex color code (e.g., #6366f1)"
}`;

    const userPrompt = `Generate a unique AI host for this game:

Game Name: ${gameName || "Custom Game"}

Game Rules:
${gameRules}

Create a host that perfectly matches the game's theme and atmosphere. Make the personality unique and memorable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
