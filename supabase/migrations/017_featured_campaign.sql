-- Add featured campaign support
-- Only one campaign can be featured at a time

ALTER TABLE demands
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
