'use client';

import { useState, useEffect } from 'react';
import { Coins, Clock, Check, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface CoinPackage {
  id: string;
  name: string;
  price: number;
  coins: number;
  bonus: number;
  popular?: boolean;
  estimatedHours: string;
  description: string;
}

const PACKAGES: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    coins: 500,
    bonus: 0,
    estimatedHours: '5-8 hours',
    description: 'Perfect for trying out',
  },
  {
    id: 'popular',
    name: 'Popular',
    price: 10,
    coins: 1000,
    bonus: 200,
    estimatedHours: '12-18 hours',
    description: 'Best for casual gaming',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 25,
    coins: 2500,
    bonus: 750,
    estimatedHours: '35-50 hours',
    description: 'For serious players',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 50,
    coins: 5000,
    bonus: 2000,
    estimatedHours: '80-120 hours',
    description: 'Maximum value',
  },
  {
    id: 'mega',
    name: 'Mega',
    price: 100,
    coins: 10000,
    bonus: 5000,
    estimatedHours: '180-250 hours',
    description: 'For power users',
  },
  {
    id: 'legendary',
    name: 'Legendary',
    price: 200,
    coins: 20000,
    bonus: 12000,
    estimatedHours: '400-550 hours',
    description: 'Ultimate package',
  },
  {
    id: 'immortal',
    name: 'Immortal',
    price: 500,
    coins: 50000,
    bonus: 35000,
    estimatedHours: '1000+ hours',
    description: 'Unbeatable value',
  },
];

export function RechargeContent() {
  const [currentCoins, setCurrentCoins] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage>(PACKAGES[1]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch('/api/user/balance', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { tokens: 0 }))
      .then((data) => setCurrentCoins(data.tokens ?? 0))
      .catch(() => setCurrentCoins(0));
  }, []);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage.id }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data?.error || 'Payment failed');
    } catch {
      alert('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCoins = selectedPackage.coins + selectedPackage.bonus;

  return (
    <div className="bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Get Coins</h1>
            <p className="text-zinc-500">Play any game, unlimited types</p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3">
            <Coins className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-xs text-zinc-500">Balance</div>
              <div className="text-xl font-bold text-white">{currentCoins.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;
            const pkgTotal = pkg.coins + pkg.bonus;

            return (
              <motion.button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative bg-zinc-900 border-2 rounded-xl p-6 text-left transition-all ${
                  isSelected
                    ? 'border-violet-500 shadow-lg shadow-violet-500/20'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <div className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      POPULAR
                    </div>
                  </div>
                )}

                {/* Package Name & Price */}
                <div className="mb-4">
                  <div className="text-zinc-400 text-sm font-semibold mb-1">{pkg.name}</div>
                  <div className="text-4xl font-black text-white mb-1">${pkg.price}</div>
                  <div className="text-zinc-500 text-xs">{pkg.description}</div>
                </div>

                {/* Coins Display - The Most Important */}
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                      You Get
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">
                    {pkgTotal.toLocaleString()}
                  </div>
                  {pkg.bonus > 0 ? (
                    <div className="text-xs text-zinc-500">
                      {pkg.coins.toLocaleString()} + {pkg.bonus.toLocaleString()} coins
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">coins</div>
                  )}
                </div>

                {/* Estimated Play Time */}
                <div className="flex items-center justify-between text-sm pb-4 border-b border-zinc-800 mb-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span>Est. playtime</span>
                  </div>
                  <span className="text-white font-bold">{pkg.estimatedHours}</span>
                </div>

                {/* Selected Indicator */}
                {isSelected ? (
                  <div className="flex items-center justify-center gap-2 text-violet-400 text-sm font-semibold">
                    <Check className="h-4 w-4" />
                    Selected
                  </div>
                ) : (
                  <div className="text-center text-zinc-600 text-sm font-semibold">
                    Select
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Purchase Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Summary */}
            <div>
              <div className="text-zinc-400 text-sm mb-2">You&apos;re getting</div>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{totalCoins.toLocaleString()}</div>
                  <div className="text-zinc-500 text-sm">coins • {selectedPackage.estimatedHours} of play</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>All game types unlocked</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Unlimited AI characters</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Premium AI quality</span>
                </div>
              </div>
            </div>

            {/* Right: Payment */}
            <div>
              <div className="bg-zinc-800/50 rounded-xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400">Total</span>
                  <span className="text-3xl font-black text-white">${selectedPackage.price}</span>
                </div>
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-base transition-opacity disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase Now'
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-600 text-center">
                Secured by Stripe • Instant delivery
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-violet-500/10 border border-violet-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">How It Works</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Coins are consumed based on AI interactions during gameplay. Longer conversations and more complex
                games use more coins. Estimated playtime is based on average usage - actual time may vary depending on
                your playstyle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
