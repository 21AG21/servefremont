"use client";

// Inline script that executes during HTML parsing on hard loads (the server
// sends type="text/javascript"), but renders inert as text/plain whenever
// React renders it client-side — avoiding re-execution and React's dev
// warning about client-rendered script tags. suppressHydrationWarning
// bridges the deliberate type mismatch. Pattern from the Next.js guide
// "Preventing Flash Before Hydration".
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
