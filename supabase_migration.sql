-- ============================================================
-- Craft Manager PWA - Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tags
CREATE TABLE IF NOT EXISTS material_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 2. Material Types
CREATE TABLE IF NOT EXISTS material_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  default_unit TEXT NOT NULL
);

-- 3. Purchase Sources
CREATE TABLE IF NOT EXISTS purchase_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 4. Materials
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  type_id TEXT REFERENCES material_types(id) ON DELETE SET NULL,
  tag_ids TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL
);

-- 5. Material Batches (inventory / FIFO)
CREATE TABLE IF NOT EXISTS material_batches (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES purchase_sources(id) ON DELETE SET NULL,
  total_price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  remaining NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  created_at BIGINT NOT NULL
);

-- 6. Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  created_at BIGINT NOT NULL
);

-- 7. Recipe Items
CREATE TABLE IF NOT EXISTS recipe_items (
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  PRIMARY KEY (recipe_id, material_id)
);

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL
);

-- 9. Product Records (production log)
CREATE TABLE IF NOT EXISTS product_records (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  total_cost NUMERIC NOT NULL,
  created_at BIGINT NOT NULL
);

-- 10. Consumed Batches (detail of each production)
CREATE TABLE IF NOT EXISTS consumed_batches (
  id SERIAL PRIMARY KEY,
  record_id TEXT REFERENCES product_records(id) ON DELETE CASCADE,
  batch_id TEXT,
  material_id TEXT,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL
);

-- ============================================================
-- Enable Row Level Security (RLS) - open policy for now
-- ============================================================

ALTER TABLE material_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumed_batches ENABLE ROW LEVEL SECURITY;

-- Open policy (allow all for anon key - single user app)
CREATE POLICY "allow_all_material_tags" ON material_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_material_types" ON material_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_purchase_sources" ON purchase_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_material_batches" ON material_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recipe_items" ON recipe_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_product_records" ON product_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_consumed_batches" ON consumed_batches FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed default material types (matching app defaults)
-- ============================================================

INSERT INTO material_types (id, name, default_unit) VALUES
  ('1', '線材', 'cm'),
  ('2', '珠珠', '顆')
ON CONFLICT (id) DO NOTHING;
