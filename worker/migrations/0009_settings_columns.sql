-- Configurable tiles-per-row for the Staff Home menu grid and the Kitchen board.
ALTER TABLE settings ADD COLUMN menu_columns INTEGER NOT NULL DEFAULT 4;
ALTER TABLE settings ADD COLUMN kitchen_columns INTEGER NOT NULL DEFAULT 2;
