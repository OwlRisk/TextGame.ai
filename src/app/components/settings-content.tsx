'use client';

import { ArrowLeft, Bot, Volume2, Image as ImageIcon, Sparkles, Info, Globe } from 'lucide-react';
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

const VOICE_LANGUAGES = [
  { value: 'EN_US', label: 'English', flag: '🇺🇸', count: 69 },
  { value: 'ZH_CN', label: '中文 (普通话)', flag: '🇨🇳', count: 4 },
  { value: 'JA_JP', label: '日本語', flag: '🇯🇵', count: 2 },
  { value: 'KO_KR', label: '한국어', flag: '🇰🇷', count: 4 },
  { value: 'FR_FR', label: 'Français', flag: '🇫🇷', count: 4 },
  { value: 'DE_DE', label: 'Deutsch', flag: '🇩🇪', count: 2 },
  { value: 'ES_ES', label: 'Español', flag: '🇪🇸', count: 4 },
  { value: 'IT_IT', label: 'Italiano', flag: '🇮🇹', count: 2 },
  { value: 'PT_BR', label: 'Português (BR)', flag: '🇧🇷', count: 2 },
  { value: 'RU_RU', label: 'Русский', flag: '🇷🇺', count: 4 },
  { value: 'NL_NL', label: 'Nederlands', flag: '🇳🇱', count: 4 },
  { value: 'PL_PL', label: 'Polski', flag: '🇵🇱', count: 2 },
  { value: 'HI_IN', label: 'हिन्दी', flag: '🇮🇳', count: 2 },
  { value: 'AR_SA', label: 'العربية', flag: '🇸🇦', count: 2 },
  { value: 'HE_IL', label: 'עברית', flag: '🇮🇱', count: 2 },
];

function ls(key: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function SettingsContent() {
  const router = useRouter();
  const { session } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => ls('voice_enabled', 'true') !== 'false');
  const [voiceSpeed, setVoiceSpeed] = useState<string>(() => ls('voice_speed', '1'));
  const [voiceLang, setVoiceLang] = useState<string>(() => ls('voice_lang', 'EN_US'));
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

  const selectedLang = VOICE_LANGUAGES.find((l) => l.value === voiceLang) ?? VOICE_LANGUAGES[0];

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

                {/* Voice language */}
                <div>
                  <Label className="text-zinc-400 text-xs mb-2 block uppercase tracking-wide flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Voice Language
                  </Label>
                  <Select
                    value={voiceLang}
                    onValueChange={(v) => {
                      setVoiceLang(v);
                      localStorage.setItem('voice_lang', v);
                      toast.success('Voice language updated');
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue>
                        <span>{selectedLang.flag} {selectedLang.label}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 max-h-64">
                      {(isPaid ? VOICE_LANGUAGES : VOICE_LANGUAGES.slice(0, 1)).map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-zinc-700">
                          <span className="mr-2">{lang.flag}</span>
                          <span className="font-medium">{lang.label}</span>
                          <span className="text-xs text-zinc-500 ml-2">{lang.count} voices</span>
                        </SelectItem>
                      ))}
                      {!isPaid && (
                        <div className="px-3 py-2 border-t border-zinc-700">
                          <p className="text-xs text-zinc-500">
                            <button onClick={() => router.push('/subscription')} className="text-violet-400 underline">Upgrade</button> for 15 more languages
                          </p>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-zinc-600 text-xs mt-1.5">
                    Characters will speak in this language. {isPaid ? `${selectedLang.count} voices available.` : 'Paid plans unlock 15 more languages.'}
                  </p>
                </div>

                {/* Speech speed */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wide">Speech Speed</Label>
                    <span className="text-emerald-400 font-semibold text-sm tabular-nums">
                      {parseFloat(voiceSpeed).toFixed(2)}×
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(0.5, parseFloat(voiceSpeed) - 0.05).toFixed(2);
                        setVoiceSpeed(v);
                        localStorage.setItem('voice_speed', v);
                      }}
                      className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-base font-bold shrink-0 transition-colors"
                    >−</button>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={voiceSpeed}
                      onChange={(e) => {
                        setVoiceSpeed(e.target.value);
                        localStorage.setItem('voice_speed', e.target.value);
                      }}
                      className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${((parseFloat(voiceSpeed) - 0.5) / 1.5) * 100}%, #3f3f46 ${((parseFloat(voiceSpeed) - 0.5) / 1.5) * 100}%, #3f3f46 100%)`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.min(2, parseFloat(voiceSpeed) + 0.05).toFixed(2);
                        setVoiceSpeed(v);
                        localStorage.setItem('voice_speed', v);
                      }}
                      className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-base font-bold shrink-0 transition-colors"
                    >+</button>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5 px-10">
                    <span>0.5×</span><span>1.0×</span><span>1.5×</span><span>2.0×</span>
                  </div>
                </div>

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
              onClick={() => toast.success('Settings saved!')}
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
