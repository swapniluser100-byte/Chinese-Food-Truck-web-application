import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderWithItem } from "../../types";
import { TopBar } from "../../components/TopBar";

export function Kitchen() {
  const [orders, setOrders] = useState<OrderWithItem[]>([]);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);

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

  async function markReady(id: number) {
    setMarkingId(id);
    try {
      await api.markReady(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="Kitchen / किचन" />

      <div className="p-4 space-y-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {orders.length === 0 && <p className="text-neutral-500 text-sm">No orders in the kitchen right now.</p>}

        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold">Order #{order.id}</span>
              <span className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="text-2xl font-semibold">
              {order.quantity} × {order.item_name}
            </div>
            {order.customer_name && <div className="text-neutral-500 mt-1">For: {order.customer_name}</div>}

            <button
              onClick={() => markReady(order.id)}
              disabled={markingId === order.id}
              className="tap-target mt-4 w-full py-4 rounded-xl bg-green-600 text-white text-lg font-bold shadow disabled:opacity-50"
            >
              {markingId === order.id ? "…" : "Mark Ready / तयार"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
