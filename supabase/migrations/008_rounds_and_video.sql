-- Add round tracking to demand questions
-- Round 1 = initial questions, Round 2+ = follow-up rounds after each response
ALTER TABLE demand_questions
  ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1;

-- Add video URL to demand updates (for official responses alongside or instead of PDF/text)
ALTER TABLE demand_updates
  ADD COLUMN IF NOT EXISTS video_url text;
