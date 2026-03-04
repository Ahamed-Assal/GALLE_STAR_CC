export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="h-24 animate-pulse rounded-xl border bg-white dark:bg-slate-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border bg-white dark:bg-slate-900" />
        ))}
      </div>
    </section>
  );
}
