-- Fix profiles table and populate clean data
-- First add missing columns to profiles table

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS karma INTEGER NOT NULL DEFAULT 0;

-- Create some test users first (these will be referenced by deals and coupons)
INSERT INTO public.profiles (id, handle, avatar_url, karma) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dealmaster', 'https://i.pravatar.cc/150?img=1', 150),
  ('22222222-2222-2222-2222-222222222222', 'bargainhunter', 'https://i.pravatar.cc/150?img=2', 120),
  ('33333333-3333-3333-3333-333333333333', 'savingsexpert', 'https://i.pravatar.cc/150?img=3', 200),
  ('44444444-4444-4444-4444-444444444444', 'couponqueen', 'https://i.pravatar.cc/150?img=4', 180),
  ('55555555-5555-5555-5555-555555555555', 'techdealer', 'https://i.pravatar.cc/150?img=5', 95)
ON CONFLICT (id) DO UPDATE SET
  handle = EXCLUDED.handle,
  avatar_url = EXCLUDED.avatar_url,
  karma = EXCLUDED.karma;

-- Now populate deals with realistic data
INSERT INTO public.deals (
  submitter_id, company_id, category_id, title, url, price, original_price, 
  merchant, description, image_url, discount_percentage, deal_type, 
  is_featured, views_count, clicks_count, status, approved_at
) VALUES
  -- Electronics deals
  ('11111111-1111-1111-1111-111111111111', 1, 1, 'Amazon Echo Dot (5th Gen) - 50% Off', 'https://amazon.com/echo-dot', 24.99, 49.99, 'Amazon', 'Smart speaker with Alexa voice control, perfect for any room', 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg', 50, 'discount', true, 450, 89, 'approved', NOW() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 2, 1, 'Apple MacBook Air M3 - $200 Off', 'https://apple.com/macbook-air', 899.00, 1099.00, 'Apple', 'Latest MacBook Air with M3 chip, 13-inch display, 8GB RAM', 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202402', 18, 'discount', true, 520, 95, 'approved', NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', 4, 1, 'Samsung Galaxy S24 Ultra - $300 Off', 'https://samsung.com/galaxy-s24', 899.99, 1199.99, 'Samsung', 'Latest flagship with S Pen, 200MP camera, and 1TB storage', 'https://images.samsung.com/is/image/samsung/p6pim/us/galaxy-s24-ultra/gallery/us-galaxy-s24-ultra-s928-sm-s928uzkaxaa-thumb-539573421', 25, 'discount', true, 680, 124, 'approved', NOW() - INTERVAL '3 hours'),
  ('44444444-4444-4444-4444-444444444444', 6, 1, 'Sony WH-1000XM5 Headphones - 30% Off', 'https://sony.com/headphones', 279.99, 399.99, 'Sony', 'Industry-leading noise canceling wireless headphones', 'https://sony.scene7.com/is/image/sonyglobalsolutions/wh-1000xm5_Primary_image', 30, 'discount', false, 340, 67, 'approved', NOW() - INTERVAL '5 hours'),
  ('55555555-5555-5555-5555-555555555555', 5, 1, 'Microsoft Surface Pro 9 - $400 Off', 'https://microsoft.com/surface', 699.99, 1099.99, 'Microsoft', '2-in-1 laptop with 13-inch touchscreen and Surface Pen', 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RW15tI', 36, 'discount', true, 290, 58, 'approved', NOW() - INTERVAL '6 hours'),
  
  -- Fashion deals
  ('11111111-1111-1111-1111-111111111111', 3, 2, 'Nike Air Max 270 - 40% Off', 'https://nike.com/air-max-270', 89.99, 149.99, 'Nike', 'Comfortable running shoes with Air Max technology', 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-mens-shoes-KkLcGR.png', 40, 'discount', true, 380, 76, 'approved', NOW() - INTERVAL '4 hours'),
  ('22222222-2222-2222-2222-222222222222', 7, 2, 'Adidas Ultraboost 22 - 35% Off', 'https://adidas.com/ultraboost', 116.99, 179.99, 'Adidas', 'Premium running shoes with Boost technology', 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg', 35, 'discount', false, 220, 45, 'approved', NOW() - INTERVAL '7 hours'),
  ('33333333-3333-3333-3333-333333333333', 19, 2, 'Under Armour Training Gear - 50% Off', 'https://underarmour.com/training', 49.99, 99.99, 'Under Armour', 'High-performance training apparel and accessories', 'https://underarmour.scene7.com/is/image/Underarmour/V5-1326413-001_HF', 50, 'discount', true, 195, 39, 'approved', NOW() - INTERVAL '8 hours'),
  
  -- Home & Garden deals
  ('44444444-4444-4444-4444-444444444444', 1, 3, 'Instant Pot Duo 7-in-1 - 45% Off', 'https://amazon.com/instant-pot', 54.99, 99.99, 'Amazon', 'Multi-functional pressure cooker for quick and easy meals', 'https://m.media-amazon.com/images/I/71VBX8UBDEL._AC_SL1500_.jpg', 45, 'discount', false, 280, 56, 'approved', NOW() - INTERVAL '9 hours'),
  ('55555555-5555-5555-5555-555555555555', 1, 3, 'Robot Vacuum Cleaner - 60% Off', 'https://amazon.com/robot-vacuum', 199.99, 499.99, 'Amazon', 'Smart robot vacuum with app control and mapping', 'https://m.media-amazon.com/images/I/61Zs+wH6AFL._AC_SL1500_.jpg', 60, 'discount', true, 420, 84, 'approved', NOW() - INTERVAL '10 hours'),
  
  -- More variety deals
  ('11111111-1111-1111-1111-111111111111', 8, 1, 'Best Buy Gaming Monitor - 25% Off', 'https://bestbuy.com/gaming-monitor', 299.99, 399.99, 'Best Buy', '27-inch 144Hz gaming monitor with G-Sync support', 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6425/6425559_sd.jpg', 25, 'discount', false, 165, 33, 'approved', NOW() - INTERVAL '12 hours'),
  ('22222222-2222-2222-2222-222222222222', 9, 2, 'Target Fashion Sale - Up to 70% Off', 'https://target.com/fashion-sale', 29.99, 99.99, 'Target', 'Clearance sale on designer clothing and accessories', 'https://target.scene7.com/is/image/Target/GUEST_c8b9d2f5-7d8a-4d7e-9c5f-8b2a1c3d4e5f', 70, 'clearance', true, 320, 64, 'approved', NOW() - INTERVAL '15 hours'),
  ('33333333-3333-3333-3333-333333333333', 10, 3, 'Walmart Home Essentials - 30% Off', 'https://walmart.com/home-essentials', 69.99, 99.99, 'Walmart', 'Bundle of home essentials including bedding and decor', 'https://i5.walmartimages.com/asr/1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.jpeg', 30, 'bundle', false, 145, 29, 'approved', NOW() - INTERVAL '18 hours'),
  ('44444444-4444-4444-4444-444444444444', 15, 6, 'Google Nest Hub - 40% Off', 'https://store.google.com/nest-hub', 59.99, 99.99, 'Google', 'Smart display with Google Assistant built-in', 'https://lh3.googleusercontent.com/Q3wLKmDFzJr4KWVuZnVHWqEH7VuKJ2fL8GhI9PqR3StU5VwX7YzA2BcD4EfG6HiJ8KlM0NoPqR', 40, 'discount', true, 210, 42, 'approved', NOW() - INTERVAL '20 hours'),
  ('55555555-5555-5555-5555-555555555555', 16, 8, 'Netflix 6-Month Subscription - 20% Off', 'https://netflix.com/gift', 79.99, 99.99, 'Netflix', '6 months of premium Netflix streaming service', 'https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/mobile-0819.jpg', 20, 'subscription', false, 95, 19, 'approved', NOW() - INTERVAL '22 hours')
ON CONFLICT DO NOTHING;

-- Populate coupons with realistic data
INSERT INTO public.coupons (
  submitter_id, company_id, category_id, title, description, coupon_code, 
  coupon_type, discount_value, minimum_order_amount, expires_at, is_featured, 
  views_count, clicks_count, success_rate, status, approved_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 1, '20% Off Amazon Electronics', 'Save 20% on all electronics including smartphones, laptops, and accessories', 'ELECTRONICS20', 'percentage', 20.00, 50.00, '2025-12-31 23:59:59', true, 280, 56, 85.50, 'approved', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 2, 1, '$100 Off Apple Products', 'Get $100 off on MacBooks, iPads, and iPhones with minimum purchase', 'APPLE100', 'fixed_amount', 100.00, 500.00, '2025-11-30 23:59:59', true, 420, 84, 78.25, 'approved', NOW() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333333', 3, 2, 'Nike Free Shipping', 'Free shipping on all Nike orders, no minimum purchase required', 'NIKEFREE', 'free_shipping', 0.00, 0.00, '2025-10-31 23:59:59', false, 195, 39, 92.30, 'approved', NOW() - INTERVAL '3 days'),
  ('44444444-4444-4444-4444-444444444444', 4, 1, '15% Off Samsung Galaxy', 'Special discount on Samsung Galaxy smartphones and tablets', 'GALAXY15', 'percentage', 15.00, 200.00, '2025-09-30 23:59:59', true, 340, 68, 81.75, 'approved', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555555', 5, 1, 'Microsoft Student Discount', '10% off Microsoft Surface and Office products for students', 'STUDENT10', 'percentage', 10.00, 100.00, '2025-12-31 23:59:59', false, 125, 25, 88.90, 'approved', NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 6, 1, '$50 Off Sony Headphones', 'Save $50 on premium Sony wireless headphones', 'SONY50', 'fixed_amount', 50.00, 150.00, '2025-08-31 23:59:59', true, 220, 44, 75.60, 'approved', NOW() - INTERVAL '6 days'),
  ('22222222-2222-2222-2222-222222222222', 7, 2, 'Adidas 25% Off Sale', 'Get 25% off on all Adidas footwear and apparel', 'ADIDAS25', 'percentage', 25.00, 75.00, '2025-07-31 23:59:59', false, 180, 36, 83.45, 'approved', NOW() - INTERVAL '7 days'),
  ('33333333-3333-3333-3333-333333333333', 8, 1, 'Best Buy Tech Deals', '$25 off electronics with Best Buy membership', 'BESTBUY25', 'fixed_amount', 25.00, 100.00, '2025-06-30 23:59:59', true, 165, 33, 79.20, 'approved', NOW() - INTERVAL '8 days'),
  ('44444444-4444-4444-4444-444444444444', 9, 2, 'Target Fashion Week', '30% off designer fashion during Target Fashion Week', 'FASHION30', 'percentage', 30.00, 80.00, '2025-05-31 23:59:59', true, 290, 58, 86.15, 'approved', NOW() - INTERVAL '9 days'),
  ('55555555-5555-5555-5555-555555555555', 10, 3, 'Walmart Home & Garden', '20% off home and garden essentials at Walmart', 'HOME20', 'percentage', 20.00, 60.00, '2025-04-30 23:59:59', false, 145, 29, 82.75, 'approved', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Add some votes for deals
INSERT INTO public.votes (user_id, deal_id, value) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 1),
  ('22222222-2222-2222-2222-222222222222', 1, 1),
  ('33333333-3333-3333-3333-333333333333', 1, 1),
  ('44444444-4444-4444-4444-444444444444', 2, 1),
  ('55555555-5555-5555-5555-555555555555', 2, 1),
  ('11111111-1111-1111-1111-111111111111', 3, 1),
  ('22222222-2222-2222-2222-222222222222', 3, 1),
  ('33333333-3333-3333-3333-333333333333', 3, 1),
  ('44444444-4444-4444-4444-444444444444', 3, 1),
  ('55555555-5555-5555-5555-555555555555', 4, 1),
  ('11111111-1111-1111-1111-111111111111', 4, 1),
  ('22222222-2222-2222-2222-222222222222', 5, 1),
  ('33333333-3333-3333-3333-333333333333', 5, 1),
  ('44444444-4444-4444-4444-444444444444', 5, 1),
  ('55555555-5555-5555-5555-555555555555', 6, 1)
ON CONFLICT (user_id, deal_id) DO NOTHING;

-- Add some votes for coupons
INSERT INTO public.coupon_votes (user_id, coupon_id, value) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 1),
  ('22222222-2222-2222-2222-222222222222', 1, 1),
  ('33333333-3333-3333-3333-333333333333', 2, 1),
  ('44444444-4444-4444-4444-444444444444', 2, 1),
  ('55555555-5555-5555-5555-555555555555', 3, 1),
  ('11111111-1111-1111-1111-111111111111', 3, 1),
  ('22222222-2222-2222-2222-222222222222', 4, 1),
  ('33333333-3333-3333-3333-333333333333', 4, 1),
  ('44444444-4444-4444-4444-444444444444', 5, 1),
  ('55555555-5555-5555-5555-555555555555', 6, 1)
ON CONFLICT (user_id, coupon_id) DO NOTHING;

-- Add some popular tags to deals and coupons
INSERT INTO public.deal_tags (deal_id, tag_id) VALUES
  (1, 1), (1, 23), -- Echo Dot: Smartphone, Free Shipping
  (2, 2), (2, 4), -- MacBook: Laptop, Gaming
  (3, 1), (3, 30), -- Galaxy S24: Smartphone, Exclusive
  (4, 3), (4, 11), -- Sony Headphones: Headphones, Beauty (music)
  (5, 2), (5, 4), -- Surface Pro: Laptop, Gaming
  (6, 5), (6, 7), -- Nike: Sneakers, Running
  (7, 5), (7, 8), -- Adidas: Sneakers, Fitness
  (8, 5), (8, 7), -- Under Armour: Sneakers, Running
  (9, 10), (9, 17), -- Instant Pot: Kitchen, Food Delivery
  (10, 9), (10, 4) -- Robot Vacuum: Home Decor, Gaming (smart home)
ON CONFLICT (deal_id, tag_id) DO NOTHING;

INSERT INTO public.coupon_tags (coupon_id, tag_id) VALUES
  (1, 1), (1, 2), -- Amazon Electronics: Smartphone, Laptop
  (2, 2), (2, 1), -- Apple: Laptop, Smartphone
  (3, 5), (3, 23), -- Nike: Sneakers, Free Shipping
  (4, 1), (4, 30), -- Samsung: Smartphone, Exclusive
  (5, 2), (5, 24), -- Microsoft: Laptop, Student Discount
  (6, 3), (6, 11), -- Sony: Headphones, Beauty (music)
  (7, 5), (7, 6), -- Adidas: Sneakers, Clothing
  (8, 1), (8, 2), -- Best Buy: Smartphone, Laptop
  (9, 6), (9, 25), -- Target: Clothing, Clearance
  (10, 9), (10, 10) -- Walmart: Home Decor, Kitchen
ON CONFLICT (coupon_id, tag_id) DO NOTHING;

-- Update tag usage counts
SELECT update_tag_usage_counts();

-- Success message
SELECT 
  'Clean dummy data populated successfully! Created ' || 
  (SELECT COUNT(*) FROM public.deals WHERE status = 'approved') || ' deals and ' ||
  (SELECT COUNT(*) FROM public.coupons WHERE status = 'approved') || ' coupons with ' ||
  (SELECT COUNT(*) FROM public.votes) || ' deal votes and ' ||
  (SELECT COUNT(*) FROM public.coupon_votes) || ' coupon votes.' as summary;
