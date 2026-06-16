"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

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
      <div className="rounded-xl border border-brand/30 bg-brand-soft p-4 text-sm text-brand-dark">
        Thank you! Your organization was submitted for review. Nothing goes live
        until we verify it — we&apos;ll be in touch.
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm";
  const label = "block text-sm font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Honeypot — visually hidden, ignored by humans. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div>
        <label className={label} htmlFor="orgName">
          Organization name *
        </label>
        <input id="orgName" name="orgName" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="email">
          Contact email *
        </label>
        <input id="email" name="email" type="email" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="contactName">
          Your name
        </label>
        <input id="contactName" name="contactName" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="role">
          Volunteer role(s)
        </label>
        <input
          id="role"
          name="role"
          placeholder="e.g. front-desk help (14+), food sorting"
          className={field}
        />
      </div>
      <div>
        <label className={label} htmlFor="website">
          Website
        </label>
        <input id="website" name="website" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="notes">
          Anything else?
        </label>
        <textarea id="notes" name="notes" rows={4} className={field} />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-700">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Submit for review"}
      </button>
      <p className="text-xs text-ink-soft">
        Nothing publishes automatically. We verify every organization before it
        appears on the map.
      </p>
    </form>
  );
}
