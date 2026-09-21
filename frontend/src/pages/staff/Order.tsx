import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import type { MenuItem, OrderUnit, OrderWithItems } from "../../types";
import { ORDER_UNITS } from "../../types";
import { formatOrderLine } from "../../orderSummary";
import { MenuImage } from "../../components/MenuImage";
import { TopBar } from "../../components/TopBar";
import { STAGES } from "../../stages";

const DEFAULT_GRAMS = 250;

interface CartLine {
  lineId: string;
  item: MenuItem;
  quantity: number;
  unit: OrderUnit;
  rate: number; // auto-filled from item.rate, editable by staff
  grams: number; // only used when unit === "gram"
}

function newLine(item: MenuItem): CartLine {
  return { lineId: crypto.randomUUID(), item, quantity: 1, unit: "full", rate: item.rate, grams: DEFAULT_GRAMS };
}

export function StaffOrder() {
  const { menuItemId } = useParams();
  const navigate = useNavigate();
  const seeded = useRef(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [instructions, setInstructions] = useState("");
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
      .then((r) => setCart([newLine(r.item)]))
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
    setCart((prev) => [...prev, newLine(item)]);
    setQuery("");
    setResults([]);
  }

  function setQuantity(lineId: string, quantity: number) {
    setCart((prev) =>
      quantity < 1 ? prev.filter((line) => line.lineId !== lineId) : prev.map((line) => (line.lineId === lineId ? { ...line, quantity } : line))
    );
  }

  function setUnit(lineId: string, unit: OrderUnit) {
    setCart((prev) =>
      prev.map((line) => {
        if (line.lineId !== lineId) return line;
        const rate = unit === "full" ? line.item.rate : unit === "half" ? line.item.rate_half ?? line.item.rate : line.rate;
        return { ...line, unit, quantity: unit === "gram" ? 1 : line.quantity, rate };
      })
    );
  }

  function setRate(lineId: string, rate: number) {
    setCart((prev) => prev.map((line) => (line.lineId === lineId ? { ...line, rate } : line)));
  }

  function setGrams(lineId: string, grams: number) {
    setCart((prev) => prev.map((line) => (line.lineId === lineId ? { ...line, grams } : line)));
  }

  function removeLine(lineId: string) {
    setCart((prev) => prev.filter((line) => line.lineId !== lineId));
  }

  const cartTotal = cart.reduce((sum, line) => sum + line.rate * line.quantity, 0);

  async function handleSaveOrder() {
    if (cart.length === 0) return;
    setSaving(true);
    setError("");
    try {
      const { order } = await api.createOrder({
        customer_name: customerName.trim() || undefined,
        instructions: instructions.trim() || undefined,
        items: cart.map((line) => ({
          menu_item_id: line.item.id,
          quantity: line.quantity,
          rate: line.rate,
          unit: line.unit,
          grams: line.unit === "gram" ? line.grams : undefined,
        })),
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
                className="field"
              />
              {query.trim() && (
                <div className="mt-2 space-y-2">
                  {results.length === 0 && <p className="text-neutral-500 text-sm">No matching items.</p>}
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="tap-target w-full flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 shadow-sm p-2.5 text-left"
                    >
                      <MenuImage
                        imageRefId={item.image_ref_id}
                        category={item.category}
                        name={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs text-neutral-500">₹{item.rate}</div>
                      </div>
                      <span className="bg-brand-500 text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center">+</span>
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
                  <div key={line.lineId} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <MenuImage
                        imageRefId={line.item.image_ref_id}
                        category={line.item.category}
                        name={line.item.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{line.item.name}</div>
                        <div className="text-xs text-neutral-500">
                          Full ₹{line.item.rate}
                          {line.item.rate_half ? ` · Half ₹${line.item.rate_half}` : ""}
                        </div>
                      </div>
                      <button onClick={() => removeLine(line.lineId)} className="tap-target bg-neutral-600 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 self-start">
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={line.unit}
                        onChange={(e) => setUnit(line.lineId, e.target.value as OrderUnit)}
                        className="px-2 py-2 rounded-lg border border-neutral-300 bg-white text-sm"
                      >
                        {ORDER_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-300">
                        <span className="text-neutral-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={line.rate}
                          onChange={(e) => setRate(line.lineId, Math.max(0, Number(e.target.value) || 0))}
                          className="w-16 text-sm outline-none"
                        />
                      </div>

                      {line.unit === "gram" ? (
                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-neutral-300 ml-auto">
                          <input
                            type="number"
                            min={1}
                            value={line.grams}
                            onChange={(e) => setGrams(line.lineId, Math.max(1, Number(e.target.value) || 0))}
                            className="w-16 text-sm outline-none"
                          />
                          <span className="text-neutral-500 text-sm">grams</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            className="tap-target w-8 h-8 rounded-full bg-brand-500 text-white text-lg font-bold leading-none"
                            onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">{line.quantity}</span>
                          <button
                            className="tap-target w-8 h-8 rounded-full bg-brand-500 text-white text-lg font-bold leading-none"
                            onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-t border-neutral-200">
                      <span className="text-sm text-neutral-500">Subtotal</span>
                      <span className="text-lg font-semibold text-neutral-700">₹{line.rate * line.quantity}</span>
                    </div>
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
                className="field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Instructions for Chef (optional)</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Less spicy, no onions"
                rows={2}
                className="field resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm border border-neutral-200">
              <span className="text-neutral-600 font-medium">Total</span>
              <span className="text-2xl font-bold text-brand-600">₹{cartTotal}</span>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSaveOrder}
              disabled={saving || cart.length === 0}
              className="tap-target w-full py-4 rounded-2xl bg-brand-500 text-white text-lg font-bold shadow disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Order & Show QR"}
            </button>
          </>
        )}

        {order && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
              <div className="flex justify-center mb-3">
                <div className="inline-flex rounded-full overflow-hidden text-sm font-bold">
                  <span className={`${STAGES.pending_payment.pillId} px-3 py-1`}>#{order.id}</span>
                  <span className={`${STAGES.pending_payment.pillLabel} px-3 py-1`}>{STAGES.pending_payment.label}</span>
                </div>
              </div>
              <div className="space-y-1">
                {order.items.map((line) => (
                  <div key={line.id} className="flex justify-between text-sm border-b border-neutral-100 py-1 last:border-0">
                    <span>{formatOrderLine(line)}</span>
                    <span className="font-medium">₹{line.quantity * line.rate}</span>
                  </div>
                ))}
              </div>
              <div className="text-2xl font-bold text-brand-600 mt-2 text-center">₹{order.total_amount}</div>
              {order.instructions && (
                <div className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <span className="font-medium">Instructions:</span> {order.instructions}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 flex flex-col items-center gap-2">
              <div className="font-semibold">Scan to Pay via UPI</div>
              <img src={api.qrUrl(order.id)} alt="UPI payment QR code" width={240} height={240} className="rounded-lg" />
              <div className="text-xs text-neutral-500">Ask customer to scan &amp; pay ₹{order.total_amount}</div>
            </div>

            <label className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
              <input
                type="checkbox"
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
                className="w-6 h-6 accent-green-600"
              />
              <span className="font-medium">Payment received</span>
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleStartPreparation}
              disabled={!paymentConfirmed || starting}
              className="tap-target w-full py-4 rounded-2xl bg-green-600 text-white text-lg font-bold shadow disabled:opacity-40"
            >
              {starting ? "Sending…" : "Start Preparation → Kitchen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
