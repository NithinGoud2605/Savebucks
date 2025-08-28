-- SEED: initial data for development/testing
-- Insert sample merchants
insert into public.merchants (name, domain, reputation, default_network) values
  ('Amazon', 'amazon.com', 95, 'amazon'),
  ('Best Buy', 'bestbuy.com', 88, 'none'),
  ('Newegg', 'newegg.com', 85, 'none'),
  ('Walmart', 'walmart.com', 82, 'none'),
  ('Target', 'target.com', 80, 'none'),
  ('B&H Photo', 'bhphotovideo.com', 92, 'none'),
  ('Micro Center', 'microcenter.com', 90, 'none'),
  ('Adorama', 'adorama.com', 87, 'none')
on conflict (domain) do nothing;

-- Insert sample badges
insert into public.badges (code, name, description) values
  ('first_deal', 'First Deal', 'Submitted your first deal'),
  ('top_contributor', 'Top Contributor', 'Submitted 10+ approved deals'),
  ('community_favorite', 'Community Favorite', 'Deal received 100+ upvotes'),
  ('early_adopter', 'Early Adopter', 'Joined during beta'),
  ('moderator', 'Moderator', 'Community moderator'),
  ('admin', 'Administrator', 'Platform administrator')
on conflict (code) do nothing;

-- Insert sample deals (if no deals exist)
insert into public.deals (title, url, description, price, merchant, category, status, approved_at) 
select * from (values
  ('Anker USB-C Charger 45W', 'https://amazon.com/anker-charger', 'Fast charging USB-C wall charger', 19.99, 'Amazon', 'Electronics', 'approved', now()),
  ('Samsung 1TB SSD', 'https://bestbuy.com/samsung-ssd', 'High-speed internal SSD', 69.99, 'Best Buy', 'Electronics', 'approved', now()),
  ('Logitech MX Master 3S', 'https://amazon.com/mx-master-3s', 'Wireless ergonomic mouse', 89.99, 'Amazon', 'Electronics', 'approved', now()),
  ('Instant Pot Duo 6QT', 'https://target.com/instant-pot', '7-in-1 electric pressure cooker', 79.99, 'Target', 'Kitchen', 'approved', now()),
  ('Nike Air Max 270', 'https://amazon.com/nike-air-max', 'Comfortable running shoes', 129.99, 'Amazon', 'Fashion', 'approved', now())
) as v(title, url, description, price, merchant, category, status, approved_at)
where not exists (select 1 from public.deals limit 1);

-- Insert sample votes (if no votes exist)
insert into public.votes (user_id, deal_id, value)
select 
  (select id from auth.users limit 1),
  d.id,
  case when random() > 0.5 then 1 else -1 end
from public.deals d
where not exists (select 1 from public.votes limit 1)
limit 10;

-- Insert sample comments (if no comments exist)
insert into public.comments (deal_id, user_id, body)
select 
  d.id,
  (select id from auth.users limit 1),
  case 
    when random() > 0.7 then 'Great deal! Thanks for sharing.'
    when random() > 0.5 then 'Just ordered one!'
    else 'Is this still available?'
  end
from public.deals d
where not exists (select 1 from public.comments limit 1)
limit 5;
