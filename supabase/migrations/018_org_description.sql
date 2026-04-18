-- Add description field to organisations for org reps to manage
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS description text null;
