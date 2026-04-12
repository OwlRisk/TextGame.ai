import { describe, it, expect } from 'vitest';
import {
  rechargeCoinsFromPayment,
  usdToCoins,
  gptUsageToCoins,
  estimatedTokensToCoins,
  estimateTokensFromText,
  estimateChatTokens,
  ttsCostToCoins,
  imageGenCostToCoins,
  COIN_VALUE_USD,
  GPT_BUDGET_RATIO,
  PLATFORM_MARKUP,
  TOKEN_COSTS,
  INWORLD_TTS_PRICE_PER_1M_CHARS,
  IMAGE_GEN_PRICE_USD,
  DEFAULT_COIN_PACKAGES,
} from '../tokens';

// ─── rechargeCoinsFromPayment ──────────────────────────────────────────────

describe('rechargeCoinsFromPayment', () => {
  it('$10 (1000 cents) → 500 coins', () => {
    expect(rechargeCoinsFromPayment(1000)).toBe(500);
  });

  it('$20 (2000 cents) → 1000 coins', () => {
    expect(rechargeCoinsFromPayment(2000)).toBe(1000);
  });

  it('$1 (100 cents) → 50 coins', () => {
    expect(rechargeCoinsFromPayment(100)).toBe(50);
  });

  it('returns 0 for zero amount', () => {
    expect(rechargeCoinsFromPayment(0)).toBe(0);
  });

  it('returns 0 for negative amount', () => {
    expect(rechargeCoinsFromPayment(-100)).toBe(0);
  });

  it('floors fractional coins', () => {
    expect(rechargeCoinsFromPayment(1)).toBe(0);
    expect(rechargeCoinsFromPayment(3)).toBe(1);
  });

  it('is consistent with COIN_VALUE_USD and GPT_BUDGET_RATIO constants', () => {
    const cents = 5000;
    const expected = Math.floor((cents / 100) * GPT_BUDGET_RATIO / COIN_VALUE_USD);
    expect(rechargeCoinsFromPayment(cents)).toBe(expected);
  });
});

// ─── usdToCoins ───────────────────────────────────────────────────────────

describe('usdToCoins', () => {
  it('PLATFORM_MARKUP is 2', () => {
    expect(PLATFORM_MARKUP).toBe(2);
  });

  it('$0.01 API cost → 2 coins (2x markup)', () => {
    expect(usdToCoins(0.01)).toBe(2);
  });

  it('$0.10 API cost → 20 coins', () => {
    expect(usdToCoins(0.10)).toBe(20);
  });

  it('$1.00 API cost → 200 coins', () => {
    expect(usdToCoins(1.00)).toBe(200);
  });

  it('ceils fractional coins after markup', () => {
    // $0.005 → ceil(0.005 / 0.01 * 2) = ceil(1.0) = 1
    expect(usdToCoins(0.005)).toBe(1);
  });

  it('zero or negative → 0 coins (callers enforce minimum via Math.max)', () => {
    expect(usdToCoins(0)).toBe(0);
    expect(usdToCoins(-5)).toBe(0);
  });

  it('very small cost → still at least 1', () => {
    expect(usdToCoins(0.001)).toBe(1);
  });

  it('is consistent with PLATFORM_MARKUP constant', () => {
    const usd = 0.05;
    expect(usdToCoins(usd)).toBe(Math.max(1, Math.ceil((usd / COIN_VALUE_USD) * PLATFORM_MARKUP)));
  });
});

// ─── gptUsageToCoins ──────────────────────────────────────────────────────

describe('gptUsageToCoins', () => {
  it('gpt-4o: 1M prompt + 1M completion tokens → correct coins (2x markup)', () => {
    // input $2.5/1M + output $10/1M → usd = 12.5 → coins = ceil(12.5/0.01 * 2) = 2500
    expect(gptUsageToCoins('gpt-4o', 1_000_000, 1_000_000)).toBe(2500);
  });

  it('gpt-4o-mini: 1M prompt + 1M completion → cheap model (2x markup)', () => {
    // input $0.15/1M + output $0.6/1M → usd = 0.75 → coins = ceil(0.75/0.01 * 2) = 150
    expect(gptUsageToCoins('gpt-4o-mini', 1_000_000, 1_000_000)).toBe(150);
  });

  it('gpt-5.2 costs more than gpt-4o (higher tier)', () => {
    expect(gptUsageToCoins('gpt-5.2', 1_000_000, 1_000_000))
      .toBeGreaterThan(gptUsageToCoins('gpt-4o', 1_000_000, 1_000_000));
  });

  it('unknown model falls back to gpt-5.2 pricing', () => {
    expect(gptUsageToCoins('unknown-model', 1_000_000, 1_000_000)).toBe(
      gptUsageToCoins('gpt-5.2', 1_000_000, 1_000_000)
    );
  });

  it('gpt-5.2 uses $1.75 input / $14.00 output pricing (2x markup)', () => {
    // 1M input + 1M output: 15.75 USD → ceil(15.75/0.01 * 2) = 3150
    expect(gptUsageToCoins('gpt-5.2', 1_000_000, 1_000_000)).toBe(3150);
  });

  it('gpt-4.1 uses $2.00 input / $8.00 output pricing (2x markup)', () => {
    // 10.00 USD → ceil(10/0.01 * 2) = 2000
    expect(gptUsageToCoins('gpt-4.1', 1_000_000, 1_000_000)).toBe(2000);
  });

  it('gpt-4.1-mini uses $0.40 input / $1.60 output pricing (2x markup)', () => {
    // 2.00 USD → ceil(2/0.01 * 2) = 400
    expect(gptUsageToCoins('gpt-4.1-mini', 1_000_000, 1_000_000)).toBe(400);
  });

  it('gpt-5-nano is the cheapest supported model', () => {
    const nano = gptUsageToCoins('gpt-5-nano', 1_000_000, 1_000_000);
    const mini = gptUsageToCoins('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(nano).toBeLessThan(mini);
  });

  it('zero tokens → 0 coins (callers enforce minimum via Math.max)', () => {
    expect(gptUsageToCoins('gpt-4o', 0, 0)).toBe(0);
  });

  it('small real-world usage (1k prompt, 500 completion)', () => {
    const coins = gptUsageToCoins('gpt-4o', 1000, 500);
    expect(coins).toBeGreaterThanOrEqual(1);
  });
});

// ─── estimatedTokensToCoins ───────────────────────────────────────────────

describe('estimatedTokensToCoins', () => {
  it('returns at least 1 for positive tokens', () => {
    expect(estimatedTokensToCoins(100)).toBeGreaterThanOrEqual(1);
  });

  it('returns 0 for zero or negative tokens', () => {
    expect(estimatedTokensToCoins(0)).toBe(0);
    expect(estimatedTokensToCoins(-100)).toBe(0);
  });

  it('larger token counts cost more', () => {
    expect(estimatedTokensToCoins(100_000)).toBeGreaterThan(estimatedTokensToCoins(1_000));
  });

  it('uses default model when none specified', () => {
    const defaultCost = estimatedTokensToCoins(10_000);
    const explicitCost = estimatedTokensToCoins(10_000, 'gpt-5.2');
    expect(defaultCost).toBe(explicitCost);
  });

  it('cheap model costs fewer coins than expensive model', () => {
    const cheap = estimatedTokensToCoins(100_000, 'gpt-4o-mini');
    const expensive = estimatedTokensToCoins(100_000, 'gpt-4o');
    expect(cheap).toBeLessThan(expensive);
  });
});

// ─── estimateTokensFromText ───────────────────────────────────────────────

describe('estimateTokensFromText', () => {
  it('empty string → 0', () => {
    expect(estimateTokensFromText('')).toBe(0);
  });

  it('null / non-string → 0', () => {
    expect(estimateTokensFromText(null as unknown as string)).toBe(0);
    expect(estimateTokensFromText(undefined as unknown as string)).toBe(0);
  });

  it('3-char string → 1 token', () => {
    expect(estimateTokensFromText('abc')).toBe(1);
  });

  it('6-char string → 2 tokens', () => {
    expect(estimateTokensFromText('abcdef')).toBe(2);
  });

  it('ceils partial tokens', () => {
    expect(estimateTokensFromText('ab')).toBe(1);
    expect(estimateTokensFromText('abcd')).toBe(2);
  });

  it('longer text produces proportionally more tokens', () => {
    const short = estimateTokensFromText('Hello');
    const long = estimateTokensFromText('Hello World, this is a longer message for testing.');
    expect(long).toBeGreaterThan(short);
  });
});

// ─── estimateChatTokens ───────────────────────────────────────────────────

describe('estimateChatTokens', () => {
  it('sums all three components', () => {
    expect(estimateChatTokens(100, 200, 300)).toBe(600);
  });

  it('handles zeros', () => {
    expect(estimateChatTokens(0, 0, 0)).toBe(0);
  });

  it('typical scenario: system(500) + messages(2000) + max(1000)', () => {
    expect(estimateChatTokens(500, 2000, 1000)).toBe(3500);
  });
});

// ─── TOKEN_COSTS constants ────────────────────────────────────────────────

describe('TOKEN_COSTS', () => {
  it('all values are positive integers', () => {
    Object.values(TOKEN_COSTS).forEach((cost) => {
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    });
  });

  it('has required cost keys', () => {
    expect(TOKEN_COSTS).toHaveProperty('QUICK_REPLY_SUGGESTION');
    expect(TOKEN_COSTS).toHaveProperty('VOICE_TRANSCRIPTION_PER_MIN');
  });
});

// ─── IMAGE_GEN_PRICE_USD ──────────────────────────────────────────────────

describe('IMAGE_GEN_PRICE_USD', () => {
  it('covers all supported image models', () => {
    const expected = ['dall-e-2', 'dall-e-3', 'dall-e-3-hd', 'flux', 'stable-diffusion'];
    expected.forEach((model) => {
      expect(IMAGE_GEN_PRICE_USD).toHaveProperty(model);
      expect(IMAGE_GEN_PRICE_USD[model]).toBeGreaterThan(0);
    });
  });

  it('dall-e-3 costs more than dall-e-2', () => {
    expect(IMAGE_GEN_PRICE_USD['dall-e-3']).toBeGreaterThan(IMAGE_GEN_PRICE_USD['dall-e-2']);
  });

  it('dall-e-3-hd costs more than dall-e-3', () => {
    expect(IMAGE_GEN_PRICE_USD['dall-e-3-hd']).toBeGreaterThan(IMAGE_GEN_PRICE_USD['dall-e-3']);
  });
});

// ─── imageGenCostToCoins ──────────────────────────────────────────────────

describe('imageGenCostToCoins', () => {
  it('dall-e-2: $0.016 × 2x markup = ceil(0.016/0.01 * 2) = 4 coins', () => {
    expect(imageGenCostToCoins('dall-e-2')).toBe(4);
  });

  it('dall-e-3: $0.04 × 2x markup = 8 coins', () => {
    expect(imageGenCostToCoins('dall-e-3')).toBe(8);
  });

  it('dall-e-3-hd: $0.08 × 2x markup = 16 coins', () => {
    expect(imageGenCostToCoins('dall-e-3-hd')).toBe(16);
  });

  it('dall-e-3 costs more than dall-e-2', () => {
    expect(imageGenCostToCoins('dall-e-3')).toBeGreaterThan(imageGenCostToCoins('dall-e-2'));
  });

  it('unknown model falls back to dall-e-3 pricing', () => {
    expect(imageGenCostToCoins('unknown-model')).toBe(imageGenCostToCoins('dall-e-3'));
  });

  it('returns at least 1 coin for any model', () => {
    expect(imageGenCostToCoins('dall-e-2')).toBeGreaterThanOrEqual(1);
  });
});

// ─── INWORLD_TTS_PRICE_PER_1M_CHARS ──────────────────────────────────────

describe('INWORLD_TTS_PRICE_PER_1M_CHARS', () => {
  it('covers all supported Inworld TTS models', () => {
    const expected = ['inworld-tts-1.5-max', 'inworld-tts-1-max', 'inworld-tts-1.5-mini', 'inworld-tts-1'];
    expected.forEach((model) => {
      expect(INWORLD_TTS_PRICE_PER_1M_CHARS).toHaveProperty(model);
      expect(INWORLD_TTS_PRICE_PER_1M_CHARS[model]).toBeGreaterThan(0);
    });
  });

  it('max models cost more than mini/standard models', () => {
    expect(INWORLD_TTS_PRICE_PER_1M_CHARS['inworld-tts-1.5-max'])
      .toBeGreaterThan(INWORLD_TTS_PRICE_PER_1M_CHARS['inworld-tts-1.5-mini']);
  });
});

// ─── ttsCostToCoins ───────────────────────────────────────────────────────

describe('ttsCostToCoins', () => {
  it('returns 0 for empty text', () => {
    expect(ttsCostToCoins(0, 'inworld-tts-1.5-mini')).toBe(0);
  });

  it('returns 0 for negative chars', () => {
    expect(ttsCostToCoins(-10, 'inworld-tts-1.5-mini')).toBe(0);
  });

  it('inworld-tts-1.5-mini: 1M chars = 1000 coins ($5/1M × 2x markup)', () => {
    expect(ttsCostToCoins(1_000_000, 'inworld-tts-1.5-mini')).toBe(1000);
  });

  it('inworld-tts-1.5-max: 1M chars = 2000 coins ($10/1M × 2x markup)', () => {
    expect(ttsCostToCoins(1_000_000, 'inworld-tts-1.5-max')).toBe(2000);
  });

  it('small text (100 chars) costs at least 1 coin', () => {
    expect(ttsCostToCoins(100, 'inworld-tts-1.5-mini')).toBeGreaterThanOrEqual(1);
  });

  it('unknown model falls back to inworld-tts-1.5-max pricing', () => {
    expect(ttsCostToCoins(1_000_000, 'unknown-tts-model'))
      .toBe(ttsCostToCoins(1_000_000, 'inworld-tts-1.5-max'));
  });

  it('max model costs more than mini for same char count', () => {
    const large = 500_000;
    expect(ttsCostToCoins(large, 'inworld-tts-1.5-max'))
      .toBeGreaterThan(ttsCostToCoins(large, 'inworld-tts-1.5-mini'));
  });

  it('typical message (200 chars) costs 1 coin with mini', () => {
    // 200/1M * $5 = $0.001 → ceil(0.001/0.01 * 2) = ceil(0.2) = 1
    expect(ttsCostToCoins(200, 'inworld-tts-1.5-mini')).toBe(1);
  });

  it('2000 chars with max costs 4 coins (2x markup)', () => {
    // 2000/1M * $10 = $0.02 → ceil(0.02/0.01 * 2) = ceil(4) = 4
    expect(ttsCostToCoins(2000, 'inworld-tts-1.5-max')).toBe(4);
  });
});

// ─── DEFAULT_COIN_PACKAGES ────────────────────────────────────────────────

describe('DEFAULT_COIN_PACKAGES', () => {
  it('has at least 3 packages', () => {
    expect(DEFAULT_COIN_PACKAGES.length).toBeGreaterThanOrEqual(3);
  });

  it('packages are sorted by token count ascending', () => {
    for (let i = 1; i < DEFAULT_COIN_PACKAGES.length; i++) {
      expect(DEFAULT_COIN_PACKAGES[i].tokens).toBeGreaterThan(
        DEFAULT_COIN_PACKAGES[i - 1].tokens
      );
    }
  });

  it('each package has positive tokens and price_cents', () => {
    DEFAULT_COIN_PACKAGES.forEach((pkg) => {
      expect(pkg.tokens).toBeGreaterThan(0);
      expect(pkg.price_cents).toBeGreaterThan(0);
      expect(typeof pkg.name).toBe('string');
      expect(pkg.name.length).toBeGreaterThan(0);
    });
  });

  it('price_cents is proportional to tokens (default 1:1)', () => {
    DEFAULT_COIN_PACKAGES.forEach((pkg) => {
      expect(pkg.price_cents).toBe(pkg.tokens);
    });
  });
});
