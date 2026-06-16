// Straight-line ("as the crow flies") distance. We use this instead of a
// driving/walking API because those require a paid key.

type Point = { lat: number; lng: number };

export function haversineMiles(a: Point, b: Point): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function formatMiles(m: number): string {
  if (m < 0.1) return "<0.1 mi";
  if (m < 10) return `${m.toFixed(1)} mi`;
  return `${Math.round(m)} mi`;
}
