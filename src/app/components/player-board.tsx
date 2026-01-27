import { X, User, Heart, Zap, Shield, Sword, Package, Sparkles, Plus, Minus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";

export interface PlayerAttribute {
  id: string;
  name: string;
  value: number;
  maxValue?: number;
  icon?: string;
  color?: string;
}

export interface PlayerItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  quantity?: number;
}

export interface PlayerStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration?: string;
  type: "buff" | "debuff" | "neutral";
}

export interface PlayerBoardData {
  characterName: string;
  characterClass?: string;
  level?: number;
  avatar: string;
  attributes: PlayerAttribute[];
  items: PlayerItem[];
  statusEffects: PlayerStatus[];
}

interface PlayerBoardProps {
  data: PlayerBoardData;
  onClose: () => void;
  isEditable?: boolean;
}

const rarityColors = {
  common: "bg-zinc-600 text-zinc-100",
  uncommon: "bg-green-600 text-green-100",
  rare: "bg-blue-600 text-blue-100",
  epic: "bg-purple-600 text-purple-100",
  legendary: "bg-amber-600 text-amber-100",
};

const attributeIcons: Record<string, JSX.Element> = {
  health: <Heart className="h-4 w-4" />,
  mana: <Zap className="h-4 w-4" />,
  defense: <Shield className="h-4 w-4" />,
  attack: <Sword className="h-4 w-4" />,
};

export function PlayerBoard({ data, onClose, isEditable = false }: PlayerBoardProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            {data.characterName === "You" ? (
              <Avatar className="h-16 w-16">
                <AvatarFallback
                  className="text-white"
                  style={{ backgroundColor: data.avatar }}
                >
                  <User className="h-8 w-8 text-white" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <GeneratedAvatar
                name={data.characterName}
                type="player"
                background={`Game character. Role: ${data.characterClass ?? "Player"}.`}
                className="h-16 w-16"
                fallbackColor={data.avatar}
                fallback={<User className="h-8 w-8 text-white" />}
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{data.characterName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {data.characterClass && (
                  <span className="text-sm text-zinc-400">{data.characterClass}</span>
                )}
                {data.level && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-sm text-zinc-400">Level {data.level}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Attributes Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  Attributes
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="bg-zinc-800 rounded-lg p-4 border border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`text-${attr.color || 'blue'}-400`}>
                          {attributeIcons[attr.id.toLowerCase()] || <Sparkles className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-white">{attr.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {attr.value}
                          {attr.maxValue && <span className="text-zinc-500">/{attr.maxValue}</span>}
                        </span>
                        {attr.maxValue && (
                          <span className="text-sm text-zinc-400 tabular-nums">
                            ({Math.round((attr.value / attr.maxValue) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Status Effects Section */}
            {data.statusEffects.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Status Effects
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {data.statusEffects.map((status) => (
                    <div
                      key={status.id}
                      className={`bg-zinc-800 rounded-lg p-4 border ${
                        status.type === "buff"
                          ? "border-green-600/50 bg-green-950/20"
                          : status.type === "debuff"
                          ? "border-red-600/50 bg-red-950/20"
                          : "border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{status.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white">{status.name}</h4>
                            {status.duration && (
                              <Badge
                                variant="outline"
                                className="border-zinc-600 text-zinc-300"
                              >
                                {status.duration}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{status.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inventory Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-400" />
                  Inventory
                  <Badge variant="outline" className="border-zinc-600 text-zinc-300 ml-2">
                    {data.items.length} items
                  </Badge>
                </h3>
              </div>
              {data.items.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{item.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{item.name}</h4>
                            {item.rarity && (
                              <Badge className={rarityColors[item.rarity]}>
                                {item.rarity}
                              </Badge>
                            )}
                            {item.quantity && item.quantity > 1 && (
                              <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                                x{item.quantity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-800 rounded-lg p-8 border border-zinc-700 text-center">
                  <Package className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No items in inventory</p>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
