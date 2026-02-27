import { describe, it, expect } from 'vitest';
import {
  rechargeCoinsFromPayment,
  usdToCoins,
  gptUsageToCoins,
  estimatedTokensToCoins,
  estimateTokensFromText,
  estimateChatTokens,
  COIN_VALUE_USD,
  GPT_BUDGET_RATIO,
  TOKEN_COSTS,
  DEFAULT_COIN_PACKAGES,
} from '../tokens';

// ─── rechargeCoinsFromPayment ──────────────────────────────────────────────

describe('rechargeCoinsFromPayment', () => {
  it('$10 (1000 cents) → 500 coins', () => {
    // 1000 / 100 * 0.5 / 0.01 = 500
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
    // 1 cent → 0.01 * 0.5 / 0.01 = 0.5 → floor → 0
    expect(rechargeCoinsFromPayment(1)).toBe(0);
    // 3 cents → 0.03 * 0.5 / 0.01 = 1.5 → floor → 1
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
  it('$0.01 → 1 coin', () => {
    expect(usdToCoins(0.01)).toBe(1);
  });

  it('$0.10 → 10 coins', () => {
    expect(usdToCoins(0.10)).toBe(10);
  });

  it('$1.00 → 100 coins', () => {
    expect(usdToCoins(1.00)).toBe(100);
  });

  it('ceils fractional coins', () => {
    // $0.015 → ceil(0.015 / 0.01) = ceil(1.5) = 2
    expect(usdToCoins(0.015)).toBe(2);
  });

  it('zero or negative → minimum 1 coin', () => {
    expect(usdToCoins(0)).toBe(1);
    expect(usdToCoins(-5)).toBe(1);
  });

  it('very small cost → still at least 1', () => {
    expect(usdToCoins(0.001)).toBe(1);
  });
});

// ─── gptUsageToCoins ──────────────────────────────────────────────────────

describe('gptUsageToCoins', () => {
  it('gpt-4o: 1M prompt + 1M completion tokens → correct coins', () => {
    // input $2.5/1M + output $10/1M → usd = 12.5 → coins = ceil(12.5/0.01) = 1250
    expect(gptUsageToCoins('gpt-4o', 1_000_000, 1_000_000)).toBe(1250);
  });

  it('gpt-4o-mini: 1M prompt + 1M completion → cheap model', () => {
    // input $0.15/1M + output $0.6/1M → usd = 0.75 → coins = ceil(0.75/0.01) = 75
    expect(gptUsageToCoins('gpt-4o-mini', 1_000_000, 1_000_000)).toBe(75);
  });

  it('gpt-5.2: same pricing as gpt-4o', () => {
    expect(gptUsageToCoins('gpt-5.2', 1_000_000, 1_000_000)).toBe(
      gptUsageToCoins('gpt-4o', 1_000_000, 1_000_000)
    );
  });

  it('unknown model falls back to gpt-5.2 pricing', () => {
    expect(gptUsageToCoins('unknown-model', 1_000_000, 1_000_000)).toBe(
      gptUsageToCoins('gpt-5.2', 1_000_000, 1_000_000)
    );
  });

  it('zero tokens → minimum 1 coin', () => {
    expect(gptUsageToCoins('gpt-4o', 0, 0)).toBe(1);
  });

  it('small real-world usage (1k prompt, 500 completion)', () => {
    // gpt-4o: (1000/1M)*2.5 + (500/1M)*10 = 0.0025 + 0.005 = 0.0075 → ceil(0.75) = 1
    const coins = gptUsageToCoins('gpt-4o', 1000, 500);
    expect(coins).toBeGreaterThanOrEqual(1);
  });
});

// ─── estimatedTokensToCoins ───────────────────────────────────────────────

describe('estimatedTokensToCoins', () => {
  it('returns at least 1 for positive tokens', () => {
    expect(estimatedTokensToCoins(100)).toBeGreaterThanOrEqual(1);
  });

  it('returns 1 for zero or negative tokens', () => {
    expect(estimatedTokensToCoins(0)).toBe(1);
    expect(estimatedTokensToCoins(-100)).toBe(1);
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
    expect(estimateTokensFromText('ab')).toBe(1);   // 2/3 → ceil = 1
    expect(estimateTokensFromText('abcd')).toBe(2); // 4/3 → ceil = 2
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
    expect(TOKEN_COSTS).toHaveProperty('GENERATE_AVATAR');
    expect(TOKEN_COSTS).toHaveProperty('GENERATE_ICON');
    expect(TOKEN_COSTS).toHaveProperty('QUICK_REPLY_SUGGESTION');
    expect(TOKEN_COSTS).toHaveProperty('TTS_PER_1K_CHARS');
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
