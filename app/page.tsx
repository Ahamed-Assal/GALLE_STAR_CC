import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <section className="space-y-8 py-8 md:space-y-10">
      <div className="grid gap-5 rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/45 via-[#ece2fa] to-primary/28 p-6 text-slate-900 shadow-md dark:border-primary/40 dark:from-[#2a1a45] dark:via-[#1b1230] dark:to-[#140f24] dark:text-slate-100 md:grid-cols-[1.35fr_1fr] md:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary dark:text-purple-300">Official Club Platform</p>
          <div className="mt-3 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="GALLE STAR CC logo"
              width={64}
              height={64}
              className="rounded-full border border-primary/30 object-cover"
            />
            <h1 className="text-3xl font-black sm:text-5xl">GALLE STAR CC</h1>
          </div>
          <p className="mt-4 max-w-2xl text-slate-800 dark:text-slate-200">
            Professional cricket club operations in one platform. Register teams, manage players, run tournaments,
            and deliver live ball-by-ball scoring with secure role-based controls.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session?.user ? (
              <Link href="/teams" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Explore Teams</Link>
            ) : (
              <Link href="/register" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Get Started</Link>
            )}
            <Link href="/matches" className="rounded-md border border-primary/40 px-4 py-2 font-semibold text-primary hover:bg-primary/10 dark:border-primary/60 dark:text-purple-200 dark:hover:bg-primary/20">View Matches</Link>
          </div>
        </div>
        <div className="rounded-xl border border-primary/35 bg-white/85 p-4 dark:border-primary/40 dark:bg-slate-900/70">
          <h2 className="text-xl font-bold">Matchday Snapshot</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <li>• Live scoring with scorer-only updates</li>
            <li>• Practice and tournament match modes</li>
            <li>• Real-time scoreboard and event timeline</li>
            <li>• Mobile-first interface for on-ground use</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Live scorer controls",
          "Tournament + practice flow",
          "Realtime updates",
          "Admin role management",
        ].map((item) => (
          <div key={item} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="font-medium">{item}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Team Management</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Create teams, upload logos, and manage player squads with dynamic player entries and jersey numbers.
          </p>
        </article>
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Smart Scoring Engine</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Track every event through score events with undo support, run-rate calculations, and innings-ready flow.
          </p>
        </article>
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Administration Control</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Dedicated admin dashboard to manage roles, monitor match activity, and keep platform operations secure.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-2xl font-bold">Why GALLE STAR CC Platform</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Built for clubs that want a modern digital match center. From practice fixtures to tournament-grade scoring,
          this platform gives players, scorers, owners, and fans a reliable live experience with strong security.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/teams" className="rounded-md border px-4 py-2 font-semibold hover:border-primary hover:text-primary">
            Explore Teams
          </Link>
          <Link href="/dashboard" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
