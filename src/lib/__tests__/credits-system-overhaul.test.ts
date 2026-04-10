/**
 * Credits system overhaul tests.
 *
 * Validates the full set of changes from the credits-only migration:
 *  1. PLATFORM_MARKUP = 2 (1:2 credit-to-token ratio)
 *  2. Settings page — no isPaid gating, no model selector, no image gen toggle
 *  3. Sidebar — static template icons, no DALL-E generation
 *  4. Stripe checkout — credits match display values (not formula)
 *  5. Model unification — getPreferredModel always returns default
 *  6. Removed API routes — no generate-game-icon, no generate-nav-icon
 */

import { describe, it, expect } from 'vitest';
import {
  PLATFORM_MARKUP,
  COIN_VALUE_USD,
  GPT_BUDGET_RATIO,
  usdToCoins,
  rechargeCoinsFromPayment,
  gptUsageToCoins,
  imageGenCostToCoins,
  ttsCostToCoins,
} from '../tokens';
import { DEFAULT_AI_MODEL, getPreferredModel, sanitizeModel } from '../model-prefs';
import { getGameTemplate } from '../game-templates';
import * as fs from 'fs';
import * as path from 'path';

// ─── 1. PLATFORM_MARKUP = 2 ──────────────────────────────────────────────────

describe('PLATFORM_MARKUP ratio (1:2)', () => {
  it('PLATFORM_MARKUP is exactly 2', () => {
    expect(PLATFORM_MARKUP).toBe(2);
  });

  it('COIN_VALUE_USD is $0.01', () => {
    expect(COIN_VALUE_USD).toBe(0.01);
  });

  it('GPT_BUDGET_RATIO is 0.5', () => {
    expect(GPT_BUDGET_RATIO).toBe(0.5);
  });

  it('$0.01 API cost → 2 credits', () => {
    expect(usdToCoins(0.01)).toBe(2);
  });

  it('$0.10 API cost → 20 credits', () => {
    expect(usdToCoins(0.10)).toBe(20);
  });

  it('$1.00 API cost → 200 credits', () => {
    expect(usdToCoins(1.00)).toBe(200);
  });

  it('platform profit margin is 50% (markup = 2x)', () => {
    const margin = 1 - (1 / PLATFORM_MARKUP);
    expect(margin).toBe(0.5);
  });

  it('GPT cost is cheaper with 2x vs old 3x markup', () => {
    const cost2x = Math.ceil((0.01 / COIN_VALUE_USD) * 2);
    const cost3x = Math.ceil((0.01 / COIN_VALUE_USD) * 3);
    expect(cost2x).toBeLessThan(cost3x);
  });

  it('typical chat message (1k prompt + 500 completion) costs few credits', () => {
    const coins = gptUsageToCoins('gpt-5.3-chat-latest', 1000, 500);
    expect(coins).toBeGreaterThanOrEqual(1);
    expect(coins).toBeLessThan(10);
  });
});

// ─── 2. Settings page — no feature gating ────────────────────────────────────

describe('Settings page — no feature gating', () => {
  const settingsPath = path.resolve(__dirname, '../../app/components/settings-content.tsx');
  const content = fs.readFileSync(settingsPath, 'utf-8');

  it('does not contain isPaid variable', () => {
    expect(content).not.toContain('isPaid');
  });

  it('does not contain currentPlan state', () => {
    expect(content).not.toContain('currentPlan');
  });

  it('does not contain freeModels or paidModels arrays', () => {
    expect(content).not.toContain('freeModels');
    expect(content).not.toContain('paidModels');
  });

  it('does not contain AI model selector (no availableModels)', () => {
    expect(content).not.toContain('availableModels');
    expect(content).not.toContain('ai-model');
  });

  it('does not contain image generation toggle', () => {
    expect(content).not.toContain('imageGenEnabled');
    expect(content).not.toContain('Image Generation');
  });

  it('does not contain SubscriptionTier import', () => {
    expect(content).not.toContain('SubscriptionTier');
  });

  it('does not contain plan badge UI', () => {
    expect(content).not.toContain('Current plan');
  });

  it('still contains AI Voice settings (TTS)', () => {
    expect(content).toContain('AI Voice');
    expect(content).toContain('ttsEnabled');
    expect(content).toContain('ttsModel');
  });

  it('still has a save button', () => {
    expect(content).toContain('Save Changes');
  });
});

// ─── 3. Sidebar — static icons, no generation ───────────────────────────────

describe('Sidebar — static template icons', () => {
  const sidebarPath = path.resolve(__dirname, '../../app/components/game-sidebar.tsx');
  const typesPath = path.resolve(__dirname, '../templates/types.ts');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');

  it('does not contain handleGenerateIcon function', () => {
    expect(sidebarContent).not.toContain('handleGenerateIcon');
  });

  it('does not call generate-game-icon API', () => {
    expect(sidebarContent).not.toContain('generate-game-icon');
  });

  it('does not contain Regenerate Icon menu item', () => {
    expect(sidebarContent).not.toContain('Regenerate Icon');
  });

  it('does not import RefreshCw icon', () => {
    expect(sidebarContent).not.toContain('RefreshCw');
  });

  it('does not contain iconGeneratingId state', () => {
    expect(sidebarContent).not.toContain('iconGeneratingId');
  });

  it('has ICON_URLS mapping in template types', () => {
    expect(typesContent).toContain('ICON_URLS');
  });

  it('has getGameIcon helper function', () => {
    expect(sidebarContent).toContain('getGameIcon');
  });

  const EXPECTED_TEMPLATES = [
    'werewolf', 'mafia', 'undercover', 'tarot', 'codenames', 'avalon',
    'spyfall', 'trivia', 'debate', 'storyteller', 'custom',
  ];

  for (const template of EXPECTED_TEMPLATES) {
    it(`has static iconUrl for template "${template}" (getGameTemplate)`, () => {
      const t = getGameTemplate(template);
      expect(t, `missing template: ${template}`).toBeDefined();
      expect(t!.iconUrl).toMatch(/^\/games\//);
      expect(t!.iconUrl).toContain(`sidebar-icon-${template}`);
    });
  }
});

describe('Sidebar icon files exist', () => {
  const iconsDir = path.resolve(__dirname, '../../../public/games');

  const ICON_FILES = [
    'sidebar-icon-werewolf.webp',
    'sidebar-icon-mafia.webp',
    'sidebar-icon-undercover.webp',
    'sidebar-icon-tarot.webp',
    'sidebar-icon-codenames.webp',
    'sidebar-icon-avalon.webp',
    'sidebar-icon-spyfall.webp',
    'sidebar-icon-detective.webp',
    'sidebar-icon-escape-room.webp',
    'sidebar-icon-trivia.webp',
    'sidebar-icon-debate.webp',
    'sidebar-icon-storyteller.webp',
    'sidebar-icon-20-questions.webp',
    'sidebar-icon-two-truths.webp',
    'sidebar-icon-custom.webp',
  ];

  it('has all 15 sidebar icon files', () => {
    for (const file of ICON_FILES) {
      const full = path.join(iconsDir, file);
      expect(fs.existsSync(full), `Missing: ${file}`).toBe(true);
    }
  });

  it('all icon files are non-empty', () => {
    for (const file of ICON_FILES) {
      const full = path.join(iconsDir, file);
      const stat = fs.statSync(full);
      expect(stat.size, `Empty: ${file}`).toBeGreaterThan(0);
    }
  });

  it('all icon files are under 10 KB (optimized thumbnails)', () => {
    for (const file of ICON_FILES) {
      const full = path.join(iconsDir, file);
      const stat = fs.statSync(full);
      expect(stat.size, `Too large: ${file} (${(stat.size / 1024).toFixed(1)} KB)`).toBeLessThan(10240);
    }
  });
});

// ─── 6. Stripe checkout — credits match display ─────────────────────────────

describe('Stripe checkout — credits match package display', () => {
  const checkoutPath = path.resolve(__dirname, '../../app/api/stripe/create-checkout/route.ts');
  const content = fs.readFileSync(checkoutPath, 'utf-8');

  it('REFERENCE_PACKAGES includes credits field', () => {
    expect(content).toContain('credits:');
  });

  it('starter package has 500 credits', () => {
    expect(content).toMatch(/starter.*credits:\s*500/s);
  });

  it('popular package has 1200 credits', () => {
    expect(content).toMatch(/popular.*credits:\s*1200/s);
  });

  it('power package has 3250 credits', () => {
    expect(content).toMatch(/power.*credits:\s*3250/s);
  });

  it('ultimate package has 7000 credits', () => {
    expect(content).toMatch(/ultimate.*credits:\s*7000/s);
  });

  it('description says "credits" not "usage"', () => {
    expect(content).toContain('credits');
    expect(content).not.toContain("'usage'");
  });
});

describe('Stripe fulfill — reads metadata tokens', () => {
  const fulfillPath = path.resolve(__dirname, '../../app/api/stripe/fulfill-session/route.ts');
  const content = fs.readFileSync(fulfillPath, 'utf-8');

  it('reads tokens from session metadata first', () => {
    expect(content).toContain('metadata?.tokens');
  });

  it('falls back to rechargeCoinsFromPayment for legacy sessions', () => {
    expect(content).toContain('rechargeCoinsFromPayment');
  });

  it('logs "credits" not "usage"', () => {
    expect(content).toContain('credits');
  });
});

describe('Stripe webhook — reads metadata tokens', () => {
  const webhookPath = path.resolve(__dirname, '../../app/api/stripe/webhook/route.ts');
  const content = fs.readFileSync(webhookPath, 'utf-8');

  it('reads tokens from session metadata first', () => {
    expect(content).toContain('metadata?.tokens');
  });

  it('falls back to rechargeCoinsFromPayment for legacy sessions', () => {
    expect(content).toContain('rechargeCoinsFromPayment');
  });
});

// ─── 7. Model unification ───────────────────────────────────────────────────

describe('Model unification — gpt-5.3-chat-latest', () => {
  it('DEFAULT_AI_MODEL is gpt-5.3-chat-latest', () => {
    expect(DEFAULT_AI_MODEL).toBe('gpt-5.3-chat-latest');
  });

  it('getPreferredModel always returns default (ignores localStorage)', () => {
    expect(getPreferredModel()).toBe(DEFAULT_AI_MODEL);
  });

  it('sanitizeModel accepts the default model', () => {
    expect(sanitizeModel('gpt-5.3-chat-latest')).toBe('gpt-5.3-chat-latest');
  });

  it('sanitizeModel falls back to default for unknown models', () => {
    expect(sanitizeModel('unknown-model')).toBe(DEFAULT_AI_MODEL);
  });

  it('sanitizeModel falls back to default when no preference given', () => {
    expect(sanitizeModel()).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel('')).toBe(DEFAULT_AI_MODEL);
    expect(sanitizeModel(undefined)).toBe(DEFAULT_AI_MODEL);
  });
});

// ─── 8. Removed API routes ──────────────────────────────────────────────────

describe('Removed icon generation APIs', () => {
  it('generate-game-icon route does NOT exist', () => {
    const p = path.resolve(__dirname, '../../app/api/generate-game-icon/route.ts');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('generate-nav-icon route does NOT exist', () => {
    const p = path.resolve(__dirname, '../../app/api/generate-nav-icon/route.ts');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('useNavIcon hook does NOT exist', () => {
    const p = path.resolve(__dirname, '../use-nav-icon.ts');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('game page does not call generate-game-icon', () => {
    const p = path.resolve(__dirname, '../../app/(pages)/game/[gameId]/page.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).not.toContain('generate-game-icon');
  });
});

// ─── 9. Cost calculations with 2x markup ────────────────────────────────────

describe('Cost calculations — 2x markup applied correctly', () => {
  it('image gen dall-e-3 = 8 credits', () => {
    expect(imageGenCostToCoins('dall-e-3')).toBe(8);
  });

  it('image gen dall-e-2 = 4 credits', () => {
    expect(imageGenCostToCoins('dall-e-2')).toBe(4);
  });

  it('image gen dall-e-3-hd = 16 credits', () => {
    expect(imageGenCostToCoins('dall-e-3-hd')).toBe(16);
  });

  it('TTS mini 1M chars = 1000 credits', () => {
    expect(ttsCostToCoins(1_000_000, 'inworld-tts-1.5-mini')).toBe(1000);
  });

  it('TTS max 1M chars = 2000 credits', () => {
    expect(ttsCostToCoins(1_000_000, 'inworld-tts-1.5-max')).toBe(2000);
  });

  it('gpt-4o 1M+1M tokens = 2500 credits', () => {
    expect(gptUsageToCoins('gpt-4o', 1_000_000, 1_000_000)).toBe(2500);
  });

  it('gpt-4o-mini 1M+1M tokens = 150 credits', () => {
    expect(gptUsageToCoins('gpt-4o-mini', 1_000_000, 1_000_000)).toBe(150);
  });

  it('all cost functions return at least 1 for positive input', () => {
    expect(usdToCoins(0.0001)).toBeGreaterThanOrEqual(1);
    expect(gptUsageToCoins('gpt-4o', 1, 1)).toBeGreaterThanOrEqual(1);
  });
});

// ─── 10. Recharge formula sanity ─────────────────────────────────────────────

describe('Recharge formula — edge cases', () => {
  it('$0 payment → 0 credits', () => {
    expect(rechargeCoinsFromPayment(0)).toBe(0);
  });

  it('negative payment → 0 credits', () => {
    expect(rechargeCoinsFromPayment(-500)).toBe(0);
  });

  it('$100 payment → 5000 credits', () => {
    expect(rechargeCoinsFromPayment(10000)).toBe(5000);
  });

  it('formula is deterministic', () => {
    const a = rechargeCoinsFromPayment(1000);
    const b = rechargeCoinsFromPayment(1000);
    expect(a).toBe(b);
  });

  it('credits scale linearly with payment', () => {
    const single = rechargeCoinsFromPayment(1000);
    const double = rechargeCoinsFromPayment(2000);
    expect(double).toBe(single * 2);
  });
});
