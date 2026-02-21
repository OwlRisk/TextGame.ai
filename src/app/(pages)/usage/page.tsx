'use client';

import { UsageContent } from '@/app/components/usage-content';
import { ProtectedRoute } from '@/app/components/protected-route';

export default function UsagePage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <UsageContent />
      </div>
    </ProtectedRoute>
  );
}
