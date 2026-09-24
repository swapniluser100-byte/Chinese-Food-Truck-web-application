import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderStatus, OrderWithItems } from "../../types";
import { STAGES, STAGE_ORDER } from "../../stages";
import { OrderCard } from "../../components/OrderCard";
import { StageChips } from "../../components/StageChips";
import { TopBar } from "../../components/TopBar";

// Ready orders first (they need handing over), then work backwards through the pipeline.
const LIST_ORDER: OrderStatus[] = ["ready", "in_progress", "in_kitchen", "pending_payment"];

export function StaffActiveOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus | null>(null);

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

  const counts = Object.fromEntries(STAGE_ORDER.map((s) => [s, orders.filter((o) => o.status === s).length]));
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="pb-8">
      <TopBar
        title="Active Orders"
        tabs={[
          { to: "/staff", label: "Menu" },
          { to: "/staff/orders", label: "Active Orders" },
        ]}
        links={[
          { to: "/kitchen", label: "Kitchen", icon: "🍳" },
          { to: "/admin", label: "Admin", icon: "⚙️" },
        ]}
      />

      <div className="p-4 space-y-4">
        <StageChips stages={STAGE_ORDER} counts={counts} filter={filter} onChange={setFilter} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {visible.length === 0 && <p className="text-neutral-500 text-sm">No active orders right now.</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onAdvance={() => act(order.id, STAGES[order.status].run!)}
              onCancel={() => cancel(order)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
