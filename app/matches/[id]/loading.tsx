export default function MatchLoading() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
