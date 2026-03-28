create table if not exists public.listing_view_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete cascade,
  visitor_id text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint listing_view_events_identity_check check (
    viewer_id is not null or nullif(trim(coalesce(visitor_id, '')), '') is not null
  )
);

create index if not exists listing_view_events_listing_id_created_at_idx
  on public.listing_view_events (listing_id, created_at desc);

create index if not exists listing_view_events_viewer_id_idx
  on public.listing_view_events (viewer_id)
  where viewer_id is not null;

create index if not exists listing_view_events_visitor_id_idx
  on public.listing_view_events (visitor_id)
  where visitor_id is not null;

alter table public.listing_view_events enable row level security;

create or replace function public.track_listing_view(
  p_listing_id uuid,
  p_viewer_id uuid default null,
  p_visitor_id text default null,
  p_user_agent text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_visitor_id text := nullif(trim(coalesce(p_visitor_id, '')), '');
  normalized_user_agent text := nullif(trim(coalesce(p_user_agent, '')), '');
  updated_views bigint;
  already_counted boolean;
begin
  if p_viewer_id is null and normalized_visitor_id is null then
    return coalesce((select views from public.listings where id = p_listing_id), 0);
  end if;

  select exists (
    select 1
    from public.listing_view_events lve
    where lve.listing_id = p_listing_id
      and lve.created_at >= now() - interval '24 hours'
      and (
        (p_viewer_id is not null and lve.viewer_id = p_viewer_id)
        or (
          p_viewer_id is null
          and normalized_visitor_id is not null
          and lve.viewer_id is null
          and lve.visitor_id = normalized_visitor_id
        )
      )
  ) into already_counted;

  if not already_counted then
    insert into public.listing_view_events (
      listing_id,
      viewer_id,
      visitor_id,
      user_agent
    ) values (
      p_listing_id,
      p_viewer_id,
      normalized_visitor_id,
      normalized_user_agent
    );

    update public.listings
    set views = views + 1
    where id = p_listing_id
      and active = true
    returning views into updated_views;

    return coalesce(updated_views, 0);
  end if;

  return coalesce((select views from public.listings where id = p_listing_id), 0);
end;
$$;

grant execute on function public.track_listing_view(uuid, uuid, text, text) to anon, authenticated;
