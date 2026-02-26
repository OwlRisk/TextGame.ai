/**
 * 环境变量集中引用与说明。
 * 各 API 在用时自行校验必填项（如 OPENAI_API_KEY）；此处仅作单点查阅与类型提示。
 */

export const env = {
  get OPENAI_API_KEY(): string | undefined {
    return process.env.OPENAI_API_KEY;
  },
  get OPENAI_CHAT_MODEL(): string {
    return process.env.OPENAI_CHAT_MODEL || 'gpt-5.2';
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
  /** 设为 '0' 时关闭 DB TLS 证书校验（仅开发/自签名用，生产勿设） */
  get DATABASE_SSL_REJECT_UNAUTHORIZED(): string | undefined {
    return process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  },
  get STRIPE_SECRET_KEY(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  },
  get STRIPE_WEBHOOK_SECRET(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get CARTESIA_API_KEY(): string | undefined {
    return process.env.CARTESIA_API_KEY;
  },
  /** Inworld.ai: Base64 for "Authorization: Basic <value>" (server-side only) */
  get INWORLD_BASIC_BASE64(): string | undefined {
    return process.env.INWORLD_BASIC_BASE64;
  },
  /** Inworld.ai: JWT Key (for signing tokens with INWORLD_JWT_SECRET) */
  get INWORLD_JWT_KEY(): string | undefined {
    return process.env.INWORLD_JWT_KEY;
  },
  /** Inworld.ai: JWT Secret (keep secret, server-side only) */
  get INWORLD_JWT_SECRET(): string | undefined {
    return process.env.INWORLD_JWT_SECRET;
  },
  get REPLICATE_API_TOKEN(): string | undefined {
    return process.env.REPLICATE_API_TOKEN;
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },
} as const;
