"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { FileText, Trash2, Clock, Edit, Play, Archive } from "lucide-react";
import { GameConfig } from "@/app/components/game-setup-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { useAuth } from "@/app/contexts/AuthContext";
import { getDrafts, createDraft, deleteDraft } from "@/lib/db";

export interface GameDraft {
  id: string;
  config: GameConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface DraftsPageProps {
  onEditDraft: (draft: GameDraft) => void;
  onCreateFromDraft: (config: GameConfig) => void;
}

function rowToDraft(row: { id: string; config: unknown; created_at: string; updated_at: string }): GameDraft {
  return {
    id: row.id,
    config: row.config as GameConfig,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function DraftsPage({ onEditDraft, onCreateFromDraft }: DraftsPageProps) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<GameDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const loadDrafts = useCallback(() => {
    if (user?.id) {
      setLoading(true);
      getDrafts(user.id).then(({ data, error }) => {
        if (error) {
          setDrafts([]);
          return;
        }
        setDrafts((data ?? []).map(rowToDraft));
      }).finally(() => setLoading(false));
    } else {
      try {
        const savedDrafts = localStorage.getItem("gameDrafts");
        if (savedDrafts) {
          const parsed = JSON.parse(savedDrafts);
          setDrafts(parsed.map((draft: any) => ({
            ...draft,
            createdAt: new Date(draft.createdAt),
            updatedAt: new Date(draft.updatedAt),
          })));
        } else {
          setDrafts([]);
        }
      } catch {
        setDrafts([]);
      }
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleDeleteDraft = (id: string) => {
    setDraftToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!draftToDelete) {
      setDeleteDialogOpen(false);
      return;
    }
    const id = draftToDelete;
    setDraftToDelete(null);
    setDeleteDialogOpen(false);

    setDrafts((prev) => prev.filter((d) => d.id !== id));

    if (user?.id) {
      deleteDraft(id, user.id).catch((e) => {
        console.error("Failed to delete draft from DB", e);
        loadDrafts();
      });
    }
    try {
      const fromStorage = localStorage.getItem("gameDrafts");
      if (fromStorage) {
        const parsed = JSON.parse(fromStorage);
        const updated = parsed.filter((d: GameDraft) => d.id !== id);
        localStorage.setItem("gameDrafts", JSON.stringify(updated));
      }
    } catch (_) {}
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 bg-black overflow-y-auto relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-10 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
              <Archive className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white">Drafts</h1>
              <p className="text-zinc-400 text-lg mt-2">Continue working on your saved game configurations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-sm px-3 py-1">
              {drafts.length} {drafts.length === 1 ? "Draft" : "Drafts"}
            </Badge>
          </div>
        </div>

        {/* Drafts Grid */}
        {loading ? (
          <div className="text-center py-24 text-zinc-500">Loading drafts…</div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-24">
            <div className="mb-6">
              <FileText className="h-24 w-24 text-zinc-700 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No drafts yet</h3>
            <p className="text-zinc-500 text-lg mb-8">
              Start creating a game and save it as a draft to continue later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .map((draft) => (
                <Card
                  key={draft.id}
                  className="bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Gradient Accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2 line-clamp-1">
                          {draft.config.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              draft.config.template === "werewolf"
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                                : draft.config.template === "undercover"
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                                : "bg-pink-500/10 border-pink-500/30 text-pink-300"
                            }`}
                          >
                            {draft.config.template === "werewolf"
                              ? "🐺 Werewolf"
                              : draft.config.template === "undercover"
                              ? "🕵️ Undercover"
                              : "🎮 Custom"}
                          </Badge>
                          <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 text-xs">
                            {draft.config.playerCount} players
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardDescription className="text-zinc-400 text-sm line-clamp-3 min-h-[60px]">
                      {draft.config.rules.slice(0, 150)}
                      {draft.config.rules.length > 150 ? "..." : ""}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Updated {formatDate(draft.updatedAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onEditDraft(draft)}
                        className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white transition-all group-hover:scale-[1.02]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Continue
                      </Button>
                      <Button
                        onClick={() => onCreateFromDraft(draft.config)}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(draft.id)}
                        variant="outline"
                        className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/30 text-white hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-white border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete this draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
