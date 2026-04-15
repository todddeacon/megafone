-- ============================================================
-- ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ============================================================
-- Run this in Supabase: SQL Editor → New Query → paste → Run
--
-- WHAT THIS DOES:
-- Right now, anyone with your Supabase URL can read/write all data.
-- This locks it down so:
--   - Public visitors can only READ public data
--   - Signed-in users can only CREATE/DELETE their own records
--   - Admin operations use the service_role key which bypasses RLS
--
-- IMPORTANT: The service_role key (used by admin client) bypasses all
-- these policies, so admin actions and cached queries still work.
-- ============================================================


-- ── PROFILES ─────────────────────────────────────────────────
-- Everyone can read (for display names), users can update their own

alter table profiles enable row level security;

create policy "Anyone can read profiles"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);


-- ── ORGANISATIONS ────────────────────────────────────────────
-- Everyone can read, only admin (service_role) can write

alter table organisations enable row level security;

create policy "Anyone can read organisations"
  on organisations for select
  using (true);

-- Admin updates (e.g. marking as claimed) — app checks isAdmin() first
create policy "Authenticated users can update organisations"
  on organisations for update
  using (auth.uid() is not null);


-- ── DEMANDS ──────────────────────────────────────────────────
-- Everyone can read approved demands (+ creators can see their own pending ones)
-- Signed-in users can create, creators can update their own

alter table demands enable row level security;

create policy "Anyone can read approved demands"
  on demands for select
  using (
    moderation_status = 'approved'
    or creator_user_id = auth.uid()
  );

create policy "Authenticated users can create demands"
  on demands for insert
  with check (auth.uid() = creator_user_id);

-- Updates come from creators (editing), org reps (responding), supporters
-- (triggering status changes), and the RPC function (support count).
-- The app's server actions verify permissions before updating.
create policy "Authenticated users can update demands"
  on demands for update
  using (auth.uid() is not null);

-- Admin can delete campaigns — app checks isAdmin() first
create policy "Authenticated users can delete demands"
  on demands for delete
  using (auth.uid() is not null);


-- ── DEMAND QUESTIONS ─────────────────────────────────────────
-- Everyone can read, authenticated users can insert

alter table demand_questions enable row level security;

create policy "Anyone can read demand questions"
  on demand_questions for select
  using (true);

create policy "Authenticated users can insert questions"
  on demand_questions for insert
  with check (auth.uid() = author_user_id);


-- ── DEMAND UPDATES ───────────────────────────────────────────
-- Everyone can read, authenticated users can insert

alter table demand_updates enable row level security;

create policy "Anyone can read demand updates"
  on demand_updates for select
  using (true);

create policy "Authenticated users can insert updates"
  on demand_updates for insert
  with check (auth.uid() = author_user_id);


-- ── DEMAND LINKS ─────────────────────────────────────────────
-- Everyone can read, authenticated users can insert/delete

alter table demand_links enable row level security;

create policy "Anyone can read demand links"
  on demand_links for select
  using (true);

create policy "Authenticated users can insert links"
  on demand_links for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can delete links"
  on demand_links for delete
  using (auth.uid() is not null);


-- ── SUPPORTS ─────────────────────────────────────────────────
-- Everyone can read (support counts are public)
-- Users can insert/delete their own supports

alter table supports enable row level security;

create policy "Anyone can read supports"
  on supports for select
  using (true);

create policy "Users can insert their own support"
  on supports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own support"
  on supports for delete
  using (auth.uid() = user_id);


-- ── COMMENTS ─────────────────────────────────────────────────
-- Everyone can read, users can insert/delete their own

alter table comments enable row level security;

create policy "Anyone can read comments"
  on comments for select
  using (true);

create policy "Users can insert their own comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);


-- ── ORGANISATION NOTIFICATIONS ───────────────────────────────
-- Everyone can read (shows when org was notified)
-- Only admin (service_role) can insert

alter table organisation_notifications enable row level security;

create policy "Anyone can read notifications"
  on organisation_notifications for select
  using (true);

create policy "Authenticated users can insert notifications"
  on organisation_notifications for insert
  with check (auth.uid() is not null);


-- ── CLAIM REQUESTS ───────────────────────────────────────────
-- Users can insert their own, only admin can read/update all

alter table claim_requests enable row level security;

create policy "Users can insert their own claim requests"
  on claim_requests for insert
  with check (auth.uid() is not null);

create policy "Users can read their own claim requests"
  on claim_requests for select
  using (auth.uid() is not null);

-- Admin approves/rejects — app checks isAdmin() first
create policy "Authenticated users can update claim requests"
  on claim_requests for update
  using (auth.uid() is not null);


-- ── ORG REPS ─────────────────────────────────────────────────
-- Users can read their own rep status
-- Admin inserts via regular client (isAdmin() checked in app)

alter table org_reps enable row level security;

create policy "Users can read their own rep status"
  on org_reps for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert org reps"
  on org_reps for insert
  with check (auth.uid() is not null);


-- ── ORGANISATION NOTIFICATION EMAILS ─────────────────────────
-- Admin reads/inserts/deletes via regular client (isAdmin() checked in app)
-- Also read by server actions to send threshold emails

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
