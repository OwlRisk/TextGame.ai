import type { Metadata } from "next";
import HelpView from "./help-view";

export const metadata: Metadata = {
  title: "Help & Support",
  description:
    "Get help with textgame.ai — learn how to create games, manage your account, and get answers to common questions.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return <HelpView />;
}
