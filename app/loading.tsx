// Shown while the homepage fetches from Airtable.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="h-7 w-64 animate-pulse rounded bg-ink/10" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-ink/10" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-ink/10 bg-white"
          />
        ))}
      </div>
    </main>
  );
}
