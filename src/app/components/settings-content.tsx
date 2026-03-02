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

const TTS_MODELS = [
  { value: 'inworld-tts-1.5-max', label: 'Inworld TTS 1.5 Max', description: 'Highest quality' },
  { value: 'inworld-tts-1.5-mini', label: 'Inworld TTS 1.5 Mini', description: 'Fast & balanced' },
  { value: 'inworld-tts-1-max', label: 'Inworld TTS 1 Max', description: 'Stable quality' },
  { value: 'inworld-tts-1', label: 'Inworld TTS 1', description: 'Lightweight' },
];

function ls(key: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function SettingsContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [aiModel, setAiModel] = useState<string>(() => ls('ai_model', 'gpt-5.2'));
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => ls('voice_enabled', 'true') !== 'false');
  const [ttsModel, setTtsModel] = useState<string>(() => ls('tts_model', 'inworld-tts-1.5-max'));
  const [ttsTemperature, setTtsTemperature] = useState<string>(() => ls('tts_temperature', '1.1'));
  const [ttsSpeed, setTtsSpeed] = useState<string>(() => ls('tts_speed', '1.0'));
  const [imageGenEnabled, setImageGenEnabled] = useState<boolean>(() => ls('image_gen_enabled', 'true') !== 'false');
  const [saving, setSaving] = useState(false);

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
    { value: 'gpt-5.2', label: 'GPT-5.2', description: 'Default model' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & efficient' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Reliable & quick' },
  ];
  const paidModels = [
    { value: 'gpt-5.2', label: 'GPT-5.2', description: 'Default model' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & efficient' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Advanced reasoning' },
  ];
  const availableModels = isPaid ? paidModels : freeModels;

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-y-auto">
      {/* Header */}
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

          {/* Plan badge */}
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

          {/* AI Model */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg mb-0.5">AI Model</h2>
                <p className="text-zinc-400 text-sm">Which model powers the game Host and AI characters</p>
              </div>
            </div>
            <div>
              <Label htmlFor="ai-model" className="text-zinc-400 text-xs mb-2 block uppercase tracking-wide">Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger id="ai-model" className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {availableModels.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-white hover:bg-zinc-700">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-zinc-400 ml-2">{model.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isPaid && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-200/80 text-xs">
                  Free plan supports basic models only. <button onClick={() => router.push('/subscription')} className="underline text-amber-300">Upgrade</button> for GPT-4o and Claude.
                </p>
              </div>
            )}
          </div>

          {/* AI Voice */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Volume2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-0.5">AI Voice</h2>
                <p className="text-zinc-400 text-sm">
                  Characters speak aloud as text streams in.
                  Voices are auto-matched to each character&apos;s personality and gender.
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
              <div className="space-y-5 pt-4 border-t border-zinc-800">

                {/* TTS Model */}
                <div>
                  <Label className="text-zinc-400 text-xs mb-2 block uppercase tracking-wide">Model</Label>
                  <Select
                    value={ttsModel}
                    onValueChange={(v) => {
                      setTtsModel(v);
                      localStorage.setItem('tts_model', v);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {TTS_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-white hover:bg-zinc-700">
                          <span className="font-medium">{m.label}</span>
                          <span className="text-xs text-zinc-400 ml-2">{m.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                {(() => {
                  const numVal = parseFloat(ttsTemperature);
                  const pct = ((numVal - 0.7) / (1.5 - 0.7)) * 100;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wide">Temperature</Label>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>0.7</span>
                          <span className="text-emerald-400 font-semibold text-sm tabular-nums">{numVal.toFixed(1)}</span>
                          <span>1.5</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(0.7, parseFloat((numVal - 0.1).toFixed(1))).toFixed(1);
                            setTtsTemperature(v);
                            localStorage.setItem('tts_temperature', v);
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                        >−</button>
                        <input
                          id="tts-temperature"
                          name="tts-temperature"
                          type="range" min="0.7" max="1.5" step="0.1"
                          value={ttsTemperature}
                          onChange={(e) => { setTtsTemperature(e.target.value); localStorage.setItem('tts_temperature', e.target.value); }}
                          className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                          style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #3f3f46 ${pct}%, #3f3f46 100%)` }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(1.5, parseFloat((numVal + 0.1).toFixed(1))).toFixed(1);
                            setTtsTemperature(v);
                            localStorage.setItem('tts_temperature', v);
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                        >+</button>
                        <button type="button" onClick={() => { setTtsTemperature('1.1'); localStorage.setItem('tts_temperature', '1.1'); }} className="text-xs text-zinc-600 hover:text-zinc-400 w-8 text-right transition-colors">reset</button>
                      </div>
                      <p className="text-zinc-600 text-xs mt-1.5">Controls expressiveness and variation in speech.</p>
                    </div>
                  );
                })()}

                {/* Talking Speed */}
                {(() => {
                  const numVal = parseFloat(ttsSpeed);
                  const pct = ((numVal - 0.5) / (1.5 - 0.5)) * 100;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-zinc-400 text-xs uppercase tracking-wide">Talking Speed</Label>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>0.5×</span>
                          <span className="text-emerald-400 font-semibold text-sm tabular-nums">{numVal.toFixed(1)}×</span>
                          <span>1.5×</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.max(0.5, parseFloat((numVal - 0.05).toFixed(2))).toFixed(2);
                            setTtsSpeed(v);
                            localStorage.setItem('tts_speed', v);
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                        >−</button>
                        <input
                          id="tts-speed"
                          name="tts-speed"
                          type="range" min="0.5" max="1.5" step="0.05"
                          value={ttsSpeed}
                          onChange={(e) => { setTtsSpeed(e.target.value); localStorage.setItem('tts_speed', e.target.value); }}
                          className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                          style={{ background: `linear-gradient(to right, #10b981 0%, #10b981 ${pct}%, #3f3f46 ${pct}%, #3f3f46 100%)` }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = Math.min(1.5, parseFloat((numVal + 0.05).toFixed(2))).toFixed(2);
                            setTtsSpeed(v);
                            localStorage.setItem('tts_speed', v);
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                        >+</button>
                        <button type="button" onClick={() => { setTtsSpeed('1.0'); localStorage.setItem('tts_speed', '1.0'); }} className="text-xs text-zinc-600 hover:text-zinc-400 w-8 text-right transition-colors">reset</button>
                      </div>
                      <p className="text-zinc-600 text-xs mt-1.5">Native speech rate, processed by Inworld&apos;s TTS engine.</p>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>

          {/* Image Generation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <ImageIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold text-lg mb-0.5">Image Generation</h2>
                <p className="text-zinc-400 text-sm">Generate scene images during gameplay</p>
              </div>
              <Switch
                checked={imageGenEnabled && isPaid}
                onCheckedChange={(checked) => {
                  if (!isPaid) {
                    toast.error('Image generation requires a paid plan');
                    return;
                  }
                  setImageGenEnabled(checked);
                  toast.success(checked ? 'Image generation enabled' : 'Disabled');
                }}
                disabled={!isPaid}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
            {!isPaid && (
              <div className="flex items-start gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <Info className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                <p className="text-zinc-400 text-xs">
                  Available on paid plans. <button onClick={() => router.push('/subscription')} className="text-violet-400 underline">Upgrade →</button>
                </p>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  localStorage.setItem('ai_model', aiModel);
                  localStorage.setItem('image_gen_enabled', String(imageGenEnabled));
                  // Persist to server when logged in
                  if (session?.access_token) {
                    await fetch('/api/user/settings', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ ai_model: aiModel, image_gen_enabled: imageGenEnabled }),
                    });
                  }
                  toast.success('Settings saved!');
                } catch {
                  toast.error('Failed to save settings');
                } finally {
                  setSaving(false);
                }
              }}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
