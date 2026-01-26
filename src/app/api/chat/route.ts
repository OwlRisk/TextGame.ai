import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid errors at module load time
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set. Please configure it in your .env file.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    // Check API key first
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, hostPersonality, gameContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

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

    systemMessage += `\n\nContext: This chat is for game setup. The actual game (phases, roles, etc.) runs on a separate screen after the user clicks "Create Game". Use your judgment to guide appropriately.`;
    
    if (gameContext?.conversationState === "confirmation") {
      systemMessage += `\n\nYou are in the confirmation state. Configuration is complete. A "Create Game" button will appear when the user is ready to proceed—use your judgment to help them get there.`;
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
      model: 'gpt-5.2',
      messages: formattedMessages,
      temperature: 0.8,
      max_completion_tokens: 500,
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
