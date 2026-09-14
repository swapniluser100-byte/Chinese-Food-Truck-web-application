-- Free-form note staff can attach to an order for the chef.
ALTER TABLE orders ADD COLUMN instructions TEXT;
