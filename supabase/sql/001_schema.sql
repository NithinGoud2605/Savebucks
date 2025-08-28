-- SCHEMA: core tables, enums, indexes, triggers
-- idempotent guards
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ENUMS
do $$ begin
  create type role_enum as enum ('user','mod','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deal_status as enum ('pending','approved','rejected','expired','deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('spam','expired','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type follow_kind as enum ('merchant','category','keyword');
exception when duplicate_object then null; end $$;

-- HELPER: updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- HELPER: is_admin()
create or replace function is_admin() returns boolean
language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- TABLES

-- profiles mirrors auth.users (1:1)
create table if not exists public.profiles (
  id uuid primary key, -- equals auth.users.id
  handle text unique,
  avatar_url text,
  karma int not null default 0,
  role role_enum not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function set_updated_at();

-- merchants (domain unique)
create table if not exists public.merchants (
  id bigserial primary key,
  name text not null,
  domain text not null unique,
  reputation int not null default 0,
  default_network text not null default 'none', -- 'amazon' | 'cj' | 'none'
  program_id text,
  created_at timestamptz not null default now()
);

-- deals
create table if not exists public.deals (
  id bigserial primary key,
  title text not null,
  url text not null,
  normalized_url_hash text generated always as (md5(lower(url))) stored,
  description text,
  image_url text,
  price numeric,
  list_price numeric,
  currency char(3),
  merchant text,
  category text,
  submitter_id uuid references public.profiles(id) on delete set null,
  status deal_status not null default 'pending',
  rejection_reason text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_deals_urlhash_unique on public.deals(normalized_url_hash);
create index if not exists idx_deals_status_approved_at on public.deals(status, approved_at desc);
create index if not exists idx_deals_merchant on public.deals(merchant);
create index if not exists idx_deals_category on public.deals(category);
create trigger trg_deals_updated_at
before update on public.deals
for each row execute function set_updated_at();

-- votes (net score derived)
create table if not exists public.votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  deal_id bigint not null references public.deals(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);
create index if not exists idx_votes_deal on public.votes(deal_id);

-- comments (nested)
create table if not exists public.comments (
  id bigserial primary key,
  deal_id bigint not null references public.deals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  parent_id bigint references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_deal_created on public.comments(deal_id, created_at);

-- reports
create table if not exists public.reports (
  id bigserial primary key,
  deal_id bigint not null references public.deals(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason report_reason not null,
  note text,
  created_at timestamptz not null default now()
);

-- affiliate_clicks
create table if not exists public.affiliate_clicks (
  id bigserial primary key,
  deal_id bigint references public.deals(id) on delete set null,
  user_id uuid,
  source_ip inet,
  ua text,
  referrer text,
  network text not null default 'none', -- 'amazon' | 'cj' | 'none'
  target_url text,
  click_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_aff_clicks_deal_created on public.affiliate_clicks(deal_id, created_at desc);

-- conversions
create table if not exists public.conversions (
  id bigserial primary key,
  network text not null,
  external_id text unique,
  advertiser text,
  order_amount numeric,
  commission_amount numeric,
  click_id text,
  deal_id bigint,
  created_at timestamptz not null default now()
);

-- follows
create table if not exists public.follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind follow_kind not null,
  value text not null,
  threshold int,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, value)
);

-- badges + user_badges
create table if not exists public.badges (
  id serial primary key,
  code text unique not null,
  name text not null,
  description text
);
create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id int not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- LEADERBOARD snapshots
create table if not exists public.leaderboard_snapshots (
  id bigserial primary key,
  period_start date not null,
  period_end date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  net_votes int not null default 0,
  approved_posts int not null default 0,
  rank int
);

-- rewards
create table if not exists public.rewards (
  id bigserial primary key,
  period_start date not null,
  period_end date not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null,
  reward_value text,
  reason text,
  issued_at timestamptz
);

-- KARMA: +5 when a deal moves to approved
create or replace function bump_karma_on_approve()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and new.submitter_id is not null then
    update public.profiles set karma = karma + 5 where id = new.submitter_id;
    new.approved_at = coalesce(new.approved_at, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_deals_bump_karma on public.deals;
create trigger trg_deals_bump_karma
before update on public.deals
for each row execute function bump_karma_on_approve();
