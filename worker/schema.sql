-- Chinese Food Truck — D1 schema

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rate INTEGER NOT NULL,
  availability BOOLEAN DEFAULT 1,
  top_item BOOLEAN DEFAULT 0,
  image_ref_id TEXT NOT NULL
);

-- One order = one customer's full cart (can contain several menu items).
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- pending_payment, in_kitchen, ready, completed
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
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_top ON menu_items(top_item);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items(availability);
