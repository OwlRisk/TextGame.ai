import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, hostPersonality, gameContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Build system message with host personality and game context
    let systemMessage = `You are an AI Game Master for a social deduction game platform. Your role is to guide players through game setup and gameplay in a friendly, engaging manner.`;

    if (hostPersonality) {
      systemMessage += `\n\nYour personality: ${hostPersonality.name} - ${hostPersonality.description}`;
      if (hostPersonality.personality) {
        systemMessage += `\nPersonality traits: ${hostPersonality.personality}`;
      }
    }

    if (gameContext) {
      systemMessage += `\n\nGame Context:\n`;
      if (gameContext.template) {
        systemMessage += `- Game Template: ${gameContext.template}\n`;
      }
      if (gameContext.playerCount) {
        systemMessage += `- Player Count: ${gameContext.playerCount}\n`;
      }
      if (gameContext.gameName) {
        systemMessage += `- Game Name: ${gameContext.gameName}\n`;
      }
      if (gameContext.rules) {
        systemMessage += `- Rules: ${gameContext.rules}\n`;
      }
      if (gameContext.conversationState) {
        systemMessage += `- Current State: ${gameContext.conversationState}\n`;
      }
    }

    systemMessage += `\n\nKeep your responses concise, engaging, and helpful. Guide the user through the game setup process step by step.`;
    
    // When in confirmation state, guide user to confirm
    if (gameContext?.conversationState === "confirmation") {
      systemMessage += `\n\nIMPORTANT: You are in the confirmation state. The game configuration is complete. You should:
1. Summarize the game configuration
2. Ask if the user wants to make any changes
3. When the user confirms they're ready (says "yes", "create", "start", etc.), encourage them to click the "Create Game" button that will appear
4. Remind them they can still modify rules before creating if needed

The user will see a button to create the game - guide them to click it when they're ready.`;
    }

    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg: any) => ({
        role: msg.role === 'gm' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency, can switch to gpt-4o if needed
      messages: formattedMessages,
      temperature: 0.8,
      max_tokens: 500,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';

    return NextResponse.json({ 
      message: response,
      usage: completion.usage 
    });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI API key configuration.' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
