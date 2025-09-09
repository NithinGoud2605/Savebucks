import express from 'express';
import { makeAdminClient } from '../lib/supa.js';

const router = express.Router();
const supaAdmin = makeAdminClient();

// Lightweight image proxy to handle CORS/referrer issues and encoded URLs
router.get('/proxy/image', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs allowed' });
    }

    // Check for obviously invalid URLs (like localhost routes, non-image paths)
    if (targetUrl.hostname === 'localhost' && !targetUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      console.log(`Rejecting invalid localhost URL: ${targetUrl.toString()}`);
      // Return a transparent placeholder for invalid localhost URLs
      const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(placeholder);
    }

    // Check for common non-image file extensions
    const pathname = targetUrl.pathname.toLowerCase();
    if (pathname.match(/\.(html|htm|php|asp|aspx|jsp|js|css|txt|pdf|doc|docx)$/)) {
      console.log(`Rejecting non-image URL: ${targetUrl.toString()}`);
      const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(placeholder);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const resp = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
          'Referer': targetUrl.origin + '/',
          'Origin': targetUrl.origin
        },
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        // Log the error for debugging
        console.log(`Image proxy failed for ${targetUrl.toString()}: ${resp.status} ${resp.statusText}`);
        
        // For 404/403 errors, return a placeholder image instead of JSON error
        if (resp.status === 404 || resp.status === 403) {
          // Return a simple 1x1 transparent PNG as placeholder
          const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minute cache for placeholders
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.send(placeholder);
        }
        
        // For other errors, return JSON error
        return res.status(resp.status).json({ 
          error: `Image not accessible: ${resp.status} ${resp.statusText}`,
          url: targetUrl.toString()
        });
      }

      const contentType = resp.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'URL does not point to an image' });
      }

      // Set headers
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Stream the response
      resp.body.pipe(res);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ error: 'Request timeout' });
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

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
