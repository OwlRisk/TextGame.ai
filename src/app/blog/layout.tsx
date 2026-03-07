import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: `Blog · ${SITE_NAME}`,
  },
};

function BlogSidebar() {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0 pt-10">
      {/* Main CTA */}
      <div className="sticky top-24 flex flex-col gap-4">
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/60 to-zinc-900/60 p-5">
          <div className="text-2xl mb-2">🎮</div>
          <h3 className="text-sm font-bold text-white mb-1">Play with AI now</h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Create a game in 2 minutes. AI Game Master hosts — no moderator needed.
          </p>
          <Link
            href="/discover"
            className="block w-full text-center bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            Browse Games →
          </Link>
          <Link
            href="/create"
            className="block w-full text-center mt-2 text-violet-400 hover:text-violet-300 text-xs transition-colors"
          >
            or create your own
          </Link>
        </div>

        {/* Popular games */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Popular Games</h3>
          <div className="flex flex-col gap-1.5">
            {[
              { name: "Werewolf", href: "/games/werewolf", emoji: "🐺" },
              { name: "Mafia", href: "/games/mafia", emoji: "🔫" },
              { name: "Spyfall", href: "/games/spyfall", emoji: "🕵️" },
              { name: "Avalon", href: "/games/avalon", emoji: "⚔️" },
              { name: "Murder Mystery", href: "/games/detective-mystery", emoji: "🔍" },
            ].map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition-colors py-1 group"
              >
                <span className="text-base">{game.emoji}</span>
                <span className="group-hover:text-white">{game.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-200 flex flex-col">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-12">
          <div className="flex-1 min-w-0">{children}</div>
          <BlogSidebar />
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
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
