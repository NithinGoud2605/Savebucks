-- SEED DATA
-- Categories, companies, and initial tags

-- Insert categories
INSERT INTO public.categories (name, slug, color) VALUES
  ('Electronics', 'electronics', '#3B82F6'),
  ('Fashion', 'fashion', '#F59E0B'),
  ('Home & Garden', 'home-garden', '#10B981'),
  ('Health & Beauty', 'health-beauty', '#EF4444'),
  ('Sports & Outdoors', 'sports-outdoors', '#8B5CF6'),
  ('Food & Beverages', 'food-beverages', '#F97316'),
  ('Travel', 'travel', '#06B6D4'),
  ('Books & Media', 'books-media', '#84CC16')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color;

-- Insert companies
INSERT INTO public.companies (name, slug, logo_url, website_url, is_verified) VALUES
  ('Amazon', 'amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', true),
  ('Apple', 'apple', 'https://logo.clearbit.com/apple.com', 'https://apple.com', true),
  ('Nike', 'nike', 'https://logo.clearbit.com/nike.com', 'https://nike.com', true),
  ('Samsung', 'samsung', 'https://logo.clearbit.com/samsung.com', 'https://samsung.com', true),
  ('Microsoft', 'microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://microsoft.com', true),
  ('Sony', 'sony', 'https://logo.clearbit.com/sony.com', 'https://sony.com', true),
  ('Adidas', 'adidas', 'https://logo.clearbit.com/adidas.com', 'https://adidas.com', true),
  ('Best Buy', 'best-buy', 'https://logo.clearbit.com/bestbuy.com', 'https://bestbuy.com', true),
  ('Target', 'target', 'https://logo.clearbit.com/target.com', 'https://target.com', true),
  ('Walmart', 'walmart', 'https://logo.clearbit.com/walmart.com', 'https://walmart.com', true),
  ('eBay', 'ebay', 'https://logo.clearbit.com/ebay.com', 'https://ebay.com', true),
  ('Dell', 'dell', 'https://logo.clearbit.com/dell.com', 'https://dell.com', true),
  ('HP', 'hp', 'https://logo.clearbit.com/hp.com', 'https://hp.com', true),
  ('Lenovo', 'lenovo', 'https://logo.clearbit.com/lenovo.com', 'https://lenovo.com', true),
  ('Google', 'google', 'https://logo.clearbit.com/google.com', 'https://google.com', true),
  ('Netflix', 'netflix', 'https://logo.clearbit.com/netflix.com', 'https://netflix.com', true),
  ('Spotify', 'spotify', 'https://logo.clearbit.com/spotify.com', 'https://spotify.com', true),
  ('Adobe', 'adobe', 'https://logo.clearbit.com/adobe.com', 'https://adobe.com', true),
  ('Under Armour', 'under-armour', 'https://logo.clearbit.com/underarmour.com', 'https://underarmour.com', true),
  ('Costco', 'costco', 'https://logo.clearbit.com/costco.com', 'https://costco.com', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  is_verified = EXCLUDED.is_verified;

-- Insert popular tags
INSERT INTO public.tags (name, slug, color, category, is_featured) VALUES
  ('Smartphone', 'smartphone', '#3B82F6', 'Electronics', true),
  ('Laptop', 'laptop', '#3B82F6', 'Electronics', true),
  ('Headphones', 'headphones', '#3B82F6', 'Electronics', true),
  ('Gaming', 'gaming', '#8B5CF6', 'Electronics', true),
  ('Sneakers', 'sneakers', '#F59E0B', 'Fashion', true),
  ('Clothing', 'clothing', '#F59E0B', 'Fashion', true),
  ('Running', 'running', '#8B5CF6', 'Sports', true),
  ('Fitness', 'fitness', '#8B5CF6', 'Sports', true),
  ('Home Decor', 'home-decor', '#10B981', 'Home', true),
  ('Kitchen', 'kitchen', '#10B981', 'Home', true),
  ('Beauty', 'beauty', '#EF4444', 'Health', true),
  ('Skincare', 'skincare', '#EF4444', 'Health', true),
  ('Books', 'books', '#84CC16', 'Media', true),
  ('Movies', 'movies', '#84CC16', 'Media', true),
  ('Travel Deals', 'travel-deals', '#06B6D4', 'Travel', true),
  ('Hotels', 'hotels', '#06B6D4', 'Travel', true),
  ('Food Delivery', 'food-delivery', '#F97316', 'Food', true),
  ('Restaurants', 'restaurants', '#F97316', 'Food', true),
  ('Black Friday', 'black-friday', '#000000', 'Events', true),
  ('Cyber Monday', 'cyber-monday', '#000000', 'Events', true),
  ('Back to School', 'back-to-school', '#FBBF24', 'Events', true),
  ('Holiday Sale', 'holiday-sale', '#DC2626', 'Events', true),
  ('Free Shipping', 'free-shipping', '#059669', 'Shipping', true),
  ('Student Discount', 'student-discount', '#7C3AED', 'Discount', true),
  ('Clearance', 'clearance', '#EF4444', 'Discount', true),
  ('Limited Time', 'limited-time', '#F59E0B', 'Urgency', true),
  ('Flash Sale', 'flash-sale', '#DC2626', 'Urgency', true),
  ('New Release', 'new-release', '#10B981', 'Product', true),
  ('Bestseller', 'bestseller', '#F59E0B', 'Product', true),
  ('Exclusive', 'exclusive', '#8B5CF6', 'Product', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  is_featured = EXCLUDED.is_featured;

-- Success message
SELECT 'Seed data inserted successfully!' as status;
