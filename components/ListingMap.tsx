"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/listing";

const CENTER: [number, number] = [37.553, -121.982];

const UI =
  '-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", system-ui, sans-serif';

type OrgGroup = {
  orgName: string;
  listings: Listing[];
  lat?: number;
  lng?: number;
};

type TravelMode = "transit" | "walking" | "bicycling" | "driving";

function directionsUrl(destination: string, mode: TravelMode): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}&travelmode=${mode}`;
}

const modeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  borderRadius: 999,
  background: "var(--sf-pill-track)",
  color: "var(--sf-text)",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  border: "1px solid var(--sf-input-border)",
  whiteSpace: "nowrap",
};

function numberedIcon(
  n: number,
  active: boolean,
  priority: boolean,
  enterDelayMs?: number
): L.DivIcon {
  const accent = priority ? "var(--sf-priority-accent)" : "var(--sf-accent)";
  const tint = priority ? "var(--sf-priority-bg)" : "var(--sf-green-bg)";
  const size = active ? 30 : 26;
  const half = size / 2;
  // Teardrop pin: a square rotated -45deg (border-radius rounds three
  // corners, leaving one sharp corner to form the point). The rotation
  // lives on an inner div so the outer div's hover/active scale (see
  // .sf-map-pin in globals.css) and the pop-in animation aren't clobbered
  // by a competing inline `transform`. The number sits in its own
  // unrotated layer so it reads upright instead of on a diagonal.
  const tipOffset = Math.round(size * 0.707);
  const anchorY = half + tipOffset;
  // Only the marker's first-ever icon gets the pop-in — every later call
  // (active/priority toggling) omits it, since Leaflet's setIcon() rebuilds
  // this element on every change and an unconditional animation would
  // replay on every click instead of just on mount.
  const enterStyle =
    enterDelayMs != null
      ? `animation:sf-pin-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${enterDelayMs}ms both;`
      : "";
  return L.divIcon({
    className: "",
    html: `<div class="sf-map-pin" style="position:relative;width:${size}px;height:${size}px;cursor:pointer;${enterStyle}">
      <div style="
        position:absolute;inset:0;border-radius:50% 50% 50% 0;
        background:${active ? accent : tint};
        border:1.5px solid ${accent};
        box-shadow:0 1px 2px var(--sf-shadow), 0 4px 10px var(--sf-shadow-strong);
        transform:rotate(-45deg);"></div>
      <div style="
        position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
        color:${active ? "var(--sf-on-accent)" : accent};
        font-family:${UI};font-size:${active ? 13 : 12}px;font-weight:700;
        pointer-events:none;">${n}</div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [half, anchorY],
    popupAnchor: [0, -2 * tipOffset - 8],
  });
}

function userIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:#2f6fed;border:3px solid #fff;
      box-shadow:0 0 0 6px rgba(47,111,237,0.22),0 1px 4px rgba(0,0,0,0.35);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Keeps Leaflet's internal size in sync with its container — needed now
// that the container can shrink to a 210px rail (hide-map state) or grow
// back, without the MapContainer itself remounting.
function InvalidateOnLayout() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [map]);
  return null;
}

export default function ListingMap({
  orgGroups,
  activeId,
  onSelect,
  userLoc,
  theme = "light",
}: {
  orgGroups: OrgGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userLoc?: { lat: number; lng: number } | null;
  theme?: "light" | "dark";
}) {
  const [directionsOrg, setDirectionsOrg] = useState<string | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  // Orgs whose pin has already played its pop-in — read/written during
  // render (not an effect) so the very first icon computed for an org is
  // the one that gets the animation; every later icon swap for that org
  // (active toggling) is skipped.
  const enteredOrgs = useRef<Set<string>>(new Set());

  const groupsWithCoords = orgGroups.filter(
    (g) => g.lat != null && g.lng != null
  );
  const activeGroup = groupsWithCoords.find((g) =>
    g.listings.some((l) => l.id === activeId)
  );

  // Close directions popup if the selected org changes underneath it.
  useEffect(() => {
    if (directionsOrg && activeGroup?.orgName !== directionsOrg) {
      setDirectionsOrg(null);
    }
  }, [activeGroup, directionsOrg]);

  // react-leaflet v5 binds the Popup but doesn't auto-open it — open it
  // imperatively whenever a new directionsOrg is selected.
  useEffect(() => {
    if (!directionsOrg) return;
    const marker = markerRefs.current.get(directionsOrg);
    marker?.openPopup();
  }, [directionsOrg]);

  return (
    <MapContainer
      center={CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        key={`base-${theme}`}
        url={
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        }
        subdomains="abcd"
      />
      <TileLayer
        key={`labels-${theme}`}
        pane="shadowPane"
        url={
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
        }
        subdomains="abcd"
      />
      <InvalidateOnLayout />

      {groupsWithCoords.map((g) => {
        const orgIdx = orgGroups.indexOf(g) + 1;
        const isActive = g.listings.some((l) => l.id === activeId);
        const isPriority = g.listings.some((l) => l.priority);
        const isShowingDirections = directionsOrg === g.orgName;
        const count = g.listings.length;
        const address = g.listings.find((l) => l.address)?.address;
        const transitNotes = g.listings.find((l) => l.transitNotes)
          ?.transitNotes;
        const destination =
          address ?? `${g.orgName}, Fremont, CA`;
        const isFirstAppearance = !enteredOrgs.current.has(g.orgName);
        if (isFirstAppearance) enteredOrgs.current.add(g.orgName);
        return (
          <Marker
            key={g.orgName}
            position={[g.lat!, g.lng!]}
            icon={numberedIcon(
              orgIdx,
              isActive,
              isPriority,
              isFirstAppearance ? Math.min(orgIdx - 1, 12) * 20 : undefined
            )}
            ref={(m) => {
              if (m) markerRefs.current.set(g.orgName, m);
              else markerRefs.current.delete(g.orgName);
            }}
            eventHandlers={{
              click: () => {
                if (isActive) {
                  setDirectionsOrg((cur) =>
                    cur === g.orgName ? null : g.orgName
                  );
                } else {
                  onSelect(g.listings[0].id);
                  setDirectionsOrg(null);
                }
              },
              popupclose: () => {
                setDirectionsOrg((cur) =>
                  cur === g.orgName ? null : cur
                );
              },
            }}
          >
            {!isShowingDirections && (
              <Tooltip direction="top" offset={[0, -46]}>
                {g.orgName}
                {count > 1 ? ` · ${count} opportunities` : ""}
                {isActive ? " · click for directions" : ""}
              </Tooltip>
            )}

            {isShowingDirections && (
              <Popup
                closeButton
                closeOnClick={false}
                autoClose={false}
              >
                <div style={{ minWidth: 220, maxWidth: 260 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 2,
                      color: "var(--sf-text)",
                    }}
                  >
                    {g.orgName}
                  </div>
                  {address && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--sf-text-soft)",
                        marginBottom: 10,
                        lineHeight: 1.35,
                      }}
                    >
                      {address}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--sf-text-muted)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      fontWeight: 700,
                    }}
                  >
                    Get directions
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <a
                      href={directionsUrl(destination, "transit")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn"
                      style={modeButtonStyle}
                    >
                      🚍 Transit
                    </a>
                    <a
                      href={directionsUrl(destination, "walking")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn"
                      style={modeButtonStyle}
                    >
                      🚶 Walk
                    </a>
                    <a
                      href={directionsUrl(destination, "bicycling")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn"
                      style={modeButtonStyle}
                    >
                      🚲 Bike
                    </a>
                    <a
                      href={directionsUrl(destination, "driving")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sf-btn"
                      style={modeButtonStyle}
                    >
                      🚗 Drive
                    </a>
                  </div>
                  {transitNotes && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: "1px solid var(--sf-border)",
                        fontSize: 12,
                        color: "var(--sf-text-soft)",
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Transit notes: </span>
                      {transitNotes}
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}

      {userLoc && (
        <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon()}>
          <Tooltip direction="top" offset={[0, -10]}>
            You
          </Tooltip>
        </Marker>
      )}

      {activeGroup && <FlyTo lat={activeGroup.lat!} lng={activeGroup.lng!} />}
    </MapContainer>
  );
}
