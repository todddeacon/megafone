-- Review media: up to 5 images + 1 video per review.
-- Stored in the 'review-media' Supabase Storage bucket, referenced from this table.

CREATE TABLE IF NOT EXISTS review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id uuid NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  url text NOT NULL,
  storage_path text NULL,
  display_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_media_demand_idx
  ON review_media(demand_id, display_order);

-- Storage bucket (public — URLs are shared publicly like campaign images elsewhere on the site)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access on objects in the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'review_media_public_read'
  ) THEN
    CREATE POLICY review_media_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id = 'review-media');
  END IF;
END $$;

-- Authenticated users can insert into the bucket (server action uses admin client
-- so this is a belt-and-braces allowance for any direct client uploads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'review_media_auth_insert'
  ) THEN
    CREATE POLICY review_media_auth_insert ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'review-media');
  END IF;
END $$;
