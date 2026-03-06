import { describe, it, expect, afterEach } from "vitest";
import { env } from "../env";

describe("env", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns OPENAI_API_KEY from process.env", () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    expect(env.OPENAI_API_KEY).toBe("sk-test-key");
  });

  it("returns undefined for OPENAI_API_KEY when not set", () => {
    delete process.env.OPENAI_API_KEY;
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  it("returns OPENAI_CHAT_MODEL from env or default gpt-5.2", () => {
    delete process.env.OPENAI_CHAT_MODEL;
    expect(env.OPENAI_CHAT_MODEL).toBe("gpt-5.2");

    process.env.OPENAI_CHAT_MODEL = "gpt-4o";
    expect(env.OPENAI_CHAT_MODEL).toBe("gpt-4o");
  });

  it("returns NODE_ENV or default 'development'", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(env.NODE_ENV).toBe("production");

    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    expect(env.NODE_ENV).toBe("test");
  });

  it("returns Supabase variables", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-key");
  });

  it("returns undefined for missing optional keys", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.CARTESIA_API_KEY;
    delete process.env.INWORLD_BASIC_BASE64;
    delete process.env.REPLICATE_API_TOKEN;
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(env.STRIPE_WEBHOOK_SECRET).toBeUndefined();
    expect(env.CARTESIA_API_KEY).toBeUndefined();
    expect(env.INWORLD_BASIC_BASE64).toBeUndefined();
    expect(env.REPLICATE_API_TOKEN).toBeUndefined();
  });

  it("returns DATABASE_URL when set", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost/db";
    expect(env.DATABASE_URL).toBe("postgres://user:pass@localhost/db");
  });

  it("returns DATABASE_SSL_REJECT_UNAUTHORIZED when set", () => {
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = "0";
    expect(env.DATABASE_SSL_REJECT_UNAUTHORIZED).toBe("0");
  });

  it("returns Inworld keys when set", () => {
    process.env.INWORLD_JWT_KEY = "jwt-key";
    process.env.INWORLD_JWT_SECRET = "jwt-secret";
    expect(env.INWORLD_JWT_KEY).toBe("jwt-key");
    expect(env.INWORLD_JWT_SECRET).toBe("jwt-secret");
  });

  it("all env getters are reactive (change when process.env changes)", () => {
    process.env.OPENAI_API_KEY = "key-1";
    expect(env.OPENAI_API_KEY).toBe("key-1");
    process.env.OPENAI_API_KEY = "key-2";
    expect(env.OPENAI_API_KEY).toBe("key-2");
  });
});
