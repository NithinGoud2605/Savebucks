-- ============================================
-- SEED MAJOR COMPANIES (50+)
-- Inserts real verified companies across all categories
-- ============================================

BEGIN;

-- ============================================
-- 0. CLEANUP & SCHEMA FIXES 
-- ============================================

-- Safely clear related tables to avoid conflicts
TRUNCATE TABLE public.companies CASCADE;
TRUNCATE TABLE public.categories CASCADE;
-- Use DO block for table that might not exist yet
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_categories') THEN
        TRUNCATE TABLE public.company_categories CASCADE;
    END IF;
END $$;

-- Ensure categories table has all necessary columns
DO $$
BEGIN
    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE public.categories ADD COLUMN description TEXT;
    END IF;

    -- Add icon if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE public.categories ADD COLUMN icon TEXT;
    END IF;

    -- Add color if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'color') THEN
        ALTER TABLE public.categories ADD COLUMN color TEXT DEFAULT '#3B82F6';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE public.categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Ensure companies table has all necessary columns
DO $$
BEGIN
    -- Add verified/status columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_verified') THEN
        ALTER TABLE public.companies ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'status') THEN
        ALTER TABLE public.companies ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    -- Add other useful columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'category') THEN
        ALTER TABLE public.companies ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'headquarters') THEN
        ALTER TABLE public.companies ADD COLUMN headquarters TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'founded_year') THEN
        ALTER TABLE public.companies ADD COLUMN founded_year INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'rating') THEN
        ALTER TABLE public.companies ADD COLUMN rating DECIMAL(3,2);
    END IF;
END $$;

-- ============================================
-- 1. INSERT CATEGORIES (For Deals)
-- ============================================

-- Sync ID sequence
SELECT setval(pg_get_serial_sequence('public.categories', 'id'), 1, false);

INSERT INTO public.categories (name, slug, description, color, icon, is_active) VALUES
  ('E-commerce', 'ecommerce', 'Online retail and shopping platforms', '#10B981', 'shopping-cart', true),
  ('Technology', 'technology', 'Software, hardware, and tech services', '#3B82F6', 'cpu', true),
  ('Restaurant', 'restaurant', 'Food and dining establishments', '#F59E0B', 'utensils', true),
  ('Travel', 'travel', 'Hotels, flights, vacation packages', '#06B6D4', 'plane', true),
  ('Fashion', 'fashion', 'Clothing, accessories, and style', '#EC4899', 'shirt', true),
  ('Health & Beauty', 'health-beauty', 'Wellness, cosmetics, and personal care', '#EF4444', 'heart', true),
  ('Home & Garden', 'home-garden', 'Home improvement and outdoor living', '#8B5CF6', 'home', true),
  ('Automotive', 'automotive', 'Cars, parts, and automotive services', '#6B7280', 'car', true),
  ('Entertainment', 'entertainment', 'Movies, games, and leisure activities', '#F97316', 'gamepad-2', true),
  ('Education', 'education', 'Learning resources and courses', '#6366F1', 'graduation-cap', true),
  ('Finance', 'finance', 'Banking, insurance, and financial services', '#059669', 'dollar-sign', true),
  ('Sports & Fitness', 'sports-fitness', 'Athletic equipment and fitness services', '#84CC16', 'dumbbell', true),
  ('Pets', 'pets', 'Pet supplies and services', '#A855F7', 'dog', true),
  ('Books & Media', 'books-media', 'Books, music, and digital content', '#1E40AF', 'book', true);

-- ============================================
-- 2. INSERT COMPANY CATEGORIES (For Companies)
-- ============================================

-- Create table if it doesn't exist (just in case)
CREATE TABLE IF NOT EXISTS public.company_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync ID sequence
SELECT setval(pg_get_serial_sequence('public.company_categories', 'id'), 1, false);

INSERT INTO public.company_categories (name, slug, description, color, icon, is_active) VALUES
  ('E-commerce', 'ecommerce', 'Online retail and shopping platforms', '#10B981', 'shopping-cart', true),
  ('Technology', 'technology', 'Software, hardware, and tech services', '#3B82F6', 'cpu', true),
  ('Restaurant', 'restaurant', 'Food and dining establishments', '#F59E0B', 'utensils', true),
  ('Travel', 'travel', 'Hotels, flights, vacation packages', '#06B6D4', 'plane', true),
  ('Fashion', 'fashion', 'Clothing, accessories, and style', '#EC4899', 'shirt', true),
  ('Health & Beauty', 'health-beauty', 'Wellness, cosmetics, and personal care', '#EF4444', 'heart', true),
  ('Home & Garden', 'home-garden', 'Home improvement and outdoor living', '#8B5CF6', 'home', true),
  ('Automotive', 'automotive', 'Cars, parts, and automotive services', '#6B7280', 'car', true),
  ('Entertainment', 'entertainment', 'Movies, games, and leisure activities', '#F97316', 'gamepad-2', true),
  ('Education', 'education', 'Learning resources and courses', '#6366F1', 'graduation-cap', true),
  ('Finance', 'finance', 'Banking, insurance, and financial services', '#059669', 'dollar-sign', true),
  ('Sports & Fitness', 'sports-fitness', 'Athletic equipment and fitness services', '#84CC16', 'dumbbell', true),
  ('Pets', 'pets', 'Pet supplies and services', '#A855F7', 'dog', true),
  ('Books & Media', 'books-media', 'Books, music, and digital content', '#1E40AF', 'book', true);

-- ============================================
-- 3. INSERT COMPANIES
-- ~75 Major Companies with verified status
-- ============================================

-- Sync companies ID sequence
SELECT setval(pg_get_serial_sequence('public.companies', 'id'), 1, false);

INSERT INTO public.companies (name, slug, logo_url, website_url, description, is_verified, status, category, headquarters, founded_year, rating) VALUES

-- E-COMMERCE & RETAIL
('Amazon', 'amazon', 'https://logo.clearbit.com/amazon.com', 'https://www.amazon.com', 'The world''s largest online retailer and cloud service provider.', true, 'approved', 'E-commerce', 'Seattle, WA', 1994, 4.5),
('Walmart', 'walmart', 'https://logo.clearbit.com/walmart.com', 'https://www.walmart.com', 'Multinational retail corporation operating hypermarkets and grocery stores.', true, 'approved', 'E-commerce', 'Bentonville, AR', 1962, 4.2),
('Target', 'target', 'https://logo.clearbit.com/target.com', 'https://www.target.com', 'General merchandise retailer known for its "cheap chic" aesthetic.', true, 'approved', 'E-commerce', 'Minneapolis, MN', 1902, 4.4),
('eBay', 'ebay', 'https://logo.clearbit.com/ebay.com', 'https://www.ebay.com', 'Global online marketplace connecting buyers and sellers.', true, 'approved', 'E-commerce', 'San Jose, CA', 1995, 4.1),
('Costco', 'costco', 'https://logo.clearbit.com/costco.com', 'https://www.costco.com', 'Membership-only big-box retail stores.', true, 'approved', 'E-commerce', 'Issaquah, WA', 1983, 4.6),
('Wayfair', 'wayfair', 'https://logo.clearbit.com/wayfair.com', 'https://www.wayfair.com', 'E-commerce company selling furniture and home-goods.', true, 'approved', 'E-commerce', 'Boston, MA', 2002, 4.0),
('Etsy', 'etsy', 'https://logo.clearbit.com/etsy.com', 'https://www.etsy.com', 'Global marketplace for unique and creative goods.', true, 'approved', 'E-commerce', 'New York, NY', 2005, 4.3),
('AliExpress', 'aliexpress', 'https://logo.clearbit.com/aliexpress.com', 'https://www.aliexpress.com', 'Online retail service owned by Alibaba Group.', true, 'approved', 'E-commerce', 'Hangzhou, China', 2010, 3.8),
('Macy''s', 'macys', 'https://logo.clearbit.com/macys.com', 'https://www.macys.com', 'Premier department store chain.', true, 'approved', 'E-commerce', 'New York, NY', 1858, 4.1),
('Kohl''s', 'kohls', 'https://logo.clearbit.com/kohls.com', 'https://www.kohls.com', 'Department store retail chain.', true, 'approved', 'E-commerce', 'Menomonee Falls, WI', 1962, 3.9),
('Walgreens', 'walgreens', 'https://logo.clearbit.com/walgreens.com', 'https://www.walgreens.com', 'Pharmacy store chain.', true, 'approved', 'E-commerce', 'Deerfield, IL', 1901, 3.7),
('CVS Pharmacy', 'cvs', 'https://logo.clearbit.com/cvs.com', 'https://www.cvs.com', 'Consumer health and services company.', true, 'approved', 'E-commerce', 'Woonsocket, RI', 1963, 3.8),

-- TECHNOLOGY
('Apple', 'apple', 'https://logo.clearbit.com/apple.com', 'https://www.apple.com', 'Technology company that designs, develops, and sells consumer electronics.', true, 'approved', 'Technology', 'Cupertino, CA', 1976, 4.8),
('Microsoft', 'microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://www.microsoft.com', 'Tech giant producing computer software, consumer electronics, and personal computers.', true, 'approved', 'Technology', 'Redmond, WA', 1975, 4.5),
('Samsung', 'samsung', 'https://logo.clearbit.com/samsung.com', 'https://www.samsung.com', 'Multinational electronics corporation.', true, 'approved', 'Technology', 'Seoul, South Korea', 1938, 4.4),
('Best Buy', 'best-buy', 'https://logo.clearbit.com/bestbuy.com', 'https://www.bestbuy.com', 'Consumer electronics retailer.', true, 'approved', 'Technology', 'Richfield, MN', 1966, 4.3),
('Dell', 'dell', 'https://logo.clearbit.com/dell.com', 'https://www.dell.com', 'Develops, sells, repairs, and supports computers and related products.', true, 'approved', 'Technology', 'Round Rock, TX', 1984, 4.0),
('HP', 'hp', 'https://logo.clearbit.com/hp.com', 'https://www.hp.com', 'Information technology company known for printers and PCs.', true, 'approved', 'Technology', 'Palo Alto, CA', 1939, 3.9),
('Lenovo', 'lenovo', 'https://logo.clearbit.com/lenovo.com', 'https://www.lenovo.com', 'Global technology leader in PC and smart devices.', true, 'approved', 'Technology', 'Beijing, China', 1984, 4.1),
('Sony', 'sony', 'https://logo.clearbit.com/sony.com', 'https://www.sony.com', 'Conglomerate corporation known for electronics, gaming, and entertainment.', true, 'approved', 'Technology', 'Tokyo, Japan', 1946, 4.5),
('Newegg', 'newegg', 'https://logo.clearbit.com/newegg.com', 'https://www.newegg.com', 'Online retailer of computer hardware and consumer electronics.', true, 'approved', 'Technology', 'City of Industry, CA', 2001, 4.2),
('B&H Photo Video', 'bh-photo', 'https://logo.clearbit.com/bhphotovideo.com', 'https://www.bhphotovideo.com', 'American photo and video equipment retailer.', true, 'approved', 'Technology', 'New York, NY', 1973, 4.6),
('Logitech', 'logitech', 'https://logo.clearbit.com/logitech.com', 'https://www.logitech.com', 'Manufacturer of computer peripherals and software.', true, 'approved', 'Technology', 'Lausanne, Switzerland', 1981, 4.3),

-- FASHION
('Nike', 'nike', 'https://logo.clearbit.com/nike.com', 'https://www.nike.com', 'Multinational corporation engaged in footwear, apparel, and equipment.', true, 'approved', 'Fashion', 'Beaverton, OR', 1964, 4.7),
('Adidas', 'adidas', 'https://logo.clearbit.com/adidas.com', 'https://www.adidas.com', 'Design and manufacturing of shoes, clothing and accessories.', true, 'approved', 'Fashion', 'Herzogenaurach, Germany', 1949, 4.5),
('H&M', 'hm', 'https://logo.clearbit.com/hm.com', 'https://www.hm.com', 'Fast-fashion clothing retailer.', true, 'approved', 'Fashion', 'Stockholm, Sweden', 1947, 4.0),
('Zara', 'zara', 'https://logo.clearbit.com/zara.com', 'https://www.zara.com', 'Apparel retailer known for fast fashion.', true, 'approved', 'Fashion', 'Arteixo, Spain', 1975, 4.1),
('Uniqlo', 'uniqlo', 'https://logo.clearbit.com/uniqlo.com', 'https://www.uniqlo.com', 'Japanese casual wear designer, manufacturer and retailer.', true, 'approved', 'Fashion', 'Yamaguchi, Japan', 1949, 4.4),
('Lululemon', 'lululemon', 'https://logo.clearbit.com/lululemon.com', 'https://www.lululemon.com', 'Athletic apparel retailer.', true, 'approved', 'Fashion', 'Vancouver, Canada', 1998, 4.6),
('GAP', 'gap', 'https://logo.clearbit.com/gap.com', 'https://www.gap.com', 'American worldwide clothing and accessories retailer.', true, 'approved', 'Fashion', 'San Francisco, CA', 1969, 3.8),
('Old Navy', 'old-navy', 'https://logo.clearbit.com/oldnavy.com', 'https://www.oldnavy.com', 'American clothing and accessories retailing company.', true, 'approved', 'Fashion', 'San Francisco, CA', 1994, 4.0),
('ASOS', 'asos', 'https://logo.clearbit.com/asos.com', 'https://www.asos.com', 'British online fashion and cosmetic retailer.', true, 'approved', 'Fashion', 'London, UK', 2000, 3.9),
('Shein', 'shein', 'https://logo.clearbit.com/shein.com', 'https://www.shein.com', 'Global online fashion and lifestyle retailer.', true, 'approved', 'Fashion', 'Singapore', 2008, 3.5),
('Victoria''s Secret', 'victorias-secret', 'https://logo.clearbit.com/victoriassecret.com', 'https://www.victoriassecret.com', 'American lingerie, clothing, and beauty retailer.', true, 'approved', 'Fashion', 'San Francisco, CA', 1977, 3.9),
('Ralph Lauren', 'ralph-lauren', 'https://logo.clearbit.com/ralphlauren.com', 'https://www.ralphlauren.com', 'American fashion company.', true, 'approved', 'Fashion', 'New York, NY', 1967, 4.3),
('Levi''s', 'levis', 'https://logo.clearbit.com/levi.com', 'https://www.levi.com', 'American clothing company known worldwide for its denim jeans.', true, 'approved', 'Fashion', 'San Francisco, CA', 1853, 4.4),

-- RESTAURANT & FOOD
('DoorDash', 'doordash', 'https://logo.clearbit.com/doordash.com', 'https://www.doordash.com', 'Food delivery service.', true, 'approved', 'Restaurant', 'San Francisco, CA', 2013, 4.1),
('Uber Eats', 'uber-eats', 'https://logo.clearbit.com/ubereats.com', 'https://www.ubereats.com', 'Online food ordering and delivery platform.', true, 'approved', 'Restaurant', 'San Francisco, CA', 2014, 4.0),
('Grubhub', 'grubhub', 'https://logo.clearbit.com/grubhub.com', 'https://www.grubhub.com', 'Mobile food-ordering marketplace.', true, 'approved', 'Restaurant', 'Chicago, IL', 2004, 3.8),
('Starbucks', 'starbucks', 'https://logo.clearbit.com/starbucks.com', 'https://www.starbucks.com', 'American coffeehouse chain.', true, 'approved', 'Restaurant', 'Seattle, WA', 1971, 4.5),
('McDonald''s', 'mcdonalds', 'https://logo.clearbit.com/mcdonalds.com', 'https://www.mcdonalds.com', 'Multinational fast food chain.', true, 'approved', 'Restaurant', 'San Bernardino, CA', 1940, 3.9),
('Domino''s Pizza', 'dominos', 'https://logo.clearbit.com/dominos.com', 'https://www.dominos.com', 'Multinational pizza restaurant chain.', true, 'approved', 'Restaurant', 'Ypsilanti, MI', 1960, 4.2),
('Chipotle', 'chipotle', 'https://logo.clearbit.com/chipotle.com', 'https://www.chipotle.com', 'Fast casual restaurants specializing in tacos and burritos.', true, 'approved', 'Restaurant', 'Denver, CO', 1993, 4.3),
('Dunkin''', 'dunkin', 'https://logo.clearbit.com/dunkindonuts.com', 'https://www.dunkindonuts.com', 'Coffee and doughnut company.', true, 'approved', 'Restaurant', 'Quincy, MA', 1950, 4.1),

-- HOME & GARDEN
('Home Depot', 'home-depot', 'https://logo.clearbit.com/homedepot.com', 'https://www.homedepot.com', 'Home improvement retailer.', true, 'approved', 'Home & Garden', 'Atlanta, GA', 1978, 4.4),
('Lowe''s', 'lowes', 'https://logo.clearbit.com/lowes.com', 'https://www.lowes.com', 'Retail company specializing in home improvement.', true, 'approved', 'Home & Garden', 'Mooresville, NC', 1921, 4.2),
('IKEA', 'ikea', 'https://logo.clearbit.com/ikea.com', 'https://www.ikea.com', 'Furniture and home accessories.', true, 'approved', 'Home & Garden', 'Delft, Netherlands', 1943, 4.5),
('Bed Bath & Beyond', 'bed-bath-beyond', 'https://logo.clearbit.com/bedbathandbeyond.com', 'https://www.bedbathandbeyond.com', 'Chain of domestic merchandise retail stores.', true, 'approved', 'Home & Garden', 'Union, NJ', 1971, 3.7),

-- TRAVEL
('Expedia', 'expedia', 'https://logo.clearbit.com/expedia.com', 'https://www.expedia.com', 'Online travel agency.', true, 'approved', 'Travel', 'Seattle, WA', 1996, 4.0),
('Booking.com', 'booking-com', 'https://logo.clearbit.com/booking.com', 'https://www.booking.com', 'Online travel agency for lodging reservations.', true, 'approved', 'Travel', 'Amsterdam, Netherlands', 1996, 4.3),
('Airbnb', 'airbnb', 'https://logo.clearbit.com/airbnb.com', 'https://www.airbnb.com', 'Online marketplace for lodging and tourism activities.', true, 'approved', 'Travel', 'San Francisco, CA', 2008, 4.4),
('TripAdvisor', 'tripadvisor', 'https://logo.clearbit.com/tripadvisor.com', 'https://www.tripadvisor.com', 'Travel information and booking website.', true, 'approved', 'Travel', 'Needham, MA', 2000, 4.1),
('Delta Air Lines', 'delta', 'https://logo.clearbit.com/delta.com', 'https://www.delta.com', 'Major United States airline.', true, 'approved', 'Travel', 'Atlanta, GA', 1925, 3.9),
('United Airlines', 'united', 'https://logo.clearbit.com/united.com', 'https://www.united.com', 'Major American airline.', true, 'approved', 'Travel', 'Chicago, IL', 1926, 3.5),
('American Airlines', 'american-airlines', 'https://logo.clearbit.com/aa.com', 'https://www.aa.com', 'Major US-based airline.', true, 'approved', 'Travel', 'Fort Worth, TX', 1926, 3.4),
('Southwest Airlines', 'southwest', 'https://logo.clearbit.com/southwest.com', 'https://www.southwest.com', 'Major American airline.', true, 'approved', 'Travel', 'Dallas, TX', 1967, 3.8),

-- HEALTH & BEAUTY
('Sephora', 'sephora', 'https://logo.clearbit.com/sephora.com', 'https://www.sephora.com', 'Personal care and beauty stores.', true, 'approved', 'Health & Beauty', 'Paris, France', 1970, 4.6),
('Ulta Beauty', 'ulta', 'https://logo.clearbit.com/ulta.com', 'https://www.ulta.com', 'Chain of beauty stores.', true, 'approved', 'Health & Beauty', 'Bolingbrook, IL', 1990, 4.5),
('Bath & Body Works', 'bath-body-works', 'https://logo.clearbit.com/bathandbodyworks.com', 'https://www.bathandbodyworks.com', 'Retail store chain selling soaps, lotions, fragrances, and candles.', true, 'approved', 'Health & Beauty', 'Columbus, OH', 1990, 4.3),
('Glossier', 'glossier', 'https://logo.clearbit.com/glossier.com', 'https://www.glossier.com', 'Direct-to-consumer beauty company.', true, 'approved', 'Health & Beauty', 'New York, NY', 2014, 4.2),

-- ENTERTAINMENT & MISC
('GameStop', 'gamestop', 'https://logo.clearbit.com/gamestop.com', 'https://www.gamestop.com', 'Video game consumer electronics and gaming merchandise retailer.', true, 'approved', 'Entertainment', 'Grapevine, TX', 1984, 3.8),
('Steam', 'steam', 'https://logo.clearbit.com/steampowered.com', 'https://store.steampowered.com', 'Video game digital distribution service.', true, 'approved', 'Entertainment', 'Bellevue, WA', 2003, 4.8),
('Netflix', 'netflix', 'https://logo.clearbit.com/netflix.com', 'https://www.netflix.com', 'Subscription streaming service and production company.', true, 'approved', 'Entertainment', 'Los Gatos, CA', 1997, 4.4),
('Spotify', 'spotify', 'https://logo.clearbit.com/spotify.com', 'https://www.spotify.com', 'Audio streaming and media services provider.', true, 'approved', 'Entertainment', 'Stockholm, Sweden', 2006, 4.5),
('Disney+', 'disney-plus', 'https://logo.clearbit.com/disneyplus.com', 'https://www.disneyplus.com', 'Subscription video on-demand over-the-top streaming service.', true, 'approved', 'Entertainment', 'Burbank, CA', 2019, 4.3),
('Ticketmaster', 'ticketmaster', 'https://logo.clearbit.com/ticketmaster.com', 'https://www.ticketmaster.com', 'American ticket sales and distribution company.', true, 'approved', 'Entertainment', 'Beverly Hills, CA', 1976, 2.8),
('StubHub', 'stubhub', 'https://logo.clearbit.com/stubhub.com', 'https://www.stubhub.com', 'Ticket exchange and resale company.', true, 'approved', 'Entertainment', 'San Francisco, CA', 2000, 3.5),

-- AUTOMOTIVE
('AutoZone', 'autozone', 'https://logo.clearbit.com/autozone.com', 'https://www.autozone.com', 'Retailer of after-market automotive parts and accessories.', true, 'approved', 'Automotive', 'Memphis, TN', 1979, 4.1),
('O''Reilly Auto Parts', 'oreilly-auto', 'https://logo.clearbit.com/oreillyauto.com', 'https://www.oreillyauto.com', 'American auto parts retailer.', true, 'approved', 'Automotive', 'Springfield, MO', 1957, 4.0),
('Tesla', 'tesla', 'https://logo.clearbit.com/tesla.com', 'https://www.tesla.com', 'Electric vehicle manufacturer.', true, 'approved', 'Automotive', 'Austin, TX', 2003, 4.5),

-- SPORTS
('Dick''s Sporting Goods', 'dicks', 'https://logo.clearbit.com/dickssportinggoods.com', 'https://www.dickssportinggoods.com', 'Sporting goods retail company.', true, 'approved', 'Sports & Fitness', 'Coraopolis, PA', 1948, 4.1),
('REI', 'rei', 'https://logo.clearbit.com/rei.com', 'https://www.rei.com', 'American retail and outdoor recreation services corporation.', true, 'approved', 'Sports & Fitness', 'Seattle, WA', 1938, 4.7),
('Peloton', 'peloton', 'https://logo.clearbit.com/onepeloton.com', 'https://www.onepeloton.com', 'Exercise equipment and media company.', true, 'approved', 'Sports & Fitness', 'New York, NY', 2012, 4.0),

-- PETS
('Chewy', 'chewy', 'https://logo.clearbit.com/chewy.com', 'https://www.chewy.com', 'Online retailer of pet food and other pet-related products.', true, 'approved', 'Pets', 'Dania Beach, FL', 2011, 4.6),
('PetSmart', 'petsmart', 'https://logo.clearbit.com/petsmart.com', 'https://www.petsmart.com', 'North American pet superstore chain.', true, 'approved', 'Pets', 'Phoenix, AZ', 1986, 4.0),
('Petco', 'petco', 'https://logo.clearbit.com/petco.com', 'https://www.petco.com', 'American health and wellness company focused on pets.', true, 'approved', 'Pets', 'San Diego, CA', 1965, 3.9)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  description = EXCLUDED.description,
  is_verified = EXCLUDED.is_verified,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  headquarters = EXCLUDED.headquarters,
  founded_year = EXCLUDED.founded_year,
  rating = EXCLUDED.rating;

-- Update category_id based on category string name - LINKING TO company_categories
DO $$
BEGIN
  -- Update referenced from company_categories
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'category_id') THEN
    UPDATE public.companies c
    SET category_id = cc.id
    FROM public.company_categories cc
    WHERE LOWER(c.category) = LOWER(cc.name) 
       OR STRPOS(LOWER(cc.name), LOWER(c.category)) > 0
       OR STRPOS(LOWER(c.category), LOWER(cc.name)) > 0;
  END IF;
END $$;

COMMIT;

SELECT count(*) as companies_inserted FROM companies;
