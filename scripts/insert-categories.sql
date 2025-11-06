-- Insert AAC Master Categories
-- Run this in Supabase SQL Editor

INSERT INTO public.aac_master_categories (name, display_name, icon, order_index, is_active) VALUES
    ('food', 'Food', '🍽️', 0, true),
    ('activities', 'Activities', '⚽', 1, true),
    ('emotions', 'Emotions', '😊', 2, true),
    ('people', 'People', '👥', 3, true),
    ('objects', 'Objects', '📦', 4, true)
ON CONFLICT (name) DO NOTHING;

-- Get the category UUIDs
SELECT
    name,
    id,
    display_name,
    icon,
    order_index
FROM public.aac_master_categories
ORDER BY order_index;
