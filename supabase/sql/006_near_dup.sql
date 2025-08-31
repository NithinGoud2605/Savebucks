create or replace function public.find_similar_deal(p_title text, p_days int default 7, p_threshold real default 0.55)
returns table(id bigint, title text, sim real)
language sql stable as $$
  select d.id, d.title, similarity(d.title, p_title) as sim
  from public.deals d
  where d.created_at >= now() - (p_days || ' days')::interval
  order by similarity(d.title, p_title) desc
  limit 1
$$;
