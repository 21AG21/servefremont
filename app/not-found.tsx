import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-medium text-ink">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        That listing may have been removed or the link is wrong.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to all opportunities
      </Link>
    </main>
  );
}
