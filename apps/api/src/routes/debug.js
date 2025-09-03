import express from 'express';
import { makeAdminClient } from '../lib/supa.js';

const router = express.Router();
const supaAdmin = makeAdminClient();

// Simple debug endpoint to test database connection
router.get('/debug/deals', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    const { data, error } = await supaAdmin
      .from('deals')
      .select('id, title, status')
      .eq('status', 'approved')
      .limit(3);
    
    console.log('Database query result:', { data, error });
    
    if (error) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      count: data?.length || 0, 
      deals: data 
    });
  } catch (e) {
    console.error('Debug endpoint error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// Test coupons
router.get('/debug/coupons', async (req, res) => {
  try {
    console.log('Testing coupons database connection...');
    
    const { data, error } = await supaAdmin
      .from('coupons')
      .select('id, title, status')
      .eq('status', 'approved')
      .limit(3);
    
    console.log('Coupons query result:', { data, error });
    
    if (error) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      count: data?.length || 0, 
      coupons: data 
    });
  } catch (e) {
    console.error('Debug coupons error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

// Test categories
router.get('/debug/categories', async (req, res) => {
  try {
    console.log('Testing categories database connection...');
    
    const { data, error } = await supaAdmin
      .from('categories')
      .select('*')
      .limit(5);
    
    console.log('Categories query result:', { data, error });
    
    if (error) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      count: data?.length || 0, 
      categories: data 
    });
  } catch (e) {
    console.error('Debug categories error:', e);
    res.status(500).json({ 
      error: 'Server error', 
      details: e.message 
    });
  }
});

export default router;
