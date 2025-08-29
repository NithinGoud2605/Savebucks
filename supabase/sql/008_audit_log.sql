create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  table_name text not null,
  row_id text not null,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- when a deal is updated by an admin (approve/reject/edit), log it
create or replace function public.audit_deals_update()
returns trigger language plpgsql as $$
declare
  isadmin boolean;
begin
  select exists(select 1 from public.profiles where id = auth.uid() and role='admin') into isadmin;
  if isadmin then
    insert into public.audit_log (actor_id, action, table_name, row_id, diff)
    values (auth.uid(), 'update', 'deals', new.id::text, to_jsonb(new) - 'updated_at');
  end if;
  return new;
end $$;

drop trigger if exists trg_audit_deals_update on public.deals;
create trigger trg_audit_deals_update
after update on public.deals
for each row execute function public.audit_deals_update();
