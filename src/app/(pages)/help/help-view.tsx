'use client';

import { HelpSupportContent } from '@/app/components/help-support-content';
import { Toaster } from '@/app/components/ui/sonner';

export default function HelpView() {
  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
      <HelpSupportContent />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </div>
  );
}
