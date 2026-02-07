"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

interface GoogleSignOutButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
}

export function GoogleSignOutButton({ className, variant = "outline" }: GoogleSignOutButtonProps) {
  const { signOut, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={loading || isLoading}
      className={className}
      variant={variant}
    >
      {isLoading || loading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
