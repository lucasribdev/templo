insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  22508,
  'seed',
  'overwatch',
  'Overwatch',
  'https://playoverwatch.com',
  'https://media.rawg.io/media/categories/4ea/4ea507ceebeabb43edbc09468f5aaac6.jpg',
  array['Ação', 'Tiro', 'Casual'],
  '2016-05-24'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  442840,
  'seed',
  'space-station-14',
  'Space Station 14',
  'https://spacestation14.io/',
  'https://media.rawg.io/media/screenshots/e92/e923cb9d4ef8617b1f383b0c45690bff.jpg',
  array['Ação', 'Aventura', 'RPG', 'Simulação', 'Indie'],
  null
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  36045,
  'seed',
  'tibia',
  'Tibia',
  'http://www.tibia.com',
  'https://media.rawg.io/media/screenshots/c4f/c4f6c6982902c6c0195e36f44044bdf0.jpg',
  array['RPG', 'MMORPG'],
  '1996-01-01'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  15323,
  'seed',
  'foxhole',
  'Foxhole',
  'http://www.foxholegame.com',
  'https://media.rawg.io/media/screenshots/9d4/9d4787c3d42848def5f1c229b644c21a.jpg',
  array['Ação', 'RPG', 'Estratégia', 'Indie'],
  '2017-07-27'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  23598,
  'seed',
  'league-of-legends',
  'League of Legends',
  'http://www.leagueoflegends.com',
  'https://media.rawg.io/media/categories/78b/78bc81e247fc7e77af700cbd632a9297.jpg',
  array['Ação', 'RPG', 'Estratégia'],
  '2009-10-27'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  22509,
  'seed',
  'minecraft',
  'Minecraft',
  'https://classic.minecraft.net/',
  'https://media.rawg.io/media/categories/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg',
  array['Ação', 'Simulação', 'Arcade', 'Indie'],
  '2009-05-10'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  3498,
  'seed',
  'grand-theft-auto-v',
  'Grand Theft Auto V',
  'http://www.rockstargames.com/V/',
  'https://media.rawg.io/media/categories/20a/20aa03a10cda45239fe22d035c0ebe64.jpg',
  array['Ação'],
  '2013-09-17'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.categories (
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values (
  10213,
  'seed',
  'dota-2',
  'Dota 2',
  'http://www.dota2.com/',
  'https://media.rawg.io/media/categories/6fc/6fcf4cd3b17c288821388e6085bb0fc9.jpg',
  array['Ação', 'MOBA'],
  '2013-07-09'
)
on conflict (rawg_id) do update
set
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();
