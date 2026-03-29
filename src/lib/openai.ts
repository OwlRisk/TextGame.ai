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
  /** Supabase session access_token; required for API auth */
  authToken?: string;
  gameContext?: {
    template?: string;
    playerCount?: number;
    gameName?: string;
    rules?: string;
    conversationState?: string;
    minPlayers?: number;
    maxPlayers?: number;
    recommendedAICount?: number;
    category?: string;
    hasHiddenRoles?: boolean;
    hasElimination?: boolean;
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
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (request.authToken) headers['Authorization'] = `Bearer ${request.authToken}`;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
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
 * Stream AI response via SSE from /api/chat/stream with retry logic.
 * Calls onChunk incrementally as tokens arrive for real-time UI updates.
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
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (request.authToken) headers['Authorization'] = `Bearer ${request.authToken}`;
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
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
        let errorMessage = 'Failed to get AI response';
        let errorCode: string | undefined;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          errorCode = error.code;
        } catch {
          try {
            const text = await response.text();
            if (text.includes('OPENAI_API_KEY')) {
              errorMessage = 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.';
            } else {
              errorMessage = text || errorMessage;
            }
          } catch {
            // Fallback to default message
          }
        }

        if (response.status === 402 || errorCode === 'INSUFFICIENT_TOKENS') {
          const err = new Error('INSUFFICIENT_TOKENS') as Error & { code: string };
          err.code = 'INSUFFICIENT_TOKENS';
          throw err;
        }

        if (response.status === 401 || /invalid.*api.*key|incorrect.*api.*key|authentication/i.test(errorMessage)) {
          errorMessage = 'OpenAI API key is invalid or expired. Please check OPENAI_API_KEY in your .env file.';
        } else if (response.status === 429 || /rate limit|too many requests/i.test(errorMessage)) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (response.status >= 502 && response.status <= 504) {
          errorMessage = 'OpenAI service is temporarily unavailable. Please try again later.';
        } else if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up|fetch failed|network|connection/i.test(errorMessage)) {
          errorMessage = 'Unable to connect. Please check your network and try again.';
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) onChunk(parsed.content);
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== payload) throw parseErr;
          }
        }
      }

      onComplete?.();
      return;
    } catch (error: any) {
      lastError = error;
      console.error(`Error streaming AI response (attempt ${attempt + 1}/${retries}):`, error);
      
      const noRetry = error.message?.includes('API key')
        || error.message?.includes('authentication')
        || error.message === 'INSUFFICIENT_TOKENS'
        || error.code === 'INSUFFICIENT_TOKENS';
      if (noRetry) {
        if (onError) { onError(error); } else { throw error; }
        return;
      }
      
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  if (onError) {
    onError(lastError);
  } else {
    throw lastError;
  }
}
