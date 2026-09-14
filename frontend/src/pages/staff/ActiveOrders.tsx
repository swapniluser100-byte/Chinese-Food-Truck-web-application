import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderWithItems } from "../../types";
import { summarizeItems } from "../../orderSummary";
import { StatusBadge } from "../../components/StatusBadge";
import { TopBar } from "../../components/TopBar";

export function StaffActiveOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [pending, kitchen, ready] = await Promise.all([
        api.listOrders("pending_payment"),
        api.listOrders("in_kitchen"),
        api.listOrders("ready"),
      ]);
      setOrders([...ready.orders, ...kitchen.orders, ...pending.orders]);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

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
