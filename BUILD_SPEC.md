# Fan Demands — Master Build Specification

## 1. Product Overview

Fan Demands is a public accountability platform where fans create structured demands directed at sports organisations (clubs, leagues, events, owners).

Each demand acts as a **living case file** that evolves over time through:
- a clear headline
- a target organisation
- structured questions
- supporter growth
- official responses
- follow-up questions
- timeline updates
- related creator content
- comments
- visible response / non-response

This product is NOT a petition site.
It is NOT a social feed.

It is:
👉 a structured public accountability system

---

## 2. Core Product Loop

1. Fan creates a demand
2. Other fans support it
3. Demand gains visibility
4. Target is notified
5. Target responds (or doesn't)
6. Creator follows up
7. Timeline becomes public record

---

## 3. Core Principles

- Emotional but structured
- Public accountability
- Living objects (not static posts)
- Simple UX, powerful system
- Shareable
- Credible

---

## 4. User Roles

### Visitor
- Can view everything

### Fan
- Create demand
- Support demand
- Comment (if supporter)

### Creator
- Add follow-up questions
- Add updates
- Mark resolved / not relevant

### Organisation (Verified)
- Post official responses
- Respond multiple times

### Admin
- Moderate content
- Approve organisation claims
- Manage notifications
- Override statuses

---

## 5. Demand Lifecycle

Statuses:
- Building support
- Live
- Target notified
- Responded
- Further questions raised
- Resolved
- No longer relevant

Rules:
- New demand = Building
- Support threshold → Live
- Notification → Target notified
- Official response → Responded
- Follow-up questions → Further questions raised

---

## 6. Core Features

### Demand Creation
- Headline
- Target organisation
- Summary
- Initial questions (multiple)
- Related links

### Support
- Email verification required
- One support per user

### Demand Page (CORE SCREEN)
Must include:

1. Header (headline, target, support count, CTA)
2. Response status bar
3. Summary
4. Questions (initial + follow-up)
5. Official responses
6. Timeline
7. Related content
8. Comments
9. Share module

---

## 7. Demand Page UX (CRITICAL)

### Header
- Large headline
- Target organisation
- Creator
- Support count (prominent)
- Momentum (optional)
- Status badge
- Support button (sticky)

### Response Status Bar
- Show:
  - notified count
  - last notified
  - whether responded

### Questions Section
- Numbered list
- Follow-ups clearly marked

### Official Response
- Verified badge
- Timestamp
- Multiple responses allowed

### Timeline
- Chronological
- Shows:
  - demand created
  - notifications
  - responses
  - follow-ups
  - updates

### Related Content
- External links only
- Show title + source

### Comments
- Read by all
- Only supporters can comment

---

## 8. Organisation Profiles

- Show all demands
- Show responded vs unresolved
- Show claimed status

---

## 9. Organisation Claim Flow

- Submit:
  - name
  - role
  - email
- Admin approval
- Verified badge

---

## 10. Notification System

- Admin triggers notification
- Log:
  - timestamp
  - email
- Display publicly:
  - "Notified X times"

---

## 11. Data Model (Supabase)

### users
id, email, display_name, role, created_at

### organisations
id, name, slug, type, logo_url, is_claimed

### demands
id, organisation_id, creator_user_id, headline, summary, status, support_count_cache

### demand_questions
id, demand_id, author_user_id, body, is_followup

### demand_updates
id, demand_id, author_user_id, type, body

### demand_links
id, demand_id, url, title

### supports
id, demand_id, user_id

### comments
id, demand_id, user_id, body

### notifications
id, demand_id, sent_at

---

## 12. Tech Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (Auth + DB)
- Vercel
- Email (Resend / SendGrid)

---

## 13. Build Instructions

Build in phases:

### Phase 1
- Scaffold Next.js app
- Setup Tailwind
- Setup Supabase

### Phase 2
- Demand creation
- Demand page (basic)

### Phase 3
- Support system
- Comments

### Phase 4
- Questions + follow-ups
- Timeline

### Phase 5
- Organisation responses
- Claim system

### Phase 6
- Notifications + admin tools

---

## 14. Rules

- One support per user
- Only supporters can comment
- Only creator can add follow-ups
- Only verified org can respond
- Timeline is append-only

---

## 15. Success Criteria

- One demand works end-to-end
- Users can support
- Organisation can respond
- Creator can follow up
- Timeline reflects reality
- Page feels like a living case

---

## FINAL INSTRUCTION TO CLAUDE

Do NOT over-engineer.

Focus on:
- clean architecture
- working flows
- simple implementation

Build:
👉 one demand working perfectly
