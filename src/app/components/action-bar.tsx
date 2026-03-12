"use client";

import { Eye, Footprints, Package, Bed, Sword, Zap, Shield, Wind, MessageCircle, ShoppingBag, GraduationCap, DoorOpen } from "lucide-react";

type ActionMode = "exploration" | "combat" | "npc" | "shop";

interface ActionBarProps {
  mode: ActionMode;
  onAction: (message: string) => void;
  disabled?: boolean;
  connectedRooms?: Array<{ name: string; roomType: string }>;
}

interface ActionButton {
  icon: typeof Eye;
  label: string;
  message: string;
  color: string;
}

const EXPLORATION_ACTIONS: ActionButton[] = [
  { icon: Eye, label: "Look around", message: "I look around and examine my surroundings", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 hover:bg-cyan-400/20" },
  { icon: Package, label: "Check inventory", message: "I check my inventory and equipment", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" },
  { icon: Bed, label: "Rest", message: "I suggest we rest here to recover", color: "text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20" },
];

const COMBAT_ACTIONS: ActionButton[] = [
  { icon: Sword, label: "Attack", message: "I attack the enemy with my weapon", color: "text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20" },
  { icon: Zap, label: "Use skill", message: "I want to use a skill", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20" },
  { icon: Shield, label: "Defend", message: "I take a defensive stance", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" },
  { icon: Wind, label: "Flee", message: "I try to flee from combat", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20 hover:bg-zinc-400/20" },
];

const NPC_ACTIONS: ActionButton[] = [
  { icon: MessageCircle, label: "Ask about quest", message: "Do you have any quests or tasks for us?", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" },
  { icon: ShoppingBag, label: "Trade", message: "I'd like to see what you have for trade", color: "text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20" },
  { icon: GraduationCap, label: "Learn", message: "Can you teach me anything useful?", color: "text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20" },
  { icon: DoorOpen, label: "Leave", message: "Thank you, we'll be on our way", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20 hover:bg-zinc-400/20" },
];

const SHOP_ACTIONS: ActionButton[] = [
  { icon: ShoppingBag, label: "Browse", message: "Show me what you have for sale", color: "text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20" },
  { icon: Package, label: "Sell", message: "I'd like to sell some items", color: "text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20" },
  { icon: DoorOpen, label: "Leave shop", message: "I'm done shopping, let's move on", color: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20 hover:bg-zinc-400/20" },
];

export function ActionBar({ mode, onAction, disabled, connectedRooms }: ActionBarProps) {
  const actions: ActionButton[] = {
    exploration: EXPLORATION_ACTIONS,
    combat: COMBAT_ACTIONS,
    npc: NPC_ACTIONS,
    shop: SHOP_ACTIONS,
  }[mode];

  const moveActions: ActionButton[] = mode === "exploration" && connectedRooms
    ? connectedRooms.slice(0, 4).map((room) => ({
        icon: Footprints,
        label: room.name.length > 12 ? room.name.slice(0, 12) + "…" : room.name,
        message: `Let's travel to ${room.name}`,
        color: "text-purple-400 bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/20",
      }))
    : [];

  return (
    <div className="flex flex-wrap gap-1 px-3 py-1.5 border-t border-zinc-800/50 bg-zinc-900/50">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => !disabled && onAction(action.message)}
          disabled={disabled}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${action.color}`}
        >
          <action.icon className="h-3 w-3" />
          {action.label}
        </button>
      ))}
      {moveActions.length > 0 && (
        <>
          <div className="w-px h-5 bg-zinc-700 self-center mx-0.5" />
          {moveActions.map((action) => (
            <button
              key={action.label}
              onClick={() => !disabled && onAction(action.message)}
              disabled={disabled}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${action.color}`}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
