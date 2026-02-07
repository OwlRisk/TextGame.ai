"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
}

export function GoogleSignInButton({ className, variant = "default" }: GoogleSignInButtonProps) {
  const { signInWithGoogle, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success("Redirecting to Google...");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading || isLoading}
      className={className}
      variant={variant}
    >
      {isLoading || loading ? "Signing in..." : "Sign in with Google"}
    </Button>
  );
}
