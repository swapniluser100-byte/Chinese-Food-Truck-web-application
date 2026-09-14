-- image_ref_id is now an R2 object key served via GET /api/images/:key, so it
-- needs its file extension. The 20 seeded items were bundled as .jpg; admin-
-- uploaded images already get their extension from the upload endpoint.
UPDATE menu_items SET image_ref_id = image_ref_id || '.jpg' WHERE image_ref_id NOT LIKE '%.%';
