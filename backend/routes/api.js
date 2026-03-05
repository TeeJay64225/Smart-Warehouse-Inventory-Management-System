const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// SUPPLIERS
// ============================================================
router.get('/suppliers', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.post('/suppliers', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, country, lead_time_days, delivery_score, accuracy_score, price_score, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Supplier name required' });
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name, contact_person, email, phone, address, country,
        lead_time_days: lead_time_days || 7,
        delivery_score: delivery_score || 5,
        accuracy_score: accuracy_score || 5,
        price_score: price_score || 5,
        notes
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.put('/suppliers/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, country, lead_time_days, delivery_score, accuracy_score, price_score, notes } = req.body;
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name, contact_person, email, phone, address, country,
        lead_time_days, delivery_score, accuracy_score, price_score, notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

// ============================================================
// CATEGORIES
// ============================================================
router.get('/categories', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard/stats', authenticate, async (req, res) => {
  try {
    // Fetch basic data
    const [products, inventory, suppliers, alerts] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('inventory').select('*'),
      supabase.from('suppliers').select('*').eq('is_active', true),
      supabase.from('alerts').select('*').eq('is_resolved', false)
    ]);

    if (products.error) throw products.error;
    if (inventory.error) throw inventory.error;
    if (suppliers.error) throw suppliers.error;
    if (alerts.error) throw alerts.error;

    // Calculate stats
    let total_inventory_value = 0;
    let low_stock_count = 0;
    let out_of_stock_count = 0;

    inventory.data?.forEach(inv => {
      const product = products.data?.find(p => p.id === inv.product_id);
      if (product) {
        total_inventory_value += (inv.quantity_on_hand * product.unit_price);
        if (inv.quantity_on_hand === 0) out_of_stock_count++;
        else if (inv.quantity_on_hand <= product.reorder_level) low_stock_count++;
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          total_products: products.data?.length || 0,
          total_inventory_value: Math.round(total_inventory_value * 100) / 100,
          low_stock_count,
          out_of_stock_count,
          total_suppliers: suppliers.data?.length || 0,
          unresolved_alerts: alerts.data?.length || 0
        },
        lowStockProducts: [],
        recentMovements: [],
        categoryBreakdown: [],
        monthlyMovements: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// REPORTS
// ============================================================
router.get('/reports/inventory', authenticate, async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    res.json({ success: true, data: products });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.get('/reports/movements', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('movement_date', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.get('/reports/supplier-performance', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('overall_rating', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
    
    const hashed = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password_hash: hashed, role_id: role || 'staff' }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

module.exports = router;

// Users management (admin only)
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`SELECT u.id, u.name, u.email, u.is_active, u.last_login, u.created_at, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, password required' });
    const roleResult = await query('SELECT id FROM roles WHERE name = $1', [role || 'staff']);
    if (!roleResult.rows[0]) return res.status(400).json({ success: false, message: 'Invalid role' });
    const hashed = await bcrypt.hash(password, 12);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(409).json({ success: false, message: 'Email already exists' });
    const result = await query('INSERT INTO users (name, email, password_hash, role_id) VALUES ($1,$2,$3,$4) RETURNING id, name, email, created_at', [name, email, hashed, roleResult.rows[0].id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
