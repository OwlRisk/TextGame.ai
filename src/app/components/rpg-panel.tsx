"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { Heart, Zap, Sword, Shield, Wind, Clover, ChevronDown, ChevronUp, Swords, BookOpen, Package, Star, User } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import type { Player } from "@/types/player";
import type { RpgCharacter, RpgSkill, RpgItem, StatusEffect } from "@/types/rpg";
import type { MudRoom } from "@/lib/gm-state";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { getClassById } from "@/lib/rpg/classes";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { t, getBrowserLanguage } from "@/lib/i18n";
import type { AvatarStyle } from "@/lib/avatar-style-constants";

interface RpgPanelProps {
  players: Player[];
  currentSpeakerId?: string | null;
  currentUserId?: string;
  gameId?: string;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  avatarStyle?: AvatarStyle;
  onPlayerClick?: (player: Player) => void;
  currentRoom?: MudRoom | null;
  onNavigate?: (direction: string) => void;
}

export function RpgPanel({
  players,
  currentSpeakerId,
  currentUserId,
  gameId,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  avatarStyle,
  onPlayerClick,
  currentRoom,
  onNavigate,
}: RpgPanelProps) {
  const lang = getBrowserLanguage();
  const partyMembers = useMemo(() => players.filter((p) => !p.isGameMaster), [players]);

  return (
    <div className="w-80 flex-shrink-0 bg-gradient-to-b from-zinc-900/95 via-[#120820]/95 to-zinc-900/95 flex flex-col border-l border-violet-900/20 h-full overflow-hidden backdrop-blur-sm">
      <div className="h-14 px-5 flex items-center justify-between border-b border-violet-900/20 bg-zinc-900/40 backdrop-blur-md">
        <div className="flex items-center gap-2 text-zinc-300">
          <Swords className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">{t("rpg.party", lang)}</span>
          <span className="text-xs text-zinc-500">· {t("rpg.party_count", lang).replace("{n}", String(partyMembers.length))}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-2">
          {currentRoom && (
            <RoomCard room={currentRoom} onNavigate={onNavigate} />
          )}
          {partyMembers.map((player) => (
            <RpgPlayerCard
              key={player.id}
              player={player}
              isSpeaking={currentSpeakerId === player.id}
              isCurrentUser={player.id === currentUserId}
              gameId={gameId}
              avatarImageUrls={avatarImageUrls}
              onAvatarUrlLoaded={onAvatarUrlLoaded}
              avatarStyle={avatarStyle}
              onPlayerClick={onPlayerClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-zinc-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const RpgPlayerCard = memo(function RpgPlayerCard({
  player,
  isSpeaking,
  isCurrentUser,
  gameId,
  avatarImageUrls = {},
  onAvatarUrlLoaded,
  avatarStyle,
  onPlayerClick,
}: {
  player: Player;
  isSpeaking: boolean;
  isCurrentUser: boolean;
  gameId?: string;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  avatarStyle?: AvatarStyle;
  onPlayerClick?: (player: Player) => void;
}) {
  const lang = getBrowserLanguage();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "skills" | "equip" | "bag">("stats");
  const rpg = player.rpg;
  const classDef = rpg ? getClassById(rpg.class) : undefined;
  const avatarProps = player.isAI ? getAvatarPropsForPlayer(player, avatarStyle) : null;
  const { user } = useAuth();
  const userAvatarUrl = !player.isAI ? getUserAvatarUrl(user) : undefined;

  return (
    <div
      className={`rounded-lg transition-all duration-200 overflow-hidden ${
        isSpeaking
          ? "bg-green-600/15 ring-1 ring-green-600/40"
          : "bg-zinc-800/40 hover:bg-zinc-800/60"
      }`}
    >
      {/* Compact header */}
      <button
        className="w-full p-2.5 flex items-start gap-2.5 text-left"
        onClick={() => onPlayerClick ? onPlayerClick(player) : rpg && setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {player.isAI && avatarProps ? (
            <GeneratedAvatar
              {...avatarProps}
              gameId={gameId}
              enabled={true}
              className={`h-10 w-10 shadow-md ${isSpeaking ? "ring-2 ring-green-500/50" : ""}`}
              fallbackColor={player.avatar}
              initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name ?? player.name, avatarProps.type, undefined, avatarProps.gender)]}
              onAvatarLoaded={onAvatarUrlLoaded}
            />
          ) : (
            <Avatar className={`h-10 w-10 shadow-md ${isSpeaking ? "ring-2 ring-green-500/50" : ""}`}>
              {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={player.name} className="object-cover" />}
              <AvatarFallback className="text-sm font-semibold text-white" style={{ backgroundColor: player.avatar }}>
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-sm font-semibold truncate ${isCurrentUser ? "text-blue-200" : "text-white"}`}>
              {player.name}
            </span>
            {isCurrentUser && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px] px-1.5 py-0 h-4 font-bold">
                YOU
              </Badge>
            )}
          </div>

          {rpg ? (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] text-amber-400 font-medium">
                  Lv.{rpg.level} {lang.startsWith("zh") ? (classDef?.nameZh ?? classDef?.name ?? rpg.class) : (classDef?.name ?? rpg.class)}
                </span>
                {rpg.faction && (
                  <span className="text-[10px] text-zinc-500">· {rpg.faction}</span>
                )}
              </div>
              {/* HP Bar */}
              <StatBar label="HP" current={rpg.hp} max={rpg.maxHp} color="bg-red-500" bgColor="bg-red-900/40" icon={<Heart className="h-3 w-3 text-red-400" />} />
              {/* MP Bar */}
              <StatBar label="MP" current={rpg.mp} max={rpg.maxMp} color="bg-blue-500" bgColor="bg-blue-900/40" icon={<Zap className="h-3 w-3 text-blue-400" />} />
              {/* EXP Bar */}
              <StatBar label="EXP" current={rpg.exp} max={rpg.expToNext} color="bg-amber-500" bgColor="bg-amber-900/40" icon={<Star className="h-3 w-3 text-amber-400" />} tiny />
            </>
          ) : (
            <span className="text-xs text-zinc-500">{t("rpg.no_data", lang)}</span>
          )}
        </div>

        {rpg && (
          <div className="flex-shrink-0 text-zinc-500 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}
      </button>

      {/* Status effects (always visible if any) */}
      {rpg && rpg.statusEffects.length > 0 && (
        <div className="px-2.5 pb-1.5 flex flex-wrap gap-1">
          {rpg.statusEffects.map((eff) => (
            <Badge key={eff.id} className="text-[9px] px-1.5 py-0 h-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
              {eff.icon || "✦"} {eff.name}{eff.turnsRemaining != null ? ` (${eff.turnsRemaining}t)` : ""}
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded detail tabs */}
      {rpg && expanded && (
        <div className="border-t border-zinc-700/50">
          <div className="flex border-b border-zinc-700/30">
            {(["stats", "skills", "equip", "bag"] as const).map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
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
          <div className="p-2.5 max-h-48 overflow-y-auto">
            {activeTab === "stats" && <StatsTab rpg={rpg} />}
            {activeTab === "skills" && <SkillsTab skills={rpg.skills} />}
            {activeTab === "equip" && <EquipTab rpg={rpg} />}
            {activeTab === "bag" && <BagTab items={rpg.inventory} />}
          </div>
        </div>
      )}
    </div>
  );
});

function RoomCard({ room, onNavigate }: { room: MudRoom; onNavigate?: (direction: string) => void }) {
  const lang = getBrowserLanguage();
  const visibleExits = room.exits.filter(e => !e.hidden);
  return (
    <div className="rounded-lg bg-gradient-to-b from-emerald-950/40 to-zinc-800/40 border border-emerald-900/30 overflow-hidden">
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs">📍</span>
          <span className="text-sm font-bold text-emerald-200 truncate">{room.name}</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{room.description}</p>
      </div>

      {visibleExits.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {visibleExits.map((exit) => (
            <button
              key={exit.direction}
              className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                exit.locked
                  ? "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/60 cursor-pointer"
              }`}
              disabled={exit.locked}
              onClick={() => !exit.locked && onNavigate?.(exit.label ? `Go ${exit.direction} to ${exit.label}` : `Go ${exit.direction}`)}
              title={exit.locked ? "Locked" : exit.label || exit.roomId}
            >
              {exit.locked ? "🔒 " : ""}{exit.direction}{exit.label ? ` → ${exit.label}` : ""}
            </button>
          ))}
        </div>
      )}

      {room.npcs.length > 0 && (
        <div className="px-3 pb-2 border-t border-zinc-700/30 pt-1.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{lang.startsWith("zh") ? "NPC" : "NPCs"}</span>
          <div className="mt-1 space-y-0.5">
            {room.npcs.map((npc) => (
              <div key={npc.id} className="flex items-center gap-1.5">
                <span className="text-[10px]">
                  {npc.attitude === "hostile" ? "⚔️" : npc.attitude === "friendly" ? "💬" : "👤"}
                </span>
                <span className={`text-[11px] font-medium ${
                  npc.attitude === "hostile" ? "text-red-300" : npc.attitude === "friendly" ? "text-green-300" : "text-zinc-300"
                }`}>
                  {npc.name}
                </span>
                {npc.description && (
                  <span className="text-[10px] text-zinc-500 truncate flex-1">{npc.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {room.items.length > 0 && (
        <div className="px-3 pb-2 border-t border-zinc-700/30 pt-1.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">{lang.startsWith("zh") ? "物品" : "Items"}</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {room.items.map((item) => (
              <span key={item.id} className="text-[10px] bg-amber-900/30 text-amber-300 px-1.5 py-0.5 rounded">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, current, max, color, bgColor, icon, tiny }: {
  label: string; current: number; max: number; color: string; bgColor: string; icon: React.ReactNode; tiny?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className={`flex items-center gap-1.5 ${tiny ? "mb-0.5" : "mb-1"}`}>
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
    { label: "ATK", value: rpg.attack, icon: <Sword className="h-3 w-3 text-red-400" />, color: "text-red-300" },
    { label: "DEF", value: rpg.defense, icon: <Shield className="h-3 w-3 text-blue-400" />, color: "text-blue-300" },
    { label: "SPD", value: rpg.speed, icon: <Wind className="h-3 w-3 text-green-400" />, color: "text-green-300" },
    { label: "LUK", value: rpg.luck, icon: <Clover className="h-3 w-3 text-amber-400" />, color: "text-amber-300" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 bg-zinc-800/60 rounded px-2 py-1.5">
          {s.icon}
          <span className="text-[10px] text-zinc-400">{s.label}</span>
          <span className={`text-xs font-bold ml-auto ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function SkillsTab({ skills }: { skills: RpgSkill[] }) {
  const lang = getBrowserLanguage();
  if (skills.length === 0) return <p className="text-xs text-zinc-500 text-center py-2">{t("rpg.no_skills", lang)}</p>;
  return (
    <div className="space-y-1.5">
      {skills.map((skill) => (
        <div key={skill.id} className="bg-zinc-800/60 rounded px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">{skill.name}</span>
            <div className="flex items-center gap-1">
              {skill.mpCost != null && (
                <Badge className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {skill.mpCost} MP
                </Badge>
              )}
              {skill.damage != null && (
                <Badge className="text-[9px] px-1 py-0 h-3.5 bg-red-500/20 text-red-300 border-red-500/30">
                  {skill.damage} DMG
                </Badge>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">{skill.description}</p>
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
    <div className="space-y-1.5">
      {slots.map((slot) => (
        <div key={slot.label} className="bg-zinc-800/60 rounded px-2 py-1.5">
          <span className="text-[10px] text-zinc-500">{slot.label}</span>
          {slot.item ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm">{slot.item.icon || "📦"}</span>
              <span className={`text-xs font-medium ${RARITY_COLORS[slot.item.rarity] || "text-white"}`}>
                {slot.item.name}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-600 mt-0.5">{t("rpg.slot_empty", lang)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function BagTab({ items }: { items: RpgItem[] }) {
  const lang = getBrowserLanguage();
  if (items.length === 0) return <p className="text-xs text-zinc-500 text-center py-2">{t("rpg.bag_empty", lang)}</p>;
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 bg-zinc-800/60 rounded px-2 py-1.5">
          <span className="text-sm">{item.icon || "📦"}</span>
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-medium ${RARITY_COLORS[item.rarity] || "text-white"}`}>
              {item.name}
            </span>
            {item.quantity > 1 && <span className="text-[10px] text-zinc-500 ml-1">×{item.quantity}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
