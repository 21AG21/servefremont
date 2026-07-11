"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 7,
  border: "1px solid var(--sf-input-border)",
  background: "var(--sf-bg)",
  color: "var(--sf-text)",
  padding: "8px 12px",
  fontSize: 13,
  fontFamily: UI,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: UI,
  color: "var(--sf-text)",
  marginBottom: 5,
};

export default function SubmitForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  if (status === "ok") {
    return (
      <div
        style={{
          borderRadius: 10,
          border: "1px solid var(--sf-accent-border)",
          background: "var(--sf-accent-soft)",
          padding: 16,
          fontFamily: UI,
          fontSize: 13,
          color: "var(--sf-accent-ink)",
        }}
      >
        Thank you! Your organization was submitted for review. Nothing goes live
        until we verify it — we&apos;ll be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Honeypot — visually hidden, ignored by humans. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: "none" }}
      />

      <div>
        <label style={labelStyle} htmlFor="orgName">
          Organization name *
        </label>
        <input id="orgName" name="orgName" required style={fieldStyle} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="email">
          Contact email *
        </label>
        <input id="email" name="email" type="email" required style={fieldStyle} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="contactName">
          Your name
        </label>
        <input id="contactName" name="contactName" style={fieldStyle} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="role">
          Volunteer role(s)
        </label>
        <input
          id="role"
          name="role"
          placeholder="e.g. front-desk help (14+), food sorting"
          style={fieldStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="website">
          Website
        </label>
        <input id="website" name="website" style={fieldStyle} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="notes">
          Anything else?
        </label>
        <textarea id="notes" name="notes" rows={4} style={fieldStyle} />
      </div>

      {status === "error" && (
        <p style={{ fontFamily: UI, fontSize: 13, color: "var(--sf-gold-ink)", margin: 0 }}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        style={{
          borderRadius: 10,
          border: "none",
          background: "var(--sf-accent)",
          color: "var(--sf-on-accent)",
          padding: "12px 16px",
          fontFamily: UI,
          fontSize: 13.5,
          fontWeight: 600,
          cursor: status === "sending" ? "default" : "pointer",
          opacity: status === "sending" ? 0.6 : 1,
        }}
      >
        {status === "sending" ? "Sending…" : "Submit for review"}
      </button>
      <p style={{ fontFamily: UI, fontSize: 11.5, color: "var(--sf-text-muted)", margin: 0 }}>
        Nothing publishes automatically. We verify every organization before it
        appears on the map.
      </p>
    </form>
  );
}
