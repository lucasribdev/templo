create table if not exists public.community_link_click_events (
  id uuid primary key default gen_random_uuid(),
  community_link_id uuid not null references public.community_links(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  platform text not null,
  viewer_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists community_link_click_events_link_created_at_idx
on public.community_link_click_events (community_link_id, created_at desc);

create index if not exists community_link_click_events_community_id_idx
on public.community_link_click_events (community_id);

create index if not exists community_link_click_events_platform_idx
on public.community_link_click_events (platform);

alter table public.community_link_click_events enable row level security;

drop policy if exists "Community owners can read link click events"
on public.community_link_click_events;
create policy "Community owners can read link click events"
on public.community_link_click_events
for select
to authenticated
using (
  exists (
    select 1
    from public.communities c
    where c.id = community_link_click_events.community_id
      and c.user_id = auth.uid()
  )
);

grant select on public.community_link_click_events to authenticated;

create or replace function public.track_community_link_click(
  p_community_link_id uuid,
  p_visitor_id text default null,
  p_user_agent text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  link_record record;
  updated_clicks_count bigint;
begin
  select
    cl.id,
    cl.community_id,
    cl.platform
  into link_record
  from public.community_links cl
  where cl.id = p_community_link_id;

  if link_record.id is null then
    return null;
  end if;

  update public.community_links cl
  set clicks_count = cl.clicks_count + 1
  where cl.id = link_record.id
  returning cl.clicks_count into updated_clicks_count;

  insert into public.community_link_click_events (
    community_link_id,
    community_id,
    platform,
    viewer_id,
    visitor_id,
    user_agent
  )
  values (
    link_record.id,
    link_record.community_id,
    link_record.platform,
    auth.uid(),
    nullif(trim(p_visitor_id), ''),
    nullif(trim(p_user_agent), '')
  );

  return updated_clicks_count;
end;
$$;

grant execute on function public.track_community_link_click(uuid, text, text)
to anon, authenticated;
