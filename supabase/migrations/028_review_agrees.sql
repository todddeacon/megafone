-- Anonymous (and authenticated) "I agree" support for reviews.
-- Deduped per demand by cookie_id; authenticated user_id captured when present.
-- support_count_cache on the demand is incremented for each new agree row.

CREATE TABLE IF NOT EXISTS review_agrees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  cookie_id text NOT NULL,
  ip_hash text NULL,
  user_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS review_agrees_cookie_unique
  ON review_agrees(demand_id, cookie_id);

CREATE INDEX IF NOT EXISTS review_agrees_demand_idx
  ON review_agrees(demand_id);

-- Rate-limit helper: recent agrees by IP (for spam detection)
CREATE INDEX IF NOT EXISTS review_agrees_ip_recent_idx
  ON review_agrees(ip_hash, created_at DESC);
