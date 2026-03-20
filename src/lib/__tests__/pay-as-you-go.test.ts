/**
 * Pay-as-you-go migration tests.
 *
 * Validates the switch from subscription-first to recharge-first UX:
 *  1. Recharge packages — pricing, bonus structure, ordering
 *  2. Routing — all user-facing nav points to /recharge, not /subscription
 *  3. Sitemap — /recharge present, /subscription removed
 *  4. Robots — /recharge is crawlable
 *  5. Coin formula — packages deliver correct coin amounts
 */

import { describe, it, expect } from 'vitest';
import { rechargeCoinsFromPayment, GPT_BUDGET_RATIO, COIN_VALUE_USD } from '../tokens';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { SITE_DOMAIN } from '@/lib/site';
import * as fs from 'fs';
import * as path from 'path';

// ─── Recharge package definitions (mirrors recharge-content.tsx) ────────────

interface CoinPackage {
  id: string;
  name: string;
  price: number;
  coins: number;
  bonus: number;
  popular?: boolean;
  estimatedHours: string;
}

const PACKAGES: CoinPackage[] = [
  { id: 'starter',   name: 'Starter',   price: 5,   coins: 500,   bonus: 0,     estimatedHours: '5-8 hours' },
  { id: 'popular',   name: 'Popular',   price: 10,  coins: 1000,  bonus: 200,   estimatedHours: '12-18 hours', popular: true },
  { id: 'power',     name: 'Power',     price: 25,  coins: 2500,  bonus: 750,   estimatedHours: '35-50 hours' },
  { id: 'ultimate',  name: 'Ultimate',  price: 50,  coins: 5000,  bonus: 2000,  estimatedHours: '80-120 hours' },
  { id: 'mega',      name: 'Mega',      price: 100, coins: 10000, bonus: 5000,  estimatedHours: '180-250 hours' },
  { id: 'legendary', name: 'Legendary', price: 200, coins: 20000, bonus: 12000, estimatedHours: '400-550 hours' },
  { id: 'immortal',  name: 'Immortal',  price: 500, coins: 50000, bonus: 35000, estimatedHours: '1000+ hours' },
];

// ─── 1. Package structure ───────────────────────────────────────────────────

describe('Recharge packages — structure', () => {
  it('has 7 packages', () => {
    expect(PACKAGES).toHaveLength(7);
  });

  it('every package has required fields', () => {
    for (const pkg of PACKAGES) {
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(pkg.price).toBeGreaterThan(0);
      expect(pkg.coins).toBeGreaterThan(0);
      expect(typeof pkg.bonus).toBe('number');
      expect(pkg.estimatedHours).toBeTruthy();
    }
  });

  it('all package IDs are unique', () => {
    const ids = PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exactly one package is marked popular', () => {
    const popular = PACKAGES.filter((p) => p.popular);
    expect(popular).toHaveLength(1);
    expect(popular[0].id).toBe('popular');
  });

  it('prices are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].price).toBeGreaterThan(PACKAGES[i - 1].price);
    }
  });

  it('base coins are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].coins).toBeGreaterThan(PACKAGES[i - 1].coins);
    }
  });

  it('total coins (base + bonus) are strictly ascending', () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      const totalCurrent = PACKAGES[i].coins + PACKAGES[i].bonus;
      const totalPrev = PACKAGES[i - 1].coins + PACKAGES[i - 1].bonus;
      expect(totalCurrent).toBeGreaterThan(totalPrev);
    }
  });

  it('starter pack has no bonus', () => {
    expect(PACKAGES[0].bonus).toBe(0);
  });

  it('higher-priced packages offer better bonus ratios', () => {
    const withBonus = PACKAGES.filter((p) => p.bonus > 0);
    for (let i = 1; i < withBonus.length; i++) {
      const ratioNow = withBonus[i].bonus / withBonus[i].coins;
      const ratioPrev = withBonus[i - 1].bonus / withBonus[i - 1].coins;
      expect(ratioNow).toBeGreaterThanOrEqual(ratioPrev);
    }
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

  it('all packages: formula coins = floor(price * GPT_BUDGET_RATIO / COIN_VALUE_USD)', () => {
    for (const pkg of PACKAGES) {
      const expected = Math.floor((pkg.price * GPT_BUDGET_RATIO) / COIN_VALUE_USD);
      expect(rechargeCoinsFromPayment(pkg.price * 100)).toBe(expected);
    }
  });

  it('display coins + bonus are always greater than formula coins (value perception)', () => {
    for (const pkg of PACKAGES) {
      const formulaCoins = rechargeCoinsFromPayment(pkg.price * 100);
      const displayTotal = pkg.coins + pkg.bonus;
      expect(displayTotal).toBeGreaterThan(formulaCoins);
    }
  });
});

// ─── 3. Routing — /recharge pages and components ────────────────────────────

describe('Routing — /recharge page is active', () => {
  it('recharge page.tsx exists and does NOT redirect to /subscription', () => {
    const pagePath = path.resolve(__dirname, '../../app/(pages)/recharge/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).not.toContain("redirect('/subscription')");
    expect(content).not.toContain('redirect("/subscription")');
    expect(content).toContain('RechargeContent');
  });

  it('recharge-content.tsx does NOT reference /subscription links', () => {
    const contentPath = path.resolve(__dirname, '../../app/components/recharge-content.tsx');
    const content = fs.readFileSync(contentPath, 'utf-8');
    expect(content).not.toContain('href="/subscription"');
    expect(content).not.toContain("href='/subscription'");
    expect(content).not.toContain('Subscribe to Pro');
  });

  it('out-of-credits-modal.tsx routes to /recharge, not /subscription', () => {
    const modalPath = path.resolve(__dirname, '../../app/components/out-of-credits-modal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');
    expect(content).toContain('/recharge');
    expect(content).not.toContain("router.push('/subscription");
    expect(content).not.toContain('router.push("/subscription');
    expect(content).not.toContain("router.push(`/subscription");
  });

  it('token-balance.tsx routes to /recharge, not /subscription', () => {
    const balancePath = path.resolve(__dirname, '../../app/components/token-balance.tsx');
    const content = fs.readFileSync(balancePath, 'utf-8');
    expect(content).toContain("'/recharge'");
    expect(content).not.toContain("'/subscription'");
  });

  it('game-sidebar.tsx user menu routes to /recharge', () => {
    const sidebarPath = path.resolve(__dirname, '../../app/components/game-sidebar.tsx');
    const content = fs.readFileSync(sidebarPath, 'utf-8');
    expect(content).toContain("'/recharge'");
    expect(content).not.toContain("router.push('/subscription')");
  });

  it('settings-content.tsx routes to /recharge, not /subscription', () => {
    const settingsPath = path.resolve(__dirname, '../../app/components/settings-content.tsx');
    const content = fs.readFileSync(settingsPath, 'utf-8');
    expect(content).not.toContain("router.push('/subscription')");
    expect(content).toContain("router.push('/recharge')");
  });
});

// ─── 4. Subscription page remains accessible ────────────────────────────────

describe('Subscription page — kept functional but hidden', () => {
  it('subscription page.tsx still exists', () => {
    const pagePath = path.resolve(__dirname, '../../app/(pages)/subscription/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('subscription layout has noindex robots tag', () => {
    const layoutPath = path.resolve(__dirname, '../../app/(pages)/subscription/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('index: false');
  });

  it('subscription API routes still exist', () => {
    const apiPaths = [
      '../../app/api/stripe/create-checkout/route.ts',
      '../../app/api/stripe/webhook/route.ts',
      '../../app/api/stripe/create-portal-session/route.ts',
      '../../app/api/stripe/subscription-details/route.ts',
    ];
    for (const rel of apiPaths) {
      const full = path.resolve(__dirname, rel);
      expect(fs.existsSync(full), `Missing: ${rel}`).toBe(true);
    }
  });
});

// ─── 5. Sitemap ─────────────────────────────────────────────────────────────

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
    const rechargeEntry = entries.find((e) => e.url === `${SITE_DOMAIN}/recharge`);
    expect(rechargeEntry).toBeDefined();
    expect(rechargeEntry!.changeFrequency).toBe('monthly');
  });
});

// ─── 6. Robots — /recharge is crawlable ─────────────────────────────────────

describe('Robots — /recharge is not disallowed', () => {
  const robotsConfig = robots();
  const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];
  const disallowed = rules.flatMap((r) => (Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []));

  it('/recharge is NOT in disallow list', () => {
    expect(disallowed).not.toContain('/recharge');
  });

  it('/subscription is NOT in disallow list (page has noindex meta instead)', () => {
    expect(disallowed).not.toContain('/subscription');
  });

  it('private pages are still disallowed', () => {
    expect(disallowed).toContain('/profile');
    expect(disallowed).toContain('/settings');
    expect(disallowed).toContain('/my-games');
    expect(disallowed).toContain('/api/');
  });
});

// ─── 7. Layout title mapping ────────────────────────────────────────────────

describe('Layout title mapping', () => {
  it('/recharge maps to "Buy Credits" in layout', () => {
    const layoutPath = path.resolve(__dirname, '../../app/(pages)/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('"/recharge": "Buy Credits"');
  });
});

// ─── 8. Root layout footer ──────────────────────────────────────────────────

describe('Root layout footer', () => {
  it('footer links to /recharge, not /subscription', () => {
    const layoutPath = path.resolve(__dirname, '../../app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('href="/recharge"');
    expect(content).not.toContain('href="/subscription"');
  });
});
