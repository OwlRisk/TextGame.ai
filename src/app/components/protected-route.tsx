"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Inner component that reads useSearchParams (must be inside <Suspense>)
function ProtectedRouteInner({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Guest players joining via invite link carry ?guestId=... in the URL.
  // Allow them through without requiring a login.
  const isGuestSession = !!searchParams.get("guestId");

  useEffect(() => {
    if (!loading && !user && !isGuestSession) {
      const qs = searchParams.toString();
      const fullPath = pathname ? (qs ? `${pathname}?${qs}` : pathname) : "";
      const returnUrl = fullPath ? `/signin?returnUrl=${encodeURIComponent(fullPath)}` : "/signin";
      router.push(returnUrl);
    }
  }, [user, loading, router, pathname, searchParams, isGuestSession]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user && !isGuestSession) {
    // M-4: Show spinner while the redirect effect fires so there is no blank flash
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}

// Suspense boundary required by Next.js for any component using useSearchParams
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </Suspense>
  );
}
