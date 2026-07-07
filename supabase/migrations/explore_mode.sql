-- Migration template for explore mode configurations
CREATE TYPE product_category_enum AS ENUM ('apparel', 'food');

-- Create the base products table if it doesn't exist so the ALTER command succeeds
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Alternative 1: Adding dynamic configuration categories to existing base structures
ALTER TABLE products ADD COLUMN IF NOT EXISTS category product_category_enum DEFAULT 'apparel';

-- Alternative 2: Isolated fast-lookup table structures for Food Mode items
CREATE TABLE IF NOT EXISTS food_items (
    id BIGSERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    restaurant_name TEXT NOT NULL,
    delivery_time TEXT NOT NULL,
    calories_or_type TEXT NOT NULL, -- e.g., 'Veg' or 'Non-Veg'
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
