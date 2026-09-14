import { Hono } from "hono";
import type { Env, Settings } from "../types";

export const settingsRoutes = new Hono<{ Bindings: Env }>();

const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  name: "Chinese Food Truck",
  slogan: null,
  logo_data_url: null,
};

// GET /api/settings — public branding info (name, slogan, logo) for the Staff/Kitchen UI
settingsRoutes.get("/", async (c) => {
  const row = await c.env.DB.prepare("SELECT name, slogan, logo_data_url FROM settings WHERE id = 1").first<
    Omit<Settings, "id">
  >();
  return c.json({ settings: row ?? DEFAULT_SETTINGS });
});
