import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderStatus, OrderWithItems } from "../../types";
import { formatOrderLine } from "../../orderSummary";
import { MenuImage } from "../../components/MenuImage";
import { TopBar } from "../../components/TopBar";

type ActiveStatus = Exclude<OrderStatus, "completed" | "cancelled">;

interface StageTheme {
  label: string;
  chip: string;
  count: string;
  tile: string;
  pillId: string;
  pillLabel: string;
  action: string;
  actionClass: string;
  run: (id: number) => Promise<unknown>;
}

const STAGES: Record<ActiveStatus, StageTheme> = {
  pending_payment: {
    label: "Payment Pending",
    chip: "bg-red-600",
    count: "bg-red-800/40",
    tile: "from-red-500 to-orange-600",
    pillId: "bg-red-600 text-white",
    pillLabel: "bg-red-500 text-white",
    action: "Confirm Payment",
    actionClass: "bg-green-600",
    run: api.startPreparation,
  },
  in_kitchen: {
    label: "Queued",
    chip: "bg-orange-500",
    count: "bg-orange-700/40",
    tile: "from-amber-300 to-orange-500",
    pillId: "bg-orange-500 text-white",
    pillLabel: "bg-amber-200 text-amber-900",
    action: "Start Cooking",
    actionClass: "bg-blue-600",
    run: api.startInKitchen,
  },
  in_progress: {
    label: "Cooking",
    chip: "bg-blue-600",
    count: "bg-blue-900/40",
    tile: "from-sky-400 to-blue-600",
    pillId: "bg-blue-600 text-white",
    pillLabel: "bg-blue-500 text-white",
    action: "Mark Ready",
    actionClass: "bg-green-600",
    run: api.markReady,
  },
  ready: {
    label: "Ready",
    chip: "bg-green-600",
    count: "bg-green-900/40",
    tile: "from-green-400 to-green-700",
    pillId: "bg-green-600 text-white",
    pillLabel: "bg-green-500 text-white",
    action: "Complete Order",
    actionClass: "bg-blue-600",
    run: api.completeOrder,
  },
};

const STAGE_ORDER: ActiveStatus[] = ["pending_payment", "in_kitchen", "in_progress", "ready"];
// Ready orders first (they need handing over), then work backwards through the pipeline.
const LIST_ORDER: ActiveStatus[] = ["ready", "in_progress", "in_kitchen", "pending_payment"];

export function StaffActiveOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<ActiveStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(LIST_ORDER.map((s) => api.listOrders(s)));
      setOrders(results.flatMap((r) => r.orders));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function act(id: number, fn: (id: number) => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try {
      await fn(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function cancel(order: OrderWithItems) {
    if (!window.confirm(`Cancel order #${order.id}? This can't be undone.`)) return;
    act(order.id, api.cancelOrder);
  }

  const counts = STAGE_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
    {} as Record<ActiveStatus, number>
  );
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="pb-8">
      <TopBar
        title="Active Orders"
        tabs={[
          { to: "/staff", label: "Menu" },
          { to: "/staff/orders", label: "Active Orders" },
        ]}
      />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAGE_ORDER.map((s) => {
            const t = STAGES[s];
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(active ? null : s)}
                aria-pressed={active}
                className={`tap-target ${t.chip} text-white rounded-xl px-3 py-3 font-bold shadow flex items-center justify-center gap-2 transition ${
                  filter && !active ? "opacity-50" : ""
                } ${active ? "ring-4 ring-neutral-900/20" : ""}`}
              >
                {t.label}
                <span className={`${t.count} rounded-full px-2 py-0.5 text-sm`}>{counts[s] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {visible.length === 0 && <p className="text-neutral-500 text-sm">No active orders right now.</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((order) => {
            const t = STAGES[order.status as ActiveStatus];
            if (!t) return null;
            const first = order.items[0];
            const busy = busyId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${t.tile} p-1.5`}>
                    {first && (
                      <MenuImage
                        imageRefId={first.image_ref_id}
                        category={first.item_category}
                        name={first.item_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="inline-flex rounded-full overflow-hidden text-sm font-bold">
                      <span className={`${t.pillId} px-3 py-1`}>#{order.id}</span>
                      <span className={`${t.pillLabel} px-3 py-1`}>{t.label}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5">
                      {order.items.map((line) => (
                        <li key={line.id} className="text-neutral-800">
                          {formatOrderLine(line)}
                        </li>
                      ))}
                    </ul>
                    {order.customer_name && <div className="text-sm text-neutral-500">{order.customer_name}</div>}
                    {order.instructions && <div className="text-xs text-amber-700">Note: {order.instructions}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                  <span className="text-xl font-semibold text-neutral-700 mr-auto">₹{order.total_amount}</span>
                  <button
                    onClick={() => act(order.id, t.run)}
                    disabled={busy}
                    className={`tap-target ${t.actionClass} text-white px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50`}
                  >
                    {busy ? "…" : t.action}
                  </button>
                  <button
                    onClick={() => cancel(order)}
                    disabled={busy}
                    className="tap-target bg-neutral-600 text-white px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
