-- Add contact email to organisations for threshold notifications
-- Run this in the Supabase SQL Editor after 004_english_football_clubs.sql

alter table organisations
  add column contact_email text null;

-- Track when the threshold notification was sent (prevents duplicate emails)
alter table demands
  add column threshold_notified_at timestamp with time zone null;
