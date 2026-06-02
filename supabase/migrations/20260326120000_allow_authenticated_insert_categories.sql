drop policy if exists "Authenticated users can create categories" on public.categories;
create policy "Authenticated users can create categories"
on public.categories
for insert
to authenticated
with check (true);
