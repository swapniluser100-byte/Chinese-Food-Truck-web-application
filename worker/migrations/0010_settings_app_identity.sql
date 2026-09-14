-- Fixed app identity used to look up this deployment's row in the vendor's
-- renewal-tracking spreadsheet. Never written by PUT /api/admin/settings.
ALTER TABLE settings ADD COLUMN app_name TEXT NOT NULL DEFAULT 'Chinese Food Truck Web Application';
ALTER TABLE settings ADD COLUMN app_id TEXT NOT NULL DEFAULT 'ahJAFDCZT8Z51ms';
