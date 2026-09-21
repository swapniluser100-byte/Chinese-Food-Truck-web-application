import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderStatus, OrderWithItems } from "../../types";
import { STAGES } from "../../stages";
import { OrderCard } from "../../components/OrderCard";
import { StageChips } from "../../components/StageChips";
import { TopBar } from "../../components/TopBar";
import { useBranding } from "../../BrandingContext";

const KITCHEN_STAGES: OrderStatus[] = ["in_kitchen", "in_progress"];

export function Kitchen() {
  const { settings } = useBranding();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus | null>(null);

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

  async function advance(order: OrderWithItems) {
    setBusyId(order.id);
    setError("");
    try {
      await STAGES[order.status].run!(order.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const counts = Object.fromEntries(KITCHEN_STAGES.map((s) => [s, orders.filter((o) => o.status === s).length]));
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="pb-8">
      <TopBar title="Kitchen" />

      <div className="p-4 space-y-4">
        <StageChips stages={KITCHEN_STAGES} counts={counts} filter={filter} onChange={setFilter} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {visible.length === 0 && <p className="text-neutral-500 text-sm">No orders in the kitchen right now.</p>}

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${settings.kitchen_columns}, minmax(0, 1fr))` }}>
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onAdvance={() => advance(order)}
              showPrice={false}
              showTime
              compact={settings.kitchen_columns >= 3}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
