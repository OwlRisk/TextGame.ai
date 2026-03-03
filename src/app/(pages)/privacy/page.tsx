import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how textgame.ai collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200 p-4 sm:p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white mb-8 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>
              To provide sign-in and game features we process your login data (e.g. email and identifier when using Google sign-in) via Supabase Auth. Game configurations and conversation content you create in the app may be stored or processed for syncing and restoring games across devices. If you subscribe or purchase credits, your payment is processed by Stripe — we do not store your card details. We also collect anonymous usage analytics (page views, interactions) via Vercel Analytics to improve the product.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use It</h2>
            <p>
              We use this information to provide and maintain the service, sync accounts and data, process payments, and improve the product. We do not sell your personal data to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Third-Party Services</h2>
            <p>
              We use the following third-party services, each with their own privacy policies:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-400">
              <li><strong className="text-zinc-300">Supabase</strong> — authentication and database storage</li>
              <li><strong className="text-zinc-300">OpenAI</strong> — AI text generation and image creation</li>
              <li><strong className="text-zinc-300">Inworld</strong> — AI voice / text-to-speech</li>
              <li><strong className="text-zinc-300">Stripe</strong> — payment processing and subscription management</li>
              <li><strong className="text-zinc-300">Vercel</strong> — hosting and anonymous usage analytics</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Security and Retention</h2>
            <p>
              We take reasonable technical and organizational measures to protect your data. Retention depends on product needs and legal requirements. You may delete or export your data where the product supports it.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. You can exercise these rights by signing out, deleting your account in Settings, or contacting us directly.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Policy Updates</h2>
            <p>
              We may update this privacy policy from time to time; the updated version will be posted on this page. Continued use of the service means you accept the updated policy.
            </p>
          </section>
          <section>
            <p className="text-zinc-500">
              For questions or requests, contact us at{' '}
              <a href="mailto:info@cvnio.com" className="underline hover:text-zinc-300">info@cvnio.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
