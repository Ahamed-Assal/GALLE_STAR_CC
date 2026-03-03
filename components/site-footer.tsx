import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t bg-white/80 dark:bg-slate-950/80">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className="hover:text-primary">
            Dashboard
          </Link>
          <Link href="/teams" className="hover:text-primary">
            Teams
          </Link>
          <Link href="/matches" className="hover:text-primary">
            Matches
          </Link>
          <Link href="/practice" className="hover:text-primary">
            Practice
          </Link>
        </div>
        <p className="mt-4 border-t pt-4 text-center">
          © {new Date().getFullYear()} <span className="font-semibold text-primary">GALLE STAR CC</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
