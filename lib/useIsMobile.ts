"use client";

import { useLayoutEffect, useState } from "react";

export function useIsMobile(): boolean {
  // false on the server and on the first client render (hydration-safe);
  // corrected before first paint, then tracked live.
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}
