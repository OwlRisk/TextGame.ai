'use client';

import { ArrowLeft, Bot, Volume2, Image as ImageIcon, Sparkles, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import type { SubscriptionTier } from '@/lib/subscription';

export function SettingsContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('voice_enabled');
    return stored === null ? true : stored !== 'false';
  });
  const [voiceSpeed, setVoiceSpeed] = useState<string>(() => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('voice_speed') ?? '1';
  });
  const [imageGenEnabled, setImageGenEnabled] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/user/balance', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const status = data?.subscriptionStatus ?? 'free';
        setCurrentPlan(status === 'cancelled' ? 'free' : (status as SubscriptionTier));
      })
      .catch(() => setCurrentPlan('free'));
  }, [session?.access_token]);

  const isPaid = currentPlan !== 'free';

  const freeModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & efficient' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Reliable & quick' },
  ];

  const paidModels = [
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & efficient' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Advanced reasoning' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: "Anthropic's best" },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', description: 'Maximum intelligence' },
  ];

  const availableModels = isPaid ? paidModels : freeModels;

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-zinc-500">Customize your gaming experience</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Current plan:</span>
              <span className={`font-semibold ${isPaid ? 'text-violet-300' : 'text-zinc-300'}`}>
                {currentPlan === 'free' ? 'Free' : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/subscription')}
              className="text-xs text-zinc-400 hover:text-white h-7 px-3"
            >
              Manage →
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-1">AI Model</h2>
                <p className="text-zinc-400 text-sm">Choose which AI model to use for game interactions</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-model" className="text-zinc-300 mb-2 block">
                  Select Model
                </Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger id="ai-model" className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {availableModels.map((model) => (
                      <SelectItem
                        key={model.value}
                        value={model.value}
                        className="text-white hover:bg-zinc-700"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-zinc-400">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isPaid && (
                <div className="flex items-start gap-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-300 text-sm font-medium">Free Plan Limitation</p>
                    <p className="text-amber-200/70 text-xs mt-1">
                      Only basic models are available. Upgrade to access premium models like GPT-4o and Claude.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-1">AI Voice (TTS)</h2>
                <p className="text-zinc-400 text-sm">
                  AI characters speak aloud as they type. Voices are automatically matched to each character&apos;s personality.
                  {isPaid
                    ? <span className="block mt-1 text-emerald-400/80 text-xs">113 voices · 16 languages available on your plan.</span>
                    : <span className="block mt-1 text-zinc-500 text-xs">3 voices on Free plan · upgrade for 113 voices across 16 languages.</span>
                  }
                </p>
              </div>
              <Switch
                checked={ttsEnabled}
                onCheckedChange={(checked) => {
                  setTtsEnabled(checked);
                  localStorage.setItem('voice_enabled', String(checked));
                  toast.success(checked ? 'Voice enabled' : 'Voice disabled');
                }}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            {ttsEnabled && (
              <div className="pt-4 border-t border-zinc-800">
                <Label className="text-zinc-300 mb-2 block text-sm">Speech Speed</Label>
                <Select
                  value={voiceSpeed}
                  onValueChange={(v) => {
                    setVoiceSpeed(v);
                    localStorage.setItem('voice_speed', v);
                  }}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {[
                      { value: '0.75', label: '0.75×  Slow' },
                      { value: '1',    label: '1.0×   Normal' },
                      { value: '1.25', label: '1.25×  Slightly fast' },
                      { value: '1.5',  label: '1.5×   Fast' },
                      { value: '1.75', label: '1.75×  Very fast' },
                      { value: '2',    label: '2.0×   Maximum' },
                    ].map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-zinc-700">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-1">Image Generation</h2>
                <p className="text-zinc-400 text-sm">Generate custom images during gameplay</p>
              </div>
              <Switch
                checked={imageGenEnabled && isPaid}
                onCheckedChange={(checked) => {
                  if (!isPaid) {
                    toast.error('Image generation is only available for paid subscribers');
                    return;
                  }
                  setImageGenEnabled(checked);
                  toast.success(checked ? 'Image generation enabled' : 'Image generation disabled');
                }}
                disabled={!isPaid}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
            {!isPaid && (
              <div className="flex items-start gap-2 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Info className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm font-medium">Premium Feature</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Image generation is only available for paid subscribers. Create custom visuals for your games!
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
