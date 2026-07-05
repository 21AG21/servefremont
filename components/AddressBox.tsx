"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; short: string; lat: number; lng: number };

const PRIVACY =
  "Your address stays in your browser for this visit only and is never saved. It is sent to OpenStreetMap to look up the location for distances.";

// Bias results to the Tri-City / Fremont area so typing a street just works.
const VIEWBOX = "-122.12,37.63,-121.84,37.45";

function shorten(displayName: string): string {
  return displayName.split(", ").slice(0, 3).join(", ");
}

export default function AddressBox({
  active,
  onPick,
  onClear,
  fullWidth = false,
}: {
  active: boolean;
  onPick: (loc: { lat: number; lng: number }, label: string) => void;
  onClear: () => void;
  fullWidth?: boolean;
}) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const query = q.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5` +
          `&countrycodes=us&bounded=1&viewbox=${VIEWBOX}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        const data = await res.json();
        const list: Suggestion[] = (Array.isArray(data) ? data : []).map(
          (d: { display_name: string; lat: string; lon: string }) => ({
            label: d.display_name,
            short: shorten(d.display_name),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          })
        );
        setSuggestions(list);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [q]);

  function pick(s: Suggestion) {
    justPicked.current = true;
    setQ(s.short);
    setSuggestions([]);
    setOpen(false);
    onPick({ lat: s.lat, lng: s.lng }, s.short);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        justPicked.current = true;
        setQ("My location");
        setOpen(false);
        setLoading(false);
        onPick(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          "My location"
        );
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <div style={{ position: "relative", flex: fullWidth ? 1 : undefined }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--sf-text-muted)",
            pointerEvents: "none",
            display: "inline-flex",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Enter your address to see distances…"
          style={{
            border: "1px solid var(--sf-input-border)",
            borderRadius: 10,
            padding: "9px 14px 9px 34px",
            fontSize: 13,
            width: fullWidth ? "100%" : 280,
            outline: "none",
            background: "var(--sf-surface)",
            color: "var(--sf-text)",
          }}
        />
        {open && (suggestions.length > 0 || loading) && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              width: fullWidth ? "100%" : 320,
              maxWidth: "calc(100vw - 40px)",
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-border)",
              borderRadius: 10,
              boxShadow: "0 6px 24px var(--sf-shadow-strong)",
              overflow: "hidden",
              zIndex: 3000,
            }}
          >
            {loading && suggestions.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--sf-text-muted)",
                }}
              >
                Searching…
              </div>
            ) : (
              suggestions.map((s, i) => (
                <button
                  key={`${s.lat}-${s.lng}-${i}`}
                  onClick={() => pick(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--sf-border-soft)",
                    background: "var(--sf-surface)",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "var(--sf-text)",
                    cursor: "pointer",
                  }}
                >
                  {s.short}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {active ? (
        <button
          onClick={() => {
            setQ("");
            onClear();
          }}
          style={linkBtn}
        >
          Clear
        </button>
      ) : (
        <button onClick={useMyLocation} style={linkBtn}>
          Use my location
        </button>
      )}

      <div style={{ position: "relative", flexShrink: 0 }}>
        <span
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "1px solid var(--sf-input-border)",
            color: "var(--sf-text-muted)",
            fontSize: 11,
            cursor: "help",
          }}
        >
          i
        </span>
        {showInfo && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              width: 240,
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-border)",
              borderRadius: 10,
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
      </div>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "var(--sf-accent)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  whiteSpace: "nowrap",
  flexShrink: 0,
};
