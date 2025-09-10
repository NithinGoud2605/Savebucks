import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { log } from '../lib/logger.js';
import { makeAuth } from '../middleware/auth.js';

const r = Router();
const supaAdmin = makeAdminClient();

/**
 * Get restaurants near user's location
 * GET /api/restaurants/nearby
 */
r.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMiles = parseFloat(radius);
    const limitCount = parseInt(limit);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Get all restaurants first
    const { data: allRestaurants, error: fetchError } = await supaAdmin
      .from('companies')
      .select('*')
      .eq('is_restaurant', true)
      .eq('status', 'approved');

    if (fetchError) throw fetchError;

    // Get deals and coupons for each restaurant
    const restaurantsWithOffers = await Promise.all(
      allRestaurants.map(async (restaurant) => {
        // Get deals
        const { data: deals } = await supaAdmin
          .from('deals')
          .select('id, title, description, url, price, original_price, discount_percentage, discount_amount, coupon_code, expires_at, starts_at, is_featured, is_exclusive, created_at')
          .eq('company_id', restaurant.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);

        // Get coupons
        const { data: coupons } = await supaAdmin
          .from('coupons')
          .select('id, title, description, code, discount_percentage, discount_amount, expires_at, is_featured, created_at')
          .eq('company_id', restaurant.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);

        return {
          ...restaurant,
          deals: deals || [],
          coupons: coupons || []
        };
      })
    );

    // Calculate distance for each restaurant
    const restaurantsWithDistance = restaurantsWithOffers
      .filter(restaurant => restaurant.latitude && restaurant.longitude)
      .map(restaurant => {
        const distance = calculateDistance(
          latitude, longitude,
          restaurant.latitude, restaurant.longitude
        );
        return {
          ...restaurant,
          distance_miles: distance
        };
      })
      .filter(restaurant => restaurant.distance_miles <= radiusMiles)
      .sort((a, b) => a.distance_miles - b.distance_miles)
      .slice(0, limitCount);

    res.json({
      success: true,
      data: restaurantsWithDistance,
      count: restaurantsWithDistance.length
    });
  } catch (error) {
    log('Get nearby restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Get deals for a specific restaurant
 * GET /api/restaurants/:id/deals
 */
r.get('/:id/deals', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const { data: deals, error } = await supaAdmin.rpc('get_restaurant_deals', {
      restaurant_id: id,
      limit_count: parseInt(limit)
    });

    if (error) throw error;

    res.json(deals || []);
  } catch (error) {
    log('Get restaurant deals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Search restaurants
 * GET /api/restaurants/search
 */
r.get('/search', async (req, res) => {
  try {
    const { q, cuisine, city, state, limit = 20 } = req.query;

    let query = supaAdmin
      .from('companies')
      .select('*')
      .eq('is_restaurant', true);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,cuisine_type.ilike.%${q}%`);
    }

    if (cuisine) {
      query = query.eq('cuisine_type', cuisine);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (state) {
      query = query.eq('state', state);
    }

    const { data: restaurants, error } = await query
      .order('name')
      .limit(parseInt(limit));

    if (error) throw error;

    res.json(restaurants || []);
  } catch (error) {
    log('Search restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all restaurants
 * GET /api/restaurants
 */
r.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: restaurants, error } = await supaAdmin
      .from('companies')
      .select('*')
      .eq('is_restaurant', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json(restaurants || []);
  } catch (error) {
    log('Get restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get restaurant by ID
 * GET /api/restaurants/:id
 */
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: restaurant, error } = await supaAdmin
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('is_restaurant', true)
      .single();

    if (error || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    log('Get restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new restaurant
 * POST /api/restaurants
 */
r.post('/', makeAuth(), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      logo_url,
      website,
      phone,
      address,
      city,
      state,
      zip_code,
      country = 'US',
      latitude,
      longitude,
      cuisine_type,
      price_range,
      restaurant_hours
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    if (!latitude || !longitude || !address || !city || !state) {
      return res.status(400).json({ error: 'Location data is required for restaurants' });
    }

    // Check if slug already exists
    const { data: existingCompany } = await supaAdmin
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCompany) {
      return res.status(409).json({ error: 'Company with this slug already exists' });
    }

    const { data: restaurant, error } = await supaAdmin
      .from('companies')
      .insert({
        name,
        slug,
        description,
        logo_url,
        website,
        phone,
        address,
        city,
        state,
        zip_code,
        country,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cuisine_type,
        price_range,
        restaurant_hours,
        is_restaurant: true,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(restaurant);
  } catch (error) {
    log('Create restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update restaurant
 * PUT /api/restaurants/:id
 */
r.put('/:id', makeAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if restaurant exists
    const { data: existingRestaurant, error: checkError } = await supaAdmin
      .from('companies')
      .select('id, name, created_by, is_restaurant')
      .eq('id', id)
      .eq('is_restaurant', true)
      .single();

    if (checkError || !existingRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check permissions
    if (existingRestaurant.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData.is_restaurant;

    const { data: restaurant, error } = await supaAdmin
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(restaurant);
  } catch (error) {
    log('Update restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default r;