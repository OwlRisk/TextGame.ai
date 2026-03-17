"use client";

import { useRouter } from "next/navigation";
import { UserProfile } from "@/app/components/user-profile";
import { Toaster } from "@/app/components/ui/sonner";
import { ProtectedRoute } from "@/app/components/protected-route";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const router = useRouter();

  return (
    <>
      <UserProfile onClose={() => router.replace("/discover")} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </>
  );
}
