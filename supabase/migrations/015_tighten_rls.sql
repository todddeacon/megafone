-- ============================================================
-- TIGHTEN RLS POLICIES
-- ============================================================
-- Fixes overly permissive policies that allowed any authenticated
-- user to update/delete any row via direct Supabase API calls.
--
-- Admin operations now use the service_role key (admin client)
-- which bypasses RLS entirely — no permissive policies needed.
-- ============================================================


-- ── DEMANDS ──────────────────────────────────────────────────
-- Only creators can update/delete their own demands.
-- Admin and system operations (status transitions, support count)
-- use the service_role admin client which bypasses RLS.

drop policy if exists "Authenticated users can update demands" on demands;
drop policy if exists "Authenticated users can delete demands" on demands;

create policy "Creators can update their own demands"
  on demands for update
  using (auth.uid() = creator_user_id);

create policy "Creators can delete their own demands"
  on demands for delete
  using (auth.uid() = creator_user_id);


-- ── ORGANISATIONS ──────────���─────────────────────────────────
-- Remove permissive update — admin uses service_role client.

drop policy if exists "Authenticated users can update organisations" on organisations;


-- ── ORG REPS ────���────────────────────────────���───────────────
-- Remove permissive insert — only admin (service_role) can create reps.

drop policy if exists "Authenticated users can insert org reps" on org_reps;


-- ── CLAIM REQUESTS ──────────────────��────────────────────────
-- Remove permissive update — only admin (service_role) can approve/reject.

drop policy if exists "Authenticated users can update claim requests" on claim_requests;


-- ── ORGANISATION NOTIFICATIONS ─────────────────────────��─────
-- Remove permissive insert — admin and system use service_role client.

drop policy if exists "Authenticated users can insert notifications" on organisation_notifications;


-- ── DEMAND QUESTIONS ���────────────────────────────────────────
-- Add delete policy for creators editing their campaigns (replaces questions).

create policy "Authenticated users can delete questions"
  on demand_questions for delete
  using (auth.uid() = author_user_id);
