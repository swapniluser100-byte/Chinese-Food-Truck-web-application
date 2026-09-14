import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api";
import type { OrderWithItems } from "../../types";
import { summarizeItems } from "../../orderSummary";
import { playReadyChime, unlockAudio } from "../../alertSound";
import { StatusBadge } from "../../components/StatusBadge";
import { TopBar } from "../../components/TopBar";
import { ReadyAlertModal } from "../../components/ReadyAlertModal";

const SOUND_REPEAT_MS = 4000;

export function StaffActiveOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [readyAlerts, setReadyAlerts] = useState<OrderWithItems[]>([]);

  const prevStatuses = useRef<Map<number, string> | null>(null);

  const load = useCallback(async () => {
    try {
      const [pending, kitchen, ready] = await Promise.all([
        api.listOrders("pending_payment"),
        api.listOrders("in_kitchen"),
        api.listOrders("ready"),
      ]);
      const combined = [...ready.orders, ...kitchen.orders, ...pending.orders];
      setOrders(combined);

      // Detect orders that just transitioned into "ready" since the last poll.
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
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  // Unlock the browser's audio autoplay restriction on the first tap anywhere on the page.
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

  async function complete(id: number) {
    setCompletingId(id);
    try {
      await api.completeOrder(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div className="pb-8">
      <TopBar
        title="Active Orders"
        tabs={[
          { to: "/staff", label: "Menu" },
          { to: "/staff/orders", label: "Active Orders" },
        ]}
      />

      <ReadyAlertModal orders={readyAlerts} onDismiss={() => setReadyAlerts([])} />

      <div className="p-4 space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {orders.length === 0 && <p className="text-neutral-500 text-sm">No active orders right now.</p>}

        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">#{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="truncate">
                {summarizeItems(order)}
                {order.customer_name ? ` — ${order.customer_name}` : ""}
              </div>
              <div className="text-sm text-neutral-500">₹{order.total_amount}</div>
            </div>

            {order.status === "ready" && (
              <button
                onClick={() => complete(order.id)}
                disabled={completingId === order.id}
                className="tap-target bg-green-600 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50 flex-shrink-0"
              >
                {completingId === order.id ? "…" : "Complete"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
