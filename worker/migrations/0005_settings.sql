-- Single-row app branding (name, slogan, logo). GET returns sensible
-- defaults when the row doesn't exist yet, so no seed insert is needed here.
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Chinese Food Truck',
  slogan TEXT,
  logo_data_url TEXT
);
