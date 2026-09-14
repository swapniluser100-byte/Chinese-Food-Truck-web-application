-- Chinese Food Truck — D1 schema

-- `image_ref_id` is an R2 object key (served via GET /api/images/:key), not a
-- static frontend asset path. `rate_half` is optional; a half order falls
-- back to `rate` (the full price) when it isn't set.
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rate INTEGER NOT NULL,
  rate_half INTEGER,
  availability BOOLEAN DEFAULT 1,
  top_item BOOLEAN DEFAULT 0,
  image_ref_id TEXT NOT NULL
);

-- One order = one customer's full cart (can contain several menu items).
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  instructions TEXT, -- free-form note to the chef, set by staff at order time
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- pending_payment, in_kitchen, in_progress, ready, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One row per menu item within an order. `rate` starts auto-filled from the
-- menu item's price but staff can edit it per line (e.g. for a half portion
-- or a gram-based price); `unit` records what that rate is for.
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  menu_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  rate INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'full', -- half, full, gram
  grams INTEGER, -- set when unit = 'gram'
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
);

-- Single-row app branding and layout settings. Logo is stored as a data: URL
-- — there's no object storage wired up for it, and a small logo fits fine in
-- D1. menu_columns/kitchen_columns control tiles-per-row on the Staff Home
-- menu grid and the Kitchen board, respectively.
-- app_name/app_id identify this deployment in the vendor's renewal-tracking
-- spreadsheet; the admin API never writes them (see PUT /api/admin/settings),
-- so they're effectively read-only regardless of what a client sends.
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Chinese Food Truck',
  slogan TEXT,
  logo_data_url TEXT,
  menu_columns INTEGER NOT NULL DEFAULT 4,
  kitchen_columns INTEGER NOT NULL DEFAULT 2,
  app_name TEXT NOT NULL DEFAULT 'Chinese Food Truck Web Application',
  app_id TEXT NOT NULL DEFAULT 'ahJAFDCZT8Z51ms'
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_top ON menu_items(top_item);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items(availability);
