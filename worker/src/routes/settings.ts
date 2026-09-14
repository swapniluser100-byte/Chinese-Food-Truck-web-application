import { Hono } from "hono";
import type { Env, Settings } from "../types";

export const settingsRoutes = new Hono<{ Bindings: Env }>();

export const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  name: "Chinese Food Truck",
  slogan: null,
  logo_data_url: null,
  menu_columns: 4,
  kitchen_columns: 2,
  app_name: "Chinese Food Truck Web Application",
  app_id: "ahJAFDCZT8Z51ms",
};

// GET /api/settings — public branding + layout + app identity info for the Staff/Kitchen UI
settingsRoutes.get("/", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT name, slogan, logo_data_url, menu_columns, kitchen_columns, app_name, app_id FROM settings WHERE id = 1"
  ).first<Omit<Settings, "id">>();
  return c.json({ settings: row ?? DEFAULT_SETTINGS });
});
