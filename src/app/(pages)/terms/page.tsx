import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service — textgame.ai",
  description: "Read the terms of service for textgame.ai — AI-powered text game platform. Covers AI content, multiplayer conduct, credits, and user responsibilities.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — textgame.ai",
    description: "Read the terms of service for textgame.ai — AI-powered text game platform. Covers AI content, multiplayer conduct, credits, and user responsibilities.",
    url: "https://textgame.ai/terms",
    siteName: "textgame.ai",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — textgame.ai",
    description: "Read the terms of service for textgame.ai — AI-powered text game platform.",
  },
};

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
        <p className="text-sm text-zinc-500 mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance</h2>
            <p>
              By accessing or using textgame.ai (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use the Service. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these terms on your behalf. We do not knowingly provide the Service to children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Service Description</h2>
            <p>
              textgame.ai is an AI-powered platform where you design and play text-based games. An AI Game Master runs game sessions, managing narrative, roles, rules, and player interactions. You can play solo with AI characters or invite friends to join multiplayer sessions in real time. We may update, modify, or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Accounts &amp; Guest Access</h2>
            <p>
              You can sign in with Google to create an account. You are responsible for maintaining the security of your account credentials. You may also join multiplayer games as a guest without an account — guest sessions are identified by a randomly generated ID stored in your browser and are limited in functionality compared to registered accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li>Use the Service for any illegal, harassing, defamatory, or fraudulent purpose</li>
              <li>Attempt to manipulate AI outputs to generate harmful, abusive, or exploitative content</li>
              <li>Impersonate other users or misrepresent your identity</li>
              <li>Interfere with or disrupt the Service, servers, or networks</li>
              <li>Scrape, reverse-engineer, or extract data from the Service</li>
              <li>Share sensitive personal information (real names, addresses, financial data) in game chat</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate your account and deny access if we determine, at our sole discretion, that you have violated these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. AI-Generated Content</h2>
            <p>
              The Service uses artificial intelligence (OpenAI, Inworld) to generate game narratives, character dialogue, voice audio, and images. You acknowledge that:
            </p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li>AI-generated content may be inaccurate, unexpected, or fictional</li>
              <li>AI outputs do not represent the views, opinions, or endorsements of textgame.ai</li>
              <li>You are responsible for how you use or share AI-generated content from the Service</li>
              <li>AI responses are not a substitute for professional advice of any kind</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Multiplayer Conduct</h2>
            <p>
              In multiplayer sessions, your messages are visible to all participants in the game room, including the host, other players, and anonymous guests. You are responsible for your conduct in multiplayer games. Do not share personal information, harass other players, or use the multiplayer feature to distribute harmful content. The game host (room owner) is responsible for the AI credit consumption of their room.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Credits &amp; Subscriptions</h2>
            <p>
              Subscription plans are billed monthly via Stripe and include a credit allocation that renews each billing period. Key terms:
            </p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li>Credits are consumed by AI interactions (text generation, voice synthesis, image creation)</li>
              <li>Credits have no cash value and cannot be transferred between accounts</li>
              <li>Unused credits carry over within an active subscription</li>
              <li>Refund requests for subscription charges may be submitted within 7 days of payment — we review each case individually</li>
              <li>Credits purchased separately (add-on packs) are non-refundable once consumed</li>
              <li>In multiplayer rooms, AI interactions consume the room owner&apos;s credits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. User Content &amp; Intellectual Property</h2>
            <p>
              Game rules, descriptions, and custom configurations you create remain yours. By using the Service, you grant us a limited, non-exclusive license to store, process, and display your content as necessary to operate the Service. The interface, branding, design, and underlying technology of textgame.ai are owned by us or our licensors. You may not copy, modify, or redistribute them for commercial purposes without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided <strong className="text-zinc-200">&ldquo;as is&rdquo;</strong> and <strong className="text-zinc-200">&ldquo;as available&rdquo;</strong> without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate or suitable for any particular purpose. To the maximum extent permitted by applicable law, we disclaim all warranties including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, textgame.ai and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill arising from your use of the Service. Our total liability for any claim related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless textgame.ai and its operators from any claims, damages, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these terms, or your infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of the State of California, United States, without regard to conflict-of-law principles. Any disputes shall be resolved in the courts located in California, unless applicable law requires otherwise (e.g. consumer protection laws in the EU may allow you to bring claims in your local jurisdiction).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">14. Changes to Terms</h2>
            <p>
              We may revise these terms from time to time. Material changes will be indicated by updating the &ldquo;Last updated&rdquo; date. Continued use of the Service after changes are posted constitutes acceptance of the revised terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">15. Contact Us</h2>
            <p className="text-zinc-400">
              If you have questions about these terms, contact us at{' '}
              <a href="mailto:info@cvnio.com" className="underline hover:text-zinc-300">info@cvnio.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
