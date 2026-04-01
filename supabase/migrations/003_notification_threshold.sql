-- Add supporter notification threshold to demands
-- Run this in Supabase SQL Editor after 002_phase5.sql

alter table demands
  add column notification_threshold integer null;
