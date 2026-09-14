-- Seed data — 20 menu items

INSERT INTO menu_items (name, category, rate, availability, top_item, image_ref_id) VALUES
('Triple Rice', 'Rice', 140, 1, 1, 'turn0image0'),
('Veg Hakka Noodles', 'Noodles', 120, 1, 1, 'turn0image1'),
('Chicken Hakka Noodles', 'Noodles', 160, 1, 1, 'turn0image2'),
('Veg Manchurian Gravy', 'Starters', 130, 1, 1, 'turn0image3'),
('Chicken Lollipop', 'Starters', 180, 1, 1, 'turn0image4'),
('Schezwan Fried Rice', 'Rice', 150, 1, 1, 'turn0image5'),
('Veg Fried Rice', 'Rice', 120, 1, 0, 'turn0image6'),
('Paneer Chilli', 'Starters', 160, 1, 0, 'turn0image7'),
('Chicken Manchurian', 'Starters', 170, 1, 0, 'turn0image8'),
('Egg Fried Rice', 'Rice', 130, 1, 0, 'turn0image9'),
('Veg Chowmein', 'Noodles', 110, 1, 0, 'turn0image10'),
('Chicken Chowmein', 'Noodles', 150, 1, 0, 'turn0image11'),
('Paneer Fried Rice', 'Rice', 140, 1, 0, 'turn0image12'),
('Mushroom Manchurian', 'Starters', 150, 1, 0, 'turn0image13'),
('Chicken Crispy', 'Starters', 180, 1, 0, 'turn0image14'),
('Veg Crispy', 'Starters', 140, 1, 0, 'turn0image15'),
('Garlic Noodles', 'Noodles', 130, 1, 0, 'turn0image16'),
('Singapore Noodles', 'Noodles', 140, 1, 0, 'turn0image17'),
('Chilli Chicken', 'Starters', 170, 1, 0, 'turn0image18'),
('Veg Soup', 'Soup', 100, 1, 0, 'turn0image19');

-- Two of top_item rows above (7 total) exceed "top 10" only in count sense;
-- mark 3 more as top so the Staff Home page has a full 10 big buttons.
UPDATE menu_items SET top_item = 1 WHERE name IN ('Veg Fried Rice', 'Paneer Chilli', 'Chicken Manchurian');
