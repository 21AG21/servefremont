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

function numberedIcon(n: number, active: boolean, dark: boolean): L.DivIcon {
  const green = dark ? "#7fc39a" : "#18603f";
  const paper = dark ? "#201f1b" : "#ffffff";
  const bg = active ? green : paper;
  const fg = active ? paper : green;
  const border = active ? paper : green;
  const shadow = active
    ? "0 2px 10px rgba(24,96,63,0.45),0 1px 3px rgba(0,0,0,0.25)"
    : "0 2px 8px rgba(0,0,0,0.18),0 1px 3px rgba(0,0,0,0.12)";
  const size = active ? 36 : 32;
  const half = size / 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};color:${fg};
      border:2px solid ${border};box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      font-size:${active ? 13 : 12}px;font-weight:700;">${n}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half - 2],
  });
}

function userIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:#e23b3b;border:3px solid #fff;
      box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        }
        subdomains="abcd"
      />
      <TileLayer
        key={`labels-${theme}`}
        pane="shadowPane"
        url={
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        }
        subdomains="abcd"
      />
      <InvalidateOnLayout />

      {groupsWithCoords.map((g) => {
        const orgIdx = orgGroups.indexOf(g) + 1;
        const isActive = g.listings.some((l) => l.id === activeId);
        const isShowingDirections = directionsOrg === g.orgName;
        const count = g.listings.length;
        const address = g.listings.find((l) => l.address)?.address;
        const transitNotes = g.listings.find((l) => l.transitNotes)
          ?.transitNotes;
        const destination =
          address ?? `${g.orgName}, Fremont, CA`;
        return (
          <Marker
            key={g.orgName}
            position={[g.lat!, g.lng!]}
            icon={numberedIcon(orgIdx, isActive, theme === "dark")}
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
              <Tooltip direction="top" offset={[0, -18]}>
                {g.orgName}
                {count > 1 ? ` · ${count} opportunities` : ""}
                {isActive ? " · click for directions" : ""}
              </Tooltip>
            )}

            {isShowingDirections && (
              <Popup
                offset={[0, -18]}
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
                      style={modeButtonStyle}
                    >
                      🚍 Transit
                    </a>
                    <a
                      href={directionsUrl(destination, "walking")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={modeButtonStyle}
                    >
                      🚶 Walk
                    </a>
                    <a
                      href={directionsUrl(destination, "bicycling")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={modeButtonStyle}
                    >
                      🚲 Bike
                    </a>
                    <a
                      href={directionsUrl(destination, "driving")}
                      target="_blank"
                      rel="noopener noreferrer"
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
