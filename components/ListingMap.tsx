"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
  background: "#f3f4f6",
  color: "#111",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  border: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

function numberedIcon(n: number, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${active ? "#111" : "#555"};color:#fff;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;">${n}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -19],
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

function InvalidateOnLayout() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function ListingMap({
  orgGroups,
  activeId,
  onSelect,
  userLoc,
}: {
  orgGroups: OrgGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userLoc?: { lat: number; lng: number } | null;
}) {
  const [directionsOrg, setDirectionsOrg] = useState<string | null>(null);

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

  return (
    <MapContainer
      center={CENTER}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <TileLayer
        pane="shadowPane"
        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
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
            icon={numberedIcon(orgIdx, isActive)}
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
                      color: "#111",
                    }}
                  >
                    {g.orgName}
                  </div>
                  {address && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#555",
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
                      color: "#888",
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
                        borderTop: "1px solid #eee",
                        fontSize: 12,
                        color: "#444",
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
