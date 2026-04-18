-- Add link URL and title to demand updates for official responses
ALTER TABLE demand_updates ADD COLUMN IF NOT EXISTS link_url text null;
ALTER TABLE demand_updates ADD COLUMN IF NOT EXISTS link_title text null;
