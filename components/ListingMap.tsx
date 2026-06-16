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
  const active = withCoords.find((l) => l.id === activeId);

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
        return (
          <Marker
            key={l.id}
            position={[l.lat!, l.lng!]}
            icon={numberedIcon(n, l.id === activeId)}
            eventHandlers={{ click: () => onSelect(l.id) }}
          >
            {/* Name shown on hover */}
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

      {active && <FlyTo lat={active.lat!} lng={active.lng!} />}
    </MapContainer>
  );
}
