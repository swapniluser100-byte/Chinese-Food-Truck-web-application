import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { OrderWithItems } from "../types";
import { playReadyChime, unlockAudio } from "../alertSound";

const POLL_MS = 5000;
const SOUND_REPEAT_MS = 4000;

// Polls the active-order pipeline and surfaces orders that just transitioned
// to "ready" so any staff screen (Menu, New Order, Active Orders) can alert —
// not just whichever page happens to be open when the kitchen finishes.
export function useReadyAlerts() {
  const [readyAlerts, setReadyAlerts] = useState<OrderWithItems[]>([]);
  const prevStatuses = useRef<Map<number, string> | null>(null);

  const poll = useCallback(async () => {
    try {
      const [pending, kitchen, inProgress, ready] = await Promise.all([
        api.listOrders("pending_payment"),
        api.listOrders("in_kitchen"),
        api.listOrders("in_progress"),
        api.listOrders("ready"),
      ]);
      const combined = [...pending.orders, ...kitchen.orders, ...inProgress.orders, ...ready.orders];

      const prev = prevStatuses.current;
      if (prev) {
        const newlyReady = ready.orders.filter((o) => prev.get(o.id) && prev.get(o.id) !== "ready");
        if (newlyReady.length > 0) {
          setReadyAlerts((current) => [...current, ...newlyReady.filter((o) => !current.some((c) => c.id === o.id))]);
        }
      }
      const nextStatuses = new Map<number, string>();
      for (const o of combined) nextStatuses.set(o.id, o.status);
      prevStatuses.current = nextStatuses;
    } catch {
      // transient network errors are fine to ignore — next poll retries
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  // Unlock the browser's audio autoplay restriction on the first tap anywhere.
  useEffect(() => {
    const handler = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", handler);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  // Keep chiming every few seconds while a ready alert is unacknowledged.
  useEffect(() => {
    if (readyAlerts.length === 0) return;
    playReadyChime();
    const interval = setInterval(playReadyChime, SOUND_REPEAT_MS);
    return () => clearInterval(interval);
  }, [readyAlerts.length > 0]);

  const dismiss = useCallback(() => setReadyAlerts([]), []);

  return { readyAlerts, dismiss };
}
