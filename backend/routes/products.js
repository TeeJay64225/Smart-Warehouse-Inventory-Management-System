const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/products
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`id, sku, name, description, unit_price, quantity, reorder_level, unit, location_label, created_at, updated_at,
               categories(id, name, color),
               suppliers(id, name),
               inventory(quantity_on_hand, quantity_available)`,
               { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,location_label.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate stock status
    const processed = data.map(p => ({
      ...p,
      category_id: p.categories?.id,
      category_name: p.categories?.name,
      category_color: p.categories?.color,
      supplier_id: p.suppliers?.id,
      supplier_name: p.suppliers?.name,
      quantity_on_hand: p.inventory?.[0]?.quantity_on_hand || 0,
      quantity_available: p.inventory?.[0]?.quantity_available || 0,
      stock_status: (() => {
        const qty = p.inventory?.[0]?.quantity_on_hand || 0;
        if (qty === 0) return 'out_of_stock';
        if (qty <= p.reorder_level) return 'low_stock';
        if (qty > p.reorder_level * 3) return 'overstock';
        return 'normal';
      })(),
      total_value: (p.inventory?.[0]?.quantity_on_hand || 0) * p.unit_price
    }));

    // Filter by status if needed
    let filtered = processed;
    if (status === 'low_stock') {
      filtered = processed.filter(p => p.stock_status === 'low_stock');
    } else if (status === 'out_of_stock') {
      filtered = processed.filter(p => p.stock_status === 'out_of_stock');
    }

    res.json({
      success: true,
      data: filtered,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`*, 
               categories(id, name, color),
               suppliers(id, name, email),
               inventory(quantity_on_hand, last_movement_at)`)
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const processed = {
      ...data,
      category_name: data.categories?.name,
      category_color: data.categories?.color,
      supplier_name: data.suppliers?.name,
      supplier_email: data.suppliers?.email,
      quantity_on_hand: data.inventory?.[0]?.quantity_on_hand || 0,
      last_movement_at: data.inventory?.[0]?.last_movement_at
    };
    
    res.json({ success: true, data: processed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/products
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level, unit, location_label } = req.body;
    if (!sku || !name) return res.status(400).json({ success: false, message: 'SKU and name are required' });

    // Check if SKU exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single();

    if (existing) return res.status(409).json({ success: false, message: 'SKU already exists' });

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        sku,
        name,
        description,
        category_id,
        supplier_id,
        unit_price: unit_price || 0,
        quantity: quantity || 0,
        reorder_level: reorder_level || 10,
        unit: unit || 'pcs',
        location_label,
        created_by: req.user.userId
      })
      .select()
      .single();

    if (error) throw error;

    // Record initial stock movement if quantity > 0
    if (quantity > 0) {
      await supabase
        .from('stock_movements')
        .insert({
          product_id: product.id,
          movement_type: 'stock_in',
          quantity,
          quantity_before: 0,
          quantity_after: quantity,
          unit_cost: unit_price || 0,
          reference_no: 'INITIAL',
          performed_by: req.user.userId
        });
    }

    // Audit log
    await supabase
      .from('audit_logs')
      .insert({
        user_id: req.user.userId,
        action: 'CREATE_PRODUCT',
        table_name: 'products',
        record_id: product.id,
        new_values: JSON.stringify({ sku, name })
      });

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, description, category_id, supplier_id, unit_price, reorder_level, unit, location_label } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        category_id,
        supplier_id,
        unit_price,
        reorder_level,
        unit,
        location_label,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('is_active', true)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Product not found' });
    
    res.json({ success: true, data, message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;

    // Audit log
    await supabase
      .from('audit_logs')
      .insert({
        user_id: req.user.userId,
        action: 'DELETE_PRODUCT',
        table_name: 'products',
        record_id: req.params.id
      });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
