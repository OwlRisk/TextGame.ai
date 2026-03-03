import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: "Choose a plan that fits your play style.",
  robots: { index: false, follow: false },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
