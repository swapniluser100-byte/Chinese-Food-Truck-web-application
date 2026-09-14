-- Lets each order line record its portion unit (half/full/gram); the price
-- itself was already free-form per line (order_items.rate), staff just edit
-- it in the UI after it's auto-filled from the menu item's default rate.
ALTER TABLE order_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'full';
