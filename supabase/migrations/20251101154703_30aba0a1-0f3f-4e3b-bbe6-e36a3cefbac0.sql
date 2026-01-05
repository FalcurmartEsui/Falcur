-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add hall column to profiles table for campus-based vendors
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hall TEXT;

-- Add index for faster featured product queries
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;

-- Add index for faster new arrivals queries (based on created_at)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC) WHERE is_active = true;