-- Seed data for local development.
-- Applied automatically by `supabase db reset`.

-- Stable UUIDs used across auth, profiles, listings and likes.
-- Seeded users exist mainly to satisfy foreign keys and generate profiles.
-- The current frontend only exposes Discord OAuth, so these users are not
-- directly usable in the UI without adding another auth flow.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice@example.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Alice","full_name":"Alice Santos","avatar_url":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bruno@example.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Bruno","full_name":"Bruno Lima","avatar_url":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'carla@example.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Carla","full_name":"Carla Menezes","avatar_url":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'diego@example.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Diego","full_name":"Diego Rocha","avatar_url":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'erika@example.com',
    extensions.crypt('devpassword123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Erika","full_name":"Erika Alves","avatar_url":"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=256&q=80"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.profiles (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  discord_id
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'alice',
    'Alice Santos',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'Curte co-op, survival crafting e jogos com progressão longa.',
    'alice#1001'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bruno',
    'Bruno Lima',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    'Admin de servidor dedicado e sempre montando squad para ranked.',
    'bruno#2002'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'carla',
    'Carla Menezes',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
    'Focada em MMOs, social play e comunidades brasileiras.',
    'carla#3003'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'diego',
    'Diego Rocha',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    'Joga shooters táticos, ARPG e qualquer coisa com grind decente.',
    'diego#4004'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'erika',
    'Erika Alves',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=256&q=80',
    'Curadora de comunidades cozy e sempre montando eventos para iniciantes.',
    'erika#5005'
  )
on conflict (id) do update
set
  username = excluded.username,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  discord_id = excluded.discord_id,
  updated_at = now();

insert into public.games (
  id,
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    3328,
    'seed',
    'the-witcher-3-wild-hunt',
    'The Witcher 3: Wild Hunt',
    'https://www.thewitcher.com/us/en/witcher3',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=640&q=80',
    array['RPG', 'Open World'],
    '2015-05-19'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    22511,
    'seed',
    'valheim',
    'Valheim',
    'https://www.valheimgame.com',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=80',
    array['Survival', 'Co-op'],
    '2021-02-02'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    416,
    'seed',
    'terraria',
    'Terraria',
    'https://terraria.org',
    'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=640&q=80',
    array['Sandbox', 'Adventure'],
    '2011-05-16'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    11973,
    'seed',
    'final-fantasy-xiv-online',
    'Final Fantasy XIV Online',
    'https://na.finalfantasyxiv.com',
    'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=640&q=80',
    array['MMORPG', 'Fantasy'],
    '2013-08-27'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    5679,
    'seed',
    'stardew-valley',
    'Stardew Valley',
    'https://www.stardewvalley.net',
    'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=640&q=80',
    array['Farming', 'Cozy'],
    '2016-02-26'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    290856,
    'seed',
    'elden-ring',
    'Elden Ring',
    'https://en.bandainamcoent.eu/elden-ring/elden-ring',
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=640&q=80',
    array['Action RPG', 'Open World'],
    '2022-02-25'
  ),
  (
    '12121212-1212-1212-1212-121212121212',
    3498,
    'seed',
    'grand-theft-auto-v',
    'Grand Theft Auto V',
    'https://www.rockstargames.com/gta-v',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
    array['Action', 'Online'],
    '2013-09-17'
  ),
  (
    '13131313-1313-1313-1313-131313131313',
    4200,
    'seed',
    'portal-2',
    'Portal 2',
    'https://www.thinkwithportals.com',
    'https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=640&q=80',
    array['Puzzle', 'Co-op'],
    '2011-04-19'
  )
on conflict (id) do update
set
  rawg_id = excluded.rawg_id,
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

-- Complements the handcrafted seed so local development always has enough data.
with generated_games as (
  select
    (
      '90000000-0000-0000-0000-' || lpad(gs::text, 12, '0')
    )::uuid as id,
    900000 + gs as rawg_id,
    'seed-generated' as source,
    'seed-game-' || gs as slug,
    'Seed Game ' || gs as name,
    'https://playtogether.dev/games/seed-game-' || gs as website,
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&q=80' as cover_url,
    case gs % 5
      when 0 then array['Action', 'Multiplayer']
      when 1 then array['RPG', 'Co-op']
      when 2 then array['Sandbox', 'Adventure']
      when 3 then array['Strategy', 'Online']
      else array['Survival', 'Community']
    end as genres,
    (date '2014-01-01' + ((gs - 1) * interval '45 days'))::date as release_date
  from generate_series(1, greatest(0, 50 - (select count(*) from public.games))) as gs
)
insert into public.games (
  id,
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
)
select
  id,
  rawg_id,
  source,
  slug,
  name,
  website,
  cover_url,
  genres,
  release_date
from generated_games
on conflict (id) do update
set
  rawg_id = excluded.rawg_id,
  source = excluded.source,
  slug = excluded.slug,
  name = excluded.name,
  website = excluded.website,
  cover_url = excluded.cover_url,
  genres = excluded.genres,
  release_date = excluded.release_date,
  updated_at = now();

insert into public.listings (
  id,
  user_id,
  game_id,
  slug,
  type,
  title,
  description,
  ip,
  tags,
  discord_invite,
  views,
  active,
  created_at,
  updated_at
)
values
  (
    'f1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'servidor-brasileiro-valheim-com-foco-em-progressao-pve',
    'SERVER',
    'Servidor brasileiro Valheim com foco em progressao PvE',
    'Mapa novo, sem mods obrigatorios, reset mensal e eventos aos domingos.',
    'valheim.playtogether.dev:2456',
    array['br', 'pve', 'dedicado'],
    'https://discord.gg/playtogether',
    42,
    true,
    now() - interval '7 days',
    now() - interval '2 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fechando-party-para-ng-no-the-witcher-3-via-mods-co-op',
    'LFG',
    'Fechando party para NG+ no The Witcher 3 via mods co-op',
    'Procurando gente paciente para testar um setup de mods e fazer questline principal.',
    null,
    array['mods', 'coop', 'rpg'],
    'https://discord.gg/witcherparty',
    18,
    true,
    now() - interval '5 days',
    now() - interval '1 day'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'free-company-br-recrutando-players-casuais-e-hardcore',
    'COMMUNITY',
    'Free Company BR recrutando players casuais e hardcore',
    'Aceitamos iniciantes, temos calendario de raid, mentorias e canal separado para crafting.',
    null,
    array['mmo', 'guilda', 'pt-br'],
    'https://discord.gg/eorzea-br',
    63,
    true,
    now() - interval '12 days',
    now() - interval '3 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'mundo-terraria-master-mode-com-foco-em-bosses',
    'SERVER',
    'Mundo Terraria Master Mode com foco em bosses',
    'Servidor aberto a noite, progressao organizada por semana e canal para votacao de mods leves.',
    'terraria.playtogether.dev:7777',
    array['bosses', 'master-mode', 'mods'],
    'https://discord.gg/terrariabr',
    29,
    true,
    now() - interval '9 days',
    now() - interval '4 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'comunidade-br-para-builders-e-exploradores-de-valheim',
    'COMMUNITY',
    'Comunidade BR para builders e exploradores de Valheim',
    'Grupo focado em construcoes, seeds interessantes e screenshots das bases.',
    null,
    array['community', 'building', 'social'],
    'https://discord.gg/buildheim',
    11,
    true,
    now() - interval '3 days',
    now() - interval '6 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000006',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'grupo-para-fechar-contracts-e-explorar-side-quests',
    'LFG',
    'Grupo para fechar contracts e explorar side quests',
    'Sessao curta no periodo da noite, sem rush e com foco em explorar o mapa.',
    null,
    array['casual', 'night', 'exploration'],
    'https://discord.gg/monsterhunt',
    7,
    true,
    now() - interval '1 day',
    now() - interval '1 hour'
  ),
  (
    'f1000000-0000-0000-0000-000000000007',
    '44444444-4444-4444-4444-444444444444',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'comunidade-cozy-para-farms-compartilhadas-em-stardew-valley',
    'COMMUNITY',
    'Comunidade cozy para farms compartilhadas em Stardew Valley',
    'Grupo para trocar layouts, seeds, dicas de casamento e fazendas multiplayer relax.',
    null,
    array['cozy', 'farm', 'social'],
    'https://discord.gg/stardewcozy',
    24,
    true,
    now() - interval '10 days',
    now() - interval '8 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000008',
    '55555555-5555-5555-5555-555555555555',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'party-para-legacy-dungeon-e-bosses-opcionais-em-elden-ring',
    'LFG',
    'Party para legacy dungeon e bosses opcionais em Elden Ring',
    'Buscando 2 pessoas para jogar sem speedrun, explorando tudo e ajudando com build.',
    null,
    array['soulslike', 'boss', 'exploration'],
    'https://discord.gg/erdtree',
    37,
    true,
    now() - interval '6 days',
    now() - interval '5 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000009',
    '44444444-4444-4444-4444-444444444444',
    '12121212-1212-1212-1212-121212121212',
    'servidor-rp-leve-para-gta-online-com-eventos-semanais',
    'SERVER',
    'Servidor RP leve para GTA Online com eventos semanais',
    'Foco em corridas, encontros de carros e jobs casuais. Sem whitelist pesada.',
    'gta.playtogether.dev:30120',
    array['rp', 'casual', 'cars'],
    'https://discord.gg/gtabr',
    54,
    true,
    now() - interval '14 days',
    now() - interval '2 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000010',
    '55555555-5555-5555-5555-555555555555',
    '13131313-1313-1313-1313-131313131313',
    'dupla-para-fechar-portal-2-co-op-do-zero',
    'LFG',
    'Dupla para fechar Portal 2 co-op do zero',
    'Sessao curta no fim de semana para jogar toda a campanha cooperativa com voice.',
    null,
    array['puzzle', 'coop', 'weekend'],
    'https://discord.gg/aperture',
    15,
    true,
    now() - interval '4 days',
    now() - interval '3 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000011',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'linkshell-br-para-daily-roulettes-e-iniciantes-em-ffxiv',
    'COMMUNITY',
    'Linkshell BR para daily roulettes e iniciantes em FFXIV',
    'Ambiente tranquilo para tirar duvidas, montar party finder e organizar runs semanais.',
    null,
    array['roulette', 'help', 'beginners'],
    'https://discord.gg/ffxivdaily',
    33,
    true,
    now() - interval '8 days',
    now() - interval '12 hours'
  ),
  (
    'f1000000-0000-0000-0000-000000000012',
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'fazenda-multiplayer-focada-em-100-por-cento-de-perfeicao',
    'SERVER',
    'Fazenda multiplayer focada em 100 por cento de perfeicao',
    'Save de longo prazo, calendario compartilhado e divisao de tarefas por especialidade.',
    null,
    array['perfection', 'long-term', 'multiplayer'],
    'https://discord.gg/perfectfarm',
    19,
    true,
    now() - interval '11 days',
    now() - interval '7 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000013',
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'grupo-para-derrotar-moder-e-preparar-endgame',
    'LFG',
    'Grupo para derrotar Moder e preparar endgame',
    'Server fresh, sem portal restriction e com foco em progressao rapida.',
    null,
    array['boss', 'fresh-start', 'vikings'],
    'https://discord.gg/moder',
    27,
    true,
    now() - interval '2 days',
    now() - interval '90 minutes'
  ),
  (
    'f1000000-0000-0000-0000-000000000014',
    '55555555-5555-5555-5555-555555555555',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'comunidade-de-mods-e-texture-packs-para-terraria',
    'COMMUNITY',
    'Comunidade de mods e texture packs para Terraria',
    'Canal para compartilhar packs leves, seeds e desafios de construção.',
    null,
    array['mods', 'textures', 'creative'],
    'https://discord.gg/terrariamods',
    12,
    true,
    now() - interval '13 days',
    now() - interval '9 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000015',
    '44444444-4444-4444-4444-444444444444',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'arena-pvp-privada-para-testes-de-build-em-elden-ring',
    'SERVER',
    'Arena PvP privada para testes de build em Elden Ring',
    'Lobby fechado para scrims e testes. Este anuncio esta inativo para validar filtros.',
    null,
    array['pvp', 'testing', 'inactive'],
    'https://discord.gg/buildarena',
    5,
    false,
    now() - interval '20 days',
    now() - interval '10 days'
  ),
  (
    'f1000000-0000-0000-0000-000000000016',
    '22222222-2222-2222-2222-222222222222',
    '12121212-1212-1212-1212-121212121212',
    'squad-para-heists-e-missoes-de-negocio-no-gta-online',
    'LFG',
    'Squad para heists e missoes de negocio no GTA Online',
    'Run organizada no periodo noturno com foco em dinheiro e unlocks.',
    null,
    array['heist', 'money', 'night'],
    'https://discord.gg/gtaheist',
    44,
    true,
    now() - interval '15 hours',
    now() - interval '20 minutes'
  )
on conflict (id) do update
set
  user_id = excluded.user_id,
  game_id = excluded.game_id,
  slug = excluded.slug,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  ip = excluded.ip,
  tags = excluded.tags,
  discord_invite = excluded.discord_invite,
  views = excluded.views,
  active = excluded.active,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

with target_games as (
  select
    id,
    row_number() over (order by created_at, id) as rn
  from public.games
),
generated_listings as (
  select
    (
      'f2000000-0000-0000-0000-' || lpad(gs::text, 12, '0')
    )::uuid as id,
    case gs % 5
      when 1 then '11111111-1111-1111-1111-111111111111'::uuid
      when 2 then '22222222-2222-2222-2222-222222222222'::uuid
      when 3 then '33333333-3333-3333-3333-333333333333'::uuid
      when 4 then '44444444-4444-4444-4444-444444444444'::uuid
      else '55555555-5555-5555-5555-555555555555'::uuid
    end as user_id,
    (
      select tg.id
      from target_games tg
      where tg.rn = ((gs - 1) % (select count(*) from target_games)) + 1
    ) as game_id,
    public.slugify(
      case gs % 3
        when 1 then 'Servidor gerado #' || gs || ' para partidas recorrentes'
        when 2 then 'Comunidade gerada #' || gs || ' para jogadores brasileiros'
        else 'Grupo gerado #' || gs || ' para fechar squad hoje'
      end
    ) as slug,
    case gs % 3
      when 1 then 'SERVER'::public.type
      when 2 then 'COMMUNITY'::public.type
      else 'LFG'::public.type
    end as type,
    case gs % 3
      when 1 then 'Servidor gerado #' || gs || ' para partidas recorrentes'
      when 2 then 'Comunidade gerada #' || gs || ' para jogadores brasileiros'
      else 'Grupo gerado #' || gs || ' para fechar squad hoje'
    end as title,
    case gs % 3
      when 1 then 'Seed automatica com foco em sessoes frequentes, onboarding rapido e organizacao por Discord.'
      when 2 then 'Seed automatica para manter variedade local com canais de ajuda, eventos e matchmaking casual.'
      else 'Seed automatica para testes de listagem, filtros e volume de conteudo na interface.'
    end as description,
    case
      when gs % 3 = 1 then 'seed-' || gs || '.playtogether.dev:' || (3000 + gs)
      else null
    end as ip,
    case gs % 4
      when 0 then array['br', 'casual', 'party']
      when 1 then array['dedicado', 'eventos', 'ativo']
      when 2 then array['social', 'guilda', 'pt-br']
      else array['ranked', 'coop', 'noite']
    end as tags,
    'https://discord.gg/seed' || lpad(gs::text, 4, '0') as discord_invite,
    (10 + ((gs * 7) % 90))::bigint as views,
    true as active,
    now() - (gs * interval '6 hours') as created_at,
    now() - (gs * interval '3 hours') as updated_at
  from generate_series(1, greatest(0, 100 - (select count(*) from public.listings))) as gs
)
insert into public.listings (
  id,
  user_id,
  game_id,
  slug,
  type,
  title,
  description,
  ip,
  tags,
  discord_invite,
  views,
  active,
  created_at,
  updated_at
)
select
  id,
  user_id,
  game_id,
  slug,
  type,
  title,
  description,
  ip,
  tags,
  discord_invite,
  views,
  active,
  created_at,
  updated_at
from generated_listings
on conflict (id) do update
set
  user_id = excluded.user_id,
  game_id = excluded.game_id,
  slug = excluded.slug,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  ip = excluded.ip,
  tags = excluded.tags,
  discord_invite = excluded.discord_invite,
  views = excluded.views,
  active = excluded.active,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

insert into public.listing_likes (
  listing_id,
  user_id
)
values
  ('f1000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('f1000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222'),
  ('f1000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222'),
  ('f1000000-0000-0000-0000-000000000008', '44444444-4444-4444-4444-444444444444'),
  ('f1000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000009', '55555555-5555-5555-5555-555555555555'),
  ('f1000000-0000-0000-0000-000000000010', '44444444-4444-4444-4444-444444444444'),
  ('f1000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111'),
  ('f1000000-0000-0000-0000-000000000011', '55555555-5555-5555-5555-555555555555'),
  ('f1000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222'),
  ('f1000000-0000-0000-0000-000000000013', '44444444-4444-4444-4444-444444444444'),
  ('f1000000-0000-0000-0000-000000000014', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000016', '33333333-3333-3333-3333-333333333333'),
  ('f1000000-0000-0000-0000-000000000016', '44444444-4444-4444-4444-444444444444'),
  ('f1000000-0000-0000-0000-000000000016', '55555555-5555-5555-5555-555555555555')
on conflict (listing_id, user_id) do nothing;
