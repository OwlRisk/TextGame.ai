'use client';

import { SettingsContent } from '@/app/components/settings-content';
import { ProtectedRoute } from '@/app/components/protected-route';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 min-h-0 overflow-auto bg-[#0a0a0a]">
        <SettingsContent />
      </div>
    </ProtectedRoute>
  );
}
