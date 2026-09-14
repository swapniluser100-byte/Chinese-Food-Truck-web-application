import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderWithItems } from "../../types";
import { formatOrderLine } from "../../orderSummary";
import { StatusBadge } from "../../components/StatusBadge";
import { TopBar } from "../../components/TopBar";

export function Kitchen() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { orders } = await api.getKitchenOrders();
      setOrders(orders);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  async function startPreparation(id: number) {
    setBusyId(id);
    try {
      await api.startInKitchen(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function markReady(id: number) {
    setBusyId(id);
    try {
      await api.markReady(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="Kitchen" />

      <div className="p-4">
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {orders.length === 0 && <p className="text-neutral-500 text-sm">No orders in the kitchen right now.</p>}

        <div className="grid grid-cols-3 gap-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-200 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">#{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <span className="text-[11px] text-neutral-400 mb-1">{new Date(order.created_at).toLocaleTimeString()}</span>

              <div className="space-y-0.5 mb-1">
                {order.items.map((line) => (
                  <div key={line.id} className="text-sm font-semibold leading-tight">
                    {formatOrderLine(line)}
                  </div>
                ))}
              </div>

              {order.customer_name && <div className="text-xs text-neutral-500">For: {order.customer_name}</div>}
              {order.instructions && (
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-1.5 mt-1">{order.instructions}</div>
              )}

              <div className="flex-1" />

              {order.status === "in_kitchen" ? (
                <button
                  onClick={() => startPreparation(order.id)}
                  disabled={busyId === order.id}
                  className="tap-target mt-3 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow disabled:opacity-50"
                >
                  {busyId === order.id ? "…" : "Start Preparation"}
                </button>
              ) : (
                <button
                  onClick={() => markReady(order.id)}
                  disabled={busyId === order.id}
                  className="tap-target mt-3 w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold shadow disabled:opacity-50"
                >
                  {busyId === order.id ? "…" : "Mark Ready"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
