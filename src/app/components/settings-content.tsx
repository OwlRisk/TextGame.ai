'use client';

import { ArrowLeft, Bot, Volume2, Image as ImageIcon, Sparkles, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
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
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [imageGenEnabled, setImageGenEnabled] = useState(true);
  const [ttsVoice, setTtsVoice] = useState('alloy');

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

  const ttsVoices = [
    { value: 'alloy', label: 'Alloy', description: 'Neutral & clear' },
    { value: 'echo', label: 'Echo', description: 'Warm & friendly' },
    { value: 'fable', label: 'Fable', description: 'Expressive' },
    { value: 'onyx', label: 'Onyx', description: 'Deep & authoritative' },
    { value: 'nova', label: 'Nova', description: 'Energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Soft & gentle' },
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
          <div
            className={`rounded-xl p-6 border ${
              isPaid
                ? 'bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border-violet-500/30'
                : 'from-zinc-700/20 to-zinc-800/20 border-zinc-700 bg-zinc-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg mb-1">
                  {currentPlan === 'free'
                    ? 'Free Plan'
                    : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`}
                </h2>
                <p className="text-zinc-400 text-sm">
                  {isPaid
                    ? 'You have access to premium features'
                    : 'Upgrade to unlock premium models and features'}
                </p>
              </div>
              {!isPaid && (
                <Button
                  onClick={() => router.push('/subscription')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Upgrade
                </Button>
              )}
            </div>
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

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-1">Text-to-Speech (TTS)</h2>
                <p className="text-zinc-400 text-sm">Enable voice narration for AI characters</p>
              </div>
              <Switch
                checked={ttsEnabled && isPaid}
                onCheckedChange={(checked) => {
                  if (!isPaid) {
                    toast.error('TTS is only available for paid subscribers');
                    return;
                  }
                  setTtsEnabled(checked);
                  toast.success(checked ? 'TTS enabled' : 'TTS disabled');
                }}
                disabled={!isPaid}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
            {ttsEnabled && isPaid && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div>
                  <Label htmlFor="tts-voice" className="text-zinc-300 mb-2 block">
                    Voice Selection
                  </Label>
                  <Select value={ttsVoice} onValueChange={setTtsVoice}>
                    <SelectTrigger id="tts-voice" className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {ttsVoices.map((voice) => (
                        <SelectItem
                          key={voice.value}
                          value={voice.value}
                          className="text-white hover:bg-zinc-700"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.label}</span>
                            <span className="text-xs text-zinc-400">{voice.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {!isPaid && (
              <div className="flex items-start gap-2 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Info className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-zinc-300 text-sm font-medium">Premium Feature</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    TTS is only available for paid subscribers. Upgrade to hear AI characters speak!
                  </p>
                </div>
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
