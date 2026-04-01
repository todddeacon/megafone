ALTER TABLE demands
  ADD COLUMN IF NOT EXISTS is_example boolean NOT NULL DEFAULT false;
