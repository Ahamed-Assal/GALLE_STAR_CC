export default function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-lg rounded-xl border bg-white p-8 text-center dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-red-500">Unauthorized</h1>
      <p className="mt-2 text-sm text-gray-500">You do not have permission to access this page.</p>
    </section>
  );
}
