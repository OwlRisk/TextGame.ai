"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/app/components/ui/card";
import { Gamepad2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/app/components/ui/sonner";
import { trackEvent } from "@/lib/analytics";

function SignInLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );
}

function SignInPageInner() {
  const { user, loading, signInWithGoogle, signInWithFacebook } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInFacebook, setIsSigningInFacebook] = useState(false);

  // Show error when redirected back with ?error=auth_error (e.g. OAuth callback failed)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth_error") {
      toast.error("Sign-in failed. Please try again.");
      window.history.replaceState({}, "", "/signin");
    }
  }, [searchParams]);

  const rawReturn = searchParams.get("returnUrl") ?? "";
  const returnUrl = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/";

  useEffect(() => {
    // Redirect if already logged in
    if (!loading && user) {
      router.push(returnUrl);
    }
  }, [user, loading, router, returnUrl]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle(returnUrl);
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      setIsSigningIn(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsSigningInFacebook(true);
    try {
      await signInWithFacebook(returnUrl);
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in with Facebook. Please try again.");
      setIsSigningInFacebook(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      trackEvent("sign_up_prompt_shown", { source: returnUrl === "/" ? "direct" : "redirect" });
    }
  }, [loading, user, returnUrl]);

  if (loading) {
    return <SignInLoading />;
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.06),transparent_50%)] pointer-events-none" />

      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Welcome to TextGame.ai</h1>
            <CardDescription className="text-zinc-400">
              Sign in to design and play text-based games with an AI host
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full min-h-[44px] h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-base transition-all"
            size="lg"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Facebook button hidden: pending Meta business verification
          <Button
            onClick={handleFacebookSignIn}
            disabled={isSigningInFacebook || isSigningIn}
            className="w-full min-h-[44px] h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-base transition-all"
            size="lg"
          >
            {isSigningInFacebook ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </>
            )}
          </Button>
          */}

          <p className="text-xs text-center text-zinc-500 leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-zinc-400">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>
          </p>
        </CardContent>
      </Card>

      <Toaster position="top-right" expand={false} richColors closeButton />
    </div>
  );
}

export default function SignInView() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInPageInner />
    </Suspense>
  );
}
