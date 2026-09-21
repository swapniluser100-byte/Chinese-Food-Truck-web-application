import { useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderWithItems } from "../../types";
import { OrderCard } from "../../components/OrderCard";

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
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field !w-auto">
          <option value="">All statuses</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="in_kitchen">Queued</option>
          <option value="in_progress">Cooking</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {orders.length === 0 && <p className="text-neutral-500 text-sm">No orders for this filter.</p>}

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} showTime compact />
        ))}
      </div>
    </div>
  );
}
