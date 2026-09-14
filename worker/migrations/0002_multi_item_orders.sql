-- Converts orders from "one item per order" to "one order, many items",
-- so a single customer order (and a single QR code) can cover a full cart.
--
-- SQLite refuses `ALTER TABLE ... DROP COLUMN` on a column used in a FOREIGN
-- KEY (menu_item_id here), so we rebuild the orders table instead. Foreign
-- key enforcement is on, so order_items (which references orders) must not
-- exist yet while the old orders table — the thing it would reference — is
-- being dropped. We stage the old line-item data in a plain table first.

CREATE TABLE IF NOT EXISTS _migration_stage_order_lines (
  order_id INTEGER NOT NULL,
  menu_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  rate INTEGER NOT NULL
);

INSERT INTO _migration_stage_order_lines (order_id, menu_item_id, quantity, rate)
SELECT id, menu_item_id, quantity, CAST(total_amount / quantity AS INTEGER)
FROM orders;

CREATE TABLE orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders_new (id, customer_name, total_amount, status, created_at)
SELECT id, customer_name, total_amount, status, created_at FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  menu_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  rate INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
);

INSERT INTO order_items (order_id, menu_item_id, quantity, rate)
SELECT order_id, menu_item_id, quantity, rate FROM _migration_stage_order_lines;

DROP TABLE _migration_stage_order_lines;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
