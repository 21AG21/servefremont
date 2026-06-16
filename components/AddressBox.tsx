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
}: {
  active: boolean;
  onPick: (loc: { lat: number; lng: number }, label: string) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#bbb",
            fontSize: 13,
            pointerEvents: "none",
          }}
        >
          ⌕
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions[0]) pick(suggestions[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Enter your address…"
          style={{
            border: "1.5px solid #e3e3e3",
            borderRadius: 20,
            padding: "7px 13px 7px 28px",
            fontSize: 13,
            width: 230,
            outline: "none",
          }}
        />
        {open && (suggestions.length > 0 || loading) && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              width: 300,
              background: "#fff",
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
              zIndex: 3000,
            }}
          >
            {loading && suggestions.length === 0 ? (
              <div style={{ padding: "10px 14px", fontSize: 13, color: "#999" }}>
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
                    borderTop: i === 0 ? "none" : "1px solid #f2f2f2",
                    background: "#fff",
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#222",
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
          clear
        </button>
      ) : (
        <button onClick={useMyLocation} style={linkBtn}>
          Use my location
        </button>
      )}

      <span
        title={PRIVACY}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid #ccc",
          color: "#999",
          fontSize: 10,
          cursor: "help",
          flexShrink: 0,
        }}
      >
        i
      </span>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  border: "none",
  background: "none",
  color: "#666",
  fontSize: 12,
  cursor: "pointer",
  textDecoration: "underline",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
