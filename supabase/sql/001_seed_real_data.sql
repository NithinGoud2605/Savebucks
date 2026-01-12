-- ============================================
-- SEED REAL DATA SCRIPT
-- Inserts real companies, deals, and coupons
-- ============================================

BEGIN;

-- ============================================
-- CATEGORIES (ensure they exist)
-- ============================================
INSERT INTO public.categories (name, slug, description, color, icon, is_active) VALUES
  ('Electronics', 'electronics', 'Phones, computers, gadgets and more', '#3B82F6', 'cpu', true),
  ('Fashion', 'fashion', 'Clothing, shoes, accessories', '#EC4899', 'shirt', true),
  ('Home & Garden', 'home-garden', 'Furniture, decor, outdoor', '#84CC16', 'home', true),
  ('Food & Dining', 'food-dining', 'Restaurants, groceries, delivery', '#F59E0B', 'utensils', true),
  ('Travel', 'travel', 'Hotels, flights, vacation packages', '#8B5CF6', 'plane', true),
  ('Health & Beauty', 'health-beauty', 'Skincare, wellness, fitness', '#EF4444', 'heart', true),
  ('Entertainment', 'entertainment', 'Games, movies, streaming', '#F97316', 'gamepad-2', true),
  ('Sports & Outdoors', 'sports-outdoors', 'Athletic gear, camping, fitness', '#10B981', 'dumbbell', true),
  ('Automotive', 'automotive', 'Car parts, accessories, services', '#6B7280', 'car', true),
  ('Baby & Kids', 'baby-kids', 'Toys, clothing, gear for children', '#A855F7', 'baby', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMPANIES (Real companies)
-- ============================================
INSERT INTO public.companies (name, slug, logo_url, website_url, description, is_verified, status, category, headquarters, founded_year, rating) VALUES
-- E-commerce Giants
('Amazon', 'amazon', 'https://logo.clearbit.com/amazon.com', 'https://www.amazon.com', 'World''s largest online retailer offering millions of products across every category.', true, 'approved', 'E-commerce', 'Seattle, WA', 1994, 4.5),
('Walmart', 'walmart', 'https://logo.clearbit.com/walmart.com', 'https://www.walmart.com', 'Multinational retail corporation with everyday low prices on groceries, electronics, and more.', true, 'approved', 'E-commerce', 'Bentonville, AR', 1962, 4.2),
('Target', 'target', 'https://logo.clearbit.com/target.com', 'https://www.target.com', 'Popular department store known for stylish, affordable products and excellent customer service.', true, 'approved', 'E-commerce', 'Minneapolis, MN', 1902, 4.4),
('eBay', 'ebay', 'https://logo.clearbit.com/ebay.com', 'https://www.ebay.com', 'Online marketplace for buying and selling new and used items from around the world.', true, 'approved', 'E-commerce', 'San Jose, CA', 1995, 4.1),

-- Technology
('Best Buy', 'best-buy', 'https://logo.clearbit.com/bestbuy.com', 'https://www.bestbuy.com', 'Leading consumer electronics retailer with expert advice and competitive prices.', true, 'approved', 'Technology', 'Richfield, MN', 1966, 4.3),
('Apple', 'apple', 'https://logo.clearbit.com/apple.com', 'https://www.apple.com', 'Iconic technology company known for iPhone, Mac, iPad, and innovative design.', true, 'approved', 'Technology', 'Cupertino, CA', 1976, 4.8),
('Samsung', 'samsung', 'https://logo.clearbit.com/samsung.com', 'https://www.samsung.com', 'Global leader in smartphones, TVs, appliances, and semiconductor technology.', true, 'approved', 'Technology', 'Seoul, South Korea', 1938, 4.4),
('Microsoft', 'microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://www.microsoft.com', 'Technology giant behind Windows, Office, Xbox, and Azure cloud services.', true, 'approved', 'Technology', 'Redmond, WA', 1975, 4.5),

-- Fashion
('Nike', 'nike', 'https://logo.clearbit.com/nike.com', 'https://www.nike.com', 'World''s leading athletic footwear and apparel brand. Just Do It.', true, 'approved', 'Fashion', 'Beaverton, OR', 1964, 4.6),
('Adidas', 'adidas', 'https://logo.clearbit.com/adidas.com', 'https://www.adidas.com', 'German sportswear brand known for iconic three stripes and innovative athletic gear.', true, 'approved', 'Fashion', 'Herzogenaurach, Germany', 1949, 4.5),
('H&M', 'hm', 'https://logo.clearbit.com/hm.com', 'https://www.hm.com', 'Swedish fashion retailer offering trendy clothing at affordable prices.', true, 'approved', 'Fashion', 'Stockholm, Sweden', 1947, 4.0),
('Zara', 'zara', 'https://logo.clearbit.com/zara.com', 'https://www.zara.com', 'Fast-fashion retailer known for runway-inspired designs at accessible prices.', true, 'approved', 'Fashion', 'Arteixo, Spain', 1975, 4.2),

-- Food & Delivery
('DoorDash', 'doordash', 'https://logo.clearbit.com/doordash.com', 'https://www.doordash.com', 'America''s leading food delivery service connecting you with local restaurants.', true, 'approved', 'Restaurant', 'San Francisco, CA', 2013, 4.1),
('Uber Eats', 'uber-eats', 'https://logo.clearbit.com/ubereats.com', 'https://www.ubereats.com', 'Food delivery platform offering meals from thousands of restaurants worldwide.', true, 'approved', 'Restaurant', 'San Francisco, CA', 2014, 4.0),
('Grubhub', 'grubhub', 'https://logo.clearbit.com/grubhub.com', 'https://www.grubhub.com', 'Online food ordering and delivery platform partnering with local restaurants.', true, 'approved', 'Restaurant', 'Chicago, IL', 2004, 3.9),

-- Travel
('Expedia', 'expedia', 'https://logo.clearbit.com/expedia.com', 'https://www.expedia.com', 'Full-service travel booking site for flights, hotels, car rentals, and vacation packages.', true, 'approved', 'Travel', 'Seattle, WA', 1996, 4.2),
('Hotels.com', 'hotels-com', 'https://logo.clearbit.com/hotels.com', 'https://www.hotels.com', 'Hotel booking platform with rewards program and price match guarantee.', true, 'approved', 'Travel', 'Dallas, TX', 1991, 4.3),
('Airbnb', 'airbnb', 'https://logo.clearbit.com/airbnb.com', 'https://www.airbnb.com', 'Online marketplace for unique accommodations and experiences worldwide.', true, 'approved', 'Travel', 'San Francisco, CA', 2008, 4.4),

-- Health & Beauty
('Sephora', 'sephora', 'https://logo.clearbit.com/sephora.com', 'https://www.sephora.com', 'Leading beauty retailer offering makeup, skincare, fragrance, and haircare products.', true, 'approved', 'Health & Beauty', 'Paris, France', 1970, 4.6),
('Ulta Beauty', 'ulta', 'https://logo.clearbit.com/ulta.com', 'https://www.ulta.com', 'One-stop beauty destination with salon services and extensive product selection.', true, 'approved', 'Health & Beauty', 'Bolingbrook, IL', 1990, 4.5),

-- Home & Garden
('Home Depot', 'home-depot', 'https://logo.clearbit.com/homedepot.com', 'https://www.homedepot.com', 'Largest home improvement retailer with tools, appliances, and building materials.', true, 'approved', 'Home & Garden', 'Atlanta, GA', 1978, 4.4),
('Lowes', 'lowes', 'https://logo.clearbit.com/lowes.com', 'https://www.lowes.com', 'Home improvement and appliance store with expert installation services.', true, 'approved', 'Home & Garden', 'Mooresville, NC', 1921, 4.3),
('IKEA', 'ikea', 'https://logo.clearbit.com/ikea.com', 'https://www.ikea.com', 'Swedish furniture retailer known for affordable, stylish, and functional home furnishings.', true, 'approved', 'Home & Garden', 'Delft, Netherlands', 1943, 4.2),

-- Entertainment
('GameStop', 'gamestop', 'https://logo.clearbit.com/gamestop.com', 'https://www.gamestop.com', 'Video game and consumer electronics retailer with trade-in program.', true, 'approved', 'Entertainment', 'Grapevine, TX', 1984, 3.8),
('Steam', 'steam', 'https://logo.clearbit.com/steampowered.com', 'https://store.steampowered.com', 'Leading digital gaming platform with thousands of PC games and regular sales.', true, 'approved', 'Entertainment', 'Bellevue, WA', 2003, 4.7)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  description = EXCLUDED.description,
  is_verified = EXCLUDED.is_verified,
  status = EXCLUDED.status;

-- ============================================
-- DEALS (Real product deals)
-- ============================================

-- Get category IDs for reference
DO $$
DECLARE
  cat_electronics BIGINT;
  cat_fashion BIGINT;
  cat_home BIGINT;
  cat_food BIGINT;
  cat_travel BIGINT;
  cat_beauty BIGINT;
  cat_entertainment BIGINT;
  
  comp_amazon BIGINT;
  comp_walmart BIGINT;
  comp_target BIGINT;
  comp_bestbuy BIGINT;
  comp_apple BIGINT;
  comp_nike BIGINT;
  comp_sephora BIGINT;
  comp_homedepot BIGINT;
  comp_doordash BIGINT;
  comp_steam BIGINT;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_electronics FROM public.categories WHERE slug = 'electronics';
  SELECT id INTO cat_fashion FROM public.categories WHERE slug = 'fashion';
  SELECT id INTO cat_home FROM public.categories WHERE slug = 'home-garden';
  SELECT id INTO cat_food FROM public.categories WHERE slug = 'food-dining';
  SELECT id INTO cat_travel FROM public.categories WHERE slug = 'travel';
  SELECT id INTO cat_beauty FROM public.categories WHERE slug = 'health-beauty';
  SELECT id INTO cat_entertainment FROM public.categories WHERE slug = 'entertainment';
  
  -- Get company IDs
  SELECT id INTO comp_amazon FROM public.companies WHERE slug = 'amazon';
  SELECT id INTO comp_walmart FROM public.companies WHERE slug = 'walmart';
  SELECT id INTO comp_target FROM public.companies WHERE slug = 'target';
  SELECT id INTO comp_bestbuy FROM public.companies WHERE slug = 'best-buy';
  SELECT id INTO comp_apple FROM public.companies WHERE slug = 'apple';
  SELECT id INTO comp_nike FROM public.companies WHERE slug = 'nike';
  SELECT id INTO comp_sephora FROM public.companies WHERE slug = 'sephora';
  SELECT id INTO comp_homedepot FROM public.companies WHERE slug = 'home-depot';
  SELECT id INTO comp_doordash FROM public.companies WHERE slug = 'doordash';
  SELECT id INTO comp_steam FROM public.companies WHERE slug = 'steam';
  
  -- Insert deals
  -- Amazon Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('Apple AirPods Pro (2nd Gen) - Lowest Price Ever!', 'https://www.amazon.com/dp/B0D1XD1ZV3', 'Apple AirPods Pro 2nd generation with USB-C, Active Noise Cancellation, and Transparency mode. Best price we''ve seen!', 189.99, 249.00, 24, 'Amazon', cat_electronics, comp_amazon, 'approved', 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg', true, 1250, 342),
  ('Sony WH-1000XM5 Wireless Headphones - $100 Off', 'https://www.amazon.com/dp/B09XS7JWHH', 'Industry-leading noise cancellation, 30-hour battery life, crystal clear calls. Premium wireless headphones at the best price.', 298.00, 399.99, 25, 'Amazon', cat_electronics, comp_amazon, 'approved', 'https://m.media-amazon.com/images/I/61vJtKbAssL._AC_SL1500_.jpg', true, 890, 234),
  ('Kindle Paperwhite 16GB - Prime Day Price', 'https://www.amazon.com/dp/B08KTZ8249', 'Waterproof e-reader with 6.8" display, adjustable warm light, and weeks of battery life. Perfect for book lovers!', 99.99, 149.99, 33, 'Amazon', cat_electronics, comp_amazon, 'approved', 'https://m.media-amazon.com/images/I/61LqNj1gGaL._AC_SL1000_.jpg', false, 567, 145),
  ('Instant Pot Duo 7-in-1 Electric Pressure Cooker', 'https://www.amazon.com/dp/B00FLYWNYQ', 'The #1 best-selling multi-cooker. Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, and warmer in one.', 79.95, 99.95, 20, 'Amazon', cat_home, comp_amazon, 'approved', 'https://m.media-amazon.com/images/I/71WtwEvYDOS._AC_SL1500_.jpg', false, 423, 98);

  -- Best Buy Deals  
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('Samsung 65" OLED 4K Smart TV - Open Box Excellent', 'https://www.bestbuy.com/site/samsung-65-class-s90d-series', 'Samsung S90D OLED with AI-powered 4K upscaling. Open-box excellent condition with full warranty.', 1299.99, 1999.99, 35, 'Best Buy', cat_electronics, comp_bestbuy, 'approved', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6576/6576526_sd.jpg', true, 756, 189),
  ('MacBook Air M3 - Student Discount Available', 'https://www.bestbuy.com/site/apple-macbook-air-13-m3', 'Latest MacBook Air with M3 chip, 15-hour battery, stunning Liquid Retina display. Student pricing available!', 999.00, 1099.00, 9, 'Best Buy', cat_electronics, comp_bestbuy, 'approved', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6565/6565837_sd.jpg', false, 534, 156),
  ('PlayStation 5 Console Bundle - In Stock Now', 'https://www.bestbuy.com/site/sony-playstation-5-console', 'PS5 with DualSense controller and Spider-Man 2 game bundle. Limited availability!', 499.99, 559.99, 11, 'Best Buy', cat_entertainment, comp_bestbuy, 'approved', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6565/6565194_sd.jpg', true, 2100, 567);

  -- Nike Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('Nike Air Max 270 - Extra 25% Off Sale Items', 'https://www.nike.com/t/air-max-270-mens-shoes', 'Iconic Air Max 270 with large Air unit for all-day comfort. Extra 25% off with code SAVE25.', 112.47, 160.00, 30, 'Nike', cat_fashion, comp_nike, 'approved', 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-mens-shoes-KkLcGR.png', false, 678, 234),
  ('Nike Dunk Low Retro - Multiple Colorways', 'https://www.nike.com/t/dunk-low-retro-mens-shoes', 'The iconic basketball shoe turned streetwear staple. Multiple colorways in stock.', 115.00, 115.00, 0, 'Nike', cat_fashion, comp_nike, 'approved', 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b1bcbca4-e853-4df7-b329-5be3c61ee057/dunk-low-retro-mens-shoes-76KnBL.png', true, 1567, 423);

  -- Sephora Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('Rare Beauty Soft Pinch Liquid Blush - Bestseller', 'https://www.sephora.com/product/rare-beauty-soft-pinch-liquid-blush', 'Selena Gomez''s viral blush that creates a soft, natural flush. A little goes a long way!', 23.00, 23.00, 0, 'Sephora', cat_beauty, comp_sephora, 'approved', 'https://www.sephora.com/productimages/sku/s2362108-main-zoom.jpg', false, 2345, 567),
  ('Dyson Airwrap Complete - Gift Set', 'https://www.sephora.com/product/dyson-airwrap-complete', 'The complete Dyson Airwrap with all attachments for curling, waving, smoothing and drying. Gift edition with case.', 599.99, 599.99, 0, 'Sephora', cat_beauty, comp_sephora, 'approved', 'https://www.sephora.com/productimages/sku/s2555412-main-zoom.jpg', true, 1234, 289);

  -- Home Depot Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('DeWalt 20V MAX Drill/Driver Kit - Free Battery', 'https://www.homedepot.com/p/DEWALT-20V-MAX-Drill-Driver-Kit', 'Powerful brushless motor drill with 2 batteries, charger, and bag. Get a free extra battery with purchase!', 159.00, 229.00, 31, 'Home Depot', cat_home, comp_homedepot, 'approved', 'https://images.thdstatic.com/productImages/f6bd7a15-0d68-46cb-b30c-36d699b3e426/svn/dewalt-power-tool-combo-kits-dck277c2-64_600.jpg', false, 456, 123),
  ('Weber Genesis Gas Grill - Spring Sale', 'https://www.homedepot.com/p/Weber-Genesis-E-325s-Gas-Grill', 'Premium 3-burner gas grill with smart technology. Perfect for outdoor entertaining.', 849.00, 999.00, 15, 'Home Depot', cat_home, comp_homedepot, 'approved', 'https://images.thdstatic.com/productImages/4f6f8c5c-4f8a-4f8a-8f8a-4f8a4f8a4f8a/svn/weber-gas-grills-35510001-64_600.jpg', true, 345, 87);

  -- Gaming/Steam Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('Elden Ring - Steam Winter Sale', 'https://store.steampowered.com/app/1245620/ELDEN_RING/', 'FromSoftware''s masterpiece at its lowest price ever. Winner of Game of the Year 2022.', 35.99, 59.99, 40, 'Steam', cat_entertainment, comp_steam, 'approved', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg', true, 3456, 876),
  ('Baldur''s Gate 3 - 20% Off', 'https://store.steampowered.com/app/1086940/Baldurs_Gate_3/', 'The critically acclaimed RPG of 2023. 100+ hours of epic adventure and choices that matter.', 47.99, 59.99, 20, 'Steam', cat_entertainment, comp_steam, 'approved', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg', true, 2678, 654);

  -- DoorDash Deals
  INSERT INTO public.deals (title, url, description, price, original_price, discount_percentage, merchant, category_id, company_id, status, image_url, is_featured, views_count, clicks_count) VALUES
  ('DoorDash: 50% Off First 2 Orders', 'https://www.doordash.com/promo', 'New customers get 50% off their first 2 orders, up to $15 each. Use code WELCOME50.', 0, 0, 50, 'DoorDash', cat_food, comp_doordash, 'approved', 'https://cdn.doordash.com/static/img/social/doordash-social-default.jpg', true, 4567, 1234);

END $$;

-- ============================================
-- COUPONS (Real coupon codes)
-- ============================================

DO $$
DECLARE
  comp_amazon BIGINT;
  comp_nike BIGINT;
  comp_sephora BIGINT;
  comp_doordash BIGINT;
  comp_ubereats BIGINT;
  comp_expedia BIGINT;
  comp_homedepot BIGINT;
  comp_target BIGINT;
  comp_hm BIGINT;
  comp_ulta BIGINT;
  cat_id BIGINT;
BEGIN
  -- Get company IDs
  SELECT id INTO comp_amazon FROM public.companies WHERE slug = 'amazon';
  SELECT id INTO comp_nike FROM public.companies WHERE slug = 'nike';
  SELECT id INTO comp_sephora FROM public.companies WHERE slug = 'sephora';
  SELECT id INTO comp_doordash FROM public.companies WHERE slug = 'doordash';
  SELECT id INTO comp_ubereats FROM public.companies WHERE slug = 'uber-eats';
  SELECT id INTO comp_expedia FROM public.companies WHERE slug = 'expedia';
  SELECT id INTO comp_homedepot FROM public.companies WHERE slug = 'home-depot';
  SELECT id INTO comp_target FROM public.companies WHERE slug = 'target';
  SELECT id INTO comp_hm FROM public.companies WHERE slug = 'hm';
  SELECT id INTO comp_ulta FROM public.companies WHERE slug = 'ulta';
  
  -- Get a default category
  SELECT id INTO cat_id FROM public.categories WHERE slug = 'electronics' LIMIT 1;

  -- Insert coupons
  INSERT INTO public.coupons (title, description, coupon_code, coupon_type, discount_value, minimum_order_amount, company_id, category_id, status, is_featured, expires_at, views_count, clicks_count) VALUES
  -- Amazon
  ('Amazon: $10 Off $50+ Orders', 'Get $10 off when you spend $50 or more on eligible items. Limited time offer.', 'SAVE10NOW', 'fixed_amount', 10.00, 50.00, comp_amazon, cat_id, 'approved', true, NOW() + INTERVAL '30 days', 2345, 567),
  ('Amazon Prime: 30-Day Free Trial', 'Try Amazon Prime free for 30 days. Free shipping, Prime Video, and more.', 'PRIMETRIAL', 'free_shipping', 0, 0, comp_amazon, cat_id, 'approved', false, NOW() + INTERVAL '90 days', 1234, 345),
  
  -- Nike
  ('Nike: 25% Off Sale Items', 'Extra 25% off already reduced sale items. Stack the savings!', 'SAVE25', 'percentage', 25.00, 0, comp_nike, cat_id, 'approved', true, NOW() + INTERVAL '14 days', 3456, 789),
  ('Nike: Free Shipping on All Orders', 'Free standard shipping on all orders, no minimum. Members only.', 'FREESHIP', 'free_shipping', 0, 0, comp_nike, cat_id, 'approved', false, NOW() + INTERVAL '30 days', 1567, 423),
  
  -- Sephora
  ('Sephora: 15% Off + Free Shipping', 'Beauty Insider members get 15% off entire purchase plus free shipping.', 'BEAUTY15', 'percentage', 15.00, 35.00, comp_sephora, cat_id, 'approved', true, NOW() + INTERVAL '7 days', 4567, 1234),
  ('Sephora: Free Deluxe Sample Set', 'Get 6 free deluxe samples with any $75 purchase.', 'SAMPLES6', 'fixed_amount', 0, 75.00, comp_sephora, cat_id, 'approved', false, NOW() + INTERVAL '14 days', 2345, 678),
  
  -- DoorDash
  ('DoorDash: $5 Off Your Order', 'Save $5 on your next DoorDash order of $20 or more.', 'DASH5OFF', 'fixed_amount', 5.00, 20.00, comp_doordash, cat_id, 'approved', true, NOW() + INTERVAL '7 days', 5678, 1456),
  ('DoorDash: Free Delivery on First Order', 'New customers get free delivery on their first order.', 'FREEDELIVERY', 'free_shipping', 0, 0, comp_doordash, cat_id, 'approved', false, NOW() + INTERVAL '30 days', 3456, 987),
  
  -- Uber Eats
  ('Uber Eats: 40% Off Up to $15', 'Get 40% off your order, max discount $15. New and existing users.', 'EATS40OFF', 'percentage', 40.00, 0, comp_ubereats, cat_id, 'approved', true, NOW() + INTERVAL '5 days', 4321, 1098),
  
  -- Expedia
  ('Expedia: $50 Off $500+ Hotel Booking', 'Save $50 when you book a hotel stay of $500 or more.', 'HOTEL50', 'fixed_amount', 50.00, 500.00, comp_expedia, cat_id, 'approved', true, NOW() + INTERVAL '60 days', 2345, 567),
  ('Expedia: 10% Off Flight + Hotel Bundle', 'Bundle and save 10% when you book flight and hotel together.', 'BUNDLE10', 'percentage', 10.00, 0, comp_expedia, cat_id, 'approved', false, NOW() + INTERVAL '90 days', 1678, 345),
  
  -- Home Depot
  ('Home Depot: $25 Off $200+ Orders', 'Save $25 on orders of $200 or more. Valid in-store and online.', 'HD25OFF', 'fixed_amount', 25.00, 200.00, comp_homedepot, cat_id, 'approved', true, NOW() + INTERVAL '14 days', 1234, 345),
  
  -- Target
  ('Target: 20% Off One Item', 'Use Target Circle to get 20% off one qualifying item.', 'CIRCLE20', 'percentage', 20.00, 0, comp_target, cat_id, 'approved', true, NOW() + INTERVAL '7 days', 3456, 876),
  ('Target: Free Shipping on $35+', 'Free standard shipping on all orders of $35 or more.', 'SHIP35', 'free_shipping', 0, 35.00, comp_target, cat_id, 'approved', false, NULL, 2345, 678),
  
  -- H&M
  ('H&M: 20% Off Everything', 'Members get 20% off entire purchase. Sign up for free!', 'HM20MEMBER', 'percentage', 20.00, 0, comp_hm, cat_id, 'approved', true, NOW() + INTERVAL '3 days', 2345, 567),
  
  -- Ulta
  ('Ulta: $5 Off $15+ Purchase', 'Save $5 on any purchase of $15 or more. Works on sale items too!', 'ULTA5OFF', 'fixed_amount', 5.00, 15.00, comp_ulta, cat_id, 'approved', true, NOW() + INTERVAL '14 days', 3456, 789);

END $$;

COMMIT;

-- Success message
SELECT 
  (SELECT COUNT(*) FROM public.companies) as companies_count,
  (SELECT COUNT(*) FROM public.deals) as deals_count,
  (SELECT COUNT(*) FROM public.coupons) as coupons_count,
  'Seed data inserted successfully!' as status;
