"use client";

import { useState } from "react";

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

// "Report outdated info" — collapsed to one quiet link, expands to a tiny
// form that posts to /api/report (Airtable "Reports" moderation queue).
// Used on both the in-app detail view and the standalone opportunity page.
export default function ReportOutdated({
  oppId,
  oppTitle,
}: {
  oppId: string;
  oppTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oppId, oppTitle, message, email }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p
        style={{
          fontFamily: UI,
          fontSize: 12.5,
          color: "var(--sf-accent-ink)",
          margin: 0,
        }}
      >
        Thanks — we check every report and fix real errors within 48 hours.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="sf-link"
        style={{
          fontFamily: UI,
          fontSize: 12,
          color: "var(--sf-text-muted)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Found incorrect info? Report it →
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: UI,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    borderRadius: 7,
    border: "1px solid var(--sf-input-border)",
    background: "var(--sf-bg)",
    color: "var(--sf-text)",
  };

  return (
    <form onSubmit={submit} style={{ textAlign: "left" }}>
      <label
        style={{
          fontFamily: UI,
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--sf-text-soft)",
          marginBottom: 6,
        }}
      >
        What&apos;s outdated or wrong?
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={2000}
          rows={3}
          placeholder="e.g. The Saturday shift no longer exists"
          style={{ ...inputStyle, resize: "vertical", marginTop: 6 }}
        />
      </label>
      <label
        style={{
          fontFamily: UI,
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--sf-text-soft)",
          marginBottom: 10,
        }}
      >
        Your email (optional, only if you want a reply)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          style={{ ...inputStyle, marginTop: 6 }}
        />
      </label>
      {/* Honeypot — hidden from real users, bots fill it. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
        onChange={() => {}}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="submit"
          disabled={state === "sending"}
          className="sf-btn"
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            fontWeight: 600,
            padding: "7px 14px",
            borderRadius: 7,
            border: "1px solid var(--sf-accent)",
            background: "var(--sf-accent)",
            color: "var(--sf-on-accent)",
            cursor: state === "sending" ? "default" : "pointer",
            opacity: state === "sending" ? 0.7 : 1,
          }}
        >
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="sf-btn"
          style={{
            fontFamily: UI,
            fontSize: 12.5,
            padding: "7px 12px",
            borderRadius: 7,
            border: "1px solid var(--sf-border)",
            background: "var(--sf-surface)",
            color: "var(--sf-text-soft)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        {state === "error" && (
          <span style={{ fontFamily: UI, fontSize: 12, color: "var(--sf-warn-text)" }}>
            Couldn&apos;t send — try again.
          </span>
        )}
      </div>
    </form>
  );
}
