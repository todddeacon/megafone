-- Add campaign type support: 'qa' (default, existing) or 'petition'
ALTER TABLE demands ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'qa';

-- The specific demand text for petition campaigns
ALTER TABLE demands ADD COLUMN IF NOT EXISTS demand_text text null;
