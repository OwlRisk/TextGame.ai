"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
