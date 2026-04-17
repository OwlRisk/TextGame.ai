"use client";

import { useState } from "react";
import { GameSidebar } from "@/app/components/game-sidebar";
import { Sheet, SheetContent } from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Menu } from "lucide-react";

interface Game {
  id: string;
  name: string;
  icon: string;
  color: string;
  config?: { rules?: string; template?: string };
  publishedAt?: string | null;
}

interface AppLayoutWithSidebarProps {
  /** Mobile top bar title */
  mobileTitle?: string;
  /** When child page has its own mobile top bar (e.g. game room), hide this one to avoid duplication */
  hideMobileHeader?: boolean;
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onOpenProfile?: () => void;
  onUpdateGame?: (gameId: string, updates: Partial<Pick<Game, "icon" | "color" | "publishedAt">>) => void;
  children: React.ReactNode;
}

export function AppLayoutWithSidebar({
  mobileTitle = "Menu",
  hideMobileHeader = false,
  games,
  selectedGameId,
  onSelectGame,
  onOpenProfile,
  onUpdateGame,
  children,
}: AppLayoutWithSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarProps = {
    games,
    selectedGameId,
    onSelectGame,
    onOpenProfile,
    onUpdateGame,
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row bg-zinc-900 text-white overflow-hidden">
      <header className={`${hideMobileHeader ? "hidden" : "md:hidden"} flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg min-w-[44px] min-h-[44px]"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 ml-2 truncate flex-1">{mobileTitle}</span>
      </header>
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="hidden md:flex flex-shrink-0 z-10">
          <GameSidebar {...sidebarProps} />
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            title={mobileTitle}
            className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950"
          >
            <GameSidebar {...sidebarProps} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
      </div>
    </div>
  );
}
