-- Disallow deletes for non-admins (explicit)
drop policy if exists deals_delete_admin on public.deals;
create policy deals_delete_admin on public.deals
for delete using (is_admin());

drop policy if exists comments_delete_admin on public.comments;
create policy comments_delete_admin on public.comments
for delete using (is_admin());

drop policy if exists votes_delete_admin on public.votes;
create policy votes_delete_admin on public.votes
for delete using (is_admin());
