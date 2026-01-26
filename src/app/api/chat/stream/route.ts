import { NextRequest } from 'next/server';
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
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await request.json();
    const { messages, hostPersonality, gameContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = getOpenAI();

    // Build system message
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

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: formattedMessages,
      temperature: 0.8,
      max_completion_tokens: 500,
      stream: true,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to stream AI response' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
