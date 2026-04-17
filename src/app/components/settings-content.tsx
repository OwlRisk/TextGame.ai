'use client';

import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';

export function SettingsContent() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-zinc-500">Customize your experience</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-16 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-zinc-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Nothing to configure yet</h2>
          <p className="text-sm text-zinc-500">
            More preferences will appear here as the platform grows.
          </p>
        </div>
      </div>
    </div>
  );
}
