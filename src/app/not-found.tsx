import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl font-black mb-4">
        🔍
      </div>
      <h1 className="text-3xl font-black mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-6">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition"
      >
        Return to Home
      </Link>
    </div>
  );
}
