import type { Metadata } from "next";
import SignInView from "./signin-view";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to textgame.ai to design and play AI-powered text games with your friends.",
  alternates: { canonical: "/signin" },
  robots: { index: true, follow: false },
};

export default function SignInPage() {
  return <SignInView />;
}
