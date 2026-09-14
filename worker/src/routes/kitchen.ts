import { Hono } from "hono";
import type { Env, OrderWithItem } from "../types";

export const kitchenRoutes = new Hono<{ Bindings: Env }>();

const ORDER_SELECT = `
  SELECT o.*, m.name as item_name, m.category as item_category, m.image_ref_id as image_ref_id
  FROM orders o JOIN menu_items m ON m.id = o.menu_item_id
`;

// GET /api/kitchen/orders — orders currently being prepared, oldest first
kitchenRoutes.get("/orders", async (c) => {
  const { results } = await c.env.DB.prepare(
    `${ORDER_SELECT} WHERE o.status = 'in_kitchen' ORDER BY o.created_at ASC`
  ).all<OrderWithItem>();
  return c.json({ orders: results });
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
  const order = await c.env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`).bind(id).first<OrderWithItem>();
  return c.json({ order });
});
