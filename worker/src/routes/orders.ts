import { Hono } from "hono";
import { ORDER_UNITS } from "../types";
import type { Env, MenuItem, NewOrderItemInput, Order, OrderStatus } from "../types";
import { buildUpiUri, renderQrSvg } from "../qr";
import { attachItems, getOrderWithItems } from "../orderHelpers";

export const orderRoutes = new Hono<{ Bindings: Env }>();

// GET /api/orders?status=ready — list orders (with their items), optionally filtered by status
orderRoutes.get("/", async (c) => {
  const status = c.req.query("status") as OrderStatus | undefined;
  const stmt = status
    ? c.env.DB.prepare("SELECT * FROM orders WHERE status = ?1 ORDER BY created_at DESC").bind(status)
    : c.env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100");
  const { results } = await stmt.all<Order>();
  const orders = await attachItems(c.env.DB, results);
  return c.json({ orders });
});

// GET /api/orders/:id
orderRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const order = await getOrderWithItems(c.env, id);
  if (!order) return c.json({ error: "Not found" }, 404);
  return c.json({ order });
});

// POST /api/orders — create a new order from a cart of one or more menu items (status: pending_payment)
// Each line's rate/unit is set by staff in the UI (auto-filled from the menu item, then editable),
// so lines are kept separate rather than merged — the same dish can appear twice as, say, a Half and a Full.
orderRoutes.post("/", async (c) => {
  const body = await c.req.json<{ customer_name?: string; items: NewOrderItemInput[] }>();
  const { customer_name, items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: "items must be a non-empty array of { menu_item_id, quantity, rate, unit }" }, 400);
  }
  for (const line of items) {
    if (
      !Number.isInteger(line.menu_item_id) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      !Number.isFinite(line.rate) ||
      line.rate <= 0 ||
      !ORDER_UNITS.includes(line.unit)
    ) {
      return c.json(
        { error: "Each item needs menu_item_id, a positive integer quantity, a positive rate, and unit of half/full/gram" },
        400
      );
    }
  }

  const menuItemIds = [...new Set(items.map((line) => line.menu_item_id))];
  const placeholders = menuItemIds.map((_, i) => `?${i + 1}`).join(",");
  const { results: menuItems } = await c.env.DB.prepare(
    `SELECT * FROM menu_items WHERE availability = 1 AND id IN (${placeholders})`
  )
    .bind(...menuItemIds)
    .all<MenuItem>();

  if (menuItems.length !== menuItemIds.length) {
    return c.json({ error: "One or more menu items were not found or are unavailable" }, 404);
  }

  const total_amount = items.reduce((sum, line) => sum + Math.round(line.rate) * line.quantity, 0);

  const insertOrder = await c.env.DB.prepare(
    `INSERT INTO orders (customer_name, total_amount, status) VALUES (?1, ?2, 'pending_payment')`
  )
    .bind(customer_name?.trim() || null, total_amount)
    .run();
  const orderId = insertOrder.meta.last_row_id;

  const itemInserts = items.map((line) =>
    c.env.DB.prepare(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, rate, unit) VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(orderId, line.menu_item_id, line.quantity, Math.round(line.rate), line.unit)
  );
  await c.env.DB.batch(itemInserts);

  const order = await getOrderWithItems(c.env, orderId);
  return c.json({ order }, 201);
});

// GET /api/orders/:id/qr — UPI payment QR code (SVG) for this order's total
orderRoutes.get("/:id/qr", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<Order>();
  if (!order) return c.json({ error: "Not found" }, 404);

  if (!c.env.UPI_ID) return c.json({ error: "UPI_ID is not configured on the server" }, 500);

  const uri = buildUpiUri({
    upiId: c.env.UPI_ID,
    payeeName: c.env.UPI_PAYEE_NAME || "Chinese Food Truck",
    amount: order.total_amount,
    note: `Order #${order.id}`,
  });
  const svg = renderQrSvg(uri, 320);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
});

// POST /api/orders/:id/start-preparation — staff confirmed UPI payment, send to kitchen
orderRoutes.post("/:id/start-preparation", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const existing = await c.env.DB.prepare("SELECT status FROM orders WHERE id = ?1").bind(id).first<{ status: string }>();
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "pending_payment") {
    return c.json({ error: `Order is not pending payment (status: ${existing.status})` }, 409);
  }
  await c.env.DB.prepare("UPDATE orders SET status = 'in_kitchen' WHERE id = ?1").bind(id).run();
  const order = await getOrderWithItems(c.env, id);
  return c.json({ order });
});

// POST /api/orders/:id/complete — staff hands over a ready order to the customer
orderRoutes.post("/:id/complete", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const existing = await c.env.DB.prepare("SELECT status FROM orders WHERE id = ?1").bind(id).first<{ status: string }>();
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "ready") {
    return c.json({ error: `Order is not ready (status: ${existing.status})` }, 409);
  }
  await c.env.DB.prepare("UPDATE orders SET status = 'completed' WHERE id = ?1").bind(id).run();
  const order = await getOrderWithItems(c.env, id);
  return c.json({ order });
});
