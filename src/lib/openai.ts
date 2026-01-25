import { getHostById } from '@/app/config/host-config';

export interface ChatMessage {
  role: 'user' | 'gm';
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  messages: ChatMessage[];
  hostId?: string;
  gameContext?: {
    template?: string;
    playerCount?: number;
    gameName?: string;
    rules?: string;
    conversationState?: string;
  };
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenAI API to get AI Game Master response
 */
export async function getAIChatResponse(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    const host = request.hostId ? getHostById(request.hostId) : null;
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp?.toISOString()
        })),
        hostPersonality: host ? {
          name: host.name,
          description: host.description,
          personality: `${host.tagline}. ${host.voiceStyle}`
        } : null,
        gameContext: request.gameContext
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get AI response');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Stream AI response from OpenAI API
 */
export async function streamAIChatResponse(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const host = request.hostId ? getHostById(request.hostId) : null;
    
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp?.toISOString()
        })),
        hostPersonality: host ? {
          name: host.name,
          description: host.description,
          personality: `${host.tagline}. ${host.voiceStyle}`
        } : null,
        gameContext: request.gameContext
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stream AI response');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete?.();
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error streaming AI response:', error);
    onError?.(error);
    throw error;
  }
}
