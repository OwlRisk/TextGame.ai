"use client";

import { useState } from "react";
import { Sword, Shield, Heart, Zap, Star, Package, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import type { Player } from "@/app/components/player-panel";
import { RARITY_COLORS } from "@/lib/rpg-types";

interface CharacterSheetProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterSheet({ player, isOpen, onClose }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "skills" | "equipment" | "inventory">("stats");

  if (!isOpen || player.hp === undefined) return null;

  const hpPercent = player.maxHp ? Math.round((player.hp / player.maxHp) * 100) : 0;
  const mpPercent = player.maxMp ? Math.round(((player.mp ?? 0) / player.maxMp) * 100) : 0;
  const xpPercent = player.xpToNext ? Math.round(((player.xp ?? 0) / player.xpToNext) * 100) : 0;

  const tabs = [
    { id: "stats" as const, label: "Stats", icon: Heart },
    { id: "skills" as const, label: "Skills", icon: Zap },
    { id: "equipment" as const, label: "Equip", icon: Shield },
    { id: "inventory" as const, label: "Items", icon: Package },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 border-l border-zinc-800">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{player.name}</span>
          {player.level !== undefined && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
              Lv.{player.level}
            </Badge>
          )}
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs p-1">✕</button>
      </div>

      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
              activeTab === tab.id
                ? "text-amber-400 border-b-2 border-amber-400 bg-amber-400/5"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {activeTab === "stats" && (
            <StatsTab player={player} hpPercent={hpPercent} mpPercent={mpPercent} xpPercent={xpPercent} />
          )}
          {activeTab === "skills" && <SkillsTab player={player} />}
          {activeTab === "equipment" && <EquipmentTab player={player} />}
          {activeTab === "inventory" && <InventoryTab player={player} />}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatsTab({ player, hpPercent, mpPercent, xpPercent }: { player: Player; hpPercent: number; mpPercent: number; xpPercent: number }) {
  return (
    <>
      {player.characterClass && (
        <div className="text-xs text-zinc-400">
          Class: <span className="text-zinc-200 font-medium">{player.characterClass}</span>
        </div>
      )}

      <div className="space-y-2">
        <StatBar label="HP" current={player.hp ?? 0} max={player.maxHp ?? 100} percent={hpPercent} color="green" icon="❤️" />
        {player.maxMp !== undefined && player.maxMp > 0 && (
          <StatBar label="MP" current={player.mp ?? 0} max={player.maxMp} percent={mpPercent} color="blue" icon="💎" />
        )}
        {player.xpToNext !== undefined && (
          <StatBar label="XP" current={player.xp ?? 0} max={player.xpToNext} percent={xpPercent} color="amber" icon="⭐" />
        )}
      </div>

      {player.gold !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span>💰</span>
          <span className="text-amber-300 font-semibold">{player.gold}</span>
          <span className="text-zinc-500">gold</span>
        </div>
      )}

      {player.attributes && (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Attributes</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(player.attributes).map(([attr, val]) => (
              <div key={attr} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 capitalize">{attr.slice(0, 3)}</span>
                <span className="text-zinc-200 font-mono">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StatBar({ label, current, max, percent, color, icon }: { label: string; current: number; max: number; percent: number; color: string; icon: string }) {
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  }[color] || "bg-zinc-500";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-400 flex items-center gap-1">
          <span className="text-xs">{icon}</span> {label}
        </span>
        <span className="text-zinc-300 font-mono tabular-nums">{current}/{max}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClasses}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SkillsTab({ player }: { player: Player }) {
  const skills = player.rpgSkills || player.skills?.map((s) => ({
    name: s.name, type: "utility" as const, cost: 0, cooldown: 0, currentCooldown: 0, description: `Level ${s.level}`,
  })) || [];

  if (skills.length === 0) {
    return <div className="text-xs text-zinc-500 text-center py-4">No skills learned yet</div>;
  }

  const typeColors: Record<string, string> = {
    attack: "text-red-400 bg-red-400/10 border-red-400/20",
    heal: "text-green-400 bg-green-400/10 border-green-400/20",
    buff: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    utility: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };

  return (
    <div className="space-y-1.5">
      {skills.map((skill, i) => (
        <div key={i} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-medium text-zinc-200">{skill.name}</span>
            <Badge className={`text-[9px] px-1 py-0 h-3.5 border ${typeColors[skill.type] || typeColors.utility}`}>
              {skill.type}
            </Badge>
          </div>
          <div className="text-[10px] text-zinc-500">{skill.description}</div>
          {skill.cost > 0 && (
            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
              <span>💎 {skill.cost} MP</span>
              {skill.cooldown > 0 && <span>⏱ {skill.cooldown}t CD</span>}
              {skill.currentCooldown > 0 && <span className="text-amber-400">({skill.currentCooldown}t left)</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EquipmentTab({ player }: { player: Player }) {
  const equipment = player.equipment || {};
  const slots = [
    { id: "weapon", label: "Weapon", icon: "⚔️" },
    { id: "armor", label: "Armor", icon: "🛡️" },
    { id: "accessory", label: "Accessory", icon: "💍" },
  ] as const;

  return (
    <div className="space-y-1.5">
      {slots.map((slot) => {
        const equipped = equipment[slot.id];
        return (
          <div key={slot.id} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">{slot.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase">{slot.label}</div>
                <div className="text-xs text-zinc-200 truncate">
                  {equipped || <span className="text-zinc-600 italic">Empty</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTab({ player }: { player: Player }) {
  const items = player.inventory || [];

  if (items.length === 0) {
    return <div className="text-xs text-zinc-500 text-center py-4">Inventory is empty</div>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/50 rounded border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
          <span className="text-sm">📦</span>
          <span className="text-xs text-zinc-200 truncate flex-1">{item}</span>
        </div>
      ))}
      <div className="text-[10px] text-zinc-600 text-center pt-1">{items.length} item{items.length !== 1 ? "s" : ""}</div>
    </div>
  );
}
