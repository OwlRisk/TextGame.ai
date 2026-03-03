"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Guest players joining via invite link carry ?guestId=... in the URL.
  // Allow them through without requiring a login.
  const isGuestSession = !!searchParams.get("guestId");

  useEffect(() => {
    if (!loading && !user && !isGuestSession) {
      const returnUrl = pathname ? `/signin?returnUrl=${encodeURIComponent(pathname)}` : "/signin";
      router.push(returnUrl);
    }
  }, [user, loading, router, pathname, isGuestSession]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user && !isGuestSession) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
