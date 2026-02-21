'use client';

import { HelpSupportContent } from '@/app/components/help-support-content';
import { ProtectedRoute } from '@/app/components/protected-route';

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <HelpSupportContent />
      </div>
    </ProtectedRoute>
  );
}
