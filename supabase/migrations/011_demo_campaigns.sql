-- Demo campaigns seed
-- Run this in the Supabase SQL Editor to populate example campaigns for the homepage
-- Safe to re-run (uses ON CONFLICT DO NOTHING throughout)

DO $$
DECLARE
  -- Demo user UUIDs (fixed so they can be referenced consistently)
  u_sarah  uuid := 'a0000001-0000-0000-0000-000000000001'; -- Sarah Mitchell
  u_james  uuid := 'a0000002-0000-0000-0000-000000000002'; -- James Thornton
  u_priya  uuid := 'a0000003-0000-0000-0000-000000000003'; -- Priya Sharma
  u_daniel uuid := 'a0000004-0000-0000-0000-000000000004'; -- Daniel Webb
  u_mark   uuid := 'a0000005-0000-0000-0000-000000000005'; -- Mark Connolly
  u_tom    uuid := 'a0000006-0000-0000-0000-000000000006'; -- Tom Bradley
  u_emma   uuid := 'a0000007-0000-0000-0000-000000000007'; -- Emma Walsh
  u_chris  uuid := 'a0000008-0000-0000-0000-000000000008'; -- Chris Davies
  u_rachel uuid := 'a0000009-0000-0000-0000-000000000009'; -- Rachel Foster
  u_kevin  uuid := 'a0000010-0000-0000-0000-000000000010'; -- Kevin O''Brien

  -- Organisation IDs
  org_liverpool  uuid;
  org_manutd     uuid;
  org_arsenal    uuid;
  org_chelsea    uuid;
  org_spurs      uuid;

  -- Demand IDs
  d_liverpool uuid;
  d_manutd    uuid;
  d_arsenal   uuid;
  d_chelsea   uuid;
  d_spurs     uuid;

  -- Notification record ID
  notif_liverpool uuid;

BEGIN

  -- ── 1. Create demo auth users ─────────────────────────────────────────────
  -- These accounts have no password and cannot be logged into.
  -- They exist solely to satisfy foreign key constraints.

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', u_sarah,  'authenticated', 'authenticated', 'demo-sarah@megafone.example',  '', now() - interval '90 days', now() - interval '90 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_james,  'authenticated', 'authenticated', 'demo-james@megafone.example',  '', now() - interval '75 days', now() - interval '75 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_priya,  'authenticated', 'authenticated', 'demo-priya@megafone.example',  '', now() - interval '60 days', now() - interval '60 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_daniel, 'authenticated', 'authenticated', 'demo-daniel@megafone.example', '', now() - interval '45 days', now() - interval '45 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_mark,   'authenticated', 'authenticated', 'demo-mark@megafone.example',   '', now() - interval '120 days', now() - interval '120 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_tom,    'authenticated', 'authenticated', 'demo-tom@megafone.example',    '', now() - interval '88 days', now() - interval '88 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_emma,   'authenticated', 'authenticated', 'demo-emma@megafone.example',   '', now() - interval '70 days', now() - interval '70 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_chris,  'authenticated', 'authenticated', 'demo-chris@megafone.example',  '', now() - interval '55 days', now() - interval '55 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_rachel, 'authenticated', 'authenticated', 'demo-rachel@megafone.example', '', now() - interval '40 days', now() - interval '40 days', now(), '{"provider":"email","providers":["email"]}', '{}', false),
    ('00000000-0000-0000-0000-000000000000', u_kevin,  'authenticated', 'authenticated', 'demo-kevin@megafone.example',  '', now() - interval '115 days', now() - interval '115 days', now(), '{"provider":"email","providers":["email"]}', '{}', false)
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Create profiles ────────────────────────────────────────────────────
  INSERT INTO profiles (id, name, nickname) VALUES
    (u_sarah,  'Sarah Mitchell', 'sarahm'),
    (u_james,  'James Thornton', 'jamest'),
    (u_priya,  'Priya Sharma',   'priya_s'),
    (u_daniel, 'Daniel Webb',    'danwebb'),
    (u_mark,   'Mark Connolly',  'markc'),
    (u_tom,    'Tom Bradley',    'tombrad'),
    (u_emma,   'Emma Walsh',     'ewalsh'),
    (u_chris,  'Chris Davies',   'cdavies'),
    (u_rachel, 'Rachel Foster',  'rfoster'),
    (u_kevin,  'Kevin O''Brien', 'kobrien')
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Look up organisation IDs ───────────────────────────────────────────
  SELECT id INTO org_liverpool FROM organisations WHERE slug = 'liverpool';
  SELECT id INTO org_manutd    FROM organisations WHERE slug = 'manchester-united';
  SELECT id INTO org_arsenal   FROM organisations WHERE slug = 'arsenal';
  SELECT id INTO org_chelsea   FROM organisations WHERE slug = 'chelsea';
  SELECT id INTO org_spurs     FROM organisations WHERE slug = 'tottenham-hotspur';

  -- ── 4. Insert demands ─────────────────────────────────────────────────────

  -- Campaign 1: Liverpool — End Dynamic Ticket Pricing (notified, 1,892 supporters)
  -- Featured card: highest supporter count with active status
  INSERT INTO demands (
    organisation_id, creator_user_id, headline, summary, status,
    support_count_cache, notification_threshold, moderation_status, created_at
  ) VALUES (
    org_liverpool, u_sarah,
    'End Dynamic Ticket Pricing at Anfield',
    'Liverpool FC introduced dynamic pricing for the 2024/25 season, causing some match tickets to more than triple in price based on demand algorithms. A ticket for the Manchester City home fixture was listed at £185 — nearly three times the standard price of £59. This pricing model penalises loyal supporters for the club''s own success and hands the advantage to those with the deepest pockets, not those with the longest history of following this club.

We are calling on Liverpool FC to publish a full breakdown of how dynamic pricing works, commit to a maximum price cap, and provide transparency on how many supporters are being priced out of attending their home ground.',
    'notified', 1892, 2000, 'approved',
    now() - interval '45 days'
  ) RETURNING id INTO d_liverpool;

  -- Campaign 2: Manchester United — Publish Full Financial Accounts (live, 847 supporters)
  INSERT INTO demands (
    organisation_id, creator_user_id, headline, summary, status,
    support_count_cache, notification_threshold, moderation_status, created_at
  ) VALUES (
    org_manutd, u_james,
    'Publish Full Club Financial Accounts',
    'Manchester United publish headline figures as part of their US stock exchange obligations, but fans have no access to a full breakdown of how revenue is spent — particularly on executive pay, agent fees, and transfer costs. The Glazer ownership has extracted hundreds of millions from the club while debts remain high. Fans deserve full transparency on how their money is being managed.

We are asking the club to publish a comprehensive annual report that includes a complete breakdown of executive compensation, all agent fees paid, net transfer spend, and the true cost of servicing the club''s debt.',
    'live', 847, 1000, 'approved',
    now() - interval '30 days'
  ) RETURNING id INTO d_manutd;

  -- Campaign 3: Arsenal — Restore Safe Standing at the Emirates (responded, 2,100 supporters)
  INSERT INTO demands (
    organisation_id, creator_user_id, headline, summary, status,
    support_count_cache, notification_threshold, moderation_status, created_at
  ) VALUES (
    org_arsenal, u_priya,
    'Restore Safe Standing at the Emirates Stadium',
    'Safe standing has been legal in the Premier League since January 2022, and clubs including Manchester City, Chelsea, Liverpool, and Tottenham have already introduced rail seating in designated areas. Arsenal has yet to follow suit, leaving Emirates supporters unable to stand safely in a designated area as fans do at grounds across Europe.

Safe standing increases atmosphere, improves sight lines, and lets supporters choose how they watch the game. We are asking Arsenal to apply for a safe standing licence and implement rail seating in at least one section of the Emirates for the 2025/26 season.',
    'responded', 2100, 2000, 'approved',
    now() - interval '90 days'
  ) RETURNING id INTO d_arsenal;

  -- Campaign 4: Chelsea — Fan Representative on the Board (building, 234 supporters)
  INSERT INTO demands (
    organisation_id, creator_user_id, headline, summary, status,
    support_count_cache, notification_threshold, moderation_status, created_at
  ) VALUES (
    org_chelsea, u_daniel,
    'Appoint an Elected Fan Representative to the Board',
    'Since the Boehly-Clearlake takeover, Chelsea FC has made significant decisions — on kit suppliers, stadium naming rights, ticket pricing, and community programmes — with no formal fan consultation. Supporters are the lifeblood of this club, yet we have no seat at the table.

Clubs across Europe, including Ajax and FC Barcelona, have long-established models of fan representation at board level. We are calling on Chelsea FC to establish a Fan Advisory Board with a directly elected supporter representative granted observer status on the main board of directors.',
    'building', 234, 750, 'approved',
    now() - interval '14 days'
  ) RETURNING id INTO d_chelsea;

  -- Campaign 5: Tottenham Hotspur — Increase Away Ticket Allocation (resolved, 956 supporters)
  INSERT INTO demands (
    organisation_id, creator_user_id, headline, summary, status,
    support_count_cache, notification_threshold, moderation_status, created_at
  ) VALUES (
    org_spurs, u_mark,
    'Increase the Away Ticket Allocation to 3,000',
    'Tottenham Hotspur Stadium has a capacity of 62,850, yet visiting supporters are allocated just 1,800 tickets — less than 3% of the ground. The Premier League minimum away allocation is 3,000, a figure most clubs meet as a baseline. Spurs are one of a small number of clubs consistently falling short of this standard.

Away fans are an integral part of the matchday atmosphere. A larger away end creates a better spectacle for home fans, television viewers, and the sport as a whole. We are asking Tottenham to bring their away allocation in line with the Premier League minimum of 3,000.',
    'resolved', 956, 1000, 'approved',
    now() - interval '120 days'
  ) RETURNING id INTO d_spurs;

  -- ── 5. Questions ──────────────────────────────────────────────────────────

  -- Liverpool questions (round 1)
  INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
    (d_liverpool, u_sarah, 'What is the full breakdown of how match ticket prices are set under the dynamic pricing model, including what specific factors trigger price increases and by how much?', false, 1, now() - interval '45 days'),
    (d_liverpool, u_sarah, 'Will the club commit to capping ticket prices at a maximum of two times the base price for any given fixture, regardless of demand?', false, 1, now() - interval '45 days'),
    (d_liverpool, u_sarah, 'How many supporters paid more than £100 for a single match ticket in the 2024/25 season, and what percentage of those were existing season ticket holders who could not secure their usual seat?', false, 1, now() - interval '45 days');

  -- Man United questions (round 1)
  INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
    (d_manutd, u_james, 'Will the club publish a full annual report including a complete breakdown of executive compensation packages, agent fees paid on all transfers, and net transfer spend for each of the past five seasons?', false, 1, now() - interval '30 days'),
    (d_manutd, u_james, 'What is the total debt currently held against Manchester United, and what is the annual interest payment on that debt?', false, 1, now() - interval '30 days'),
    (d_manutd, u_james, 'What percentage of matchday revenue from Old Trafford is reinvested directly into the first team playing squad, and how does this compare to the Premier League average?', false, 1, now() - interval '30 days');

  -- Arsenal questions (round 1)
  INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
    (d_arsenal, u_priya, 'Will Arsenal apply for a safe standing licence for the 2025/26 season, in line with other Premier League clubs who have already implemented rail seating?', false, 1, now() - interval '90 days'),
    (d_arsenal, u_priya, 'Which sections of the Emirates would be designated as safe standing areas, and how many additional supporters would this accommodate per match?', false, 1, now() - interval '90 days'),
    (d_arsenal, u_priya, 'What is the estimated timeline for implementation once a licence is approved, and will supporters be consulted on the design and location of the safe standing sections?', false, 1, now() - interval '90 days');

  -- Chelsea questions (round 1)
  INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
    (d_chelsea, u_daniel, 'Will Chelsea FC commit to establishing a Fan Advisory Board with a directly elected supporter representative granted observer status on the main board of directors?', false, 1, now() - interval '14 days'),
    (d_chelsea, u_daniel, 'What formal consultation mechanisms currently exist between the Boehly-Clearlake ownership group and the supporter base, and how frequently do structured meetings take place?', false, 1, now() - interval '14 days');

  -- Spurs questions (round 1)
  INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
    (d_spurs, u_mark, 'Will Tottenham Hotspur commit to increasing the away ticket allocation at Tottenham Hotspur Stadium to the Premier League minimum of 3,000 from the start of the 2025/26 season?', false, 1, now() - interval '120 days'),
    (d_spurs, u_mark, 'What are the specific operational or commercial reasons why the current allocation falls below the Premier League minimum, and are any of these constraints permanent?', false, 1, now() - interval '120 days');

  -- ── 6. Official responses ─────────────────────────────────────────────────

  -- Arsenal official response
  INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES (
    d_arsenal, u_priya,
    'official_response',
    'Arsenal Football Club welcomes the opportunity to respond to this campaign and thanks the 2,100 supporters who added their voices to it.

We are pleased to confirm that Arsenal has submitted a formal application for a safe standing licence to the Premier League and the Sports Ground Safety Authority. We expect to receive a decision by the end of Q2 2025.

Subject to licence approval, we intend to introduce rail seating in the lower tier of the North Bank stand, accommodating approximately 1,800 supporters per match. The design and implementation will follow the same rail seating specification used at other Premier League grounds, with full compliance with all Sports Ground Safety Authority requirements.

We are committed to keeping supporters informed throughout this process and will announce the full timeline once the licence has been formally approved. Further consultation with supporter groups will take place ahead of implementation.',
    now() - interval '30 days'
  );

  -- Spurs official response
  INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES (
    d_spurs, u_mark,
    'official_response',
    'Tottenham Hotspur has reviewed this campaign and the concerns raised by supporters regarding the away ticket allocation at Tottenham Hotspur Stadium.

Having reviewed our operational arrangements, we are pleased to confirm that from the 2025/26 Premier League season, Tottenham Hotspur Stadium will offer a minimum away allocation of 3,000 tickets per fixture, in line with the Premier League standard. This will be achieved by reconfiguring the upper tier of the south stand to expand the designated visiting supporters section.

We recognise the importance of away fans to the atmosphere and fabric of English football and thank the 956 supporters who raised this matter directly through this campaign.',
    now() - interval '60 days'
  );

  -- ── 7. Organisation notifications ─────────────────────────────────────────

  -- Liverpool was notified when threshold was hit
  INSERT INTO organisation_notifications (demand_id, sent_at) VALUES
    (d_liverpool, now() - interval '15 days');

  -- Arsenal was notified (before response)
  INSERT INTO organisation_notifications (demand_id, sent_at) VALUES
    (d_arsenal, now() - interval '60 days');

  -- Spurs was notified (before response)
  INSERT INTO organisation_notifications (demand_id, sent_at) VALUES
    (d_spurs, now() - interval '95 days');

  -- ── 8. Comments ───────────────────────────────────────────────────────────

  -- Liverpool comments
  INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
    (d_liverpool, u_tom,    'Been a Liverpool supporter for 31 years. Never thought I''d see the day I couldn''t afford to watch my own team at home. £185 for a league game is simply not acceptable.', now() - interval '40 days'),
    (d_liverpool, u_emma,   'They talk about the famous Anfield atmosphere, but they''re pricing out the very people who create it. The noise in that ground comes from loyal, local fans — not tourists paying £185 a seat.', now() - interval '38 days'),
    (d_liverpool, u_chris,  'My son came to his first game last season. At these prices I genuinely cannot afford to take him again. This is not the club we grew up with.', now() - interval '35 days'),
    (d_liverpool, u_rachel, 'Fully signed. I work two jobs and still can''t justify these prices. Dynamic pricing should have no place at a community football club.', now() - interval '30 days'),
    (d_liverpool, u_kevin,  'The club will say demand justifies the price. But that demand exists because of 30+ years of loyalty from supporters who are now being asked to pay through the nose for it.', now() - interval '28 days'),
    (d_liverpool, u_sarah,  'Thank you all for getting behind this. Nearly 2,000 of us speaking with one voice — they cannot ignore this.', now() - interval '20 days');

  -- Man United comments
  INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
    (d_manutd, u_tom,    'The club generates over £600m in revenue per year. The fans deserve to know exactly where that money goes. Simple as that.', now() - interval '25 days'),
    (d_manutd, u_emma,   'Glazers have taken over £1.1 billion out of this club over 19 years. And they can''t publish a full set of accounts? Something doesn''t add up.', now() - interval '23 days'),
    (d_manutd, u_rachel, 'Every other major publicly-listed company in the world publishes this information. Why should United be any different?', now() - interval '20 days'),
    (d_manutd, u_kevin,  'This is about basic accountability. If you''re taking money from supporters through ticket prices, merchandise, and TV deals, you owe them transparency.', now() - interval '15 days'),
    (d_manutd, u_james,  'Over 800 supporters have backed this in under a month. The demand for transparency is real.', now() - interval '10 days');

  -- Arsenal comments
  INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
    (d_arsenal, u_kevin,  'Been going to games since the old Highbury days. Safe standing transforms the atmosphere. Long overdue at the Emirates.', now() - interval '85 days'),
    (d_arsenal, u_tom,    'City fans have had it for two seasons now. Chelsea fans. Liverpool fans. We''re one of the last big clubs yet to act on this.', now() - interval '80 days'),
    (d_arsenal, u_emma,   'The atmosphere in the away end at the Emirates is always better than the home end. Coincidence? No — they can stand.', now() - interval '75 days'),
    (d_arsenal, u_chris,  'Brilliant response from the club. This is exactly what fan campaigns should achieve. Well done to everyone who signed and shared this.', now() - interval '25 days'),
    (d_arsenal, u_rachel, 'Credit where it''s due — Arsenal have responded properly and given a clear timeline. This is what accountability looks like.', now() - interval '22 days'),
    (d_arsenal, u_priya,  'Really pleased with this outcome. 2,100 of us made this happen. The North Bank rail seating will be brilliant.', now() - interval '20 days');

  -- Chelsea comments
  INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
    (d_chelsea, u_tom,    'We''ve had three different kit manufacturers in two years. Naming rights discussions happening with no consultation. This is exactly why we need a proper voice at board level.', now() - interval '12 days'),
    (d_chelsea, u_emma,   'Ajax have had fan representation for decades. Barcelona are member-owned. There''s nothing radical about this — it''s how a football club should be run.', now() - interval '10 days'),
    (d_chelsea, u_chris,  'Boehly promised to engage with fans when he bought the club. Two years in and there''s been nothing formal. Time to hold them to it.', now() - interval '8 days'),
    (d_chelsea, u_daniel, 'Still early days but the response from the fan community has been encouraging. Keep sharing this — we need 750 supporters behind it.', now() - interval '5 days');

  -- Spurs comments
  INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
    (d_spurs, u_rachel, 'Travelled to three away games last season. Each time we''re squeezed into 1,800 seats for a 62,000-seat stadium. Completely disproportionate.', now() - interval '115 days'),
    (d_spurs, u_kevin,  'Premier League minimum exists for a reason. No club should be falling short of it — and certainly not one with a stadium that size.', now() - interval '110 days'),
    (d_spurs, u_tom,    'Away fans are part of what makes English football special. Restricting them makes for a worse game for everyone.', now() - interval '105 days'),
    (d_spurs, u_chris,  'Great result. A proper response and a real commitment to change. This is what Megafone is for.', now() - interval '55 days'),
    (d_spurs, u_emma,   'Huge credit to Mark and everyone who signed this. 3,000 away fans from next season — brilliant.', now() - interval '52 days'),
    (d_spurs, u_mark,   'Thrilled with this outcome. Took four months but we got there. Away fans matter.', now() - interval '50 days');

END $$;
