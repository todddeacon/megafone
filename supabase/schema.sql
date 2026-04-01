-- Fan Demands — Database Schema
-- Run this in Supabase: SQL Editor → New Query → paste → Run

-- ============================================================
-- ORGANISATIONS
-- ============================================================

create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  type        text not null,
  logo_url    text,
  is_claimed  boolean not null default false,
  created_at  timestamp with time zone not null default now()
);

create index idx_organisations_slug on organisations (slug);

-- ============================================================
-- DEMANDS
-- ============================================================

create table demands (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations (id) on delete cascade,
  creator_user_id     uuid not null references auth.users (id) on delete cascade,
  headline            text not null,
  summary             text not null,
  status              text not null default 'building',
  support_count_cache integer not null default 0,
  created_at          timestamp with time zone not null default now()
);

create index idx_demands_organisation_id on demands (organisation_id);
create index idx_demands_creator_user_id on demands (creator_user_id);
create index idx_demands_status on demands (status);

-- ============================================================
-- DEMAND QUESTIONS
-- ============================================================

create table demand_questions (
  id             uuid primary key default gen_random_uuid(),
  demand_id      uuid not null references demands (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  body           text not null,
  is_followup    boolean not null default false,
  created_at     timestamp with time zone not null default now()
);

create index idx_demand_questions_demand_id on demand_questions (demand_id);

-- ============================================================
-- DEMAND UPDATES
-- ============================================================

create table demand_updates (
  id             uuid primary key default gen_random_uuid(),
  demand_id      uuid not null references demands (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  type           text not null,
  body           text not null,
  created_at     timestamp with time zone not null default now()
);

create index idx_demand_updates_demand_id on demand_updates (demand_id);

-- ============================================================
-- DEMAND LINKS
-- ============================================================

create table demand_links (
  id         uuid primary key default gen_random_uuid(),
  demand_id  uuid not null references demands (id) on delete cascade,
  url        text not null,
  title      text not null,
  created_at timestamp with time zone not null default now()
);

create index idx_demand_links_demand_id on demand_links (demand_id);

-- ============================================================
-- SUPPORTS
-- ============================================================

create table supports (
  id         uuid primary key default gen_random_uuid(),
  demand_id  uuid not null references demands (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique (demand_id, user_id)
);

create index idx_supports_demand_id on supports (demand_id);
create index idx_supports_user_id on supports (user_id);

-- ============================================================
-- COMMENTS
-- ============================================================

create table comments (
  id         uuid primary key default gen_random_uuid(),
  demand_id  uuid not null references demands (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamp with time zone not null default now()
);

create index idx_comments_demand_id on comments (demand_id);

-- ============================================================
-- ORGANISATION NOTIFICATIONS
-- ============================================================

create table organisation_notifications (
  id         uuid primary key default gen_random_uuid(),
  demand_id  uuid not null references demands (id) on delete cascade,
  sent_at    timestamp with time zone not null default now()
);

create index idx_notifications_demand_id on organisation_notifications (demand_id);

-- ============================================================
-- CLAIM REQUESTS
-- ============================================================

create table claim_requests (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations (id) on delete cascade,
  requester_email  text not null,
  requester_role   text not null,
  status           text not null default 'pending',
  created_at       timestamp with time zone not null default now()
);

create index idx_claim_requests_organisation_id on claim_requests (organisation_id);
create index idx_claim_requests_status on claim_requests (status);
