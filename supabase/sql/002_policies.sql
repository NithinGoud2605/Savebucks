-- POLICIES: Row Level Security (RLS) for all tables
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.deals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.conversions enable row level security;
alter table public.follows enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.rewards enable row level security;

-- PROFILES: users can read all, update own
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- MERCHANTS: read all, admin write
create policy "merchants_read_all" on public.merchants
  for select using (true);

create policy "merchants_admin_write" on public.merchants
  for all using (is_admin());

-- DEALS: read approved, submit own, admin full access
create policy "deals_read_approved" on public.deals
  for select using (status = 'approved');

create policy "deals_read_own_pending" on public.deals
  for select using (submitter_id = auth.uid() and status = 'pending');

create policy "deals_insert_own" on public.deals
  for insert with check (submitter_id = auth.uid());

create policy "deals_update_own_pending" on public.deals
  for update using (submitter_id = auth.uid() and status = 'pending');

create policy "deals_admin_full" on public.deals
  for all using (is_admin());

-- VOTES: read all, insert/update own
create policy "votes_read_all" on public.votes
  for select using (true);

create policy "votes_insert_own" on public.votes
  for insert with check (user_id = auth.uid());

create policy "votes_update_own" on public.votes
  for update using (user_id = auth.uid());

create policy "votes_delete_own" on public.votes
  for delete using (user_id = auth.uid());

-- COMMENTS: read all, insert/update own
create policy "comments_read_all" on public.comments
  for select using (true);

create policy "comments_insert_own" on public.comments
  for insert with check (user_id = auth.uid());

create policy "comments_update_own" on public.comments
  for update using (user_id = auth.uid());

create policy "comments_delete_own" on public.comments
  for delete using (user_id = auth.uid());

-- REPORTS: read own, insert own, admin read all
create policy "reports_read_own" on public.reports
  for select using (reporter_id = auth.uid());

create policy "reports_admin_read" on public.reports
  for select using (is_admin());

create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());

-- AFFILIATE_CLICKS: insert all, admin read
create policy "affiliate_clicks_insert_all" on public.affiliate_clicks
  for insert with check (true);

create policy "affiliate_clicks_admin_read" on public.affiliate_clicks
  for select using (is_admin());

-- CONVERSIONS: admin only
create policy "conversions_admin_only" on public.conversions
  for all using (is_admin());

-- FOLLOWS: read own, insert/update own
create policy "follows_read_own" on public.follows
  for select using (user_id = auth.uid());

create policy "follows_insert_own" on public.follows
  for insert with check (user_id = auth.uid());

create policy "follows_update_own" on public.follows
  for update using (user_id = auth.uid());

create policy "follows_delete_own" on public.follows
  for delete using (user_id = auth.uid());

-- BADGES: read all, admin write
create policy "badges_read_all" on public.badges
  for select using (true);

create policy "badges_admin_write" on public.badges
  for all using (is_admin());

-- USER_BADGES: read all, admin write
create policy "user_badges_read_all" on public.user_badges
  for select using (true);

create policy "user_badges_admin_write" on public.user_badges
  for all using (is_admin());

-- LEADERBOARD_SNAPSHOTS: read all, admin write
create policy "leaderboard_read_all" on public.leaderboard_snapshots
  for select using (true);

create policy "leaderboard_admin_write" on public.leaderboard_snapshots
  for all using (is_admin());

-- REWARDS: read own, admin full access
create policy "rewards_read_own" on public.rewards
  for select using (user_id = auth.uid());

create policy "rewards_admin_full" on public.rewards
  for all using (is_admin());
