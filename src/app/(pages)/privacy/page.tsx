import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how TextGame.ai collects, uses, and protects your personal information. Covers GDPR, CCPA, guest data, AI-generated content, and multiplayer privacy.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · TextGame.ai",
    description: "Learn how TextGame.ai collects, uses, and protects your personal information. Covers GDPR, CCPA, guest data, AI-generated content, and multiplayer privacy.",
    url: "/privacy",
    siteName: "TextGame.ai",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — TextGame.ai",
    description: "Learn how TextGame.ai collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200 p-4 sm:p-6 md:p-10">
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
            <h3 className="font-medium text-zinc-200 mt-3 mb-1">1.1 Registered Users</h3>
            <p>
              When you sign in with Google, we receive your email address, display name, and profile identifier via Supabase Auth. Game configurations, conversation content, and game state you create are stored for syncing and restoring games across devices.
            </p>
            <h3 className="font-medium text-zinc-200 mt-3 mb-1">1.2 Guest Users (Anonymous)</h3>
            <p>
              You can join multiplayer games without creating an account. When you do, we generate a random guest identifier and store it in your browser&apos;s local storage along with your chosen nickname. No email, real name, or device fingerprint is collected from guest users.
            </p>
            <h3 className="font-medium text-zinc-200 mt-3 mb-1">1.3 Payment Data</h3>
            <p>
              When you purchase credits, payment is processed entirely by Stripe. We receive only a transaction confirmation — we never see or store your card number, CVV, or billing address.
            </p>
            <h3 className="font-medium text-zinc-200 mt-3 mb-1">1.4 Usage Analytics</h3>
            <p>
              We collect anonymous, aggregated usage data (page views, feature interactions) via Vercel Analytics. This data contains no personal identifiers and cannot be traced back to individual users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Local Storage &amp; Cookies</h2>
            <p>
              We use your browser&apos;s local storage (not cookies) for functional purposes only:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-400">
              <li>Authentication session tokens</li>
              <li>Guest identity (random ID + nickname) per game room</li>
              <li>User preferences (AI model, voice language)</li>
            </ul>
            <p className="mt-2">
              We use Google Analytics 4 (GA4) to collect anonymous usage statistics such as page views, session duration, and general device/browser information. GA4 may set cookies on your device for this purpose. For visitors in the European Economic Area (EEA) and the United Kingdom, we display a cookie consent banner and only load GA4 after you explicitly grant consent. Visitors outside the EEA/UK are covered by GA4&apos;s standard data processing terms. You may decline analytics cookies at any time; declining does not affect your ability to use the service. We do not use advertising cookies or third-party tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li>Provide, maintain, and improve the service</li>
              <li>Sync your account and game data across devices</li>
              <li>Process credit purchases</li>
              <li>Generate AI game content (text and images) on your behalf</li>
              <li>Analyze aggregated usage patterns to improve the product</li>
            </ul>
            <p className="mt-3 font-medium text-zinc-200">
              We do not sell, rent, or share your personal data with third parties for marketing or advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. AI-Generated Content</h2>
            <p>
              Game narratives, character dialogue, and images are generated by AI models (OpenAI). Your game inputs (rules, messages) are sent to these providers for processing and are subject to their respective data policies. AI-generated outputs may be inaccurate, fictional, or unexpected — they do not represent the views of TextGame.ai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Multiplayer &amp; Data Visibility</h2>
            <p>
              In multiplayer game rooms, messages you send are visible to all participants in that room, including the game host, other players, and anonymous guests who join via invite link. Your chosen display name (or nickname for guests) is shown to other players. Please do not share sensitive personal information in game chat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Third-Party Services</h2>
            <p>
              We rely on the following third-party services, each governed by their own privacy policy:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-400">
              <li><strong className="text-zinc-300">Supabase</strong> — authentication, database, and real-time communication</li>
              <li><strong className="text-zinc-300">OpenAI</strong> — AI text generation and image creation</li>
              <li><strong className="text-zinc-300">Stripe</strong> — credit purchase processing</li>
              <li><strong className="text-zinc-300">Vercel</strong> — hosting, edge delivery, and anonymous usage analytics</li>
              <li><strong className="text-zinc-300">Google</strong> — OAuth sign-in provider</li>
              <li><strong className="text-zinc-300">Meta (Facebook)</strong> — OAuth sign-in provider</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Data Storage &amp; International Transfers</h2>
            <p>
              Your data is processed and stored on servers located in the United States through our service providers (Supabase, Vercel, OpenAI). If you are located outside the United States, including in the European Economic Area (EEA), your data will be transferred to and processed in the United States. We rely on standard contractual clauses and our providers&apos; compliance frameworks to ensure adequate protection of your data during such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Data Retention</h2>
            <p>
              We retain your account data and game content for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law (e.g. payment records). Guest data (random IDs) stored in our database is retained for the lifetime of the game session and may be purged when the game is deleted by its owner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Security</h2>
            <p>
              We implement industry-standard security measures including encrypted connections (HTTPS/TLS), secure authentication via OAuth 2.0, row-level security policies on our database, and server-side access controls. However, no system is 100% secure. If you discover a vulnerability, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Your Rights</h2>

            <h3 className="font-medium text-zinc-200 mt-3 mb-1">10.1 All Users</h3>
            <p>
              You have the right to access, correct, or delete your personal information at any time. You can delete your account from the Settings page, or contact us to request data export or deletion.
            </p>

            <h3 className="font-medium text-zinc-200 mt-3 mb-1">10.2 European Economic Area (GDPR)</h3>
            <p>
              If you are in the EEA, you have additional rights under the General Data Protection Regulation, including:
            </p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li><strong className="text-zinc-300">Right to access</strong> — request a copy of your personal data</li>
              <li><strong className="text-zinc-300">Right to rectification</strong> — correct inaccurate data</li>
              <li><strong className="text-zinc-300">Right to erasure</strong> — request deletion of your data</li>
              <li><strong className="text-zinc-300">Right to data portability</strong> — receive your data in a machine-readable format</li>
              <li><strong className="text-zinc-300">Right to object</strong> — object to processing based on legitimate interests</li>
              <li><strong className="text-zinc-300">Right to lodge a complaint</strong> — file a complaint with your local data protection authority</li>
            </ul>
            <p className="mt-2">
              Our legal basis for processing your data is: (a) performance of a contract (providing the service you signed up for), (b) legitimate interest (improving the service, preventing abuse), and (c) your consent (where applicable).
            </p>

            <h3 className="font-medium text-zinc-200 mt-3 mb-1">10.3 California (CCPA/CPRA)</h3>
            <p>
              If you are a California resident, you have the right to:
            </p>
            <ul className="mt-1 space-y-1 list-disc list-inside text-zinc-400">
              <li>Know what personal information we collect and how it is used</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of the sale of personal information</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className="mt-2">
              <strong className="text-zinc-200">We do not sell your personal information.</strong> We do not share personal information with third parties for their own marketing purposes. To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. Children&apos;s Privacy</h2>
            <p>
              TextGame.ai is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected data from a child under 13, we will delete it promptly. If you believe a child under 13 has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Policy Updates</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be noted by updating the &ldquo;Last updated&rdquo; date at the top. Continued use of the service after changes are posted constitutes acceptance of the updated policy. We encourage you to review this page periodically.
            </p>
          </section>

          <section id="deletion">
            <h2 className="text-lg font-semibold text-white mb-2">13. Facebook Data Deletion</h2>
            <p>
              If you have used Facebook to sign in to TextGame.ai and wish to have your data deleted, you can do so in either of the following ways:
            </p>
            <ol className="mt-2 space-y-2 list-decimal list-inside text-zinc-400">
              <li>
                <strong className="text-zinc-300">Delete via Settings</strong> — Sign in to TextGame.ai and go to{' '}
                <strong className="text-zinc-300">Settings → Account → Delete account</strong>. This will permanently delete all data associated with your account within 30 days.
              </li>
              <li>
                <strong className="text-zinc-300">Request by email</strong> — Send a deletion request to{' '}
                <a href="mailto:info@cvnio.com" className="underline hover:text-zinc-300">info@cvnio.com</a>{' '}
                with the subject line <em>&ldquo;Facebook Data Deletion Request&rdquo;</em>. Include the email address or Facebook name associated with your account. We will process the request within 30 days and send a confirmation.
              </li>
            </ol>
            <p className="mt-3">
              Upon deletion we remove your account profile, game history, and all associated personal data from our systems. Anonymous analytics data (which contains no personal identifiers) may be retained.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">14. Contact Us</h2>
            <p className="text-zinc-400">
              For privacy-related questions, data access/deletion requests, or concerns, contact us at{' '}
              <a href="mailto:info@cvnio.com" className="underline hover:text-zinc-300">info@cvnio.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
