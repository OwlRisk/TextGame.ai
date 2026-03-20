/**
 * Pay-as-you-go migration tests.
 *
 * Validates the switch from subscription-first to recharge-first UX:
 *  1. Recharge packages — pricing, bonus structure, ordering
 *  2. Routing — all user-facing nav points to /recharge, not /subscription
 *  3. /subscription redirects to /recharge
 *  4. Sitemap — /recharge present, /subscription removed
 *  5. Robots — /recharge is crawlable
 *  6. Coin formula — packages deliver correct coin amounts
 *  7. Checkout API — all package IDs are recognized
 */

import { describe, it, expect } from 'vitest';
import { rechargeCoinsFromPayment, GPT_BUDGET_RATIO, COIN_VALUE_USD } from '../tokens';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { SITE_DOMAIN } from '@/lib/site';
import * as fs from 'fs';
import * as path from 'path';

// ─── Package definitions (must mirror recharge-content.tsx) ─────────────────

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus: number;
  badge?: string;
}

const PACKAGES: CreditPackage[] = [
  { id: 'starter',  name: 'Try it out',    price: 5,  credits: 500,  bonus: 0 },
  { id: 'popular',  name: 'Most popular',  price: 10, credits: 1000, bonus: 200,  badge: 'Best value' },
  { id: 'power',    name: 'Power user',    price: 25, credits: 2500, bonus: 750 },
  { id: 'ultimate', name: 'Go all in',     price: 50, credits: 5000, bonus: 2000 },
];

// ─── 1. Package structure ───────────────────────────────────────────────────

describe('Recharge packages — structure', () => {
  it('has 4 focused packages', () => {
    expect(PACKAGES).toHaveLength(4);
  });

  it('every package has required fields', () => {
    for (const pkg of PACKAGES) {
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(pkg.price).toBeGreaterThan(0);
      expect(pkg.credits).toBeGreaterThan(0);
      expect(typeof pkg.bonus).toBe('number');
    }
  });

  it('all package IDs are unique', () => {
    const ids = PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exactly one package has a badge', () => {
    const badged = PACKAGES.filter((p) => p.badge);
    expect(badged).toHaveLength(1);
    expect(badged[0].id).toBe('popular');
  });

  it('prices are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].price).toBeGreaterThan(PACKAGES[i - 1].price);
    }
  });

  it('base credits are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].credits).toBeGreaterThan(PACKAGES[i - 1].credits);
    }
  });

  it('total credits (base + bonus) are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      const totalCurrent = PACKAGES[i].credits + PACKAGES[i].bonus;
      const totalPrev = PACKAGES[i - 1].credits + PACKAGES[i - 1].bonus;
      expect(totalCurrent).toBeGreaterThan(totalPrev);
    }
  });

  it('starter pack has no bonus (entry-level)', () => {
    expect(PACKAGES[0].bonus).toBe(0);
  });

  it('higher-priced packages offer equal or better bonus ratios', () => {
    const withBonus = PACKAGES.filter((p) => p.bonus > 0);
    for (let i = 1; i < withBonus.length; i++) {
      const ratioNow = withBonus[i].bonus / withBonus[i].credits;
      const ratioPrev = withBonus[i - 1].bonus / withBonus[i - 1].credits;
      expect(ratioNow).toBeGreaterThanOrEqual(ratioPrev);
    }
  });

  it('price range is $5 to $50 (accessible entry, reasonable cap)', () => {
    expect(PACKAGES[0].price).toBe(5);
    expect(PACKAGES[PACKAGES.length - 1].price).toBe(50);
  });
});

// ─── 2. Coin formula alignment ──────────────────────────────────────────────

describe('Recharge packages — coin formula', () => {
  it('starter $5 yields 250 coins via rechargeCoinsFromPayment', () => {
    expect(rechargeCoinsFromPayment(500)).toBe(250);
  });

  it('popular $10 yields 500 coins via formula', () => {
    expect(rechargeCoinsFromPayment(1000)).toBe(500);
  });

  it('power $25 yields 1250 coins via formula', () => {
    expect(rechargeCoinsFromPayment(2500)).toBe(1250);
  });

  it('ultimate $50 yields 2500 coins via formula', () => {
    expect(rechargeCoinsFromPayment(5000)).toBe(2500);
  });

  it('all packages: formula coins = floor(price * GPT_BUDGET_RATIO / COIN_VALUE_USD)', () => {
    for (const pkg of PACKAGES) {
      const expected = Math.floor((pkg.price * GPT_BUDGET_RATIO) / COIN_VALUE_USD);
      expect(rechargeCoinsFromPayment(pkg.price * 100)).toBe(expected);
    }
  });

  it('display credits + bonus always exceed formula coins (value perception)', () => {
    for (const pkg of PACKAGES) {
      const formulaCoins = rechargeCoinsFromPayment(pkg.price * 100);
      const displayTotal = pkg.credits + pkg.bonus;
      expect(displayTotal).toBeGreaterThan(formulaCoins);
    }
  });
});

// ─── 3. Routing — /recharge is the primary path ─────────────────────────────

describe('Routing — /recharge page is active', () => {
  it('recharge page.tsx renders RechargeContent, does NOT redirect', () => {
    const pagePath = path.resolve(__dirname, '../../app/(pages)/recharge/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).not.toContain("redirect('/subscription')");
    expect(content).not.toContain('redirect("/subscription")');
    expect(content).toContain('RechargeContent');
  });

  it('recharge-content.tsx has no /subscription links', () => {
    const contentPath = path.resolve(__dirname, '../../app/components/recharge-content.tsx');
    const content = fs.readFileSync(contentPath, 'utf-8');
    expect(content).not.toContain('href="/subscription"');
    expect(content).not.toContain("href='/subscription'");
    expect(content).not.toContain('Subscribe');
  });

  it('out-of-credits-modal routes to /recharge', () => {
    const modalPath = path.resolve(__dirname, '../../app/components/out-of-credits-modal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');
    expect(content).toContain('/recharge');
    expect(content).not.toContain("router.push('/subscription");
    expect(content).not.toContain('router.push("/subscription');
  });

  it('token-balance routes to /recharge', () => {
    const p = path.resolve(__dirname, '../../app/components/token-balance.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain("'/recharge'");
    expect(content).not.toContain("'/subscription'");
  });

  it('game-sidebar user menu routes to /recharge', () => {
    const p = path.resolve(__dirname, '../../app/components/game-sidebar.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain("'/recharge'");
    expect(content).not.toContain("router.push('/subscription')");
  });

  it('settings-content has no subscription or plan-gating links', () => {
    const p = path.resolve(__dirname, '../../app/components/settings-content.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).not.toContain("router.push('/subscription')");
    expect(content).not.toContain('isPaid');
  });
});

// ─── 4. /subscription redirects to /recharge ────────────────────────────────

describe('/subscription page redirects', () => {
  it('subscription page.tsx redirects to /recharge', () => {
    const pagePath = path.resolve(__dirname, '../../app/(pages)/subscription/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("redirect('/recharge')");
  });

  it('subscription layout still has noindex robots tag', () => {
    const layoutPath = path.resolve(__dirname, '../../app/(pages)/subscription/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('index: false');
  });
});

// ─── 5. Stripe API still functional ─────────────────────────────────────────

describe('Stripe API routes exist', () => {
  const apiPaths = [
    '../../app/api/stripe/create-checkout/route.ts',
    '../../app/api/stripe/webhook/route.ts',
    '../../app/api/stripe/create-portal-session/route.ts',
    '../../app/api/stripe/subscription-details/route.ts',
    '../../app/api/stripe/fulfill-session/route.ts',
  ];

  for (const rel of apiPaths) {
    const name = rel.split('/').slice(-2).join('/');
    it(`${name} exists`, () => {
      const full = path.resolve(__dirname, rel);
      expect(fs.existsSync(full)).toBe(true);
    });
  }

  it('create-checkout supports all 4 active package IDs', () => {
    const checkoutPath = path.resolve(__dirname, '../../app/api/stripe/create-checkout/route.ts');
    const content = fs.readFileSync(checkoutPath, 'utf-8');
    for (const pkg of PACKAGES) {
      expect(content, `Missing package ID: ${pkg.id}`).toContain(pkg.id);
    }
  });
});

// ─── 6. Sitemap ─────────────────────────────────────────────────────────────

describe('Sitemap — /recharge included, /subscription excluded', () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it('includes /recharge', () => {
    expect(urls).toContain(`${SITE_DOMAIN}/recharge`);
  });

  it('does NOT include /subscription', () => {
    expect(urls).not.toContain(`${SITE_DOMAIN}/subscription`);
  });

  it('/recharge entry has monthly changeFrequency', () => {
    const entry = entries.find((e) => e.url === `${SITE_DOMAIN}/recharge`);
    expect(entry).toBeDefined();
    expect(entry!.changeFrequency).toBe('monthly');
  });
});

// ─── 7. Robots ──────────────────────────────────────────────────────────────

describe('Robots — /recharge is crawlable', () => {
  const robotsConfig = robots();
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
  const disallowed = rules.flatMap((r) =>
    Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []
  );

  it('/recharge is NOT disallowed', () => {
    expect(disallowed).not.toContain('/recharge');
  });

  it('private pages remain disallowed', () => {
    expect(disallowed).toContain('/profile');
    expect(disallowed).toContain('/settings');
    expect(disallowed).toContain('/my-games');
    expect(disallowed).toContain('/api/');
  });
});

// ─── 8. Layout & footer ────────────────────────────────────────────────────

describe('Layout and footer', () => {
  it('/recharge maps to "Buy Credits" in layout', () => {
    const p = path.resolve(__dirname, '../../app/(pages)/layout.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('"/recharge": "Buy Credits"');
  });

  it('root layout footer links to /recharge', () => {
    const p = path.resolve(__dirname, '../../app/layout.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('href="/recharge"');
    expect(content).not.toContain('href="/subscription"');
  });
});
