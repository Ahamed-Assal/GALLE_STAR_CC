import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <section className="space-y-8 py-8 md:space-y-10">
      <div className="grid gap-5 rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/45 via-[#ece2fa] to-primary/28 p-6 text-slate-900 shadow-md dark:border-primary/40 dark:from-[#2a1a45] dark:via-[#1b1230] dark:to-[#140f24] dark:text-slate-100 md:grid-cols-[1.35fr_1fr] md:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary dark:text-purple-300">Welcome to</p>
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
            Our club runs on this site. Register your team, pick your XI, and score matches live. Whether it&apos;s a
            weekend practice or a proper tournament, everything happens here—runs, wickets, overs, and the lot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session?.user ? (
              <Link href="/teams" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">My Teams</Link>
            ) : (
              <Link href="/register" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Join the Club</Link>
            )}
            <Link href="/matches" className="rounded-md border border-primary/40 px-4 py-2 font-semibold text-primary hover:bg-primary/10 dark:border-primary/60 dark:text-purple-200 dark:hover:bg-primary/20">Live Matches</Link>
          </div>
        </div>
        <div className="rounded-xl border border-primary/35 bg-white/85 p-4 dark:border-primary/40 dark:bg-slate-900/70">
          <h2 className="text-xl font-bold">What&apos;s on here</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <li>• Live score updates—only scorers can post</li>
            <li>• Practice matches and full tournaments</li>
            <li>• Scoreboard and ball-by-ball timeline</li>
            <li>• Works on phones for scoring at the ground</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Live scoring",
          "Tournaments & practice",
          "Real-time scoreboard",
          "Team & admin tools",
        ].map((item) => (
          <div key={item} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="font-medium">{item}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Teams & squads</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Add your team, upload a logo, and list your players with jersey numbers. Handy when you&apos;re picking the
            batting order or setting up a match.
          </p>
        </article>
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Scoring</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Runs, wickets, wides, no-balls—log every ball. Undo if you tap the wrong thing. Run rate and overs update
            as you go.
          </p>
        </article>
        <article className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
          <h3 className="text-lg font-bold">Admin</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Club admins can manage users, change roles, and delete matches if needed. Keeps things tidy and under
            control.
          </p>
        </article>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-2xl font-bold">About GALLE STAR CC</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          We built this so our club could run matches without juggling spreadsheets or paper. Scorers use it at the
          ground, captains check scores on their phones, and everyone sees the same live scoreboard. Simple as that.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/teams" className="rounded-md border px-4 py-2 font-semibold hover:border-primary hover:text-primary">
            Teams
          </Link>
          <Link href="/dashboard" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
