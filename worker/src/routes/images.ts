import { Hono } from "hono";
import type { Env } from "../types";

export const imageRoutes = new Hono<{ Bindings: Env }>();

// GET /api/images/:key — public, streams a menu photo straight out of R2
imageRoutes.get("/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.MENU_IMAGES.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
});
