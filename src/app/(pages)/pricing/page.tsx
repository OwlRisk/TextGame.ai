'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Check, Crown, Coins, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price_cents: number;
  bonus_percentage: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingType, setPurchasingType] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/token-packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setPurchasingType('subscription');
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription' }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setPurchasingType(null);
    }
  };

  const handleBuyTokens = async (packageId: string) => {
    setPurchasingType(packageId);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tokens', packageId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setPurchasingType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Power your AI gaming experience with tokens or go unlimited with Pro
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pro Subscription - Featured */}
          <Card className="relative border-2 border-amber-500 shadow-2xl md:col-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Best Value
              </div>
            </div>
            
            <CardHeader className="text-center pt-8">
              <Crown className="w-12 h-12 mx-auto mb-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Pro Plan</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Unlimited everything
              </CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$49</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  'Unlimited tokens',
                  'Unlimited game creation',
                  'Unlimited AI chats',
                  'Unlimited avatar generation',
                  'Priority support',
                  'Early access to new features',
                  'No usage limits',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-lg py-6"
                onClick={handleSubscribe}
                disabled={purchasingType !== null}
              >
                {purchasingType === 'subscription' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Token Packages */}
          {loading ? (
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            packages.map((pkg) => (
              <Card key={pkg.id} className="border border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all hover:shadow-lg">
                <CardHeader className="text-center">
                  <Coins className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{pkg.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {pkg.tokens.toLocaleString()} tokens
                  </CardDescription>
                  {pkg.bonus_percentage > 0 && (
                    <div className="mt-2">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                        +{pkg.bonus_percentage}% bonus
                      </span>
                    </div>
                  )}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${(pkg.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    ${((pkg.price_cents / 100) / pkg.tokens * 1000).toFixed(2)} per 1k tokens
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>• ~{Math.floor(pkg.tokens / 250)} full game sessions</p>
                    <p>• ~{Math.floor(pkg.tokens / 10)} AI chat messages</p>
                    <p>• ~{Math.floor(pkg.tokens / 16)} avatar generations</p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleBuyTokens(pkg.id)}
                    disabled={purchasingType !== null}
                  >
                    {purchasingType === pkg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Buy Tokens'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Token Usage Guide */}
        <Card className="max-w-4xl mx-auto border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Token Usage Guide</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Here's how tokens are consumed in your gaming experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Game Creation</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Full game setup: 250 tokens</li>
                  <li>• Generate host: 50 tokens</li>
                  <li>• Generate players: 100 tokens</li>
                  <li>• Game icon: 16 tokens</li>
                  <li>• Avatar (each): 16 tokens</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Gameplay</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• GM chat message: 10 tokens</li>
                  <li>• Host response: 10 tokens</li>
                  <li>• Quick replies: 2 tokens</li>
                  <li>• Voice transcription: 6 tokens/min</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
