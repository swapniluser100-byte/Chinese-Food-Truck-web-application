import { useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderWithItems } from "../../types";
import { summarizeItems } from "../../orderSummary";
import { StatusBadge } from "../../components/StatusBadge";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AdminOrders() {
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { orders } = await api.adminListOrders({ date, status: status || undefined });
      setOrders(orders);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex gap-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-neutral-300 flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-neutral-300">
          <option value="">All statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="in_kitchen">In Kitchen</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {orders.length === 0 && <p className="text-neutral-500 text-sm">No orders for this filter.</p>}

      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-3 shadow-sm border border-neutral-200 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold">#{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="truncate">
                {summarizeItems(order)}
                {order.customer_name ? ` — ${order.customer_name}` : ""}
              </div>
              <div className="text-xs text-neutral-400">{new Date(order.created_at).toLocaleString()}</div>
            </div>
            <div className="font-bold text-brand-600">₹{order.total_amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
