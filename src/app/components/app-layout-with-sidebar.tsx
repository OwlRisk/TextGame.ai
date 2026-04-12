"use client";

import { useState, useCallback } from "react";
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
  onUpdateGame?: (gameId: string, updates: Partial<Pick<Game, "icon" | "color">>) => void;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarProps = {
    games,
    selectedGameId,
    onSelectGame,
    onOpenProfile,
    onUpdateGame,
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-900 text-white overflow-hidden">
      <header className={`${hideMobileHeader ? "hidden" : "md:hidden"} flex-shrink-0 h-12 px-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg min-w-[44px] min-h-[44px]"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5 text-zinc-300" />
        </Button>
        <span className="text-sm font-medium text-zinc-300 ml-2 truncate flex-1">{mobileTitle}</span>
      </header>
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop toggle — thin strip on the left edge */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex flex-shrink-0 w-5 h-full items-center justify-center bg-zinc-950/60 hover:bg-violet-900/30 border-r border-violet-900/20 transition-colors group cursor-pointer"
          aria-label="Open sidebar"
        >
          <div className="flex flex-col gap-[3px] opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="block w-3 h-[2px] rounded-full bg-zinc-400 group-hover:bg-violet-400 transition-colors" />
            <span className="block w-3 h-[2px] rounded-full bg-zinc-400 group-hover:bg-violet-400 transition-colors" />
            <span className="block w-3 h-[2px] rounded-full bg-zinc-400 group-hover:bg-violet-400 transition-colors" />
          </div>
        </button>

        {/* Sidebar drawer (both mobile and desktop) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            title={mobileTitle}
            className="w-[5rem] max-w-[5rem] p-0 border-r border-violet-900/20 bg-gradient-to-b from-zinc-950 via-[#0a0510] to-zinc-950"
          >
            <GameSidebar {...sidebarProps} onNavigate={closeSidebar} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
      </div>
    </div>
  );
}
