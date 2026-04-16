-- Create organisation_notification_emails table (with contact name, title, and email)
-- This table was referenced in code but never created in the database.

create table if not exists organisation_notification_emails (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations (id) on delete cascade,
  email            text not null,
  label            text null,       -- contact person's name
  title            text null,       -- job title (e.g. "Head of Media", "Press Officer")
  source           text not null default 'manual',
  created_at       timestamp with time zone not null default now(),
  unique (organisation_id, email)
);

create index if not exists idx_org_notification_emails_org_id
  on organisation_notification_emails (organisation_id);

-- Enable RLS (matching the policies from 014)
alter table organisation_notification_emails enable row level security;

create policy "Authenticated users can read notification emails"
  on organisation_notification_emails for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert notification emails"
  on organisation_notification_emails for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can delete notification emails"
  on organisation_notification_emails for delete
  using (auth.uid() is not null);

create policy "Authenticated users can update notification emails"
  on organisation_notification_emails for update
  using (auth.uid() is not null);
