-- Org-side review management: orgs can mark reviews as "dealt with" (internal only).
-- Not displayed publicly — just helps the org keep track of what they've handled.

ALTER TABLE demands ADD COLUMN IF NOT EXISTS resolved_by_org boolean NOT NULL DEFAULT false;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS resolved_by_org_at timestamptz NULL;
ALTER TABLE demands ADD COLUMN IF NOT EXISTS resolved_by_org_user_id uuid NULL;

CREATE INDEX IF NOT EXISTS demands_org_reviews_idx
  ON demands(organisation_id, campaign_type, created_at DESC)
  WHERE campaign_type = 'review';
