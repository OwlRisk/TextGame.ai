"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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
        <p className="text-sm text-zinc-500 mb-8">Last updated: February 2025</p>

        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
            <p>
              To provide sign-in and game features we process your login data (e.g. email and identifier when using Google sign-in) via Supabase Auth. Game configurations and conversation content you create in the app may be stored or processed as designed, for syncing and restoring games across devices.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. How We Use It</h2>
            <p>
              We use this information to provide and maintain the service, sync accounts and data, improve the product, and comply with legal requests when required.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Third-Party Services</h2>
            <p>
              We use Supabase for authentication and database storage, and may use third-party APIs (e.g. OpenAI, voice) for AI host and game features. Those services have their own privacy policies; we recommend reviewing them.
            </p>
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
              You have the right to access, correct, or delete your personal information, and to exercise these rights by signing out, deleting your account, or contacting us.
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
              For questions or requests, contact us via the app or the project repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
