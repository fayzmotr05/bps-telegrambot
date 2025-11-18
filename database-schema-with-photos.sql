-- BPS Telegram Bot Database Schema (Updated with Photos)
-- Run this in your Supabase SQL Editor to add photo support

-- Add photo column to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Update the table structure comment
COMMENT ON TABLE products IS 'Products catalog with multilingual support and photo URLs';

-- Create index for better photo URL queries
CREATE INDEX IF NOT EXISTS idx_products_photo ON products(photo_url) WHERE photo_url IS NOT NULL;

-- Example of updating existing products with sample photos (optional)
-- UPDATE products SET photo_url = 'https://example.com/photo1.jpg' WHERE id = 1;