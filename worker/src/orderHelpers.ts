import type { Env, Order, OrderItemWithMenu, OrderWithItems } from "./types";

// Fetches the line items for a set of orders in one query and groups them,
// so list endpoints don't run an N+1 query per order.
export async function attachItems(db: D1Database, orders: Order[]): Promise<OrderWithItems[]> {
  if (orders.length === 0) return [];

  const placeholders = orders.map((_, i) => `?${i + 1}`).join(",");
  const { results } = await db
    .prepare(
      `SELECT oi.*, m.name as item_name, m.category as item_category, m.image_ref_id as image_ref_id
       FROM order_items oi JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.id ASC`
    )
    .bind(...orders.map((o) => o.id))
    .all<OrderItemWithMenu>();

  const itemsByOrderId = new Map<number, OrderItemWithMenu[]>();
  for (const item of results) {
    const list = itemsByOrderId.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrderId.set(item.order_id, list);
  }

  return orders.map((order) => ({ ...order, items: itemsByOrderId.get(order.id) ?? [] }));
}

export async function getOrderWithItems(env: Env, id: number): Promise<OrderWithItems | null> {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<Order>();
  if (!order) return null;
  const [withItems] = await attachItems(env.DB, [order]);
  return withItems;
}
