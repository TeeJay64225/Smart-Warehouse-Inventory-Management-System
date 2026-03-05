const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    // Query Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*, roles(name, permissions)')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !users) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = users;
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.roles.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log audit entry
    await supabase
      .from('audit_logs')
      .insert([{ user_id: user.id, action: 'LOGIN', ip_address: req.ip }]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles.name,
        permissions: user.roles.permissions
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ 
    success: true, 
    user: { 
      id: req.user.userId, 
      email: req.user.email, 
      role: req.user.role 
    } 
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await supabase
      .from('audit_logs')
      .insert([{ user_id: req.user.userId, action: 'LOGOUT' }]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    // Get user's current password hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) return res.status(400).json({ success: false, message: 'User not found' });

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    // Hash and update new password
    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashed, updated_at: new Date().toISOString() })
      .eq('id', req.user.userId);

    if (updateError) throw updateError;
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
