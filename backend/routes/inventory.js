const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/inventory - Current inventory levels
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`*, inventory(quantity_on_hand, quantity_available, last_movement_at), categories(name)`)
      .eq('is_active', true)
      .order('id', { foreignTable: 'inventory' })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    let filtered = products || [];
    if (search) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) || 
        p.sku?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status === 'low_stock') {
      filtered = filtered.filter(p => p.inventory?.quantity_on_hand > 0 && p.inventory?.quantity_on_hand <= p.reorder_level);
    }
    if (status === 'out_of_stock') {
      filtered = filtered.filter(p => p.inventory?.quantity_on_hand === 0);
    }
    
    res.json({ 
      success: true, 
      data: filtered || [], 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: filtered.length 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/inventory/stock-in
router.post('/stock-in', authenticate, authorize('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { product_id, quantity, unit_cost, supplier_id, reference_no, notes } = req.body;
    if (!product_id || !quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Product and valid quantity required' });

    const { data: inv, error: invError } = await supabase
      .from('inventory')
      .select('quantity_on_hand')
      .eq('product_id', product_id)
      .single();
    
    if (invError || !inv) throw new Error('Product not found in inventory');

    const quantityBefore = inv.quantity_on_hand;
    const quantityAfter = quantityBefore + parseInt(quantity);

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity_on_hand: quantityAfter, last_movement_at: new Date().toISOString() })
      .eq('product_id', product_id);
    
    if (updateError) throw updateError;

    const { data: mov, error: movError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id, movement_type: 'stock_in', quantity, quantity_before: quantityBefore,
        quantity_after: quantityAfter, unit_cost: unit_cost || null, reference_no: reference_no || null,
        supplier_id: supplier_id || null, notes: notes || null, performed_by: req.user.userId
      }])
      .select();
    
    if (movError) throw movError;
    res.status(201).json({ success: true, data: mov[0], message: `Stock in recorded. New quantity: ${quantityAfter}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// POST /api/inventory/stock-out
router.post('/stock-out', authenticate, authorize('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { product_id, quantity, reason, destination, reference_no, notes } = req.body;
    if (!product_id || !quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Product and valid quantity required' });

    const { data: inv, error: invError } = await supabase
      .from('inventory')
      .select('quantity_on_hand')
      .eq('product_id', product_id)
      .single();
    
    if (invError || !inv) throw new Error('Product not found');

    const quantityBefore = inv.quantity_on_hand;
    if (quantityBefore < parseInt(quantity)) {
      throw new Error(`Insufficient stock. Available: ${quantityBefore}`);
    }

    const quantityAfter = quantityBefore - parseInt(quantity);
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity_on_hand: quantityAfter, last_movement_at: new Date().toISOString() })
      .eq('product_id', product_id);
    
    if (updateError) throw updateError;

    const { data: mov, error: movError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id, movement_type: 'stock_out', quantity, quantity_before: quantityBefore,
        quantity_after: quantityAfter, reason: reason || null, destination: destination || null,
        reference_no: reference_no || null, notes: notes || null, performed_by: req.user.userId
      }])
      .select();
    
    if (movError) throw movError;
    res.status(201).json({ success: true, data: mov[0], message: `Stock out recorded. New quantity: ${quantityAfter}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// GET /api/inventory/movements - Stock movement history
router.get('/movements', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, product_id, type } = req.query;
    let query = supabase.from('stock_movements').select('*');
    
    if (product_id) query = query.eq('product_id', product_id);
    if (type) query = query.eq('movement_type', type);
    
    const { data, error } = await query
      .order('movement_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) throw error;
    res.json({ success: true, data: data || [], pagination: { page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/inventory/alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select(`*, products(name, sku, reorder_level, quantity, categories(name, color))`)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/inventory/alerts/:id/resolve
router.put('/alerts/:id/resolve', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ is_resolved: true, is_read: true, resolved_by: req.user.userId, resolved_at: new Date().toISOString() })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true, message: 'Alert resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
