"use client";

import { Sword, Shield, Zap, Package, ArrowRight, Wind } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { CombatEnemy } from "@/lib/rpg-mechanics";

interface CombatUIProps {
  enemy: CombatEnemy | null;
  enemyName: string;
  inCombat: boolean;
  onAction: (action: string) => void;
  playerSkills?: Array<{ name: string; type: string; cost: number; currentCooldown: number }>;
  playerInventory?: string[];
}

export function CombatUI({ enemy, enemyName, inCombat, onAction, playerSkills = [], playerInventory = [] }: CombatUIProps) {
  if (!inCombat) return null;

  const usableSkills = playerSkills.filter((s) => s.currentCooldown === 0 && (s.type === "attack" || s.type === "heal" || s.type === "buff"));
  const consumables = playerInventory.filter((item) =>
    /potion|herb|bandage|food|stim|kit|med/i.test(item)
  );

  return (
    <div className="border-t border-red-900/50 bg-gradient-to-t from-red-950/30 to-transparent">
      {enemy && (
        <div className="px-3 py-2 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">👹</span>
              <span className="text-xs font-semibold text-red-300">{enemy.name}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              ATK:{enemy.attack} DEF:{enemy.defense}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-red-500"
                style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-red-400 font-mono tabular-nums">
              {enemy.hp}/{enemy.maxHp}
            </span>
          </div>
        </div>
      )}

      <div className="px-3 py-2 flex flex-wrap gap-1.5">
        <CombatButton icon={Sword} label="Attack" color="red" onClick={() => onAction("I attack the enemy with my weapon")} />

        {usableSkills.length > 0 && usableSkills.slice(0, 3).map((skill) => (
          <CombatButton
            key={skill.name}
            icon={Zap}
            label={skill.name}
            color="blue"
            subtitle={`${skill.cost}MP`}
            onClick={() => onAction(`I use ${skill.name}`)}
          />
        ))}

        {consumables.length > 0 && (
          <CombatButton icon={Package} label={consumables[0]} color="green" onClick={() => onAction(`I use ${consumables[0]}`)} />
        )}

        <CombatButton icon={Shield} label="Defend" color="amber" onClick={() => onAction("I take a defensive stance")} />
        <CombatButton icon={Wind} label="Flee" color="zinc" onClick={() => onAction("I try to flee from combat")} />
      </div>
    </div>
  );
}

function CombatButton({ icon: Icon, label, color, subtitle, onClick }: {
  icon: typeof Sword;
  label: string;
  color: string;
  subtitle?: string;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    red: "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25",
    green: "bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25",
    zinc: "bg-zinc-700/50 text-zinc-300 border-zinc-600/30 hover:bg-zinc-600/50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${colorClasses[color] || colorClasses.zinc}`}
    >
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[80px]">{label}</span>
      {subtitle && <span className="text-[9px] opacity-70">{subtitle}</span>}
    </button>
  );
}
