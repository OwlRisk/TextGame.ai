"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Swords, Brain, MessageCircle, Trophy, User, Clock, Smile, Frown, Zap } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { HostSelector } from "@/app/components/host-selector";
import { HOST_PERSONALITIES, getDefaultHost, getDefaultHostForTemplate, getLastSelectedHostId, saveLastSelectedHostId } from "@/app/config/host-config";

interface GameCreatorFormProps {
  onBack: () => void;
  onCreateGame: (config: GameConfig) => void;
  onSwitchToChat?: () => void;
}

import { GameTemplate, GAME_TEMPLATES } from "@/lib/game-templates";

function buildPlayerCountOptions(template: GameTemplate | null) {
  if (!template) {
    return [{ value: 0, label: "Let GM decide", description: "AI chooses based on rules", isRecommended: false }];
  }
  const minAI = Math.max(template.minPlayers - 1, 0);
  const maxAI = template.maxPlayers - 1;
  const rec = template.recommendedAICount;

  const opts: { value: number; label: string; description: string; isRecommended: boolean }[] = [
    { value: 0, label: "Let GM decide", description: "AI chooses based on rules", isRecommended: false },
  ];

  if (maxAI <= 0) return opts;

  const candidates = new Set<number>();
  candidates.add(minAI);
  if (rec > 0) candidates.add(rec);
  const mid = Math.round((minAI + maxAI) / 2);
  if (mid !== minAI && mid !== maxAI) candidates.add(mid);
  candidates.add(maxAI);

  const sorted = [...candidates].filter((v) => v >= minAI && v <= maxAI).sort((a, b) => a - b);

  for (const v of sorted) {
    const total = v + 1;
    const sizeLabel =
      v === minAI ? "Minimum" : v === maxAI ? "Maximum" : v === rec ? "Recommended" : `${total} players`;
    opts.push({
      value: v,
      label: `${sizeLabel} (${v} AI)`,
      description: `${total} total players`,
      isRecommended: v === rec,
    });
  }
  return opts;
}

const TONE_OPTIONS = [
  { id: "serious", name: "Serious & Strategic", description: "Intense gameplay focused on logic", icon: Zap, color: "from-gray-600 to-slate-600" },
  { id: "casual", name: "Fun & Casual", description: "Relaxed and entertaining", icon: Smile, color: "from-yellow-600 to-orange-600" },
  { id: "dark", name: "Dark & Mysterious", description: "Atmospheric and immersive", icon: Frown, color: "from-purple-900 to-indigo-900" },
  { id: "educational", name: "Educational", description: "Learn while you play", icon: Brain, color: "from-blue-600 to-cyan-600" },
];

type Step = "game-type" | "player-count" | "tone" | "rules" | "host" | "review";

export function GameCreatorForm({ onBack, onCreateGame, onSwitchToChat }: GameCreatorFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>("game-type");
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [selectedTone, setSelectedTone] = useState<string>("casual");
  const [customRules, setCustomRules] = useState<string>("");
  // Initialize host: try last selected, then recommended for template, then default
  const [selectedHostId, setSelectedHostId] = useState<string>(() => {
    const lastHostId = getLastSelectedHostId();
    if (lastHostId) return lastHostId;
    return getDefaultHost().id;
  });
  
  useEffect(() => {
    if (selectedTemplate) {
      setPlayerCount(selectedTemplate.maxPlayers > 1 ? selectedTemplate.maxPlayers - 1 : selectedTemplate.recommendedAICount);
      const lastHostId = getLastSelectedHostId();
      if (!lastHostId || !HOST_PERSONALITIES.find(h => h.id === lastHostId)) {
        const recommendedHost = getDefaultHostForTemplate(selectedTemplate.id);
        setSelectedHostId(recommendedHost.id);
      }
    }
  }, [selectedTemplate]);

  const steps: Step[] = ["game-type", "player-count", "tone", "rules", "host", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "game-type":
        return selectedTemplate !== null;
      case "player-count":
        return true;
      case "tone":
        return selectedTone !== "";
      case "rules":
        return true; // Optional step
      case "host":
        return selectedHostId !== "";
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    } else {
      onBack();
    }
  };

  const handleCreate = () => {
    if (!selectedTemplate) return;

    const finalRules = customRules || selectedTemplate.defaultRules;
    const toneInstruction = `\n\nTONE: ${TONE_OPTIONS.find(t => t.id === selectedTone)?.name}`;

    saveLastSelectedHostId(selectedHostId); // Save user's choice
    onCreateGame({
      name: selectedTemplate.name,
      template: selectedTemplate.id,
      playerCount: playerCount,
      rules: finalRules + toneInstruction,
      customRoles: selectedTemplate.roles,
      hostId: selectedHostId,
      hideRolesInPlayerList: selectedTemplate.hasHiddenRoles
    });
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "game-type": return "Choose Your Game";
      case "player-count": return "How Many AI Players?";
      case "tone": return "Set the Tone";
      case "rules": return "Customize Rules (Optional)";
      case "host": return "Choose Your Guide";
      case "review": return "Review & Create";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case "game-type": return "Select a game type to get started";
      case "player-count": return "AI characters will play alongside you";
      case "tone": return "How should the game feel?";
      case "rules": return "Add your own twists or keep the defaults";
      case "host": return "Each guide has a unique personality";
      case "review": return "Everything looks good? Let's play!";
      default: return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black h-full overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.03),transparent_50%)] pointer-events-none" />
      
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0 relative z-10">
        <div className="h-20 px-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-zinc-500 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl font-semibold text-white">{getStepTitle()}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">{getStepDescription()}</p>
            </div>
          </div>

          {/* Switch to Chat Mode */}
          {onSwitchToChat && currentStep === "game-type" && (
            <Button
              variant="outline"
              onClick={onSwitchToChat}
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Talk to Game Master
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-900">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-5xl mx-auto py-12 px-8">
          {/* Step 1: Game Type */}
          {currentStep === "game-type" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {GAME_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`group relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 hover:scale-105 text-left overflow-hidden ${
                    selectedTemplate?.id === template.id
                      ? 'border-violet-500/50 bg-white/10'
                      : 'border-white/10 hover:border-violet-500/30'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">{template.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{template.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {template.minPlayers}-{template.maxPlayers}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </div>
                    </div>

                    {selectedTemplate?.id === template.id && (
                      <div className="mt-4 flex items-center gap-2 text-violet-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">Selected</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Player Count */}
          {currentStep === "player-count" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 rounded-xl p-3">
                    <User className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">You + AI Characters</h3>
                    <p className="text-sm text-zinc-400">
                      You'll play as one character, and AI will control all other players. 
                      No need to wait for others to join!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {buildPlayerCountOptions(selectedTemplate).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPlayerCount(option.value)}
                    className={`relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 text-left ${
                      playerCount === option.value
                        ? 'border-violet-500/50 bg-white/10'
                        : 'border-white/10 hover:border-violet-500/30 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-3xl font-black text-white">{option.value === 0 ? "?" : option.value + 1}</div>
                      <div className="flex items-center gap-2">
                        {option.isRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">Recommended</span>
                        )}
                        {playerCount === option.value && (
                          <CheckCircle2 className="h-5 w-5 text-violet-400" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{option.label}</h3>
                    <p className="text-sm text-zinc-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Tone */}
          {currentStep === "tone" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {TONE_OPTIONS.map((tone) => {
                const Icon = tone.icon;
                return (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`group relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 hover:scale-105 text-left overflow-hidden ${
                      selectedTone === tone.id
                        ? 'border-violet-500/50 bg-white/10'
                        : 'border-white/10 hover:border-violet-500/30'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${tone.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="relative z-10">
                      <div className={`inline-flex p-3 bg-gradient-to-br ${tone.color} rounded-xl mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{tone.name}</h3>
                      <p className="text-sm text-zinc-400">{tone.description}</p>

                      {selectedTone === tone.id && (
                        <div className="mt-4 flex items-center gap-2 text-violet-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-semibold">Selected</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 4: Custom Rules */}
          {currentStep === "rules" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Default Rules</h3>
                <pre className="text-sm text-zinc-400 whitespace-pre-wrap font-mono">
                  {selectedTemplate?.defaultRules || "No default rules"}
                </pre>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">Add Your Own Rules (Optional)</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Customize the game to your liking. Leave empty to use defaults.
                </p>
                <Textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="e.g., No roles can repeat, players eliminated during day phase can still watch and comment..."
                  className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>
            </div>
          )}

          {/* Step 5: Host Selection */}
          {currentStep === "host" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HostSelector
                selectedHostId={selectedHostId}
                onSelectHost={(hostId) => {
                  setSelectedHostId(hostId);
                  saveLastSelectedHostId(hostId);
                }}
                templateId={selectedTemplate?.id}
                gameRules={customRules || selectedTemplate?.defaultRules}
                gameName={selectedTemplate?.name}
              />
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === "review" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-2xl p-8 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-violet-500/20 rounded-xl p-3">
                    <Sparkles className="h-8 w-8 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Ready to Play!</h2>
                    <p className="text-sm text-zinc-400">Review your game setup below</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Game Type</span>
                    <span className="text-base font-semibold text-white">{selectedTemplate?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Total Players</span>
                    <span className="text-base font-semibold text-white">{playerCount === 0 ? "GM decides" : `You + ${playerCount} AI`}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Tone</span>
                    <span className="text-base font-semibold text-white">
                      {TONE_OPTIONS.find(t => t.id === selectedTone)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Guide</span>
                    <span className="text-base font-semibold text-white">
                      {HOST_PERSONALITIES.find(h => h.id === selectedHostId)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-zinc-400">Custom Rules</span>
                    <span className="text-base font-semibold text-white">
                      {customRules ? "Yes" : "Using Defaults"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-sm text-amber-200/80">
                    ⚠️ <strong>Important:</strong> Rules are locked once the game starts and cannot be changed during gameplay.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>

          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep !== "review" ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Game
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
