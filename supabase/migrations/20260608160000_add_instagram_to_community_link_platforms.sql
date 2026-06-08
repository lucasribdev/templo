alter table public.community_links
drop constraint if exists community_links_platform_check;

alter table public.community_links
add constraint community_links_platform_check check (
  platform in (
    'DISCORD',
    'TELEGRAM',
    'WHATSAPP',
    'GITHUB',
    'YOUTUBE',
    'INSTAGRAM',
    'SITE_OFICIAL',
    'OUTRA'
  )
);
