
INSERT INTO menu_items (name, base_price, item_type) VALUES
('Chicken Fried Rice', 12.99, 'fried_rice'),
('Vegetable Fried Rice', 10.99, 'fried_rice'),
('Chicken Curry', 14.99, 'curry'),
('Beef Curry', 16.99, 'curry'),
('Vegetable Curry', 12.99, 'curry'),
('Spring Rolls', 6.99, 'snack'),
('Samosas', 5.99, 'snack'),
('Masala Tea', 3.99, 'tea'),
('Green Tea', 2.99, 'tea'),
('Chai Latte', 4.99, 'tea');

INSERT INTO menu_item_options (menu_item_id, option_name, price_modifier) VALUES
-- Fried Rice options (multiple selection)
(1, 'Extra Vegetables', 2.00),
(1, 'Extra Chicken', 3.00),
(1, 'Spicy Level: Mild', 0.00),
(1, 'Spicy Level: Medium', 0.00),
(1, 'Spicy Level: Hot', 0.00),
(2, 'Extra Vegetables', 2.00),
(2, 'Add Tofu', 2.50),
(2, 'Spicy Level: Mild', 0.00),
(2, 'Spicy Level: Medium', 0.00),
(2, 'Spicy Level: Hot', 0.00),

-- Curry options (single selection)
(3, 'Mild', 0.00),
(3, 'Medium', 0.00),
(3, 'Hot', 0.00),
(3, 'Extra Hot', 1.00),
(4, 'Mild', 0.00),
(4, 'Medium', 0.00),
(4, 'Hot', 0.00),
(4, 'Extra Hot', 1.00),
(5, 'Mild', 0.00),
(5, 'Medium', 0.00),
(5, 'Hot', 0.00),
(5, 'Extra Hot', 1.00),

-- Tea options (single selection)
(8, 'Small', 0.00),
(8, 'Large', 1.50),
(9, 'Small', 0.00),
(9, 'Large', 1.50),
(10, 'Small', 0.00),
(10, 'Large', 1.50);
