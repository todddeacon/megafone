/**
 * Email registry — single source of truth for all emails sent by Megafone.
 *
 * UPDATE THIS FILE whenever you add, change, or remove an email.
 * The admin panel at /admin/emails reads from this registry.
 */

export type EmailAudience = 'supporters' | 'creators' | 'organisations' | 'auth'

export interface EmailDefinition {
  id: string
  name: string
  description: string
  trigger: string
  recipients: string
  sender: 'megafone' | 'supabase'
  audience: EmailAudience
  source: string
}

export const emailRegistry: EmailDefinition[] = [
  // ── Supporter emails ──────────────────────────────────────────

  {
    id: 'welcome-supporter',
    name: 'Welcome supporter',
    description: 'Thanks the user for supporting, shows current supporter count, and encourages them to share the campaign with friends.',
    trigger: 'A user supports a campaign.',
    recipients: 'The user who just supported',
    sender: 'megafone',
    audience: 'supporters',
    source: 'src/app/demands/[id]/actions.ts → supportDemand()',
  },
  {
    id: 'campaign-sent',
    name: 'Campaign sent to organisation',
    description: 'Notifies all supporters that the campaign has reached its target and been sent to the organisation.',
    trigger: 'A campaign crosses its notification threshold and the organisation is notified.',
    recipients: 'All supporters of the campaign (batched in groups of 100)',
    sender: 'megafone',
    audience: 'supporters',
    source: 'src/app/demands/[id]/actions.ts → supportDemand() (threshold crossed)',
  },
  {
    id: 'response',
    name: 'Official response posted',
    description: 'Notifies all supporters that the organisation has posted an official response to the campaign they support.',
    trigger: 'An organisation representative posts an official response to a campaign.',
    recipients: 'All users who have supported the campaign (batched in groups of 100)',
    sender: 'megafone',
    audience: 'supporters',
    source: 'src/app/demands/[id]/actions.ts → postOfficialResponse()',
  },
  {
    id: 'campaign-resolved',
    name: 'Campaign resolved',
    description: 'Notifies all supporters of the outcome when the creator marks a campaign as resolved or unsatisfactory.',
    trigger: 'The campaign creator marks the outcome as resolved or unsatisfactory.',
    recipients: 'All supporters of the campaign (batched in groups of 100)',
    sender: 'megafone',
    audience: 'supporters',
    source: 'src/app/demands/[id]/actions.ts → setResolutionStatus()',
  },
  {
    id: 'creator-update',
    name: 'Creator posted an update',
    description: 'Notifies all supporters when the campaign creator posts a text update or adds new video/link content.',
    trigger: 'The campaign creator posts an update or adds linked content.',
    recipients: 'All supporters of the campaign (batched in groups of 100)',
    sender: 'megafone',
    audience: 'supporters',
    source: 'src/app/demands/[id]/actions.ts → addCreatorUpdate() / addDemandLink()',
  },

  // ── Creator emails ────────────────────────────────────────────

  {
    id: 'creator-first-supporter',
    name: 'First supporter',
    description: 'Notifies the campaign creator that their campaign has received its first supporter. Encourages sharing.',
    trigger: 'The first person supports a campaign.',
    recipients: 'The campaign creator',
    sender: 'megafone',
    audience: 'creators',
    source: 'src/app/demands/[id]/actions.ts → supportDemand()',
  },
  {
    id: 'creator-milestone',
    name: 'Milestone reached (25/50/75%)',
    description: 'Notifies the creator when their campaign hits 25%, 50%, or 75% of the supporter target. Shows progress and encourages continued sharing.',
    trigger: 'Campaign support count crosses 25%, 50%, or 75% of the notification threshold.',
    recipients: 'The campaign creator',
    sender: 'megafone',
    audience: 'creators',
    source: 'src/app/demands/[id]/actions.ts → supportDemand()',
  },
  {
    id: 'creator-target-reached',
    name: 'Target reached — org notified',
    description: 'Notifies the creator that their campaign reached its target and has been sent to the organisation.',
    trigger: 'Campaign crosses the notification threshold and the organisation is notified.',
    recipients: 'The campaign creator',
    sender: 'megafone',
    audience: 'creators',
    source: 'src/app/demands/[id]/actions.ts → supportDemand() (threshold crossed)',
  },
  {
    id: 'creator-response-received',
    name: 'Response received',
    description: 'Notifies the creator that the organisation has posted an official response. Prompts them to review and mark the outcome.',
    trigger: 'An organisation representative posts an official response.',
    recipients: 'The campaign creator',
    sender: 'megafone',
    audience: 'creators',
    source: 'src/app/demands/[id]/actions.ts → postOfficialResponse()',
  },
  {
    id: 'creator-weekly-digest',
    name: 'Weekly digest',
    description: 'Weekly summary showing total supporters, new supporters this week, comments this week, and campaign status. Only sent if there was activity.',
    trigger: 'Vercel Cron job runs every Monday at 9am UTC.',
    recipients: 'Creators of active campaigns with activity in the past week',
    sender: 'megafone',
    audience: 'creators',
    source: 'src/app/api/cron/creator-digest/route.ts',
  },

  // ── Organisation emails ───────────────────────────────────────

  {
    id: 'threshold',
    name: 'Campaign threshold reached',
    description: 'Notifies the organisation that a campaign has reached its supporter target. Includes the campaign headline, supporter count, and all questions.',
    trigger: 'A campaign reaches its notification_threshold number of supporters.',
    recipients: 'Organisation notification emails (configured in admin)',
    sender: 'megafone',
    audience: 'organisations',
    source: 'src/app/demands/[id]/actions.ts → supportDemand()',
  },
  {
    id: 'followup',
    name: 'Follow-up questions sent',
    description: 'Notifies the organisation that the campaign creator has added follow-up questions after an official response.',
    trigger: 'The campaign creator clicks "Notify organisation" after adding follow-up questions.',
    recipients: 'Organisation notification emails (configured in admin)',
    sender: 'megafone',
    audience: 'organisations',
    source: 'src/app/demands/[id]/actions.ts → notifyOrgFollowUp()',
  },

  // ── Auth emails (managed by Supabase) ─────────────────────────

  {
    id: 'signup-confirmation',
    name: 'Email verification',
    description: 'Sent when a new user signs up with email and password. Contains a link to verify their email address. Users must verify before they can support campaigns.',
    trigger: 'A user creates a new account via the sign-up form.',
    recipients: 'The new user',
    sender: 'supabase',
    audience: 'auth',
    source: 'src/app/auth/login/actions.ts → signUp()',
  },
  {
    id: 'magic-link',
    name: 'Magic link sign-in',
    description: 'Sent when a user chooses to sign in via magic link instead of a password. Contains a one-click link that logs them in automatically. Expires after 24 hours.',
    trigger: 'A user clicks "Sign in with magic link" and submits their email.',
    recipients: 'The user who requested the link',
    sender: 'supabase',
    audience: 'auth',
    source: 'src/app/auth/login/actions.ts → signInWithMagicLink()',
  },
  {
    id: 'password-reset',
    name: 'Password reset',
    description: 'Sent when a user requests to reset their password. Contains a link to the reset password page.',
    trigger: 'A user submits the "Forgot password" form.',
    recipients: 'The user who requested the reset',
    sender: 'supabase',
    audience: 'auth',
    source: 'src/app/auth/forgot-password/actions.ts',
  },
]
