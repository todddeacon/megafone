-- ============================================================
-- NEW EXAMPLE CAMPAIGN: Riverside Athletic FC
-- ============================================================
-- Run this in Supabase SQL Editor after uploading the PDF
-- This replaces the old Chelsea example campaign

-- Step 1: Remove old example flag
UPDATE demands SET is_example = false WHERE is_example = true;

-- Step 2: Create the fictional organisation
INSERT INTO organisations (id, name, slug, type, is_claimed, description)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Riverside Athletic FC',
  'riverside-athletic',
  'football_club',
  true,
  'Founded in 1896, Riverside Athletic FC is a proud League One club with a passionate fanbase and ambitious plans for the future. The club is committed to transparent communication with its supporters.'
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  is_claimed = true;

-- Step 3: Create demo profiles for the creator and commenters
INSERT INTO profiles (id, name, nickname) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'James Whitfield', 'whitfield_james'),
  ('b0000000-0000-0000-0000-000000000002', 'Sarah Mitchell', 'sarah_m'),
  ('b0000000-0000-0000-0000-000000000003', 'Dave Thompson', 'thommo_82'),
  ('b0000000-0000-0000-0000-000000000004', 'Lucy Chen', 'lucy_rafc'),
  ('b0000000-0000-0000-0000-000000000005', 'Mark Patterson', 'patto'),
  ('b0000000-0000-0000-0000-000000000006', 'Emma Richards', 'emrich'),
  ('b0000000-0000-0000-0000-000000000007', 'Tom Bradley', 'brad_tom'),
  ('b0000000-0000-0000-0000-000000000008', 'Priya Sharma', 'priya_s'),
  ('b0000000-0000-0000-0000-000000000009', 'Chris Donovan', 'donno_94'),
  ('b0000000-0000-0000-0000-000000000010', 'Katie Morgan', 'kmorgan')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, nickname = EXCLUDED.nickname;

-- Step 4: Create the example campaign
INSERT INTO demands (
  id, organisation_id, creator_user_id, headline, summary, status,
  support_count_cache, notification_threshold, threshold_notified_at,
  moderation_status, is_example, is_featured, target_person, created_at
)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'What is the club''s plan for Premier League promotion?',
  'Fans have been loyal through thick and thin, but we want to understand the club''s ambition. What''s the plan for squad investment, infrastructure, and leadership that will take Riverside Athletic to the Premier League? We deserve to know the vision and the timeline.',
  'responded',
  7826,
  5000,
  '2026-03-15T10:00:00Z',
  'approved',
  true,
  false,
  'The Board',
  '2026-02-01T09:30:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  headline = EXCLUDED.headline,
  summary = EXCLUDED.summary,
  status = EXCLUDED.status,
  support_count_cache = EXCLUDED.support_count_cache,
  notification_threshold = EXCLUDED.notification_threshold,
  threshold_notified_at = EXCLUDED.threshold_notified_at,
  moderation_status = EXCLUDED.moderation_status,
  is_example = EXCLUDED.is_example,
  is_featured = EXCLUDED.is_featured,
  target_person = EXCLUDED.target_person;

-- Step 5: Create the questions
DELETE FROM demand_questions WHERE demand_id = 'c0000000-0000-0000-0000-000000000001';

INSERT INTO demand_questions (demand_id, author_user_id, body, is_followup, round, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'What is the club''s target timeline for reaching the Premier League?', false, 1, '2026-02-01T09:31:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'How much will be invested in the squad over the next three transfer windows?', false, 1, '2026-02-01T09:32:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Are there plans to upgrade the stadium and training facilities?', false, 1, '2026-02-01T09:33:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'What is the club''s strategy for developing youth talent alongside new signings?', false, 1, '2026-02-01T09:34:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'How will the club ensure financial sustainability during the push for promotion?', false, 1, '2026-02-01T09:35:00Z');

-- Step 6: Create organisation notification log
DELETE FROM organisation_notifications WHERE demand_id = 'c0000000-0000-0000-0000-000000000001';

INSERT INTO organisation_notifications (demand_id, sent_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', '2026-03-15T10:00:00Z');

-- Step 7: Create the two official responses
DELETE FROM demand_updates WHERE demand_id = 'c0000000-0000-0000-0000-000000000001';

-- Response 1: Initial acknowledgment (text only)
INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'official_response',
   'Thank you to every supporter who has backed this campaign. The Board has received your questions and takes them extremely seriously. Over 7,800 fans coming together shows the strength of feeling in our community, and we respect that. We are preparing a detailed response to each of your questions and will publish it within two weeks. In the meantime, please know that your passion for this club is shared by everyone at the boardroom table.',
   '2026-03-18T14:00:00Z');

-- Response 2: Full formal response (text + PDF placeholder — update PDF URL after upload)
INSERT INTO demand_updates (demand_id, author_user_id, type, body, pdf_url, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'official_response',
   'As promised, the Board has prepared a detailed response addressing each of your five questions. The full document is attached below and covers our timeline, investment plans, stadium redevelopment, youth strategy, and financial sustainability. We look forward to discussing this further at the fan forum on 22 May.',
   NULL,
   '2026-04-01T10:00:00Z');

-- Step 8: Creator updates
INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'We''ve just passed 1,000 supporters! Thank you to everyone who has shared this campaign. Keep spreading the word — the more of us behind this, the louder our voice.',
   '2026-02-10T18:30:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'Had a great conversation with some fellow season ticket holders in the West Stand today. Everyone I spoke to wants the same thing — transparency from the Board about their plans. If you know anyone who hasn''t signed yet, send them the link.',
   '2026-02-22T20:15:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'We''ve hit our target of 5,000 supporters! The club has been officially notified. Now we wait for their response. This is what fan power looks like — 5,000 people asking the same question. They can''t ignore this.',
   '2026-03-15T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'The club has acknowledged our campaign and said they''ll respond within two weeks. This is a positive sign — they''re taking it seriously. I''ll keep you all posted.',
   '2026-03-19T09:00:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'The full response from the Board is now live! I''ve read through it in detail and it''s genuinely comprehensive. They''ve committed real numbers on investment, laid out a timeline, and announced a fan forum. I''ll be reviewing it fully and sharing my thoughts soon.',
   '2026-04-01T12:00:00Z');

-- Step 9: Discussion comments
DELETE FROM comments WHERE demand_id = 'c0000000-0000-0000-0000-000000000001';

INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   'Brilliant campaign. Been saying this for years — we need a proper plan, not just vague promises every summer.',
   '2026-02-02T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
   'Signed and shared. 30 years supporting this club and I''ve never felt like the Board actually listens. Maybe this will change that.',
   '2026-02-03T15:30:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004',
   'The question about youth development is so important. We''ve got talented kids in the academy — let''s actually give them a pathway.',
   '2026-02-05T09:45:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005',
   'Just shared this in the supporters'' group chat. Everyone I know wants answers on the stadium too. The East Stand is falling apart.',
   '2026-02-08T20:00:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006',
   'I work in finance — the question about sustainability is the right one to ask. Too many clubs chase promotion and end up in administration. We need to be smart about this.',
   '2026-02-12T12:30:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007',
   'Love that we''re doing this as a community. This is so much better than angry tweets that get ignored.',
   '2026-02-15T17:00:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008',
   'My dad has had a season ticket since 1978. He can''t believe how many people are behind this. Shared it with his mates at the club.',
   '2026-02-20T14:15:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009',
   'Can''t wait to see how the Board responds. 5,000 fans asking the same question — they have to take this seriously.',
   '2026-03-16T08:45:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000010',
   'Just read the full response. Fair play to the Board — they''ve actually answered everything in detail. The investment numbers are real and the timeline is ambitious but realistic. The fan forum is a great idea too.',
   '2026-04-02T19:30:00Z'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   'Have to say I''m genuinely impressed with the response. This is exactly the kind of transparency we asked for. Now let''s hold them to it.',
   '2026-04-03T10:00:00Z');
