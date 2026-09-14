This folder ships with a starter photo per menu item (turn0image0.jpg,
turn0image1.jpg, ...) sourced from Wikimedia Commons — see CREDITS.md for
attribution. They're placeholders, not photos of this truck's own cooking.

To use your own photo for an item, just overwrite the file named after that
item's image_ref_id, e.g. replace turn0image4.jpg with your own Chicken
Lollipop photo (same filename, any real photo works). Any item without a
matching file automatically falls back to a colored placeholder tile (see
src/components/MenuImage.tsx), so the app never breaks while you're still
photographing the menu.
