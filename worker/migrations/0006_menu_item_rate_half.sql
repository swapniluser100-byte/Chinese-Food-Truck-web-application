-- Optional half-portion price per menu item; when unset, a half order falls
-- back to the full `rate` (staff can still edit the price manually either way).
ALTER TABLE menu_items ADD COLUMN rate_half INTEGER;
