-- Add review campaign type support
-- Reviews are standalone single-author campaigns with a rating + subject + body.
-- Fans express agreement via the existing support mechanic.

-- Reviews allow optional org tagging, so organisation_id must be nullable.
-- Existing qa/petition campaigns continue to require it at the application layer.
ALTER TABLE demands ALTER COLUMN organisation_id DROP NOT NULL;

-- What the review is about (e.g. "Arsenal vs Chelsea at Emirates, 15 Mar 2026")
ALTER TABLE demands ADD COLUMN IF NOT EXISTS reviewing_subject text NULL;

-- Rating, 0-5 inclusive. NULL for non-review campaigns.
ALTER TABLE demands ADD COLUMN IF NOT EXISTS rating smallint NULL;

-- How the reviewer should be displayed: 'real_name' | 'nickname' | 'anonymous'
ALTER TABLE demands ADD COLUMN IF NOT EXISTS reviewer_display_mode text NULL;

-- Rating range constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'demands_rating_range'
  ) THEN
    ALTER TABLE demands
      ADD CONSTRAINT demands_rating_range
      CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
  END IF;
END $$;

-- Reviewer display mode constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'demands_reviewer_display_mode_valid'
  ) THEN
    ALTER TABLE demands
      ADD CONSTRAINT demands_reviewer_display_mode_valid
      CHECK (reviewer_display_mode IS NULL OR reviewer_display_mode IN ('real_name','nickname','anonymous'));
  END IF;
END $$;
