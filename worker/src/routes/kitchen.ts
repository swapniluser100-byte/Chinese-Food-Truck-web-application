import { Hono } from "hono";
import type { Env, Order } from "../types";
import { attachItems, getOrderWithItems } from "../orderHelpers";

export const kitchenRoutes = new Hono<{ Bindings: Env }>();

// GET /api/kitchen/orders — orders currently being prepared, oldest first
kitchenRoutes.get("/orders", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE status = 'in_kitchen' ORDER BY created_at ASC"
  ).all<Order>();
  const orders = await attachItems(c.env.DB, results);
  return c.json({ orders });
});

// POST /api/kitchen/orders/:id/ready — mark an order ready for pickup
kitchenRoutes.post("/orders/:id/ready", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const existing = await c.env.DB.prepare("SELECT status FROM orders WHERE id = ?1").bind(id).first<{ status: string }>();
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (existing.status !== "in_kitchen") {
    return c.json({ error: `Order is not in kitchen (status: ${existing.status})` }, 409);
  }
  await c.env.DB.prepare("UPDATE orders SET status = 'ready' WHERE id = ?1").bind(id).run();
  const order = await getOrderWithItems(c.env, id);
  return c.json({ order });
});
