"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  showLoadingMessage?: boolean;
}

/**
 * Component that protects routes from unauthenticated access
 * Redirects to home if user is not logged in
 */
export function ProtectedRoute({
  children,
  redirectTo = "/",
  showLoadingMessage = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return showLoadingMessage ? (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    ) : null;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
