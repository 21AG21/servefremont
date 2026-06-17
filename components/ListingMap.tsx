"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
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
  const groupsWithCoords = orgGroups.filter(
    (g) => g.lat != null && g.lng != null
  );
  const activeGroup = groupsWithCoords.find((g) =>
    g.listings.some((l) => l.id === activeId)
  );

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
        const count = g.listings.length;
        return (
          <Marker
            key={g.orgName}
            position={[g.lat!, g.lng!]}
            icon={numberedIcon(orgIdx, isActive)}
            eventHandlers={{ click: () => onSelect(g.listings[0].id) }}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              {g.orgName}
              {count > 1 ? ` · ${count} opportunities` : ""}
            </Tooltip>
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
