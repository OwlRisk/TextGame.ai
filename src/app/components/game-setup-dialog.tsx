"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, CheckCircle2 } from "lucide-react";
import { HOST_PERSONALITIES, HostPersonality, getDefaultHost, getDefaultHostForTemplate, getLastSelectedHostId, saveLastSelectedHostId } from "@/app/config/host-config";
import { HostSelector } from "@/app/components/host-selector";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Checkbox } from "@/app/components/ui/checkbox";

import { GameTemplate, GAME_TEMPLATES } from "@/lib/game-templates";
export type { GameTemplate };

interface GameSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateGame: (config: GameConfig) => void;
}

export interface ConfiguredPlayer {
  name: string;
  gender?: string;
  personality?: string;
  background?: string;
  /** Role assigned by LLM based on rules (e.g. Villager, Werewolf, Seer) */
  role?: string;
  /** Word for undercover game - actual word string */
  word?: string;
}

export interface GameConfig {
  name: string;
  template: string;
  playerCount: number;
  rules: string;
  /** Game background — merged into Rules (deprecated, kept for backward compatibility) */
  intro?: string;
  customRoles?: string[];
  hostId: string;
  tone?: string;
  /** When true, only each player sees their own role in the player list; Host decides at game creation. */
  hideRolesInPlayerList?: boolean;
  configuredPlayers?: ConfiguredPlayer[];
  /** Role pre-assigned to the human player (for hidden-role games like Werewolf). */
  humanRole?: string;
  /** Script Kill case identifier (e.g. "moonlight-inn") for loading structured case data. */
  caseId?: string;
  generatedHost?: {
    name: string;
    personality: string;
    voiceStyle: string;
    systemPrompt: string;
    icon: string;
    color: string;
    gender?: 'male' | 'female' | 'other';
  };
  /** GM-defined game rooms (e.g. General, Mafia only, Werewolves only). Each room has its own chat. */
  channels?: {
    id: string;
    name: string;
    /**
     * public      – everyone can see and speak (default)
     * private_ai  – restricted AI members hold free discussion (no structured outcome)
     * decision    – restricted AI members confer until consensus; result is summarised and
     *               injected into the HOST's context on the next turn
     * broadcast   – host-only announcements; players read-only
     */
    roomType?: "public" | "private_ai" | "decision" | "broadcast";
  }[];
  /** Custom label for the player's private panel Tab (defaults to "My Board"). E.g. "Briefing", "Role Card", "Intel". */
  playerBoardLabel?: string;
  /** GM-defined action buttons. Overrides template quickActions when present. */
  quickActions?: Array<{
    label: string;
    template: string;
    icon: string;
    needsTarget?: boolean;
    phase?: string;
    role?: string;
    actionType?: string;
    targetType?: string;
  }>;
}

interface ChatMessage {
  id: string;
  role: "gm" | "user";
  content: string;
  timestamp: Date;
}


type ConversationState = "greeting" | "game-type" | "player-count" | "rules-discussion" | "confirmation" | "completed";

export function GameSetupDialog({ open, onClose, onCreateGame }: GameSetupDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>("greeting");
  const [isGMTyping, setIsGMTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Game configuration being built
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [customRules, setCustomRules] = useState<string>("");
  const [gameName, setGameName] = useState<string>("");
  // Initialize host: try last selected, then recommended for template, then default
  const [selectedHostId, setSelectedHostId] = useState<string>(() => {
    const lastHostId = getLastSelectedHostId();
    if (lastHostId) return lastHostId;
    return getDefaultHost().id;
  });
  const [showHostSelector, setShowHostSelector] = useState(false);
  /** Hide roles in player list (only each player sees own role); default by template, Host can override. */
  const [hideRolesInPlayerList, setHideRolesInPlayerList] = useState(true);
  /** Label for the player's private panel Tab. Defaults to "My Board". */
  const [playerBoardLabel, setPlayerBoardLabel] = useState("");
  
  // Update host and default player count when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const lastHostId = getLastSelectedHostId();
      if (!lastHostId || !HOST_PERSONALITIES.find(h => h.id === lastHostId)) {
        const recommendedHost = getDefaultHostForTemplate(selectedTemplate.id);
        setSelectedHostId(recommendedHost.id);
      }
      // Default to max players (maxPlayers - 1 AI, leaving 1 seat for the human)
      setPlayerCount(selectedTemplate.maxPlayers > 1 ? selectedTemplate.maxPlayers - 1 : selectedTemplate.recommendedAICount);
    }
  }, [selectedTemplate]);
  
  useEffect(() => {
    if (open && messages.length === 0) {
      // Initial greeting from Game Master
      setTimeout(() => {
        addGMMessage(
          "Greetings! I'm the Game Master, and I'll help you create an amazing game experience. " +
          "I can set up classic games like Werewolf, Undercover, or Tarot, or we can design something completely custom together.\n\n" +
          "What type of game would you like to play today? You can choose:\n" +
          "• **Werewolf** - A thrilling social deduction game\n" +
          "• **Undercover** - Find the spy among you\n" +
          "• **Tarot** - A reflective card reading with the Host as reader\n" +
          "• **Custom** - Let's create something unique!\n\n" +
          "Just tell me your preference, or describe what kind of game you have in mind!"
        );
      }, 500);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const addGMMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "gm",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setIsGMTyping(false);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateGMResponse = (userInput: string) => {
    setIsGMTyping(true);
    const lowerInput = userInput.toLowerCase();

    setTimeout(() => {
      if (conversationState === "greeting") {
        // Detect game type
        if (lowerInput.includes("werewolf") || lowerInput.includes("wolf")) {
          setSelectedTemplate(GAME_TEMPLATES[0]);
          setConversationState("player-count");
          addGMMessage(
            "Excellent choice! Werewolf is a classic game of deception and deduction.\n\n" +
            "For this game, I recommend 5-12 players (including you). How many AI players would you like? " +
            "Give me a number between 4 and 11, or say \"you decide\" and I'll pick based on the rules."
          );
        } else if (lowerInput.includes("undercover") || lowerInput.includes("spy")) {
          setSelectedTemplate(GAME_TEMPLATES[1]);
          setConversationState("player-count");
          addGMMessage(
            "Great! Undercover is a fantastic word-guessing game where one player has a different word.\n\n" +
            "This game works best with 4-10 players (including you). How many AI players would you like? " +
            "Give me a number between 3 and 9, or say \"you decide\" and I'll pick based on the rules."
          );
        } else if (lowerInput.includes("tarot") || lowerInput.includes("塔罗") || lowerInput.includes("card") && lowerInput.includes("read")) {
          setSelectedTemplate(GAME_TEMPLATES[2]);
          setConversationState("player-count");
          addGMMessage(
            "A wonderful choice! In Tarot Reading, I'll act as your reader—just you and the cards. " +
            "You can ask a specific question or request a general reading. No other players needed; it's a solo reflective experience.\n\n" +
            "We'll use 0 AI players (only you and the Host). Say \"ok\" or \"let's go\" to continue, or ask to change the game type."
          );
        } else if (lowerInput.includes("custom") || lowerInput.includes("create") || lowerInput.includes("独特")) {
          setSelectedTemplate(GAME_TEMPLATES[3]);
          setConversationState("rules-discussion");
          addGMMessage(
            "Wonderful! Let's create a custom game together. I love creativity!\n\n" +
            "Tell me about the game you envision:\n" +
            "• What's the objective?\n" +
            "• What roles or characters are involved?\n" +
            "• Any special rules or phases?\n\n" +
            "Share your ideas, and I'll help structure it into a playable game!"
          );
        } else {
          addGMMessage(
            "I'm not sure which game you'd prefer. Let me help you:\n\n" +
            "**Werewolf** - Strategy and deception. Debate to find the hidden wolves.\n" +
            "**Undercover** - Quick word game. Guess who has the different word.\n" +
            "**Tarot** - A reflective card reading, just you and the Host.\n" +
            "**Custom** - Have a unique idea? Let's build it together.\n\n" +
            "Which one sounds interesting to you?"
          );
        }
      } else if (conversationState === "player-count") {
        if (selectedTemplate?.maxPlayers === 1 && (
          lowerInput.includes("ok") || lowerInput.includes("let's go") || lowerInput.includes("lets go") ||
          lowerInput.includes("go") || lowerInput.includes("yes") || /^0$/.test(userInput.trim())
        )) {
          setPlayerCount(0);
          setConversationState("rules-discussion");
          addGMMessage(
            `Perfect! ${selectedTemplate!.name} is just you and the Host—no other players. Here are the rules:\n\n` +
            `${selectedTemplate!.defaultRules}\n\n` +
            "Would you like to **keep these rules** (say \"yes\" or \"keep\"), or **modify** something?"
          );
        } else if (lowerInput.includes("you decide") || lowerInput.includes("gm decide") || lowerInput.includes("up to you") ||
            lowerInput.includes("your choice") || lowerInput.includes("decide for me") ||
            lowerInput.includes("up to you") || lowerInput.includes("whatever")) {
          setPlayerCount(0);
          setConversationState("rules-discussion");
          addGMMessage(
            "Perfect! I'll decide the player count based on the rules to keep the game balanced.\n\n" +
            `Now, let's discuss the rules. Here are the standard rules for ${selectedTemplate!.name}:\n\n` +
            `${selectedTemplate!.defaultRules}\n\n` +
            `Would you like to:\n` +
            `• **Keep these rules** (just say "yes" or "keep them")\n` +
            `• **Modify something** (tell me what you'd like to change)\n` +
            `• **Start fresh** (describe your own rules)`
          );
        } else {
          const numbers = userInput.match(/\d+/);
          if (numbers) {
            const count = parseInt(numbers[0]);
            const min = selectedTemplate!.minPlayers - 1;
            const max = selectedTemplate!.maxPlayers - 1;
            if (count >= min && count <= max) {
              setPlayerCount(count);
              setConversationState("rules-discussion");
              addGMMessage(
                `Perfect! I'll create ${count} AI players for you.\n\n` +
                `Now, let's discuss the rules. Here are the standard rules for ${selectedTemplate!.name}:\n\n` +
                `${selectedTemplate!.defaultRules}\n\n` +
                `Would you like to:\n` +
                `• **Keep these rules** (just say "yes" or "keep them")\n` +
                `• **Modify something** (tell me what you'd like to change)\n` +
                `• **Start fresh** (describe your own rules)`
              );
            } else {
              addGMMessage(
                `Hmm, ${count} players might not work well for this game. ` +
                `I recommend between ${min} and ${max} AI players (plus you makes ${min + 1} to ${max + 1} total). ` +
                `Could you choose a number in that range?`
              );
            }
          } else {
            addGMMessage(
              "I didn't catch a number there. How many AI players would you like? " +
              `(Or say "you decide" to let me choose based on the rules.) ` +
              `Please give me a number between ${selectedTemplate!.minPlayers - 1} and ${selectedTemplate!.maxPlayers - 1}.`
            );
          }
        }
      } else if (conversationState === "rules-discussion") {
        if (lowerInput.includes("yes") || lowerInput.includes("keep") || lowerInput.includes("standard") || 
            lowerInput.includes("ok") || lowerInput.includes("good") || lowerInput.includes("fine")) {
          setCustomRules(selectedTemplate!.defaultRules);
          setConversationState("confirmation");
          setHideRolesInPlayerList(selectedTemplate!.hasHiddenRoles ?? false);
          setShowHostSelector(true);
          addGMMessage(
            `Excellent! Let me summarize your game setup:\n\n` +
            `**Game Type:** ${selectedTemplate!.name}\n` +
            `**Total Players:** ${selectedTemplate!.maxPlayers === 1 ? "Just you + Host" : playerCount === 0 ? "GM decides (based on rules)" : `${playerCount + 1} (${playerCount} AI + you)`}\n` +
            `**Rules:** Standard ${selectedTemplate!.name} rules\n\n` +
            `**Important:** Once we start, these rules are locked and cannot be changed. This ensures fair gameplay.\n\n` +
            `Now, choose your guide for this adventure! Each host has a unique personality that will shape your experience. Once you've selected a host, say "create game" to begin!`
          );
        } else if (lowerInput.includes("modify") || lowerInput.includes("change") || lowerInput.includes("different")) {
          addGMMessage(
            "Of course! What would you like to modify? For example:\n" +
            "• Add or remove roles\n" +
            "• Change winning conditions\n" +
            "• Adjust game phases\n" +
            "• Add special abilities\n\n" +
            "Tell me what changes you have in mind!"
          );
        } else if (selectedTemplate?.id === "custom") {
          // For custom games, accumulate rules
          setCustomRules(prev => prev ? prev + "\n\n" + userInput : userInput);
          addGMMessage(
            "Great ideas! I'm noting that down. " +
            "Anything else you'd like to add to the rules? " +
            "Or shall I summarize what we have so far? (say 'summarize' or 'done')"
          );
        } else {
          // User is providing modifications
          setCustomRules(selectedTemplate!.defaultRules + "\n\nMODIFICATIONS:\n" + userInput);
          addGMMessage(
            "Got it! I've added your modifications to the rules. " +
            "Would you like to add anything else, or are we ready to finalize? " +
            "(say 'finalize' when ready)"
          );
        }
        
        if (lowerInput.includes("summarize") || lowerInput.includes("done") || lowerInput.includes("finalize")) {
          setConversationState("confirmation");
          setHideRolesInPlayerList(selectedTemplate!.hasHiddenRoles ?? false);
          const finalRules = customRules || selectedTemplate!.defaultRules;
          setShowHostSelector(true);
          addGMMessage(
            `Perfect! Here's your complete game setup:\n\n` +
            `**Game Type:** ${selectedTemplate!.name}\n` +
            `**Total Players:** ${selectedTemplate!.maxPlayers === 1 ? "Just you + Host" : playerCount === 0 ? "GM decides (based on rules)" : `${playerCount + 1} (${playerCount} AI + you)`}\n` +
            `**Rules:**\n${finalRules}\n\n` +
            `**⚠️ Important:** These rules are now locked and cannot be changed during gameplay.\n\n` +
            `Now, choose your guide for this adventure! Each host has a unique personality that will shape your experience. Once you've selected a host, say "create game" to begin!`
          );
        }
      } else if (conversationState === "confirmation") {
        if (lowerInput.includes("create") || lowerInput.includes("start") || 
            lowerInput.includes("begin") || lowerInput.includes("yes")) {
          // Create the game
          const finalRules = customRules || selectedTemplate!.defaultRules;
          const host = HOST_PERSONALITIES.find(h => h.id === selectedHostId) || getDefaultHost();
          saveLastSelectedHostId(selectedHostId); // Save user's choice
          onCreateGame({
            name: gameName || selectedTemplate!.name,
            template: selectedTemplate!.id,
            playerCount: playerCount,
            rules: finalRules,
            customRoles: selectedTemplate!.roles,
            hostId: selectedHostId!,
            hideRolesInPlayerList,
            ...(playerBoardLabel.trim() && { playerBoardLabel: playerBoardLabel.trim() }),
          });
          setConversationState("completed");
          addGMMessage(
            `🎉 Fantastic! ${host.name} will be your guide. Your game "${gameName || selectedTemplate!.name}" is being created...`
          );
          setTimeout(() => {
            onClose();
          }, 1500);
        } else if (lowerInput.includes("modify") || lowerInput.includes("change") || lowerInput.includes("back")) {
          setShowHostSelector(false);
          setConversationState("rules-discussion");
          addGMMessage(
            "No problem! What would you like to modify?\n" +
            "• Change player count?\n" +
            "• Adjust rules?\n" +
            "• Switch game type?\n\n" +
            "Let me know what you'd like to change."
          );
        } else {
          addGMMessage(
            "I'm ready when you are! Say 'create game' to begin, or 'modify' if you want to make changes."
          );
        }
      }
    }, 800 + Math.random() * 400);
  };

  const handleSend = () => {
    if (input.trim() && !isGMTyping) {
      addUserMessage(input.trim());
      simulateGMResponse(input.trim());
      setInput("");
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!isGMTyping) {
      addUserMessage(reply);
      simulateGMResponse(reply);
    }
  };

  const getQuickReplies = () => {
    if (conversationState === "greeting") {
      return ["Werewolf", "Undercover", "Custom Game"];
    } else if (conversationState === "player-count") {
      const min = selectedTemplate!.minPlayers - 1;
      const mid = Math.floor((selectedTemplate!.minPlayers + selectedTemplate!.maxPlayers) / 2) - 1;
      return ["You decide", `${min} players`, `${mid} players`];
    } else if (conversationState === "rules-discussion") {
      return ["Keep standard rules", "Modify rules"];
    } else if (conversationState === "confirmation") {
      return ["Create game", "Modify setup"];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[92vh] bg-zinc-900 text-white border-zinc-700 flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl">Game Master</DialogTitle>
              <DialogDescription className="text-zinc-400 text-base">
                Let's create your perfect game together
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0 px-8">
          <div className="py-6 space-y-8 max-w-5xl mx-auto">
            {/* Host Selector in Confirmation State */}
            {conversationState === "confirmation" && showHostSelector && (
              <div className="mb-8">
                <HostSelector
                  selectedHostId={selectedHostId}
                  onSelectHost={(hostId) => {
                    setSelectedHostId(hostId);
                    saveLastSelectedHostId(hostId); // Save immediately when selected
                  }}
                  templateId={selectedTemplate?.id}
                  gameRules={customRules || selectedTemplate?.defaultRules}
                  gameName={gameName || selectedTemplate?.name}
                />
                <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800">
                  <Checkbox
                    checked={hideRolesInPlayerList}
                    onCheckedChange={(v) => setHideRolesInPlayerList(v === true)}
                  />
                  <span>Hide roles in player list (only each player sees their own role)</span>
                </label>
                <div className="mt-4">
                  <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide font-medium">
                    Private panel name <span className="normal-case text-zinc-500 font-normal">(each player's secret info from Host)</span>
                  </label>
                  <input
                    id="player-board-label"
                    name="player-board-label"
                    type="text"
                    value={playerBoardLabel}
                    onChange={(e) => setPlayerBoardLabel(e.target.value)}
                    placeholder="My Board (default)"
                    maxLength={24}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-base sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                {/* Confirmation Buttons - Prominent Position */}
                <div className="mt-10 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowHostSelector(false);
                      const recommendedHost = selectedTemplate 
                        ? getDefaultHostForTemplate(selectedTemplate.id)
                        : getDefaultHost();
                      setSelectedHostId(recommendedHost.id);
                    }}
                    className="border-zinc-700 hover:bg-zinc-800 px-8 text-base h-12"
                  >
                    Use Recommended
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      saveLastSelectedHostId(selectedHostId); // Save user's choice
                      setConversationState("completed");
                      const host = HOST_PERSONALITIES.find(h => h.id === selectedHostId);
                      addGMMessage(
                        `🎉 Fantastic! ${host?.name} will be your guide.\n\n` +
                        `Your game is being created now. See you in the game room!`
                      );
                      
                      // Create the game after a short delay
                      setTimeout(() => {
                        onCreateGame({
                          name: gameName || selectedTemplate!.name,
                          template: selectedTemplate!.id,
                          playerCount: playerCount,
                          rules: customRules || selectedTemplate!.defaultRules,
                          customRoles: selectedTemplate!.roles,
                          hostId: selectedHostId!,
                          hideRolesInPlayerList,
                          ...(playerBoardLabel.trim() && { playerBoardLabel: playerBoardLabel.trim() }),
                        });
                        
                        // Reset state
                        setTimeout(() => {
                          setMessages([]);
                          setConversationState("greeting");
                          setSelectedTemplate(null);
                          setCustomRules("");
                          setGameName("");
                          const recommendedHost = getDefaultHostForTemplate(null);
                          setSelectedHostId(recommendedHost.id);
                          setShowHostSelector(false);
                          onClose();
                        }, 1500);
                      }, 1000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 px-10 text-base h-12 font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Create Game
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "gm"
                      ? "bg-gradient-to-br from-amber-500 to-orange-600"
                      : "bg-indigo-600"
                  }`}
                >
                  {message.role === "gm" ? (
                    <Sparkles className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-sm font-semibold text-white">YOU</span>
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-5 py-4 ${
                      message.role === "gm"
                        ? "bg-zinc-800 text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-base leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1.5 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isGMTyping && (
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="bg-zinc-800 rounded-2xl px-5 py-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        {getQuickReplies().length > 0 && !isGMTyping && conversationState !== "completed" && (
          <div className="px-8 py-3 max-w-5xl mx-auto w-full">
            <div className="flex flex-wrap gap-2">
              {getQuickReplies().map((reply) => (
                <Button
                  key={reply}
                  variant="outline"
                  onClick={() => handleQuickReply(reply)}
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-base px-4 py-2 h-auto"
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {conversationState !== "completed" && !showHostSelector && (
          <div className="p-8 pt-4 border-t border-zinc-800">
            <div className="flex gap-3 max-w-5xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-base h-12"
                disabled={isGMTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isGMTyping}
                size="icon"
                className="bg-indigo-600 hover:bg-indigo-500 h-12 w-12"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}