// Shown while the homepage fetches from Airtable on the server.
// Mirrors the app shell (header bar + list column) so the swap is seamless.

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

function Bar({ w, h = 12 }: { w: number | string; h?: number }) {
  return (
    <div
      className="sf-shimmer"
      style={{
        width: w,
        height: h,
        borderRadius: 6,
      }}
    />
  );
}

export default function Loading() {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--sf-bg)",
        fontFamily: UI,
      }}
    >
      <div
        style={{
          borderBottom: "1px solid var(--sf-border)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Bar w={120} h={16} />
        <Bar w={160} />
      </div>
      <div style={{ flex: 1, padding: "15px 20px", maxWidth: 560 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              border: "1.5px solid var(--sf-outline)",
              borderRadius: 10,
              background: "var(--sf-surface)",
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Bar w="60%" h={14} />
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <Bar w={70} />
              <Bar w={90} />
              <Bar w={60} />
            </div>
          </div>
        ))}
        <p style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
          Loading opportunities…
        </p>
      </div>
    </div>
  );
}
