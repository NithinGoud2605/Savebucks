-- Seed data for categories, collections, and banners

-- Insert main categories
INSERT INTO public.categories (name, slug, description, icon, color, is_featured, sort_order) VALUES
('Electronics', 'electronics', 'Gadgets, computers, phones and more', 'device-phone-mobile', '#3b82f6', true, 1),
('Fashion', 'fashion', 'Clothing, shoes, accessories', 'sparkles', '#ec4899', true, 2),
('Home & Garden', 'home-garden', 'Furniture, decor, tools', 'home', '#10b981', true, 3),
('Health & Beauty', 'health-beauty', 'Skincare, supplements, wellness', 'heart', '#f59e0b', true, 4),
('Sports & Outdoors', 'sports-outdoors', 'Fitness, camping, sports gear', 'trophy', '#8b5cf6', true, 5),
('Books & Media', 'books-media', 'Books, movies, games', 'book-open', '#06b6d4', true, 6),
('Food & Grocery', 'food-grocery', 'Snacks, pantry, beverages', 'shopping-bag', '#ef4444', true, 7),
('Travel', 'travel', 'Hotels, flights, experiences', 'map-pin', '#f97316', true, 8),
('Services', 'services', 'Software, subscriptions, courses', 'cog-6-tooth', '#6b7280', false, 9),
('Automotive', 'automotive', 'Car parts, accessories, tools', 'truck', '#374151', false, 10)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories
INSERT INTO public.categories (name, slug, description, parent_id, sort_order) VALUES
-- Electronics subcategories
('Smartphones', 'smartphones', 'Mobile phones and accessories', 1, 1),
('Laptops & Computers', 'laptops-computers', 'Computers, laptops, tablets', 1, 2),
('Audio & Headphones', 'audio-headphones', 'Speakers, headphones, earbuds', 1, 3),
('Smart Home', 'smart-home', 'Smart devices and home automation', 1, 4),
('Gaming', 'gaming', 'Gaming consoles, accessories, games', 1, 5),

-- Fashion subcategories
('Women''s Fashion', 'womens-fashion', 'Women''s clothing and accessories', 2, 1),
('Men''s Fashion', 'mens-fashion', 'Men''s clothing and accessories', 2, 2),
('Shoes', 'shoes', 'Footwear for all occasions', 2, 3),
('Bags & Accessories', 'bags-accessories', 'Handbags, wallets, jewelry', 2, 4),
('Kids Fashion', 'kids-fashion', 'Children''s clothing and accessories', 2, 5),

-- Home & Garden subcategories
('Furniture', 'furniture', 'Sofas, beds, tables, chairs', 3, 1),
('Kitchen & Dining', 'kitchen-dining', 'Cookware, appliances, dinnerware', 3, 2),
('Home Decor', 'home-decor', 'Wall art, lighting, decorations', 3, 3),
('Garden & Outdoor', 'garden-outdoor', 'Plants, tools, outdoor furniture', 3, 4),
('Bedding & Bath', 'bedding-bath', 'Sheets, towels, bathroom accessories', 3, 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert collections
INSERT INTO public.collections (name, slug, description, type, is_featured, sort_order) VALUES
('Trending Now', 'trending-now', 'Most popular deals right now', 'auto_category', true, 1),
('Amazon Best Sellers', 'amazon-best-sellers', 'Top deals from Amazon', 'auto_merchant', true, 2),
('Over 50% Off', 'over-50-off', 'Deals with huge discounts', 'auto_discount', true, 3),
('Under $20', 'under-20', 'Great deals under twenty dollars', 'manual', true, 4),
('Electronics Deals', 'electronics-deals', 'Best electronics offers', 'auto_category', true, 5),
('Fashion Finds', 'fashion-finds', 'Trending fashion deals', 'auto_category', true, 6),
('School Supplies', 'school-supplies', 'Back to school essentials', 'manual', true, 7),
('Back to College', 'back-to-college', 'College essentials and dorm items', 'manual', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- Update collections with specific parameters
UPDATE public.collections SET 
  merchant = 'Amazon',
  max_items = 12
WHERE slug = 'amazon-best-sellers';

UPDATE public.collections SET 
  min_discount = 50,
  max_items = 15
WHERE slug = 'over-50-off';

UPDATE public.collections SET 
  category_id = 1,
  max_items = 10
WHERE slug = 'electronics-deals';

UPDATE public.collections SET 
  category_id = 2,
  max_items = 10
WHERE slug = 'fashion-finds';

-- Insert hero banners
INSERT INTO public.banners (title, subtitle, description, image_url, link_url, background_color, text_color, position, sort_order) VALUES
(
  'Over 50% Off', 
  'Electronics, home & more',
  'Discover incredible savings on your favorite products',
  '/images/banners/electronics-sale.jpg',
  '/electronics?discount=50',
  '#22d3ee',
  '#ffffff',
  'hero',
  1
),
(
  'Snacks & Pantry',
  'Up to 75% off: bite into big savings',
  'Stock up on your favorite snacks and pantry essentials',
  '/images/banners/snacks-pantry.jpg',
  '/food-grocery',
  '#6366f1',
  '#ffffff',
  'hero',
  2
),
(
  'Labor Day Clearance',
  'Up to 80% off*',
  'End of summer deals on everything you need',
  '/images/banners/labor-day.jpg',
  '/collections/labor-day',
  '#f3f4f6',
  '#1f2937',
  'secondary',
  1
),
(
  'Furniture deals',
  'Up to 85% off: sofas, beds & more',
  'Transform your home with amazing furniture deals',
  '/images/banners/furniture.jpg',
  '/home-garden/furniture',
  '#92400e',
  '#ffffff',
  'secondary',
  2
)
ON CONFLICT DO NOTHING;

-- Insert some deal tags
INSERT INTO public.deal_tags (name, color) VALUES
('Hot Deal', '#ef4444'),
('Limited Time', '#f59e0b'),
('Free Shipping', '#10b981'),
('Coupon Required', '#3b82f6'),
('Cashback', '#8b5cf6'),
('New Arrival', '#06b6d4'),
('Bestseller', '#ec4899'),
('Verified', '#059669')
ON CONFLICT (name) DO NOTHING;

