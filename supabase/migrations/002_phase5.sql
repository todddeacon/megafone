-- Phase 5 additions
-- Run this in Supabase SQL Editor after schema.sql

-- Verified organisation representatives
create table org_reps (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  organisation_id  uuid not null references organisations (id) on delete cascade,
  created_at       timestamp with time zone not null default now(),
  unique (user_id, organisation_id)
);

create index idx_org_reps_user_id on org_reps (user_id);
create index idx_org_reps_organisation_id on org_reps (organisation_id);

-- Add requester name to claim requests
alter table claim_requests add column requester_name text not null default '';
