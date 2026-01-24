"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Swords, Brain, MessageCircle, Trophy, User, Clock, Smile, Frown, Zap } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { HostSelector } from "@/app/components/host-selector";
import { HOST_PERSONALITIES, getDefaultHost } from "@/app/config/host-config";

interface GameCreatorFormProps {
  onBack: () => void;
  onCreateGame: (config: GameConfig) => void;
  onSwitchToChat?: () => void;
}

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultRules: string;
  roles?: string[];
  icon: string;
  color: string;
  estimatedTime: string;
}

const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: "werewolf",
    name: "Werewolf",
    description: "A classic social deduction game where villagers try to find the werewolves.",
    minPlayers: 5,
    maxPlayers: 12,
    defaultRules: `OBJECTIVE: Villagers must find and eliminate all Werewolves. Werewolves must eliminate all Villagers.

PHASES:
1. Night Phase - Werewolves choose a victim
2. Day Phase - All players discuss and vote to eliminate someone

ROLES:
- Villagers: Innocent townspeople
- Werewolves: Kill one villager each night
- Seer: Can check one player's role each night
- Doctor: Can protect one player each night

RULES:
- Once rules are set, they cannot be changed
- Game Master controls all phases
- Dead players cannot communicate
- Majority vote eliminates a player`,
    roles: ["Villager", "Werewolf", "Seer", "Doctor"],
    icon: "🐺",
    color: "from-purple-600 to-indigo-600",
    estimatedTime: "30-45 min"
  },
  {
    id: "undercover",
    name: "Undercover",
    description: "Find the undercover agent who has a different word while blending in.",
    minPlayers: 4,
    maxPlayers: 10,
    defaultRules: `OBJECTIVE: Civilians find the Undercover. Undercover tries to blend in and survive.

SETUP:
- Most players get the same word (Civilians)
- One player gets a similar but different word (Undercover)
- One player gets a completely different word (Mr. White - optional)

GAMEPLAY:
1. Each player describes their word in one sentence
2. Vote to eliminate the suspected Undercover
3. Eliminated player reveals their role
4. Continue until Undercover is found or wins

WINNING:
- Civilians win if they eliminate the Undercover
- Undercover wins if they survive to final 3 players
- Mr. White wins if they correctly guess the civilian word when eliminated`,
    roles: ["Civilian", "Undercover", "Mr. White"],
    icon: "🕵️",
    color: "from-blue-600 to-cyan-600",
    estimatedTime: "15-20 min"
  },
  {
    id: "mafia",
    name: "Mafia",
    description: "An intense game of lies and deception. Can the town survive the Mafia?",
    minPlayers: 6,
    maxPlayers: 15,
    defaultRules: `OBJECTIVE: Town must eliminate the Mafia. Mafia must outnumber the Town.

PHASES:
1. Night Phase - Mafia choose a victim, special roles act
2. Day Phase - All players discuss and vote to eliminate someone

ROLES:
- Town Members: Innocent citizens
- Mafia: Kill one town member each night
- Detective: Can investigate one player each night
- Doctor: Can save one player each night

RULES:
- Mafia wins when they equal or outnumber town
- Town wins when all Mafia are eliminated
- Dead players cannot communicate`,
    roles: ["Town Member", "Mafia", "Detective", "Doctor"],
    icon: "🎭",
    color: "from-red-600 to-pink-600",
    estimatedTime: "45-60 min"
  },
  {
    id: "custom",
    name: "Custom Game",
    description: "Create your own game with custom rules and roles.",
    minPlayers: 2,
    maxPlayers: 20,
    defaultRules: "",
    roles: [],
    icon: "✨",
    color: "from-violet-600 to-fuchsia-600",
    estimatedTime: "Varies"
  }
];

const PLAYER_COUNT_OPTIONS = [
  { value: 4, label: "Small (4 AI players)", description: "Quick & intimate" },
  { value: 6, label: "Medium (6 AI players)", description: "Balanced & fun" },
  { value: 8, label: "Large (8 AI players)", description: "Epic & chaotic" },
  { value: 10, label: "Massive (10 AI players)", description: "Maximum chaos" },
];

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
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [selectedTone, setSelectedTone] = useState<string>("casual");
  const [customRules, setCustomRules] = useState<string>("");
  const [selectedHostId, setSelectedHostId] = useState<string>(getDefaultHost().id);

  const steps: Step[] = ["game-type", "player-count", "tone", "rules", "host", "review"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "game-type":
        return selectedTemplate !== null;
      case "player-count":
        return playerCount >= (selectedTemplate?.minPlayers || 2) - 1;
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

    onCreateGame({
      name: selectedTemplate.name,
      template: selectedTemplate.id,
      playerCount: playerCount,
      rules: finalRules + toneInstruction,
      customRoles: selectedTemplate.roles,
      hostId: selectedHostId
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
      <ScrollArea className="flex-1">
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
                {PLAYER_COUNT_OPTIONS.map((option) => {
                  const isValid = selectedTemplate 
                    ? option.value >= selectedTemplate.minPlayers - 1 && option.value <= selectedTemplate.maxPlayers - 1
                    : true;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => isValid && setPlayerCount(option.value)}
                      disabled={!isValid}
                      className={`relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 transition-all duration-300 text-left ${
                        playerCount === option.value
                          ? 'border-violet-500/50 bg-white/10'
                          : isValid
                          ? 'border-white/10 hover:border-violet-500/30 hover:scale-105'
                          : 'border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-3xl font-black text-white">{option.value + 1}</div>
                        {playerCount === option.value && (
                          <CheckCircle2 className="h-5 w-5 text-violet-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{option.label}</h3>
                      <p className="text-sm text-zinc-400">{option.description}</p>
                      <p className="text-xs text-zinc-500 mt-2">Total: You + {option.value} AI</p>
                    </button>
                  );
                })}
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
                onSelectHost={setSelectedHostId}
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
                    <span className="text-base font-semibold text-white">You + {playerCount} AI</span>
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
