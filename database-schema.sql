-- BPS Telegram Bot Database Schema
-- Execute these commands in Supabase SQL Editor

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'uz',
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Products table (no categories - simplified)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name_uz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_uz TEXT,
  description_ru TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_order INTEGER DEFAULT 1,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'feedback', -- 'feedback', 'complaint'
  status TEXT DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);

-- 6. Insert sample admin user
INSERT INTO users (id, username, first_name, role) 
VALUES (790208567, 'fayzmotr', 'Fayz', 'admin') 
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 7. Insert sample products for testing
INSERT INTO products (name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, stock_quantity, min_order) VALUES
('A4 daftar 48 varaq', 'Тетрадь A4 48 листов', 'A4 Notebook 48 pages', 'Yuqori sifatli daftar', 'Высококачественная тетрадь', 'High quality notebook', 5000, 500, 10),
('A5 daftar 96 varaq', 'Тетрадь A5 96 листов', 'A5 Notebook 96 pages', 'Kichik o\'lchamdagi daftar', 'Тетрадь малого размера', 'Small size notebook', 8000, 300, 5),
('Karton quti o\'rta', 'Картонная коробка средняя', 'Medium Cardboard Box', 'Mustahkam karton quti', 'Прочная картонная коробка', 'Durable cardboard box', 3000, 1000, 50)
ON CONFLICT DO NOTHING;