-- ============================================================
-- SEED DATA - Run AFTER schema.sql
-- ============================================================

-- Get category and supplier IDs for seeding
DO $$
DECLARE
  cat_electronics UUID;
  cat_raw UUID;
  cat_finished UUID;
  cat_packaging UUID;
  cat_spare UUID;
  sup1 UUID; sup2 UUID; sup3 UUID; sup4 UUID; sup5 UUID;
  admin_id UUID;
  zone_a UUID; zone_b UUID; zone_c UUID;
  aisle_a1 UUID; aisle_a2 UUID; aisle_b1 UUID; aisle_c1 UUID;
  shelf_a1a UUID; shelf_a1b UUID; shelf_b1a UUID; shelf_c1a UUID;
  bin1 UUID; bin2 UUID; bin3 UUID; bin4 UUID; bin5 UUID; bin6 UUID;
BEGIN
  SELECT id INTO cat_electronics FROM categories WHERE name = 'Electronics';
  SELECT id INTO cat_raw FROM categories WHERE name = 'Raw Materials';
  SELECT id INTO cat_finished FROM categories WHERE name = 'Finished Goods';
  SELECT id INTO cat_packaging FROM categories WHERE name = 'Packaging';
  SELECT id INTO cat_spare FROM categories WHERE name = 'Spare Parts';
  SELECT id INTO sup1 FROM suppliers WHERE name = 'TechParts Global';
  SELECT id INTO sup2 FROM suppliers WHERE name = 'AfriSupply Co.';
  SELECT id INTO sup3 FROM suppliers WHERE name = 'Global Logistics Ltd';
  SELECT id INTO sup4 FROM suppliers WHERE name = 'EastAsia Trade';
  SELECT id INTO sup5 FROM suppliers WHERE name = 'Euro Parts SA';
  SELECT id INTO admin_id FROM users WHERE email = 'admin@warehouse.com';
  SELECT id INTO zone_a FROM warehouse_zones WHERE code = 'A';
  SELECT id INTO zone_b FROM warehouse_zones WHERE code = 'B';
  SELECT id INTO zone_c FROM warehouse_zones WHERE code = 'C';

  -- Aisles
  INSERT INTO warehouse_aisles (zone_id, code, name) VALUES (zone_a, 'A1', 'Aisle A1'), (zone_a, 'A2', 'Aisle A2'), (zone_b, 'B1', 'Aisle B1'), (zone_c, 'C1', 'Aisle C1');
  SELECT id INTO aisle_a1 FROM warehouse_aisles WHERE code = 'A1';
  SELECT id INTO aisle_a2 FROM warehouse_aisles WHERE code = 'A2';
  SELECT id INTO aisle_b1 FROM warehouse_aisles WHERE code = 'B1';
  SELECT id INTO aisle_c1 FROM warehouse_aisles WHERE code = 'C1';

  -- Shelves
  INSERT INTO warehouse_shelves (aisle_id, code, name) VALUES (aisle_a1, 'S1', 'Shelf 1'), (aisle_a1, 'S2', 'Shelf 2'), (aisle_a2, 'S1', 'Shelf 1'), (aisle_b1, 'S1', 'Shelf 1'), (aisle_c1, 'S1', 'Shelf 1');
  SELECT id INTO shelf_a1a FROM warehouse_shelves WHERE aisle_id = aisle_a1 AND code = 'S1';
  SELECT id INTO shelf_a1b FROM warehouse_shelves WHERE aisle_id = aisle_a1 AND code = 'S2';
  SELECT id INTO shelf_b1a FROM warehouse_shelves WHERE aisle_id = aisle_b1 AND code = 'S1';
  SELECT id INTO shelf_c1a FROM warehouse_shelves WHERE aisle_id = aisle_c1 AND code = 'S1';

  -- Bins
  INSERT INTO warehouse_bins (shelf_id, code, capacity) VALUES (shelf_a1a, 'B01', 200), (shelf_a1a, 'B02', 200), (shelf_a1b, 'B01', 150), (shelf_b1a, 'B01', 500), (shelf_b1a, 'B02', 500), (shelf_c1a, 'B01', 300);
  SELECT id INTO bin1 FROM warehouse_bins WHERE shelf_id = shelf_a1a AND code = 'B01';
  SELECT id INTO bin2 FROM warehouse_bins WHERE shelf_id = shelf_a1a AND code = 'B02';
  SELECT id INTO bin3 FROM warehouse_bins WHERE shelf_id = shelf_a1b AND code = 'B01';
  SELECT id INTO bin4 FROM warehouse_bins WHERE shelf_id = shelf_b1a AND code = 'B01';
  SELECT id INTO bin5 FROM warehouse_bins WHERE shelf_id = shelf_b1a AND code = 'B02';
  SELECT id INTO bin6 FROM warehouse_bins WHERE shelf_id = shelf_c1a AND code = 'B01';

  -- Products
  INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level, unit, location_label, bin_id, created_by) VALUES
    ('SKU-ELEC-001', 'Arduino Mega 2560', 'Microcontroller board ATmega2560', cat_electronics, sup1, 45.99, 150, 20, 'pcs', 'A-A1-S1-B01', bin1, admin_id),
    ('SKU-ELEC-002', 'Raspberry Pi 4 (4GB)', 'Single board computer 4GB RAM', cat_electronics, sup1, 89.99, 8, 15, 'pcs', 'A-A1-S1-B02', bin2, admin_id),
    ('SKU-ELEC-003', 'HDMI Cable 2m', 'High-speed HDMI 2.0 cable', cat_electronics, sup4, 12.50, 5, 25, 'pcs', 'A-A1-S2-B01', bin3, admin_id),
    ('SKU-RAW-001', 'Aluminum Sheet 1mm', 'Aluminum alloy sheet 1000x2000mm', cat_raw, sup2, 35.00, 200, 50, 'sheets', 'B-B1-S1-B01', bin4, admin_id),
    ('SKU-RAW-002', 'Copper Wire 2.5mm', 'Electrical copper wire roll 100m', cat_raw, sup2, 28.75, 120, 30, 'rolls', 'B-B1-S1-B02', bin5, admin_id),
    ('SKU-FIN-001', 'LED Strip Light 5m', 'RGB LED addressable strip 5050', cat_finished, sup3, 18.99, 75, 20, 'pcs', 'C-C1-S1-B01', bin6, admin_id),
    ('SKU-PKG-001', 'Bubble Wrap Roll', 'Protective packaging 50m roll', cat_packaging, sup3, 22.00, 3, 10, 'rolls', 'A-A1-S1-B01', bin1, admin_id),
    ('SKU-ELEC-004', 'Voltage Regulator LM7805', '5V linear voltage regulator TO-220', cat_electronics, sup1, 2.50, 500, 100, 'pcs', 'A-A1-S1-B01', bin1, admin_id),
    ('SKU-SPARE-001', 'Bearing 6205-2RS', 'Deep groove ball bearing 25x52x15mm', cat_spare, sup5, 8.75, 0, 20, 'pcs', 'A-A1-S2-B01', bin3, admin_id),
    ('SKU-ELEC-005', 'ESP32 WiFi Module', 'Dual-core WiFi/BT microcontroller', cat_electronics, sup4, 15.99, 60, 25, 'pcs', 'A-A1-S1-B02', bin2, admin_id);

  -- Sync inventory table
  INSERT INTO inventory (product_id, quantity_on_hand)
  SELECT id, quantity FROM products
  ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand;

  -- Sample stock movements
  INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reference_no, supplier_id, reason, performed_by)
  SELECT id, 'stock_in', 150, 0, 150, 45.99, 'PO-2024-001', sup1, 'Initial stock', admin_id FROM products WHERE sku = 'SKU-ELEC-001';

  INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reference_no, reason, performed_by)
  SELECT id, 'stock_out', 20, 150, 130, 45.99, 'SO-2024-001', 'Customer order dispatch', admin_id FROM products WHERE sku = 'SKU-ELEC-001';

  INSERT INTO stock_movements (product_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reference_no, supplier_id, reason, performed_by)
  SELECT id, 'stock_in', 8, 0, 8, 89.99, 'PO-2024-002', sup1, 'Initial stock', admin_id FROM products WHERE sku = 'SKU-ELEC-002';

  -- Manager and staff users
  INSERT INTO users (name, email, password_hash, role_id)
  SELECT 'Warehouse Manager', 'manager@warehouse.com', crypt('Manager@1234', gen_salt('bf')), id
  FROM roles WHERE name = 'manager';
  
  INSERT INTO users (name, email, password_hash, role_id)
  SELECT 'Inventory Staff', 'staff@warehouse.com', crypt('Staff@1234', gen_salt('bf')), id
  FROM roles WHERE name = 'staff';
END $$;
