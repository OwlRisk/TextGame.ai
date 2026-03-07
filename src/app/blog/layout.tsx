import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: `Blog · ${SITE_NAME}`,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-200 flex flex-col">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-white hover:text-violet-400 transition-colors">
            {SITE_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/blog" className="text-zinc-400 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/discover" className="text-zinc-400 hover:text-white transition-colors">
              Discover
            </Link>
            <Link
              href="/signin"
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Try Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {children}
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
          <p>&copy; 2026 {SITE_NAME}</p>
          <div className="flex gap-6">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
