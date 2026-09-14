-- Lets a gram-unit order line record the weight ordered (e.g. 250) alongside
-- its staff-set price; quantity stays fixed at 1 for these lines.
ALTER TABLE order_items ADD COLUMN grams INTEGER;
