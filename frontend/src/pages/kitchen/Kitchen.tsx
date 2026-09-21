import { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderStatus, OrderWithItems } from "../../types";
import { STAGES } from "../../stages";
import { OrderCard } from "../../components/OrderCard";
import { TopBar } from "../../components/TopBar";
import { useBranding } from "../../BrandingContext";

const COLUMNS: { status: OrderStatus; empty: string }[] = [
  { status: "in_kitchen", empty: "No queued orders" },
  { status: "in_progress", empty: "Nothing cooking right now" },
];

export function Kitchen() {
  const { settings } = useBranding();
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

  const perRow = Math.max(1, Math.floor(settings.kitchen_columns / 2));

  return (
    <div className="pb-8">
      <TopBar title="Kitchen" />

      <div className="p-4 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {COLUMNS.map(({ status, empty }) => {
            const t = STAGES[status];
            const list = orders.filter((o) => o.status === status);
            return (
              <section key={status} className="space-y-3 min-w-0">
                <div className={`${t.chip} text-white rounded-xl px-3 py-3 font-bold shadow flex items-center justify-center gap-2`}>
                  {t.label}
                  <span className={`${t.count} rounded-full px-2 py-0.5 text-sm`}>{list.length}</span>
                </div>

                {list.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">{empty}</p>}

                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
                  {list.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      onAdvance={() => advance(order)}
                      showPrice={false}
                      showTime
                      compact={perRow >= 2}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
