import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { menuRoutes } from "./routes/menu";
import { orderRoutes } from "./routes/orders";
import { kitchenRoutes } from "./routes/kitchen";
import { adminRoutes } from "./routes/admin";
import { settingsRoutes } from "./routes/settings";
import { imageRoutes } from "./routes/images";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/api/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route("/api/menu", menuRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/kitchen", kitchenRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/settings", settingsRoutes);
app.route("/api/images", imageRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
