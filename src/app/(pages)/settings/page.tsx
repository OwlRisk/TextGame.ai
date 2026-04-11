"use client";

import { SettingsContent } from "@/app/components/settings-content";
import { Toaster } from "@/app/components/ui/sonner";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </ProtectedRoute>
  );
}
