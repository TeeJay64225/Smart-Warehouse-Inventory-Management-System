-- ============================================================
-- SMART WAREHOUSE INVENTORY MANAGEMENT SYSTEM
-- Database Schema for Supabase / PostgreSQL
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '{"all": true}'),
  ('manager', 'Manage inventory and products', '{"products": true, "inventory": true, "reports": true}'),
  ('staff', 'View and update stock movements', '{"inventory": true, "view": true}');

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default admin user (password: Admin@1234)
INSERT INTO users (name, email, password_hash, role_id)
SELECT 
  'System Admin',
  'admin@warehouse.com',
  crypt('Admin@1234', gen_salt('bf')),
  id
FROM roles WHERE name = 'admin';

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#2563EB',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, description, color) VALUES
  ('Electronics', 'Electronic components and devices', '#2563EB'),
  ('Raw Materials', 'Manufacturing raw materials', '#10B981'),
  ('Finished Goods', 'Ready to ship products', '#F59E0B'),
  ('Packaging', 'Packaging materials', '#8B5CF6'),
  ('Spare Parts', 'Machine spare parts', '#EF4444'),
  ('Office Supplies', 'Office consumables', '#14B8A6');

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(30),
  address TEXT,
  country VARCHAR(100),
  lead_time_days INT DEFAULT 7,
  delivery_score NUMERIC(3,2) DEFAULT 5.0,
  accuracy_score NUMERIC(3,2) DEFAULT 5.0,
  price_score NUMERIC(3,2) DEFAULT 5.0,
  overall_rating NUMERIC(3,2) GENERATED ALWAYS AS (
    ROUND((delivery_score + accuracy_score + price_score) / 3.0, 2)
  ) STORED,
  total_orders INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO suppliers (name, contact_person, email, phone, country, lead_time_days, delivery_score, accuracy_score, price_score, total_orders) VALUES
  ('TechParts Global', 'James Osei', 'james@techparts.com', '+233-244-001122', 'Ghana', 5, 4.8, 4.9, 4.5, 120),
  ('AfriSupply Co.', 'Akua Mensah', 'akua@afrisupply.com', '+233-244-334455', 'Ghana', 7, 4.2, 4.5, 4.8, 85),
  ('Global Logistics Ltd', 'Kwame Asante', 'kwame@globallog.com', '+233-244-667788', 'Ghana', 3, 4.9, 4.7, 4.0, 200),
  ('EastAsia Trade', 'Li Wei', 'liwei@easttrade.com', '+86-21-88990011', 'China', 21, 3.8, 4.6, 4.9, 60),
  ('Euro Parts SA', 'Hans Mueller', 'hans@europarts.eu', '+49-89-55667788', 'Germany', 14, 4.6, 4.8, 3.9, 45);

-- ============================================================
-- WAREHOUSE LOCATIONS
-- ============================================================
CREATE TABLE warehouse_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouse_aisles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100),
  UNIQUE(zone_id, code)
);

CREATE TABLE warehouse_shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aisle_id UUID REFERENCES warehouse_aisles(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100),
  UNIQUE(aisle_id, code)
);

CREATE TABLE warehouse_bins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id UUID REFERENCES warehouse_shelves(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  capacity INT DEFAULT 100,
  is_occupied BOOLEAN DEFAULT FALSE,
  UNIQUE(shelf_id, code)
);

-- Seed warehouse structure
INSERT INTO warehouse_zones (code, name, description) VALUES
  ('A', 'Zone A', 'Electronics and high-value items'),
  ('B', 'Zone B', 'Raw materials storage'),
  ('C', 'Zone C', 'Finished goods dispatch area'),
  ('D', 'Zone D', 'Packaging and consumables');

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  unit_price NUMERIC(12,2) DEFAULT 0,
  quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit VARCHAR(20) DEFAULT 'pcs',
  weight_kg NUMERIC(8,3),
  bin_id UUID REFERENCES warehouse_bins(id),
  location_label VARCHAR(50),
  image_url TEXT,
  barcode VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY (current stock snapshot)
-- ============================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand INT DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_counted_at TIMESTAMPTZ,
  last_movement_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'transfer')),
  quantity INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  unit_cost NUMERIC(12,2),
  reference_no VARCHAR(100),
  supplier_id UUID REFERENCES suppliers(id),
  reason VARCHAR(200),
  destination VARCHAR(200),
  notes TEXT,
  performed_by UUID REFERENCES users(id),
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERTS TABLE
-- ============================================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('low_stock', 'out_of_stock', 'overstock', 'expiry')),
  product_id UUID REFERENCES products(id),
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Products with full location and category info
CREATE OR REPLACE VIEW v_products_full AS
SELECT 
  p.*,
  c.name AS category_name,
  c.color AS category_color,
  s.name AS supplier_name,
  s.overall_rating AS supplier_rating,
  i.quantity_on_hand,
  i.quantity_available,
  CASE 
    WHEN i.quantity_on_hand = 0 THEN 'out_of_stock'
    WHEN i.quantity_on_hand <= p.reorder_level THEN 'low_stock'
    WHEN i.quantity_on_hand > p.reorder_level * 3 THEN 'overstock'
    ELSE 'normal'
  END AS stock_status,
  (i.quantity_on_hand * p.unit_price) AS total_value
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.is_active = TRUE;

-- Dashboard summary view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  COUNT(DISTINCT p.id) AS total_products,
  COALESCE(SUM(i.quantity_on_hand * p.unit_price), 0) AS total_inventory_value,
  COUNT(CASE WHEN i.quantity_on_hand <= p.reorder_level AND i.quantity_on_hand > 0 THEN 1 END) AS low_stock_count,
  COUNT(CASE WHEN i.quantity_on_hand = 0 THEN 1 END) AS out_of_stock_count,
  COUNT(DISTINCT s.id) AS total_suppliers
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = TRUE;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create inventory record when product is added
CREATE OR REPLACE FUNCTION fn_init_inventory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity_on_hand)
  VALUES (NEW.id, NEW.quantity)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_inventory
AFTER INSERT ON products
FOR EACH ROW EXECUTE FUNCTION fn_init_inventory();

-- Update inventory after stock movement
CREATE OR REPLACE FUNCTION fn_update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory 
  SET 
    quantity_on_hand = NEW.quantity_after,
    last_movement_at = NOW(),
    updated_at = NOW()
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_update_inventory_on_movement();

-- Auto-generate low stock alerts
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  prod RECORD;
BEGIN
  SELECT p.name, p.reorder_level, p.sku INTO prod 
  FROM products p WHERE p.id = NEW.product_id;
  
  IF NEW.quantity_after <= prod.reorder_level AND NEW.quantity_after > 0 THEN
    INSERT INTO alerts (type, product_id, message, severity)
    VALUES (
      'low_stock', 
      NEW.product_id,
      'Low stock alert: ' || prod.name || ' (' || prod.sku || ') has only ' || NEW.quantity_after || ' units remaining.',
      CASE WHEN NEW.quantity_after <= prod.reorder_level / 2 THEN 'critical' ELSE 'warning' END
    );
  ELSIF NEW.quantity_after = 0 THEN
    INSERT INTO alerts (type, product_id, message, severity)
    VALUES ('out_of_stock', NEW.product_id, 'OUT OF STOCK: ' || prod.name || ' (' || prod.sku || ') is now out of stock!', 'critical');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_alert
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_check_low_stock();

-- Updated_at auto-update
CREATE OR REPLACE FUNCTION fn_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_updated_at();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- ============================================================
-- SAMPLE DATA
-- ============================================================
-- Insert sample products after schema is set up (run seed.sql separately)
