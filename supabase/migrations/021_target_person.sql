-- Optional target person or group for campaigns
ALTER TABLE demands ADD COLUMN IF NOT EXISTS target_person text null;
