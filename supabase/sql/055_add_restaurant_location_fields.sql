-- Add location fields to companies table for restaurants
-- This allows restaurants to store their location data for location-based searches

-- Add location-related columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS is_restaurant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restaurant_hours JSONB,
ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
ADD COLUMN IF NOT EXISTS price_range TEXT;

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(latitude, longitude) WHERE is_restaurant = TRUE;
CREATE INDEX IF NOT EXISTS idx_companies_restaurant ON companies(is_restaurant) WHERE is_restaurant = TRUE;
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city, state) WHERE is_restaurant = TRUE;

-- Add a function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 3959; -- Earth's radius in miles
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get nearby restaurants
CREATE OR REPLACE FUNCTION get_nearby_restaurants(
    user_lat DECIMAL(10, 8),
    user_lon DECIMAL(11, 8),
    radius_miles DECIMAL DEFAULT 10,
    limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    cuisine_type TEXT,
    price_range TEXT,
    restaurant_hours JSONB,
    distance_miles DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.logo_url,
        c.website,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.latitude,
        c.longitude,
        c.cuisine_type,
        c.price_range,
        c.restaurant_hours,
        calculate_distance(user_lat, user_lon, c.latitude, c.longitude) as distance_miles,
        c.created_at,
        c.updated_at
    FROM companies c
    WHERE c.is_restaurant = TRUE
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND calculate_distance(user_lat, user_lon, c.latitude, c.longitude) <= radius_miles
    ORDER BY distance_miles ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get restaurant deals and coupons
CREATE OR REPLACE FUNCTION get_restaurant_deals(
    restaurant_id UUID,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    original_price DECIMAL,
    discount_price DECIMAL,
    discount_percentage INTEGER,
    coupon_code TEXT,
    expires_at TIMESTAMPTZ,
    is_featured BOOLEAN,
    image_url TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.description,
        d.original_price,
        d.discount_price,
        d.discount_percentage,
        d.coupon_code,
        d.expires_at,
        d.is_featured,
        d.image_url,
        d.created_at
    FROM deals d
    WHERE d.company_id = restaurant_id
        AND d.is_active = TRUE
        AND (d.expires_at IS NULL OR d.expires_at > NOW())
    ORDER BY d.is_featured DESC, d.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Update existing companies to mark restaurants
-- This is a sample update - you would need to identify which companies are restaurants
-- UPDATE companies 
-- SET is_restaurant = TRUE, cuisine_type = 'American'
-- WHERE name ILIKE '%restaurant%' OR name ILIKE '%cafe%' OR name ILIKE '%diner%' OR name ILIKE '%bistro%';

-- Add comments for documentation
COMMENT ON COLUMN companies.latitude IS 'Latitude coordinate for restaurant location';
COMMENT ON COLUMN companies.longitude IS 'Longitude coordinate for restaurant location';
COMMENT ON COLUMN companies.address IS 'Street address of the restaurant';
COMMENT ON COLUMN companies.city IS 'City where the restaurant is located';
COMMENT ON COLUMN companies.state IS 'State where the restaurant is located';
COMMENT ON COLUMN companies.zip_code IS 'ZIP code of the restaurant location';
COMMENT ON COLUMN companies.country IS 'Country where the restaurant is located (default: US)';
COMMENT ON COLUMN companies.phone IS 'Restaurant phone number';
COMMENT ON COLUMN companies.website IS 'Restaurant website URL';
COMMENT ON COLUMN companies.is_restaurant IS 'Boolean flag indicating if this company is a restaurant';
COMMENT ON COLUMN companies.restaurant_hours IS 'JSON object containing restaurant operating hours';
COMMENT ON COLUMN companies.cuisine_type IS 'Type of cuisine served (e.g., Italian, Mexican, American)';
COMMENT ON COLUMN companies.price_range IS 'Price range indicator (e.g., $, $$, $$$, $$$$)';

COMMENT ON FUNCTION calculate_distance IS 'Calculates distance between two geographic points using Haversine formula';
COMMENT ON FUNCTION get_nearby_restaurants IS 'Returns restaurants within specified radius of user location';
COMMENT ON FUNCTION get_restaurant_deals IS 'Returns active deals and coupons for a specific restaurant';
