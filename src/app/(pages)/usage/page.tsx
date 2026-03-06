'use client';

import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/app/components/protected-route';

const UsageContent = dynamic(
  () => import('@/app/components/usage-content').then(m => m.UsageContent),
  { ssr: false },
);

export default function UsagePage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <UsageContent />
      </div>
    </ProtectedRoute>
  );
}
