import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import type { MenuItem, OrderWithItems } from "../../types";
import { MenuImage } from "../../components/MenuImage";
import { TopBar } from "../../components/TopBar";

interface CartLine {
  item: MenuItem;
  quantity: number;
}

export function StaffOrder() {
  const { menuItemId } = useParams();
  const navigate = useNavigate();
  const seeded = useRef(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);

  // Seed the cart with the item tapped from Staff Home, if any.
  useEffect(() => {
    const id = Number(menuItemId);
    if (!Number.isInteger(id) || seeded.current) return;
    seeded.current = true;
    api
      .getMenuItem(id)
      .then((r) => setCart([{ item: r.item, quantity: 1 }]))
      .catch((e) => setError(e.message));
  }, [menuItemId]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .searchMenu(q)
        .then((r) => setResults(r.items))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) => (line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...prev, { item, quantity: 1 }];
    });
    setQuery("");
    setResults([]);
  }

  function setQuantity(itemId: number, quantity: number) {
    setCart((prev) =>
      quantity < 1 ? prev.filter((line) => line.item.id !== itemId) : prev.map((line) => (line.item.id === itemId ? { ...line, quantity } : line))
    );
  }

  function removeLine(itemId: number) {
    setCart((prev) => prev.filter((line) => line.item.id !== itemId));
  }

  const cartTotal = cart.reduce((sum, line) => sum + line.item.rate * line.quantity, 0);

  async function handleSaveOrder() {
    if (cart.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const { order } = await api.createOrder({
        customer_name: customerName.trim() || undefined,
        items: cart.map((line) => ({ menu_item_id: line.item.id, quantity: line.quantity })),
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

  return (
    <div className="pb-10">
      <TopBar title="New Order" />

      <div className="p-4 max-w-md mx-auto space-y-5">
        {!order && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Add item</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu by name or category"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-base"
              />
              {query.trim() && (
                <div className="mt-2 space-y-2">
                  {results.length === 0 && <p className="text-neutral-500 text-sm">No matching items.</p>}
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="tap-target w-full flex items-center gap-3 bg-white rounded-xl border border-neutral-200 shadow-sm p-2 text-left"
                    >
                      <MenuImage
                        imageRefId={item.image_ref_id}
                        category={item.category}
                        name={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-neutral-500">₹{item.rate}</div>
                      </div>
                      <span className="text-brand-600 font-bold text-lg px-2">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cart.length === 0 && (
              <p className="text-center text-neutral-500 text-sm py-6">Search above to add items to this order.</p>
            )}

            {cart.length > 0 && (
              <div className="space-y-2">
                {cart.map((line) => (
                  <div key={line.item.id} className="bg-white rounded-xl p-3 shadow-sm border border-neutral-200 flex items-center gap-3">
                    <MenuImage
                      imageRefId={line.item.image_ref_id}
                      category={line.item.category}
                      name={line.item.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{line.item.name}</div>
                      <div className="text-xs text-neutral-500">₹{line.item.rate} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="tap-target w-8 h-8 rounded-full bg-neutral-200 text-lg font-bold"
                        onClick={() => setQuantity(line.item.id, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold">{line.quantity}</span>
                      <button
                        className="tap-target w-8 h-8 rounded-full bg-neutral-200 text-lg font-bold"
                        onClick={() => setQuantity(line.item.id, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => removeLine(line.item.id)} className="text-red-500 text-sm font-medium px-1">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Customer Name (optional)</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-base"
              />
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-neutral-200">
              <span className="text-neutral-600">Total</span>
              <span className="text-2xl font-bold text-brand-600">₹{cartTotal}</span>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSaveOrder}
              disabled={saving || cart.length === 0}
              className="tap-target w-full py-4 rounded-xl bg-brand-500 text-white text-lg font-bold shadow disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Order & Show QR"}
            </button>
          </>
        )}

        {order && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
              <div className="text-sm text-neutral-500 text-center mb-2">Order #{order.id}</div>
              <div className="space-y-1">
                {order.items.map((line) => (
                  <div key={line.id} className="flex justify-between text-sm border-b border-neutral-100 py-1 last:border-0">
                    <span>
                      {line.quantity} × {line.item_name}
                    </span>
                    <span className="font-medium">₹{line.quantity * line.rate}</span>
                  </div>
                ))}
              </div>
              <div className="text-2xl font-bold text-brand-600 mt-2 text-center">₹{order.total_amount}</div>
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
              <span className="font-medium">Payment received</span>
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
