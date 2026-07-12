"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "sf-saved-ids";

// localStorage-backed set of saved listing ids. Starts empty on the server
// and on first client render (hydration-safe), then loads whatever's in
// storage — same pattern as the theme/isMobile hooks in this codebase.
export function useSavedIds() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(new Set(JSON.parse(raw)));
    } catch {
      // Storage unavailable (private mode, etc.) — saved just won't persist.
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        // Ignore — nothing to persist to.
      }
      return next;
    });
  }, []);

  return { savedIds: ids, toggleSaved: toggle };
}
