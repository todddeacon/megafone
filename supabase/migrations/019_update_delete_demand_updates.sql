-- Allow creators to update and delete their own demand updates
CREATE POLICY IF NOT EXISTS "Authors can update their own updates"
  ON demand_updates FOR UPDATE
  USING (auth.uid() = author_user_id);

CREATE POLICY IF NOT EXISTS "Authors can delete their own updates"
  ON demand_updates FOR DELETE
  USING (auth.uid() = author_user_id);
