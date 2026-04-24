-- Track when a demand (campaign) was last edited.
-- Used by reviews to show an "edited" badge.
-- Existing rows inherit NULL; edit actions set this to now() on update.

ALTER TABLE demands ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL;
