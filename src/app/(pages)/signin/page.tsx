import type { Metadata } from "next";
import SignInView from "./signin-view";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to TextGame.ai to solve AI-powered murder mysteries.",
  alternates: { canonical: "/signin" },
  robots: { index: true, follow: false },
};

export default function SignInPage() {
  return <SignInView />;
}
