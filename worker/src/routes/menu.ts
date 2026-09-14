import { Hono } from "hono";
import type { Env, MenuItem } from "../types";

export const menuRoutes = new Hono<{ Bindings: Env }>();

// GET /api/menu — all available items
menuRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM menu_items WHERE availability = 1 ORDER BY category, name"
  ).all<MenuItem>();
  return c.json({ items: results });
});

// GET /api/menu/top — top 10 items for the Staff Home big buttons
menuRoutes.get("/top", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM menu_items WHERE availability = 1 AND top_item = 1 ORDER BY name LIMIT 10"
  ).all<MenuItem>();
  return c.json({ items: results });
});

// GET /api/menu/search?q=noodles
menuRoutes.get("/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (!q) return c.json({ items: [] });
  const like = `%${q}%`;
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM menu_items WHERE availability = 1 AND (name LIKE ?1 OR category LIKE ?1) ORDER BY name LIMIT 30"
  )
    .bind(like)
    .all<MenuItem>();
  return c.json({ items: results });
});

// GET /api/menu/:id
menuRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  const item = await c.env.DB.prepare("SELECT * FROM menu_items WHERE id = ?1").bind(id).first<MenuItem>();
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ item });
});
