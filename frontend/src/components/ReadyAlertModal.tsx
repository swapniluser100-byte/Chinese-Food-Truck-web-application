import type { OrderWithItems } from "../types";
import { summarizeItems } from "../orderSummary";

export function ReadyAlertModal({ orders, onDismiss }: { orders: OrderWithItems[]; onDismiss: () => void }) {
  if (orders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onDismiss}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border-4 border-green-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-2 animate-bounce">🔔</div>
        <h2 className="text-2xl font-extrabold text-green-600 mb-4">
          {orders.length > 1 ? `${orders.length} Orders Ready!` : "Order Ready!"}
        </h2>
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {orders.map((order) => (
            <div key={order.id} className="bg-green-50 border border-green-200 rounded-xl p-3 text-left">
              <div className="font-bold text-lg">
                Order #{order.id}
                {order.customer_name ? ` — ${order.customer_name}` : ""}
              </div>
              <div className="text-sm text-neutral-600">{summarizeItems(order)}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="tap-target w-full py-4 rounded-xl bg-green-600 text-white text-lg font-bold shadow"
        >
          Got it — Notify Customer
        </button>
      </div>
    </div>
  );
}
