export default function GlobalLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
