import { Hono } from "hono";
import type { Env, MenuItem, Order } from "../types";
import { createAdminToken, requireAdmin } from "../auth";
import { attachItems } from "../orderHelpers";

export const adminRoutes = new Hono<{ Bindings: Env }>();

// POST /api/admin/login — public, issues a session token
adminRoutes.post("/login", async (c) => {
  const { password } = await c.req.json<{ password?: string }>();
  if (!c.env.ADMIN_PASSWORD) return c.json({ error: "ADMIN_PASSWORD is not configured on the server" }, 500);
  if (!password || password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Invalid password" }, 401);
  }
  const token = await createAdminToken(c.env.TOKEN_SECRET);
  return c.json({ token });
});

// Everything below requires a valid admin token
adminRoutes.use("/*", requireAdmin);

// ---- Menu management ----

adminRoutes.get("/menu", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM menu_items ORDER BY category, name").all<MenuItem>();
  return c.json({ items: results });
});

adminRoutes.post("/menu", async (c) => {
  const body = await c.req.json<Partial<MenuItem>>();
  const { name, category, rate, availability = 1, top_item = 0, image_ref_id } = body;
  if (!name || !category || !Number.isFinite(rate) || !image_ref_id) {
    return c.json({ error: "name, category, rate, and image_ref_id are required" }, 400);
  }
  const result = await c.env.DB.prepare(
    `INSERT INTO menu_items (name, category, rate, availability, top_item, image_ref_id)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  )
    .bind(name, category, rate, availability ? 1 : 0, top_item ? 1 : 0, image_ref_id)
    .run();
  const item = await c.env.DB.prepare("SELECT * FROM menu_items WHERE id = ?1").bind(result.meta.last_row_id).first();
  return c.json({ item }, 201);
});

adminRoutes.put("/menu/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const existing = await c.env.DB.prepare("SELECT * FROM menu_items WHERE id = ?1").bind(id).first<MenuItem>();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json<Partial<MenuItem>>();
  const merged: MenuItem = {
    ...existing,
    ...body,
    availability: body.availability !== undefined ? (body.availability ? 1 : 0) : existing.availability,
    top_item: body.top_item !== undefined ? (body.top_item ? 1 : 0) : existing.top_item,
  };

  await c.env.DB.prepare(
    `UPDATE menu_items SET name = ?1, category = ?2, rate = ?3, availability = ?4, top_item = ?5, image_ref_id = ?6
     WHERE id = ?7`
  )
    .bind(merged.name, merged.category, merged.rate, merged.availability, merged.top_item, merged.image_ref_id, id)
    .run();

  const item = await c.env.DB.prepare("SELECT * FROM menu_items WHERE id = ?1").bind(id).first();
  return c.json({ item });
});

adminRoutes.delete("/menu/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  await c.env.DB.prepare("DELETE FROM menu_items WHERE id = ?1").bind(id).run();
  return c.json({ ok: true });
});

// ---- Orders ----

// GET /api/admin/orders?date=YYYY-MM-DD&status=completed
adminRoutes.get("/orders", async (c) => {
  const date = c.req.query("date");
  const status = c.req.query("status");
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (date) {
    conditions.push(`date(o.created_at) = ?${bindings.length + 1}`);
    bindings.push(date);
  }
  if (status) {
    conditions.push(`o.status = ?${bindings.length + 1}`);
    bindings.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = c.env.DB.prepare(
    `SELECT * FROM orders o ${where} ORDER BY o.created_at DESC LIMIT 500`
  ).bind(...bindings);
  const { results } = await stmt.all<Order>();
  const orders = await attachItems(c.env.DB, results);
  return c.json({ orders });
});

// ---- Reporting ----

// GET /api/admin/summary?date=YYYY-MM-DD (defaults to today, server's UTC date)
adminRoutes.get("/summary", async (c) => {
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);

  const totals = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM orders WHERE date(created_at) = ?1 AND status = 'completed') as order_count,
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE date(created_at) = ?1 AND status = 'completed') as total_sales,
       (SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE date(o.created_at) = ?1 AND o.status = 'completed') as items_sold`
  )
    .bind(date)
    .first<{ order_count: number; total_sales: number; items_sold: number }>();

  const { results: byItem } = await c.env.DB.prepare(
    `SELECT m.name as item_name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.rate) as revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE date(o.created_at) = ?1 AND o.status = 'completed'
     GROUP BY m.name
     ORDER BY revenue DESC`
  )
    .bind(date)
    .all<{ item_name: string; quantity: number; revenue: number }>();

  const { results: byStatus } = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM orders WHERE date(created_at) = ?1 GROUP BY status`
  )
    .bind(date)
    .all<{ status: string; count: number }>();

  return c.json({ date, totals, byItem, byStatus });
});

// GET /api/admin/export?date=YYYY-MM-DD — CSV export of that day's orders
adminRoutes.get("/export", async (c) => {
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
  const { results } = await c.env.DB.prepare(
    `SELECT o.id, o.customer_name, m.name as item_name, oi.quantity, oi.unit, oi.grams, oi.rate,
            (oi.quantity * oi.rate) as line_total, o.total_amount, o.status, o.created_at
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE date(o.created_at) = ?1
     ORDER BY o.created_at ASC, oi.id ASC`
  )
    .bind(date)
    .all<{
      id: number;
      customer_name: string | null;
      item_name: string;
      quantity: number;
      unit: string;
      grams: number | null;
      rate: number;
      line_total: number;
      total_amount: number;
      status: string;
      created_at: string;
    }>();

  const header = "Order ID,Customer Name,Item,Unit,Grams,Quantity,Line Total,Order Total,Status,Created At";
  const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = results.map((r) =>
    [r.id, escapeCsv(r.customer_name ?? ""), escapeCsv(r.item_name), r.unit, r.grams ?? "", r.quantity, r.line_total, r.total_amount, r.status, r.created_at].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return c.body(csv, 200, {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="orders_${date}.csv"`,
  });
});

// ---- Branding ----

const MAX_LOGO_DATA_URL_LENGTH = 1_500_000; // ~1.1MB of raw image data once base64-decoded

// PUT /api/admin/settings — update app name / slogan / logo
adminRoutes.put("/settings", async (c) => {
  const body = await c.req.json<{ name?: string; slogan?: string | null; logo_data_url?: string | null }>();
  const name = (body.name ?? "").trim();
  if (!name) return c.json({ error: "name is required" }, 400);

  const slogan = body.slogan?.trim() || null;
  const logo_data_url = body.logo_data_url || null;
  if (logo_data_url && logo_data_url.length > MAX_LOGO_DATA_URL_LENGTH) {
    return c.json({ error: "Logo image is too large — please use a smaller file (under ~1MB)" }, 400);
  }
  if (logo_data_url && !logo_data_url.startsWith("data:image/")) {
    return c.json({ error: "logo_data_url must be an image data URL" }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO settings (id, name, slogan, logo_data_url) VALUES (1, ?1, ?2, ?3)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, slogan = excluded.slogan, logo_data_url = excluded.logo_data_url`
  )
    .bind(name, slogan, logo_data_url)
    .run();

  return c.json({ settings: { name, slogan, logo_data_url } });
});
