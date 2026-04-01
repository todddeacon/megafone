-- Fan Demands — Seed Data
-- Run this in Supabase SQL Editor after schema.sql

insert into organisations (name, slug, type)
values
  ('Manchester United FC', 'manchester-united', 'football_club'),
  ('Premier League', 'premier-league', 'league'),
  ('Arsenal FC', 'arsenal', 'football_club'),
  ('Chelsea FC', 'chelsea', 'football_club'),
  ('Liverpool FC', 'liverpool', 'football_club');
