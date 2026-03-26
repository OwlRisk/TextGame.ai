'use client';

import { ArrowLeft, Volume2, Sparkles } from 'lucide-react';
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
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => ls('voice_enabled', 'false') === 'true');
  const [ttsModel, setTtsModel] = useState<string>(() => ls('tts_model', 'inworld-tts-1.5-max'));
  const [ttsTemperature, setTtsTemperature] = useState<string>(() => ls('tts_temperature', '1.1'));
  const [ttsSpeed, setTtsSpeed] = useState<string>(() => ls('tts_speed', '1.0'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/user/settings', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((prefs: Record<string, unknown> | null) => {
        if (!prefs) return;
        if (typeof prefs.tts_model === 'string') {
          setTtsModel(prefs.tts_model);
          localStorage.setItem('tts_model', prefs.tts_model);
        }
        if (typeof prefs.tts_enabled === 'boolean') {
          setTtsEnabled(prefs.tts_enabled);
          localStorage.setItem('voice_enabled', String(prefs.tts_enabled));
        }
        if (typeof prefs.tts_temperature === 'string') {
          setTtsTemperature(prefs.tts_temperature);
          localStorage.setItem('tts_temperature', prefs.tts_temperature);
        }
        if (typeof prefs.tts_speed === 'string') {
          setTtsSpeed(prefs.tts_speed);
          localStorage.setItem('tts_speed', prefs.tts_speed);
        }
      })
      .catch(() => {});
  }, [session?.access_token]);

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
            <p className="text-xs text-zinc-500">Customize your experience</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

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
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium tabular-nums transition-colors ${ttsEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {ttsEnabled ? 'On' : 'Off'}
                </span>
                <Switch
                  checked={ttsEnabled}
                  onCheckedChange={(checked) => {
                    setTtsEnabled(checked);
                    localStorage.setItem('voice_enabled', String(checked));
                    toast.success(checked ? 'Voice enabled' : 'Voice disabled');
                  }}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
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
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
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
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
                        >+</button>
                        <button type="button" onClick={() => { setTtsTemperature('1.1'); localStorage.setItem('tts_temperature', '1.1'); }} className="text-xs text-zinc-600 hover:text-zinc-400 w-8 text-right transition-colors">reset</button>
                      </div>
                      <p className="text-zinc-600 text-xs mt-1.5">
                        {numVal <= 0.9
                          ? 'Stable and predictable tone with minimal variation — ideal for narration or formal speech.'
                          : numVal >= 1.3
                            ? 'Highly expressive with rich emotion and dramatic intonation — may occasionally sound unnatural.'
                            : 'Balanced expressiveness with natural-sounding variation.'}
                      </p>
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
                          <span className="text-emerald-400 font-semibold text-sm tabular-nums">{numVal.toFixed(2)}×</span>
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
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
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
                          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center text-sm font-bold shrink-0 transition-colors"
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

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  if (session?.access_token) {
                    await fetch('/api/user/settings', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        tts_model: ttsModel,
                        tts_enabled: ttsEnabled,
                        tts_temperature: ttsTemperature,
                        tts_speed: ttsSpeed,
                      }),
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
