create table if not exists public.community_links (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  platform text not null,
  url text not null,
  position integer not null default 0,
  clicks_count bigint not null default 0,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_links_platform_check check (
    platform in (
      'DISCORD',
      'TELEGRAM',
      'WHATSAPP',
      'GITHUB',
      'YOUTUBE',
      'SITE_OFICIAL',
      'OUTRA'
    )
  ),
  constraint community_links_url_check check (length(trim(url)) > 0),
  constraint community_links_position_check check (position >= 0),
  constraint community_links_clicks_count_check check (clicks_count >= 0)
);

create index if not exists community_links_community_id_idx
on public.community_links (community_id);

create index if not exists community_links_platform_idx
on public.community_links (platform);

drop trigger if exists set_community_links_updated_at on public.community_links;
create trigger set_community_links_updated_at
before update on public.community_links
for each row
execute procedure public.set_updated_at();

alter table public.community_links enable row level security;

drop policy if exists "Public can read community links" on public.community_links;
create policy "Public can read community links"
on public.community_links
for select
to anon, authenticated
using (true);

drop policy if exists "Community owners can create community links" on public.community_links;
create policy "Community owners can create community links"
on public.community_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.communities c
    where c.id = community_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Community owners can update community links" on public.community_links;
create policy "Community owners can update community links"
on public.community_links
for update
to authenticated
using (
  exists (
    select 1
    from public.communities c
    where c.id = community_links.community_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.communities c
    where c.id = community_links.community_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Community owners can delete community links" on public.community_links;
create policy "Community owners can delete community links"
on public.community_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.communities c
    where c.id = community_links.community_id
      and c.user_id = auth.uid()
  )
);

grant select on public.community_links to anon, authenticated;
grant insert, update, delete on public.community_links to authenticated;
