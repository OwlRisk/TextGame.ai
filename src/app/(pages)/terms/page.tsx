"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200 p-4 sm:p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="text-zinc-400 hover:text-white mb-8 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: February 2025</p>

        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance</h2>
            <p>
              By using textgame.ai you agree to these terms. If you do not agree, please do not use the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Service Description</h2>
            <p>
              textgame.ai provides AI-powered text-based game experiences: you design games in conversation and play with an AI host and AI players. We may update or change the service at any time.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Acceptable Use</h2>
            <p>
              You agree not to use the service for illegal, harassing, fraudulent, or rights-infringing conduct. We reserve the right to suspend or terminate your account if we find violations.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Intellectual Property</h2>
            <p>
              The interface, copy, branding, and technology in this service are owned by us or the relevant rights holders. You may not copy, modify, or use them for commercial purposes without permission.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Disclaimer</h2>
            <p>
              The service is provided &quot;as is.&quot; To the extent permitted by law, we are not liable for the availability, accuracy, or any direct or indirect loss arising from use of the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Changes to Terms</h2>
            <p>
              We may revise these terms; the updated version will be posted on this page. Continued use of the service constitutes acceptance of the revised terms.
            </p>
          </section>
          <section>
            <p className="text-zinc-500">
              If you have questions, contact us via the app or the project repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
