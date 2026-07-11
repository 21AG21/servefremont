import Link from "next/link";

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--sf-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontFamily: UI, fontSize: 20, fontWeight: 700, margin: 0, color: "var(--sf-text)" }}>
          Page not found
        </h1>
        <p style={{ fontFamily: UI, fontSize: 13, marginTop: 8, marginBottom: 0, color: "var(--sf-text-soft)" }}>
          That listing may have been removed or the link is wrong.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 20,
            display: "inline-block",
            borderRadius: 10,
            padding: "11px 20px",
            background: "var(--sf-accent)",
            color: "var(--sf-on-accent)",
            fontFamily: UI,
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to all opportunities
        </Link>
      </div>
    </main>
  );
}
