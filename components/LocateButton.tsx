"use client";

import { useState } from "react";

const PRIVACY =
  "Your location stays in your browser for this visit only and is never saved. It's used only to sort opportunities by distance from you.";

export default function LocateButton({
  active,
  onLocate,
  onClear,
}: {
  active: boolean;
  onLocate: (loc: { lat: number; lng: number }) => void;
  onClear: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [failed, setFailed] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setFailed(true);
      return;
    }
    setLoading(true);
    setFailed(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        setFailed(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <button
        onClick={active ? onClear : useMyLocation}
        className="sf-btn"
        disabled={loading}
        style={{
          fontSize: 12.5,
          fontWeight: active ? 600 : 500,
          padding: "6px 11px",
          borderRadius: 7,
          border: `1px solid ${active ? "var(--sf-accent)" : "var(--sf-border)"}`,
          background: active ? "var(--sf-accent-soft)" : "var(--sf-surface)",
          color: active ? "var(--sf-accent-ink)" : "var(--sf-text-soft)",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {loading ? "Finding you…" : active ? "Clear location" : "Use my location"}
      </button>

      <span
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid var(--sf-input-border)",
          color: "var(--sf-text-muted)",
          fontSize: 10,
          flexShrink: 0,
          cursor: "help",
        }}
      >
        i
      </span>
      {showInfo && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: 240,
            background: "var(--sf-surface)",
            border: "1px solid var(--sf-border)",
            borderRadius: 7,
            padding: "10px 12px",
            fontSize: 12,
            lineHeight: 1.55,
            color: "var(--sf-text-soft)",
            boxShadow: "0 4px 16px var(--sf-shadow-strong)",
            zIndex: 4000,
            pointerEvents: "none",
          }}
        >
          {PRIVACY}
        </div>
      )}

      {failed && (
        <span style={{ fontSize: 12, color: "var(--sf-warn-text)", whiteSpace: "nowrap" }}>
          Couldn't get your location.
        </span>
      )}
    </span>
  );
}
