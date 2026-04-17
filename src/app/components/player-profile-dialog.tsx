"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { Player } from "@/types/player";
import type { RpgCharacter, RpgSkill, RpgItem } from "@/types/rpg";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { User, Sparkles, BookOpen, Sword, Shield, Wind, Clover, Heart, Zap, Star } from "lucide-react";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { t, getBrowserLanguage } from "@/lib/i18n";
import { getClassById } from "@/lib/rpg/classes";
import type { AvatarStyle } from "@/lib/avatar-style-constants";

interface PlayerProfileDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId?: string;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  humanGameIdentity?: { name: string } | null;
  isUserGameMaster?: boolean;
  avatarStyle?: AvatarStyle;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-zinc-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

export function PlayerProfileDialog({ player, open, onOpenChange, gameId, avatarImageUrls = {}, onAvatarUrlLoaded, humanGameIdentity, isUserGameMaster, avatarStyle }: PlayerProfileDialogProps) {
  const lang = getBrowserLanguage();
  const [activeTab, setActiveTab] = useState<"stats" | "skills" | "equip" | "bag">("stats");
  const { user } = useAuth();

  if (!player) return null;

  const isUser = !player.isAI;
  const useGameAvatarForHuman = isUser && !!gameId;
  const humanAvatarName = humanGameIdentity?.name?.trim() && humanGameIdentity.name !== "You" ? humanGameIdentity.name : "Player";
  const userAvatarUrl = getUserAvatarUrl(user);
  const rpg = player.rpg;
  const classDef = rpg ? getClassById(rpg.class) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md max-h-[85vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-zinc-400" />
            {player.name}
            {isUser && (
              <span className="text-xs font-normal text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
                {t("profile.you", lang)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {isUser ? t("profile.your_profile", lang) : `${player.name}`}
        </DialogDescription>

        <div className="space-y-4 pt-2">
          {/* Avatar + basic info */}
          <div className="flex items-center gap-4">
            {isUser && !useGameAvatarForHuman ? (
              <Avatar className="h-24 w-24 rounded-xl ring-2 ring-zinc-600">
                {userAvatarUrl ? <AvatarImage src={userAvatarUrl} alt={player.name} className="object-cover" /> : null}
                <AvatarFallback className="text-white text-lg" style={{ backgroundColor: player.avatar }}>
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : isUser && useGameAvatarForHuman ? (
              <GeneratedAvatar
                name={humanAvatarName}
                type="player"
                gameId={gameId}
                enabled={true}
                initialUrl={avatarImageUrls[avatarCacheKey(humanAvatarName, "player")]}
                onAvatarLoaded={onAvatarUrlLoaded}
                className="h-24 w-24 rounded-xl ring-2 ring-zinc-600"
                fallbackColor={player.avatar}
              />
            ) : (
              (() => {
                const avatarProps = getAvatarPropsForPlayer(player, avatarStyle);
                return (
                  <GeneratedAvatar
                    {...avatarProps}
                    gameId={gameId}
                    enabled={true}
                    initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name ?? player.name, avatarProps.type, undefined, avatarProps.gender)]}
                    onAvatarLoaded={onAvatarUrlLoaded}
                    className="h-24 w-24 rounded-xl ring-2 ring-zinc-600"
                    fallbackColor={player.avatar}
                  />
                );
              })()
            )}
            <div className="flex-1 min-w-0">
              {rpg && (() => {
                const className = lang.startsWith("zh") ? (classDef?.nameZh ?? classDef?.name ?? rpg.class) : (classDef?.name ?? rpg.class);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sword className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">Lv.{rpg.level} {className}</span>
                    </div>
                    {rpg.faction && (
                      <p className="text-xs text-zinc-400">{rpg.faction}</p>
                    )}
                    <StatBar label="HP" current={rpg.hp} max={rpg.maxHp} color="bg-red-500" bgColor="bg-red-900/40" icon={<Heart className="h-3 w-3 text-red-400" />} />
                    <StatBar label="MP" current={rpg.mp} max={rpg.maxMp} color="bg-blue-500" bgColor="bg-blue-900/40" icon={<Zap className="h-3 w-3 text-blue-400" />} />
                    <StatBar label="EXP" current={rpg.exp} max={rpg.expToNext} color="bg-amber-500" bgColor="bg-amber-900/40" icon={<Star className="h-3 w-3 text-amber-400" />} tiny />
                  </div>
                );
              })()}
              {player.role && !rpg && (isUser || isUserGameMaster || player.roleRevealed) && (
                <p className="text-sm font-medium text-zinc-300">{player.role}</p>
              )}
            </div>
          </div>

          {/* Status effects */}
          {rpg && rpg.statusEffects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rpg.statusEffects.map((eff) => (
                <Badge key={eff.id} className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {eff.icon || "✦"} {eff.name}{eff.turnsRemaining != null ? ` (${eff.turnsRemaining}t)` : ""}
                </Badge>
              ))}
            </div>
          )}

          {/* RPG detail tabs */}
          {rpg && (
            <div className="border-t border-zinc-700/80 pt-3">
              <div className="flex border-b border-zinc-700/30 mb-3">
                {(["stats", "skills", "equip", "bag"] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      activeTab === tab ? "text-violet-300 border-b-2 border-violet-400" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "stats" && t("rpg.tab_stats", lang)}
                    {tab === "skills" && `${t("rpg.tab_skills", lang)} (${rpg.skills.length})`}
                    {tab === "equip" && t("rpg.tab_equip", lang)}
                    {tab === "bag" && `${t("rpg.tab_bag", lang)} (${rpg.inventory.length})`}
                  </button>
                ))}
              </div>
              <div className="min-h-[80px]">
                {activeTab === "stats" && <StatsTab rpg={rpg} />}
                {activeTab === "skills" && <SkillsTab skills={rpg.skills} />}
                {activeTab === "equip" && <EquipTab rpg={rpg} />}
                {activeTab === "bag" && <BagTab items={rpg.inventory} />}
              </div>
            </div>
          )}

          {/* Personality / background for AI characters */}
          {!isUser && (player.personality || player.background) && (
            <div className="space-y-3 border-t border-zinc-700/80 pt-4">
              <p className="text-[11px] text-zinc-500 leading-snug">{t("profile.ai_content_note", lang)}</p>
              {player.personality && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 tracking-wide mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    {t("profile.personality", lang)}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{player.personality}</p>
                </div>
              )}
              {player.background && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 tracking-wide mb-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    {t("profile.background", lang)}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{player.background}</p>
                </div>
              )}
            </div>
          )}

          {isUser && !rpg && (
            <p className="text-sm text-zinc-500 italic">{t("profile.managed_in_settings", lang)}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────

function StatBar({ label, current, max, color, bgColor, icon, tiny }: {
  label: string; current: number; max: number; color: string; bgColor: string; icon: React.ReactNode; tiny?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className={`flex items-center gap-1.5 ${tiny ? "" : "mb-0.5"}`}>
      {icon}
      <div className={`flex-1 ${tiny ? "h-1.5" : "h-2"} rounded-full ${bgColor} overflow-hidden`}>
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`${tiny ? "text-[9px] w-12" : "text-[10px] w-14"} text-right text-zinc-400 tabular-nums`}>
        {current}/{max}
      </span>
    </div>
  );
}

function StatsTab({ rpg }: { rpg: RpgCharacter }) {
  const stats = [
    { label: "ATK", value: rpg.attack, icon: <Sword className="h-3.5 w-3.5 text-red-400" />, color: "text-red-300" },
    { label: "DEF", value: rpg.defense, icon: <Shield className="h-3.5 w-3.5 text-blue-400" />, color: "text-blue-300" },
    { label: "SPD", value: rpg.speed, icon: <Wind className="h-3.5 w-3.5 text-green-400" />, color: "text-green-300" },
    { label: "LUK", value: rpg.luck, icon: <Clover className="h-3.5 w-3.5 text-amber-400" />, color: "text-amber-300" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2">
          {s.icon}
          <span className="text-xs text-zinc-400">{s.label}</span>
          <span className={`text-sm font-bold ml-auto ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function SkillsTab({ skills }: { skills: RpgSkill[] }) {
  const lang = getBrowserLanguage();
  if (skills.length === 0) return <p className="text-xs text-zinc-500 text-center py-4">{t("rpg.no_skills", lang)}</p>;
  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <div key={skill.id} className="bg-zinc-800/60 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{skill.name}</span>
            <div className="flex items-center gap-1.5">
              {skill.mpCost != null && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {skill.mpCost} MP
                </Badge>
              )}
              {skill.damage != null && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-500/20 text-red-300 border-red-500/30">
                  {skill.damage} DMG
                </Badge>
              )}
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{skill.description}</p>
        </div>
      ))}
    </div>
  );
}

function EquipTab({ rpg }: { rpg: RpgCharacter }) {
  const lang = getBrowserLanguage();
  const slots = [
    { label: t("rpg.slot_weapon", lang), item: rpg.equipment.weapon },
    { label: t("rpg.slot_armor", lang), item: rpg.equipment.armor },
    { label: t("rpg.slot_accessory", lang), item: rpg.equipment.accessory },
  ];
  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div key={slot.label} className="bg-zinc-800/60 rounded-lg px-3 py-2">
          <span className="text-[10px] text-zinc-500">{slot.label}</span>
          {slot.item ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base">{slot.item.icon || "📦"}</span>
              <span className={`text-sm font-medium ${RARITY_COLORS[slot.item.rarity] || "text-white"}`}>
                {slot.item.name}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-600 mt-0.5">{t("rpg.slot_empty", lang)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function BagTab({ items }: { items: RpgItem[] }) {
  const lang = getBrowserLanguage();
  if (items.length === 0) return <p className="text-xs text-zinc-500 text-center py-4">{t("rpg.bag_empty", lang)}</p>;
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2">
          <span className="text-base">{item.icon || "📦"}</span>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium ${RARITY_COLORS[item.rarity] || "text-white"}`}>
              {item.name}
            </span>
            {item.quantity > 1 && <span className="text-[10px] text-zinc-500 ml-1">×{item.quantity}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
