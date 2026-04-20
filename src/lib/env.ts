/**
 * Centralized environment variable references and descriptions.
 * Each API validates required keys at use time (e.g. OPENAI_API_KEY); this module serves as a single lookup point with type hints.
 */

export const env = {
  get OPENAI_API_KEY(): string | undefined {
    return process.env.OPENAI_API_KEY;
  },
  get OPENAI_CHAT_MODEL(): string {
    return process.env.OPENAI_CHAT_MODEL || 'gpt-5.3-chat-latest';
  },
  get NEXT_PUBLIC_SUPABASE_URL(): string | undefined {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string | undefined {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get DATABASE_URL(): string | undefined {
    return process.env.DATABASE_URL;
  },
  /** Set to '0' to disable DB TLS certificate verification (dev/self-signed only; do not set in production) */
  get DATABASE_SSL_REJECT_UNAUTHORIZED(): string | undefined {
    return process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  },
  get STRIPE_SECRET_KEY(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  },
  get STRIPE_WEBHOOK_SECRET(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },
} as const;

// Note: CARTESIA_API_KEY / INWORLD_* / REPLICATE_API_TOKEN getters were
// removed in the RPG-only refactor — those services were retired with the
// voice and SD-image generation features. The names are no longer
// referenced by any production code. Keep this comment as a checkpoint:
// if any of those services come back, re-add the getter explicitly so
// `env.X` reads stay typed.
