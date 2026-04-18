-- Track when comments are edited
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone null;

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);
