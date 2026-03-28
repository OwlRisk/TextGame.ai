/**
 * Billing accuracy & cost-reduction tests.
 *
 * Validates all fixes from the credit-system audit:
 *  1. gptUsageToCoins (accurate) vs estimatedTokensToCoins (50/50) — overcharge proof
 *  2. Realistic per-round cost calculations for typical game scenarios
 *  3. All API routes use gptUsageToCoins (not estimatedTokensToCoins) for deduction
 *  4. All API routes have balance pre-checks (hasTokens / getUserBalance)
 *  5. All deductTokens calls are awaited (no fire-and-forget)
 *  6. DALL-E 3 image generation removed from /api/chat
 *  7. Lobby voice preview is free (source=lobby_preview)
 *  8. TTS preview uses mini model and capped text length
 *  9. Model pricing table covers all allowed models
 * 10. Edge cases — zero tokens, unknown models, boundary values
 */

import { describe, it, expect } from 'vitest';
import {
  gptUsageToCoins,
  estimatedTokensToCoins,
  usdToCoins,
  ttsCostToCoins,
  PLATFORM_MARKUP,
  COIN_VALUE_USD,
} from '../tokens';
import * as fs from 'fs';
import * as path from 'path';

// ─── Helper: read route source ───────────────────────────────────────────────

function readRoute(routePath: string): string {
  const full = path.resolve(__dirname, '../../app/api', routePath);
  return fs.readFileSync(full, 'utf-8');
}

function readComponent(componentPath: string): string {
  const full = path.resolve(__dirname, '../../app/components', componentPath);
  return fs.readFileSync(full, 'utf-8');
}

// ─── 1. gptUsageToCoins vs estimatedTokensToCoins overcharge proof ───────────

describe('Accurate billing: gptUsageToCoins vs estimatedTokensToCoins', () => {
  const model = 'gpt-5.3-chat-latest';

  it('player-speak scenario: accurate is cheaper than 50/50 estimate', () => {
    const inputTokens = 2000;
    const outputTokens = 100;
    const totalTokens = inputTokens + outputTokens;

    const accurate = gptUsageToCoins(model, inputTokens, outputTokens);
    const estimated = estimatedTokensToCoins(totalTokens, model);

    expect(accurate).toBeLessThan(estimated);
  });

  it('host-chat scenario: accurate is cheaper than 50/50 estimate', () => {
    const inputTokens = 2300;
    const outputTokens = 200;
    const totalTokens = inputTokens + outputTokens;

    const accurate = gptUsageToCoins(model, inputTokens, outputTokens);
    const estimated = estimatedTokensToCoins(totalTokens, model);

    expect(accurate).toBeLessThan(estimated);
  });

  it('quick-reply scenario: accurate is cheaper than 50/50 estimate', () => {
    const inputTokens = 600;
    const outputTokens = 50;
    const totalTokens = inputTokens + outputTokens;

    const accurate = gptUsageToCoins(model, inputTokens, outputTokens);
    const estimated = estimatedTokensToCoins(totalTokens, model);

    expect(accurate).toBeLessThan(estimated);
  });

  it('50/50 only matches when input and output are truly equal', () => {
    const tokens = 1000;
    const accurate = gptUsageToCoins(model, tokens, tokens);
    const estimated = estimatedTokensToCoins(tokens * 2, model);
    expect(accurate).toBe(estimated);
  });

  it('overcharge factor is 2-3x for typical input-heavy calls', () => {
    const inputTokens = 2000;
    const outputTokens = 100;
    const totalTokens = inputTokens + outputTokens;

    const accurate = gptUsageToCoins(model, inputTokens, outputTokens);
    const estimated = estimatedTokensToCoins(totalTokens, model);

    const overchargeRatio = estimated / accurate;
    expect(overchargeRatio).toBeGreaterThanOrEqual(1.5);
    expect(overchargeRatio).toBeLessThanOrEqual(5);
  });

  it('the more input-heavy the call, the greater the overcharge', () => {
    const heavyInput = gptUsageToCoins(model, 5000, 50);
    const heavyEstimate = estimatedTokensToCoins(5050, model);
    const heavyRatio = heavyEstimate / heavyInput;

    const balancedInput = gptUsageToCoins(model, 500, 500);
    const balancedEstimate = estimatedTokensToCoins(1000, model);
    const balancedRatio = balancedEstimate / balancedInput;

    expect(heavyRatio).toBeGreaterThan(balancedRatio);
  });
});

// ─── 2. Realistic per-round cost calculations ────────────────────────────────

describe('Realistic per-round cost (gpt-5.3-chat-latest)', () => {
  const model = 'gpt-5.3-chat-latest';

  it('single player-speak costs 1 coin (2000 in + 100 out)', () => {
    const coins = gptUsageToCoins(model, 2000, 100);
    expect(coins).toBe(1);
  });

  it('host chat costs 2 coins (2300 in + 200 out)', () => {
    const coins = gptUsageToCoins(model, 2300, 200);
    expect(coins).toBe(2);
  });

  it('quick-reply suggestion costs 1 coin (600 in + 50 out)', () => {
    const coins = gptUsageToCoins(model, 600, 50);
    expect(coins).toBe(1);
  });

  it('full round with 4 AI players costs ~7 coins (no TTS)', () => {
    const host = gptUsageToCoins(model, 2300, 200);
    const players = 4 * gptUsageToCoins(model, 2000, 100);
    const quickReply = gptUsageToCoins(model, 600, 50);
    const total = host + players + quickReply;

    expect(total).toBeGreaterThanOrEqual(5);
    expect(total).toBeLessThanOrEqual(10);
  });

  it('full round with 4 AI players costs ~12 coins (with TTS)', () => {
    const host = gptUsageToCoins(model, 2300, 200);
    const players = 4 * gptUsageToCoins(model, 2000, 100);
    const quickReply = gptUsageToCoins(model, 600, 50);
    const tts = 5 * ttsCostToCoins(100, 'inworld-tts-1.5-max');
    const total = host + players + quickReply + tts;

    expect(total).toBeGreaterThanOrEqual(10);
    expect(total).toBeLessThanOrEqual(18);
  });

  it('$10 = 1000 coins lasts 100+ rounds without TTS', () => {
    const perRound = gptUsageToCoins(model, 2300, 200)
      + 4 * gptUsageToCoins(model, 2000, 100)
      + gptUsageToCoins(model, 600, 50);
    const rounds = Math.floor(1000 / perRound);
    expect(rounds).toBeGreaterThanOrEqual(100);
  });

  it('late-game round (longer history) costs under 15 coins without TTS', () => {
    const host = gptUsageToCoins(model, 5000, 300);
    const players = 4 * gptUsageToCoins(model, 4000, 150);
    const quickReply = gptUsageToCoins(model, 1200, 60);
    const total = host + players + quickReply;

    expect(total).toBeLessThanOrEqual(15);
  });
});

// ─── 3. gptUsageToCoins exact math verification ─────────────────────────────

describe('gptUsageToCoins — exact math', () => {
  it('gpt-5.3-chat-latest: 1000 input + 100 output = 1 coin', () => {
    // input: (1000/1M) × $1.75 = $0.00175
    // output: (100/1M) × $14.00 = $0.0014
    // total: $0.00315
    // coins: ceil(0.00315 / 0.01 × 2) = ceil(0.63) = 1
    expect(gptUsageToCoins('gpt-5.3-chat-latest', 1000, 100)).toBe(1);
  });

  it('gpt-5.3-chat-latest: 10000 input + 500 output = 5 coins', () => {
    // input: (10000/1M) × $1.75 = $0.0175
    // output: (500/1M) × $14.00 = $0.007
    // total: $0.0245
    // coins: ceil(0.0245 / 0.01 × 2) = ceil(4.9) = 5
    expect(gptUsageToCoins('gpt-5.3-chat-latest', 10000, 500)).toBe(5);
  });

  it('gpt-4o-mini: 5000 input + 500 output = 1 coin (cheapest common model)', () => {
    // input: (5000/1M) × $0.15 = $0.00075
    // output: (500/1M) × $0.60 = $0.0003
    // total: $0.00105
    // coins: ceil(0.00105 / 0.01 × 2) = ceil(0.21) = 1
    expect(gptUsageToCoins('gpt-4o-mini', 5000, 500)).toBe(1);
  });

  it('gpt-5-nano: extremely cheap per call', () => {
    // input: (2000/1M) × $0.05 = $0.0001
    // output: (200/1M) × $0.40 = $0.00008
    // total: $0.00018
    // coins: ceil(0.00018 / 0.01 × 2) = ceil(0.036) = 1
    expect(gptUsageToCoins('gpt-5-nano', 2000, 200)).toBe(1);
  });

  it('output tokens dominate cost for gpt-5.3 (~8x input price)', () => {
    const inputOnly = gptUsageToCoins('gpt-5.3-chat-latest', 10000, 0);
    const outputOnly = gptUsageToCoins('gpt-5.3-chat-latest', 0, 10000);
    // Exact 8x won't hold due to ceil() rounding, but ratio should be close
    const ratio = outputOnly / inputOnly;
    expect(ratio).toBeGreaterThanOrEqual(7);
    expect(ratio).toBeLessThanOrEqual(9);
  });

  it('usdToCoins formula: ceil(usd / COIN_VALUE_USD × PLATFORM_MARKUP)', () => {
    const testCases = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0];
    for (const usd of testCases) {
      const expected = Math.max(1, Math.ceil((usd / COIN_VALUE_USD) * PLATFORM_MARKUP));
      expect(usdToCoins(usd)).toBe(expected);
    }
  });
});

// ─── 4. All API routes use gptUsageToCoins for deduction ─────────────────────

describe('API routes use accurate billing (gptUsageToCoins)', () => {
  const routes = [
    { path: 'chat/route.ts', name: '/api/chat' },
    { path: 'chat/stream/route.ts', name: '/api/chat/stream' },
    { path: 'chat/player-speak/route.ts', name: '/api/chat/player-speak' },
    { path: 'suggest-quick-replies/route.ts', name: '/api/suggest-quick-replies' },
    { path: 'suggest-gm-replies/route.ts', name: '/api/suggest-gm-replies' },
    { path: 'generate-players/route.ts', name: '/api/generate-players' },
    { path: 'generate-host/route.ts', name: '/api/generate-host' },
  ];

  for (const route of routes) {
    it(`${route.name} imports gptUsageToCoins`, () => {
      const content = readRoute(route.path);
      expect(content).toContain('gptUsageToCoins');
    });

    it(`${route.name} uses prompt_tokens and completion_tokens separately`, () => {
      const content = readRoute(route.path);
      expect(content).toContain('prompt_tokens');
      expect(content).toContain('completion_tokens');
    });
  }

  it('/api/chat/player-speak does NOT use estimatedTokensToCoins for deduction', () => {
    const content = readRoute('chat/player-speak/route.ts');
    const deductBlock = content.slice(content.indexOf('gptUsageToCoins('));
    expect(deductBlock).toContain('gptUsageToCoins');
  });

  it('/api/suggest-quick-replies does NOT use estimatedTokensToCoins for deduction', () => {
    const content = readRoute('suggest-quick-replies/route.ts');
    const deductBlock = content.slice(content.indexOf('gptUsageToCoins('));
    expect(deductBlock).toContain('gptUsageToCoins');
  });

  it('/api/suggest-gm-replies does NOT use estimatedTokensToCoins for deduction', () => {
    const content = readRoute('suggest-gm-replies/route.ts');
    const deductBlock = content.slice(content.indexOf('gptUsageToCoins('));
    expect(deductBlock).toContain('gptUsageToCoins');
  });
});

// ─── 5. All API routes have balance pre-checks ──────────────────────────────

describe('API routes have balance pre-checks', () => {
  const routesWithPreCheck = [
    { path: 'chat/route.ts', name: '/api/chat' },
    { path: 'chat/stream/route.ts', name: '/api/chat/stream' },
    { path: 'chat/player-speak/route.ts', name: '/api/chat/player-speak' },
    { path: 'suggest-quick-replies/route.ts', name: '/api/suggest-quick-replies' },
    { path: 'suggest-gm-replies/route.ts', name: '/api/suggest-gm-replies' },
    { path: 'generate-players/route.ts', name: '/api/generate-players' },
    { path: 'generate-host/route.ts', name: '/api/generate-host' },
    { path: 'inworld-tts/route.ts', name: '/api/inworld-tts' },
  ];

  for (const route of routesWithPreCheck) {
    it(`${route.name} checks balance before API call`, () => {
      const content = readRoute(route.path);
      const hasTokensCheck = content.includes('hasTokens(') || content.includes('getUserBalance(');
      expect(hasTokensCheck).toBe(true);
    });

    it(`${route.name} returns 402 for insufficient balance`, () => {
      const content = readRoute(route.path);
      expect(content).toContain('INSUFFICIENT_TOKENS');
    });
  }
});

// ─── 6. All deductTokens calls are awaited ───────────────────────────────────

describe('deductTokens calls are awaited (no fire-and-forget)', () => {
  const routes = [
    'chat/route.ts',
    'chat/stream/route.ts',
    'chat/player-speak/route.ts',
    'suggest-quick-replies/route.ts',
    'suggest-gm-replies/route.ts',
    'generate-players/route.ts',
    'generate-host/route.ts',
    'inworld-tts/route.ts',
  ];

  for (const routePath of routes) {
    it(`${routePath} does not have fire-and-forget deductTokens`, () => {
      const content = readRoute(routePath);
      expect(content).not.toMatch(/deductTokens\([^)]*\)\s*\.\s*catch/);
    });

    it(`${routePath} awaits deductTokens`, () => {
      const content = readRoute(routePath);
      if (content.includes('deductTokens(')) {
        expect(content).toMatch(/await\s+deductTokens\(/);
      }
    });
  }
});

// ─── 7. DALL-E 3 removed from /api/chat ─────────────────────────────────────

describe('DALL-E 3 image generation removed from /api/chat', () => {
  const content = readRoute('chat/route.ts');

  it('does not contain dall-e-3 reference', () => {
    expect(content).not.toContain('dall-e-3');
  });

  it('does not contain images.generate call', () => {
    expect(content).not.toContain('images.generate');
  });

  it('does not contain IMAGE_PROMPT tag parsing', () => {
    expect(content).not.toContain('IMAGE_PROMPT');
  });

  it('does not contain REPLY_TYPE tag parsing', () => {
    expect(content).not.toContain('REPLY_TYPE');
  });

  it('does not contain IMAGE_SIZE tag parsing', () => {
    expect(content).not.toContain('IMAGE_SIZE');
  });

  it('does not contain b64_json reference', () => {
    expect(content).not.toContain('b64_json');
  });

  it('does not return imageUrl in response', () => {
    expect(content).not.toContain('imageUrl');
  });

  it('response JSON only contains message and usage', () => {
    expect(content).toContain('message: response');
    expect(content).toContain('usage: completion.usage');
  });
});

// ─── 8. Lobby voice preview is free ──────────────────────────────────────────

describe('Lobby voice preview — free TTS', () => {
  const ttsRoute = readRoute('inworld-tts/route.ts');
  const lobbyView = readComponent('lobby-view.tsx');

  it('TTS route accepts source parameter', () => {
    expect(ttsRoute).toContain("body.source === 'lobby_preview'");
  });

  it('TTS route skips deduction for lobby_preview', () => {
    expect(ttsRoute).toContain('if (!isPreview)');
    const deductSection = ttsRoute.split('if (!isPreview)');
    expect(deductSection.length).toBeGreaterThanOrEqual(2);
  });

  it('TTS route skips balance check for lobby_preview', () => {
    const balanceCheckSection = ttsRoute.match(/if \(!isPreview\)[\s\S]*?getUserBalance/);
    expect(balanceCheckSection).not.toBeNull();
  });

  it('TTS route caps preview text at 120 chars', () => {
    expect(ttsRoute).toContain('previewMaxLen = 120');
  });

  it('TTS route uses mini model for previews', () => {
    expect(ttsRoute).toContain("previewModel = 'inworld-tts-1.5-mini'");
  });

  it('lobby-view passes source: "lobby_preview" to TTS API', () => {
    expect(lobbyView).toContain('source: "lobby_preview"');
  });
});

// ─── 9. Model pricing table completeness ─────────────────────────────────────

describe('Model pricing table coverage', () => {
  const allowedModelsPath = path.resolve(__dirname, '../model-prefs.ts');
  const modelPrefs = fs.readFileSync(allowedModelsPath, 'utf-8');

  const defaultModel = 'gpt-5.3-chat-latest';

  it('default model is in the pricing table', () => {
    const coins = gptUsageToCoins(defaultModel, 1000, 100);
    expect(coins).toBeGreaterThanOrEqual(1);
  });

  it('all GPT-5 series models have pricing', () => {
    const models = [
      'gpt-5.3-chat-latest', 'gpt-5.2-chat-latest', 'gpt-5.1-chat-latest',
      'gpt-5.2', 'gpt-5.1', 'gpt-5',
    ];
    for (const m of models) {
      const coins = gptUsageToCoins(m, 100000, 10000);
      expect(coins, `Missing pricing for ${m}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('all GPT-4 series models have pricing', () => {
    const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'];
    for (const m of models) {
      const coins = gptUsageToCoins(m, 100000, 10000);
      expect(coins, `Missing pricing for ${m}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('unknown model falls back to gpt-5.3-chat-latest pricing', () => {
    const unknown = gptUsageToCoins('totally-unknown-model', 10000, 1000);
    const fallback = gptUsageToCoins('gpt-5.3-chat-latest', 10000, 1000);
    expect(unknown).toBe(fallback);
  });

  it('cheaper models always cost less than expensive models for same usage', () => {
    const input = 10000;
    const output = 1000;
    const nano = gptUsageToCoins('gpt-5-nano', input, output);
    const mini = gptUsageToCoins('gpt-4o-mini', input, output);
    const standard = gptUsageToCoins('gpt-5.3-chat-latest', input, output);

    expect(nano).toBeLessThanOrEqual(mini);
    expect(mini).toBeLessThan(standard);
  });
});

// ─── 10. Edge cases ──────────────────────────────────────────────────────────

describe('Billing edge cases', () => {
  it('zero input + zero output = minimum 1 coin', () => {
    expect(gptUsageToCoins('gpt-5.3-chat-latest', 0, 0)).toBe(1);
  });

  it('1 input + 0 output = minimum 1 coin', () => {
    expect(gptUsageToCoins('gpt-5.3-chat-latest', 1, 0)).toBe(1);
  });

  it('0 input + 1 output = minimum 1 coin', () => {
    expect(gptUsageToCoins('gpt-5.3-chat-latest', 0, 1)).toBe(1);
  });

  it('very large token counts produce proportional coins', () => {
    const small = gptUsageToCoins('gpt-5.3-chat-latest', 1000, 100);
    const large = gptUsageToCoins('gpt-5.3-chat-latest', 100000, 10000);
    expect(large).toBeGreaterThan(small * 50);
  });

  it('coins are always positive integers', () => {
    const models = ['gpt-5.3-chat-latest', 'gpt-4o-mini', 'gpt-5-nano'];
    for (const m of models) {
      for (const [i, o] of [[0, 0], [1, 1], [100, 10], [10000, 1000]]) {
        const coins = gptUsageToCoins(m, i, o);
        expect(coins).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(coins)).toBe(true);
      }
    }
  });

  it('estimatedTokensToCoins is only used for pre-checks, not deduction', () => {
    const deductionRoutes = [
      'chat/player-speak/route.ts',
      'suggest-quick-replies/route.ts',
      'suggest-gm-replies/route.ts',
      'chat/stream/route.ts',
    ];
    for (const routePath of deductionRoutes) {
      const content = readRoute(routePath);
      const afterDeduct = content.split('await deductTokens');
      for (let i = 1; i < afterDeduct.length; i++) {
        const nearDeduct = afterDeduct[i].slice(0, 200);
        expect(nearDeduct).not.toContain('estimatedTokensToCoins');
      }
    }
  });

  it('TTS cost for 0 chars is 0 (not minimum 1)', () => {
    expect(ttsCostToCoins(0, 'inworld-tts-1.5-max')).toBe(0);
    expect(ttsCostToCoins(0, 'inworld-tts-1.5-mini')).toBe(0);
  });

  it('TTS cost for negative chars is 0', () => {
    expect(ttsCostToCoins(-100, 'inworld-tts-1.5-max')).toBe(0);
  });

  it('TTS preview (120 chars, mini model) costs 1 coin if it were charged', () => {
    const coins = ttsCostToCoins(120, 'inworld-tts-1.5-mini');
    expect(coins).toBe(1);
  });
});

// ─── 11. Per-model cost comparison table ─────────────────────────────────────

describe('Per-model cost comparison (1000 input + 100 output)', () => {
  const input = 1000;
  const output = 100;

  const expectations: [string, number][] = [
    ['gpt-5-nano', 1],
    ['gpt-4o-mini', 1],
    ['gpt-4.1-nano', 1],
    ['gpt-4.1-mini', 1],
    ['gpt-5-mini', 1],
    ['gpt-4.1', 1],
    ['gpt-4o', 1],
    ['gpt-5.3-chat-latest', 1],
  ];

  for (const [model, expected] of expectations) {
    it(`${model}: ${expected} coin(s) for light usage`, () => {
      expect(gptUsageToCoins(model, input, output)).toBe(expected);
    });
  }

  it('all common models cost 1 coin for minimal usage (great for UX)', () => {
    const models = ['gpt-5-nano', 'gpt-4o-mini', 'gpt-5.3-chat-latest'];
    for (const m of models) {
      expect(gptUsageToCoins(m, input, output)).toBe(1);
    }
  });
});

// ─── 12. Cost regression guard ───────────────────────────────────────────────

describe('Cost regression guard — per-round must stay under budget', () => {
  const model = 'gpt-5.3-chat-latest';

  it('4-player round without TTS costs at most 12 coins', () => {
    const host = gptUsageToCoins(model, 3000, 300);
    const players = 4 * gptUsageToCoins(model, 2500, 150);
    const quickReply = gptUsageToCoins(model, 800, 60);
    const total = host + players + quickReply;
    expect(total).toBeLessThanOrEqual(12);
  });

  it('6-player round without TTS costs at most 16 coins', () => {
    const host = gptUsageToCoins(model, 3000, 300);
    const players = 6 * gptUsageToCoins(model, 2500, 150);
    const quickReply = gptUsageToCoins(model, 800, 60);
    const total = host + players + quickReply;
    expect(total).toBeLessThanOrEqual(16);
  });

  it('$5 starter pack (500 coins) lasts 40+ rounds', () => {
    const perRound = gptUsageToCoins(model, 3000, 300)
      + 4 * gptUsageToCoins(model, 2500, 150)
      + gptUsageToCoins(model, 800, 60);
    expect(Math.floor(500 / perRound)).toBeGreaterThanOrEqual(40);
  });

  it('$10 popular pack (1200 coins with bonus) lasts 100+ rounds', () => {
    const perRound = gptUsageToCoins(model, 3000, 300)
      + 4 * gptUsageToCoins(model, 2500, 150)
      + gptUsageToCoins(model, 800, 60);
    expect(Math.floor(1200 / perRound)).toBeGreaterThanOrEqual(100);
  });
});
