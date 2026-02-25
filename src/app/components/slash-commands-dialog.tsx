"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export interface SlashCommand {
  cmd: string;
  hint: string;
}

interface SlashCommandsDialogProps {
  open: boolean;
  onClose: () => void;
  commands: SlashCommand[];
  onSave: (commands: SlashCommand[]) => void;
  gameName?: string;
}

export function SlashCommandsDialog({
  open,
  onClose,
  commands,
  onSave,
  gameName,
}: SlashCommandsDialogProps) {
  const [items, setItems] = useState<SlashCommand[]>([]);

  useEffect(() => {
    if (open) setItems(commands.map(c => ({ ...c })));
  }, [open, commands]);

  const addRow = () => setItems(prev => [...prev, { cmd: "", hint: "" }]);

  const updateCmd = (i: number, val: string) => {
    // strip leading slashes so user doesn't double-add them
    const clean = val.replace(/^\/+/, "");
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, cmd: `/${clean}` } : item));
  };

  const updateHint = (i: number, val: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, hint: val } : item));
  };

  const removeRow = (i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    const valid = items.filter(c => c.cmd && c.cmd !== "/");
    onSave(valid);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Slash Commands</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {gameName ? `Custom commands for "${gameName}". ` : ""}
            These appear when a player types <span className="font-mono text-amber-400">/</span> in the chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {items.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">
              No commands yet. Add one below.
            </p>
          )}
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-zinc-600 shrink-0" />
              <div className="flex-1 flex gap-2">
                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-mono text-sm select-none pointer-events-none">/</span>
                  <Input
                    value={item.cmd.replace(/^\//, "")}
                    onChange={e => updateCmd(i, e.target.value)}
                    placeholder="command"
                    className="pl-6 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500/50 h-8 text-sm font-mono"
                    onKeyDown={e => e.key === " " && e.preventDefault()}
                  />
                </div>
                <Input
                  value={item.hint}
                  onChange={e => updateHint(i, e.target.value)}
                  placeholder="Short description…"
                  className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500/50 h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                onClick={() => removeRow(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 border border-dashed border-zinc-700 w-full"
          onClick={addRow}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Command
        </Button>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-500 text-white"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
