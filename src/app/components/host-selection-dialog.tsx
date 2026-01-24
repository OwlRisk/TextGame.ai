import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { HostSelector } from "@/app/components/host-selector";
import { useState } from "react";

interface HostSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectHost: (hostId: string) => void;
}

export function HostSelectionDialog({ open, onClose, onSelectHost }: HostSelectionDialogProps) {
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedHostId) {
      onSelectHost(selectedHostId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] bg-zinc-900 text-white border-zinc-700 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Host</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Select a host personality to guide your game. Each has a unique style!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <HostSelector
            selectedHostId={selectedHostId}
            onSelectHost={setSelectedHostId}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedHostId}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Continue with Selected Host
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
