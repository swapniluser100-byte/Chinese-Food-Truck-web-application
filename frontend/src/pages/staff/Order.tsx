import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import type { MenuItem, OrderWithItem } from "../../types";
import { MenuImage } from "../../components/MenuImage";
import { TopBar } from "../../components/TopBar";

export function StaffOrder() {
  const { menuItemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState<OrderWithItem | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const id = Number(menuItemId);
    if (!Number.isInteger(id)) return;
    api
      .getMenuItem(id)
      .then((r) => setItem(r.item))
      .catch((e) => setError(e.message));
  }, [menuItemId]);

  async function handleSaveOrder() {
    if (!item) return;
    setSaving(true);
    setError("");
    try {
      const { order } = await api.createOrder({
        customer_name: customerName.trim() || undefined,
        menu_item_id: item.id,
        quantity,
      });
      setOrder(order);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStartPreparation() {
    if (!order) return;
    setStarting(true);
    setError("");
    try {
      await api.startPreparation(order.id);
      navigate("/staff/orders");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  if (!item) {
    return (
      <div>
        <TopBar title="New Order" />
        <p className="p-4 text-neutral-500">{error || "Loading item…"}</p>
      </div>
    );
  }

  const total = order ? order.total_amount : item.rate * quantity;

  return (
    <div className="pb-10">
      <TopBar title="New Order / नवीन ऑर्डर" />

      <div className="p-4 max-w-md mx-auto space-y-5">
        <MenuImage imageRefId={item.image_ref_id} category={item.category} name={item.name} className="order-image" />

        <div className="text-center">
          <div className="text-xl font-bold">{item.name}</div>
          <div className="text-neutral-500 text-sm">{item.category}</div>
        </div>

        {!order && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name (optional)</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity / प्रमाण</label>
              <div className="flex items-center gap-3">
                <button
                  className="tap-target w-12 h-12 rounded-full bg-neutral-200 text-2xl font-bold"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 text-center px-2 py-3 rounded-xl border border-neutral-300 text-lg"
                />
                <button
                  className="tap-target w-12 h-12 rounded-full bg-neutral-200 text-2xl font-bold"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-neutral-200">
              <span className="text-neutral-600">Total</span>
              <span className="text-2xl font-bold text-brand-600">₹{total}</span>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="tap-target w-full py-4 rounded-xl bg-brand-500 text-white text-lg font-bold shadow disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Order & Show QR"}
            </button>
          </>
        )}

        {order && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 text-center">
              <div className="text-sm text-neutral-500">Order #{order.id}</div>
              <div className="text-lg">
                {order.quantity} × {order.item_name}
              </div>
              <div className="text-2xl font-bold text-brand-600 mt-1">₹{order.total_amount}</div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex flex-col items-center gap-2">
              <div className="font-semibold">Scan to Pay via UPI</div>
              <img src={api.qrUrl(order.id)} alt="UPI payment QR code" width={240} height={240} className="rounded-lg" />
              <div className="text-xs text-neutral-500">Ask customer to scan &amp; pay ₹{order.total_amount}</div>
            </div>

            <label className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
              <input
                type="checkbox"
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
                className="w-6 h-6"
              />
              <span className="font-medium">Payment received / पेमेंट मिळाले</span>
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleStartPreparation}
              disabled={!paymentConfirmed || starting}
              className="tap-target w-full py-4 rounded-xl bg-green-600 text-white text-lg font-bold shadow disabled:opacity-40"
            >
              {starting ? "Sending…" : "Start Preparation → Kitchen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
