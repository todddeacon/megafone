-- English Football Clubs: Premier League + Championship + League One + League Two
-- Run this in the Supabase SQL Editor
-- Uses ON CONFLICT (slug) DO NOTHING to safely re-run without duplicates

-- ── Premier League ──────────────────────────────────────────────────────────
insert into organisations (name, slug, type, is_claimed) values
  ('Arsenal',                    'arsenal',                    'football_club', false),
  ('Aston Villa',                'aston-villa',                'football_club', false),
  ('Bournemouth',                'bournemouth',                'football_club', false),
  ('Brentford',                  'brentford',                  'football_club', false),
  ('Brighton & Hove Albion',     'brighton-hove-albion',       'football_club', false),
  ('Chelsea',                    'chelsea',                    'football_club', false),
  ('Crystal Palace',             'crystal-palace',             'football_club', false),
  ('Everton',                    'everton',                    'football_club', false),
  ('Fulham',                     'fulham',                     'football_club', false),
  ('Ipswich Town',               'ipswich-town',               'football_club', false),
  ('Leicester City',             'leicester-city',             'football_club', false),
  ('Liverpool',                  'liverpool',                  'football_club', false),
  ('Manchester City',            'manchester-city',            'football_club', false),
  ('Manchester United',          'manchester-united',          'football_club', false),
  ('Newcastle United',           'newcastle-united',           'football_club', false),
  ('Nottingham Forest',          'nottingham-forest',          'football_club', false),
  ('Southampton',                'southampton',                'football_club', false),
  ('Tottenham Hotspur',          'tottenham-hotspur',          'football_club', false),
  ('West Ham United',            'west-ham-united',            'football_club', false),
  ('Wolverhampton Wanderers',    'wolverhampton-wanderers',    'football_club', false)
on conflict (slug) do nothing;

-- ── Championship ────────────────────────────────────────────────────────────
insert into organisations (name, slug, type, is_claimed) values
  ('Blackburn Rovers',           'blackburn-rovers',           'football_club', false),
  ('Bristol City',               'bristol-city',               'football_club', false),
  ('Burnley',                    'burnley',                    'football_club', false),
  ('Cardiff City',               'cardiff-city',               'football_club', false),
  ('Coventry City',              'coventry-city',              'football_club', false),
  ('Derby County',               'derby-county',               'football_club', false),
  ('Hull City',                  'hull-city',                  'football_club', false),
  ('Leeds United',               'leeds-united',               'football_club', false),
  ('Luton Town',                 'luton-town',                 'football_club', false),
  ('Middlesbrough',              'middlesbrough',              'football_club', false),
  ('Millwall',                   'millwall',                   'football_club', false),
  ('Norwich City',               'norwich-city',               'football_club', false),
  ('Oxford United',              'oxford-united',              'football_club', false),
  ('Plymouth Argyle',            'plymouth-argyle',            'football_club', false),
  ('Portsmouth',                 'portsmouth',                 'football_club', false),
  ('Preston North End',          'preston-north-end',          'football_club', false),
  ('Queens Park Rangers',        'queens-park-rangers',        'football_club', false),
  ('Sheffield United',           'sheffield-united',           'football_club', false),
  ('Sheffield Wednesday',        'sheffield-wednesday',        'football_club', false),
  ('Stoke City',                 'stoke-city',                 'football_club', false),
  ('Sunderland',                 'sunderland',                 'football_club', false),
  ('Swansea City',               'swansea-city',               'football_club', false),
  ('Watford',                    'watford',                    'football_club', false),
  ('West Bromwich Albion',       'west-bromwich-albion',       'football_club', false)
on conflict (slug) do nothing;

-- ── League One ───────────────────────────────────────────────────────────────
insert into organisations (name, slug, type, is_claimed) values
  ('Barnsley',                   'barnsley',                   'football_club', false),
  ('Birmingham City',            'birmingham-city',            'football_club', false),
  ('Blackpool',                  'blackpool',                  'football_club', false),
  ('Bolton Wanderers',           'bolton-wanderers',           'football_club', false),
  ('Bristol Rovers',             'bristol-rovers',             'football_club', false),
  ('Burton Albion',              'burton-albion',              'football_club', false),
  ('Cambridge United',           'cambridge-united',           'football_club', false),
  ('Charlton Athletic',          'charlton-athletic',          'football_club', false),
  ('Crawley Town',               'crawley-town',               'football_club', false),
  ('Exeter City',                'exeter-city',                'football_club', false),
  ('Huddersfield Town',          'huddersfield-town',          'football_club', false),
  ('Leyton Orient',              'leyton-orient',              'football_club', false),
  ('Lincoln City',               'lincoln-city',               'football_club', false),
  ('Mansfield Town',             'mansfield-town',             'football_club', false),
  ('Northampton Town',           'northampton-town',           'football_club', false),
  ('Peterborough United',        'peterborough-united',        'football_club', false),
  ('Reading',                    'reading',                    'football_club', false),
  ('Rotherham United',           'rotherham-united',           'football_club', false),
  ('Shrewsbury Town',            'shrewsbury-town',            'football_club', false),
  ('Stevenage',                  'stevenage',                  'football_club', false),
  ('Stockport County',           'stockport-county',           'football_club', false),
  ('Wigan Athletic',             'wigan-athletic',             'football_club', false),
  ('Wrexham',                    'wrexham',                    'football_club', false),
  ('Wycombe Wanderers',          'wycombe-wanderers',          'football_club', false)
on conflict (slug) do nothing;

-- ── League Two ───────────────────────────────────────────────────────────────
insert into organisations (name, slug, type, is_claimed) values
  ('AFC Wimbledon',              'afc-wimbledon',              'football_club', false),
  ('Accrington Stanley',         'accrington-stanley',         'football_club', false),
  ('Barrow',                     'barrow',                     'football_club', false),
  ('Bradford City',              'bradford-city',              'football_club', false),
  ('Bromley',                    'bromley',                    'football_club', false),
  ('Carlisle United',            'carlisle-united',            'football_club', false),
  ('Cheltenham Town',            'cheltenham-town',            'football_club', false),
  ('Chesterfield',               'chesterfield',               'football_club', false),
  ('Colchester United',          'colchester-united',          'football_club', false),
  ('Crewe Alexandra',            'crewe-alexandra',            'football_club', false),
  ('Doncaster Rovers',           'doncaster-rovers',           'football_club', false),
  ('Fleetwood Town',             'fleetwood-town',             'football_club', false),
  ('Gillingham',                 'gillingham',                 'football_club', false),
  ('Grimsby Town',               'grimsby-town',               'football_club', false),
  ('Harrogate Town',             'harrogate-town',             'football_club', false),
  ('Milton Keynes Dons',         'milton-keynes-dons',         'football_club', false),
  ('Morecambe',                  'morecambe',                  'football_club', false),
  ('Newport County',             'newport-county',             'football_club', false),
  ('Notts County',               'notts-county',               'football_club', false),
  ('Port Vale',                  'port-vale',                  'football_club', false),
  ('Salford City',               'salford-city',               'football_club', false),
  ('Swindon Town',               'swindon-town',               'football_club', false),
  ('Tranmere Rovers',            'tranmere-rovers',            'football_club', false),
  ('Walsall',                    'walsall',                    'football_club', false)
on conflict (slug) do nothing;
