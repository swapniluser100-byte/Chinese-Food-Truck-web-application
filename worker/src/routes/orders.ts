import { Hono } from "hono";
import type { Env, MenuItem, OrderWithItem, OrderStatus } from "../types";
import { buildUpiUri, renderQrSvg } from "../qr";

export const orderRoutes = new Hono<{ Bindings: Env }>();

const ORDER_SELECT = `
  SELECT o.*, m.name as item_name, m.category as item_category, m.image_ref_id as image_ref_id
  FROM orders o JOIN menu_items m ON m.id = o.menu_item_id
`;

// GET /api/orders?status=ready — list orders, optionally filtered by status
orderRoutes.get("/", async (c) => {
  const status = c.req.query("status") as OrderStatus | undefined;
  const stmt = status
    ? c.env.DB.prepare(`${ORDER_SELECT} WHERE o.status = ?1 ORDER BY o.created_at DESC`).bind(status)
    : c.env.DB.prepare(`${ORDER_SELECT} ORDER BY o.created_at DESC LIMIT 100`);
  const { results } = await stmt.all<OrderWithItem>();
  return c.json({ orders: results });
});

// GET /api/orders/:id
orderRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const order = await c.env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`).bind(id).first<OrderWithItem>();
  if (!order) return c.json({ error: "Not found" }, 404);
  return c.json({ order });
});

// POST /api/orders — create a new order (status: pending_payment)
orderRoutes.post("/", async (c) => {
  const body = await c.req.json<{ customer_name?: string; menu_item_id: number; quantity: number }>();
  const { customer_name, menu_item_id, quantity } = body;

  if (!Number.isInteger(menu_item_id) || !Number.isInteger(quantity) || quantity < 1) {
    return c.json({ error: "menu_item_id and a positive integer quantity are required" }, 400);
  }

  const item = await c.env.DB.prepare("SELECT * FROM menu_items WHERE id = ?1 AND availability = 1")
    .bind(menu_item_id)
    .first<MenuItem>();
  if (!item) return c.json({ error: "Menu item not found or unavailable" }, 404);

  const total_amount = item.rate * quantity;
  const result = await c.env.DB.prepare(
    `INSERT INTO orders (customer_name, menu_item_id, quantity, total_amount, status)
     VALUES (?1, ?2, ?3, ?4, 'pending_payment')`
  )
    .bind(customer_name?.trim() || null, menu_item_id, quantity, total_amount)
    .run();

  const orderId = result.meta.last_row_id;
  const order = await c.env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`).bind(orderId).first<OrderWithItem>();
  return c.json({ order }, 201);
});

// GET /api/orders/:id/qr — UPI payment QR code (SVG) for this order's total
orderRoutes.get("/:id/qr", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<{
    id: number;
    total_amount: number;
  }>();
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
  const order = await c.env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`).bind(id).first<OrderWithItem>();
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
  const order = await c.env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`).bind(id).first<OrderWithItem>();
  return c.json({ order });
});
