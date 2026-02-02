import { getHostById } from '@/app/config/host-config';

export interface ChatMessage {
  role: 'user' | 'gm';
  content: string;
  timestamp?: Date;
}

/** Custom host from GM conversation (overrides hostId when provided) */
export interface HostPersonalityOverride {
  name: string;
  description?: string;
  personality?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  hostId?: string;
  /** When set (e.g. host created via GM), used instead of hostId for host personality */
  hostPersonality?: HostPersonalityOverride;
  /** Max tokens for completion; higher allows full rules in one response (e.g. GM rules editing) */
  maxCompletionTokens?: number;
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
 * Call OpenAI API to get AI Game Master response with retry logic
 */
export async function getAIChatResponse(
  request: ChatRequest,
  retries = 3
): Promise<ChatResponse> {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const hostPersonality = request.hostPersonality ?? (request.hostId ? (() => {
        const host = getHostById(request.hostId);
        return host ? { name: host.name, description: host.description, personality: `${host.tagline ?? ''}. ${host.voiceStyle ?? ''}`.trim() || undefined } : null;
      })() : null);
      
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
          hostPersonality,
          gameContext: request.gameContext,
          maxCompletionTokens: request.maxCompletionTokens
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get AI response');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      lastError = error;
      console.error(`Error calling OpenAI API (attempt ${attempt + 1}/${retries}):`, error);
      
      // Don't retry on certain errors
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

/**
 * Stream AI response from OpenAI API with retry logic
 */
export async function streamAIChatResponse(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
  retries = 2
): Promise<void> {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const hostPersonality = request.hostPersonality ?? (request.hostId ? (() => {
        const host = getHostById(request.hostId);
        return host ? { name: host.name, description: host.description, personality: `${host.tagline ?? ''}. ${host.voiceStyle ?? ''}`.trim() || undefined } : null;
      })() : null);
      
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
          hostPersonality,
          gameContext: request.gameContext,
          maxCompletionTokens: request.maxCompletionTokens
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to stream AI response';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          try {
            const text = await response.text();
            if (text.includes('OPENAI_API_KEY')) {
              errorMessage = 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.';
            } else {
              errorMessage = text || errorMessage;
            }
          } catch (textError) {
            // Fallback to default message
          }
        }
        // Log original for debugging
        console.error(`[OpenAI] API error (${response.status}):`, errorMessage);
        // User-friendly messages by type
        if (response.status === 401 || /invalid.*api.*key|incorrect.*api.*key|authentication/i.test(errorMessage)) {
          errorMessage = 'OpenAI API key is invalid or expired. Please check OPENAI_API_KEY in your .env file.';
        } else if (response.status === 429 || /rate limit|too many requests/i.test(errorMessage)) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (response.status >= 502 && response.status <= 504) {
          errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
        } else if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up|fetch failed|network/i.test(errorMessage)) {
          errorMessage = 'Unable to connect. Please check your network and OpenAI API key, then try again.';
        }
        // Otherwise keep the server's error message (often helpful)
        throw new Error(errorMessage);
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
          return; // Success, exit retry loop
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return; // Success, exit retry loop
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
      lastError = error;
      console.error(`Error streaming AI response (attempt ${attempt + 1}/${retries}):`, error);
      
      // Don't retry on certain errors
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
        return;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // All retries failed
  if (onError) {
    onError(lastError);
  } else {
    throw lastError;
  }
}
