"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/listing";

const CENTER: [number, number] = [37.553, -121.982];

// 36px filled circle, white 3px border, drop shadow, white bold number.
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

// Red dot for the visitor's own location.
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

// Fly to and zoom in on the active listing.
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

// Scatter listings that share a coordinate so their pins don't stack.
// 1 degree latitude ≈ 111 km, so 0.0005 ≈ 55m — close enough to read as
// "same place" while still being individually clickable at typical zoom.
const SCATTER_RADIUS = 0.0005;

function scatterPositions(
  listings: Listing[]
): Map<string, [number, number]> {
  const positions = new Map<string, [number, number]>();
  const groups = new Map<string, Listing[]>();
  for (const l of listings) {
    if (l.lat == null || l.lng == null) continue;
    const key = `${l.lat.toFixed(5)},${l.lng.toFixed(5)}`;
    const group = groups.get(key) ?? [];
    group.push(l);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (group.length === 1) {
      const l = group[0];
      positions.set(l.id, [l.lat!, l.lng!]);
      continue;
    }
    group.forEach((l, i) => {
      const angle = (i / group.length) * Math.PI * 2;
      positions.set(l.id, [
        l.lat! + Math.cos(angle) * SCATTER_RADIUS,
        l.lng! + Math.sin(angle) * SCATTER_RADIUS,
      ]);
    });
  }
  return positions;
}

export default function ListingMap({
  listings,
  activeId,
  onSelect,
  userLoc,
}: {
  listings: Listing[];
  activeId: string | null;
  onSelect: (id: string) => void;
  userLoc?: { lat: number; lng: number } | null;
}) {
  const withCoords = listings.filter((l) => l.lat != null && l.lng != null);
  const positions = scatterPositions(withCoords);
  const active = withCoords.find((l) => l.id === activeId);
  const activePos = active ? positions.get(active.id) : undefined;

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

      {withCoords.map((l) => {
        const n = listings.indexOf(l) + 1;
        const pos = positions.get(l.id)!;
        return (
          <Marker
            key={l.id}
            position={pos}
            icon={numberedIcon(n, l.id === activeId)}
            eventHandlers={{ click: () => onSelect(l.id) }}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              {l.title}
            </Tooltip>
            <Popup closeButton={false}>
              <strong>{l.title}</strong>
              <br />
              {l.org.replace(" - Placeholder", "")}
            </Popup>
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

      {activePos && <FlyTo lat={activePos[0]} lng={activePos[1]} />}
    </MapContainer>
  );
}
