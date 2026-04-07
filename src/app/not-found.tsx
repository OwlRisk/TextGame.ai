import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-orange-500">
          404
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-zinc-400 text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            Browse games
          </Link>
        </div>
      </div>
    </div>
  );
}
