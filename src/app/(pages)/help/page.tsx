import type { Metadata } from "next";
import { SITE_NAME, SITE_DOMAIN } from "@/lib/site";
import HelpView from "./help-view";

export const metadata: Metadata = {
  title: "Help & Support",
  description:
    "Get help with TextGame.ai — learn how to create games, manage your account, and get answers to common questions.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: `Help & Support · ${SITE_NAME}`,
    description:
      "Get help with TextGame.ai — learn how to create games, manage your account, and get answers to common questions.",
    url: `${SITE_DOMAIN}/help`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Help & Support · ${SITE_NAME}`,
    description:
      "Get help with TextGame.ai — learn how to create games, manage your account, and get answers to common questions.",
  },
};

export default function HelpPage() {
  return <HelpView />;
}
