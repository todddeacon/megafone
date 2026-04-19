-- ============================================================
-- PETITION EXAMPLE CAMPAIGN: Riverside Athletic FC — Badge
-- ============================================================

-- Fix Q&A example: remove commercial interests reference
UPDATE demands
SET summary = 'Fans have been loyal through thick and thin, but we want to understand the club''s ambition. What''s the plan for squad investment, infrastructure, and leadership that will take Riverside Athletic to the Premier League? We deserve to know the vision and the timeline.'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

-- Create the petition example campaign
INSERT INTO demands (
  id, organisation_id, creator_user_id, campaign_type, headline, demand_text, summary, status,
  support_count_cache, notification_threshold, threshold_notified_at,
  moderation_status, is_example, is_featured, target_person, created_at
)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'petition',
  'Keep the club''s traditional badge — don''t rebrand',
  'We are calling on the Board of Riverside Athletic FC to commit to retaining the club''s traditional badge and identity. Any proposed rebrand must be put to a fan vote before proceeding, with a minimum 75% approval required for any changes to be made.',
  'Rumours have circulated that the club is considering a badge redesign as part of a broader commercial strategy. The current badge has been part of Riverside Athletic''s identity since 1953 and holds deep meaning for generations of supporters. We believe any changes to the club''s identity should be driven by fans.',
  'accepted',
  3412,
  2500,
  '2026-03-01T10:00:00Z',
  'approved',
  true,
  false,
  'The Board',
  '2026-02-15T14:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  campaign_type = EXCLUDED.campaign_type,
  headline = EXCLUDED.headline,
  demand_text = EXCLUDED.demand_text,
  summary = EXCLUDED.summary,
  status = EXCLUDED.status,
  support_count_cache = EXCLUDED.support_count_cache,
  notification_threshold = EXCLUDED.notification_threshold,
  threshold_notified_at = EXCLUDED.threshold_notified_at,
  moderation_status = EXCLUDED.moderation_status,
  is_example = EXCLUDED.is_example,
  target_person = EXCLUDED.target_person;

-- Organisation notification log
INSERT INTO organisation_notifications (demand_id, sent_at) VALUES
  ('c0000000-0000-0000-0000-000000000002', '2026-03-01T10:00:00Z')
ON CONFLICT DO NOTHING;

-- Official response: club accepts
DELETE FROM demand_updates WHERE demand_id = 'c0000000-0000-0000-0000-000000000002';

INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'official_response',
   'The Board has heard the strength of feeling from our supporters on this matter. We want to confirm that Riverside Athletic FC''s badge is a cherished part of our history and identity. We are formally committing to the following: no changes to the club badge will be made without a fan vote, and any proposed changes will require a minimum 75% approval from season ticket holders and registered members before proceeding. The current badge will remain in place. We thank our fans for their passion and for holding us accountable on the things that matter most.',
   '2026-03-20T11:00:00Z');

-- Creator updates
INSERT INTO demand_updates (demand_id, author_user_id, type, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'We''ve smashed through our target of 2,500 supporters! The petition has been delivered to the Board. Over 3,000 fans have made their voices heard — the badge stays. Now let''s see what they say.',
   '2026-03-01T12:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'update',
   'The Board has responded and it''s exactly what we wanted to hear. They''ve committed to keeping the badge and agreed to the 75% fan vote threshold. This is what happens when fans come together. Thank you to every single person who signed this petition.',
   '2026-03-20T14:00:00Z');

-- Discussion comments
DELETE FROM comments WHERE demand_id = 'c0000000-0000-0000-0000-000000000002';

INSERT INTO comments (demand_id, user_id, body, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   'The badge is everything. My grandad took me to my first game and pointed at that badge on the programme — it''s been the same ever since. Don''t change it.',
   '2026-02-16T09:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003',
   'Signed immediately. Look at what happened to other clubs who changed their badges — it was a disaster. Leeds, Everton — the fans always push back.',
   '2026-02-16T14:30:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004',
   'The 75% threshold is a brilliant idea. It means the club can''t sneak through a rebrand with a dodgy consultation process.',
   '2026-02-18T11:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005',
   'I''ve got a tattoo of this badge. Literally. They are not changing it.',
   '2026-02-19T20:15:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006',
   'As a graphic designer, I can tell you the current badge is actually really well designed. It has character and history. Modern minimalist rebrands always lose something.',
   '2026-02-21T16:45:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007',
   'Shared this with every Riverside fan I know. We need to show the Board that the fans care about tradition.',
   '2026-02-23T08:30:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000008',
   'If they want to modernise the merchandise that''s fine, but the badge itself is sacred. Full support for this petition.',
   '2026-02-25T19:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009',
   'Just signed — 2,847 and counting. Nearly there. Keep sharing.',
   '2026-02-28T12:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000010',
   'The Board actually listened! This is amazing. Proof that when fans organise properly, clubs take notice. Well done everyone.',
   '2026-03-21T10:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   'Incredible result. The 75% fan vote commitment is exactly what we asked for. This is how fan engagement should work — not just lip service, but real accountability.',
   '2026-03-21T15:30:00Z');
