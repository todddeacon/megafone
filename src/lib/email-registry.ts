/**
 * Email registry — single source of truth for all emails sent by Megafone.
 *
 * UPDATE THIS FILE whenever you add, change, or remove an email.
 * The admin panel at /admin/emails reads from this registry.
 */

export interface EmailDefinition {
  id: string
  name: string
  description: string
  trigger: string
  recipients: string
  sender: 'megafone' | 'supabase'
  source: string // file path where the email is sent
}

export const emailRegistry: EmailDefinition[] = [
  // ── Megafone emails (sent via Resend) ──────────────────────────

  {
    id: 'threshold',
    name: 'Campaign threshold reached',
    description: 'Notifies the organisation that a campaign has reached its supporter target. Includes the campaign headline, supporter count, and all questions.',
    trigger: 'A campaign reaches its notification_threshold number of supporters.',
    recipients: 'Organisation notification emails (configured in admin)',
    sender: 'megafone',
    source: 'src/app/demands/[id]/actions.ts → supportDemand()',
  },
  {
    id: 'response',
    name: 'Official response posted',
    description: 'Notifies all supporters that the organisation has posted an official response to the campaign they support.',
    trigger: 'An organisation representative posts an official response to a campaign.',
    recipients: 'All users who have supported the campaign (batched in groups of 100)',
    sender: 'megafone',
    source: 'src/app/demands/[id]/actions.ts → postOfficialResponse()',
  },
  {
    id: 'followup',
    name: 'Follow-up questions sent',
    description: 'Notifies the organisation that the campaign creator has added follow-up questions after an official response.',
    trigger: 'The campaign creator clicks "Notify organisation" after adding follow-up questions.',
    recipients: 'Organisation notification emails (configured in admin)',
    sender: 'megafone',
    source: 'src/app/demands/[id]/actions.ts → notifyOrgFollowUp()',
  },

  // ── Supabase auth emails (managed by Supabase) ────────────────

  {
    id: 'signup-confirmation',
    name: 'Email verification',
    description: 'Sent when a new user signs up with email and password. Contains a link to verify their email address. Users must verify before they can support campaigns.',
    trigger: 'A user creates a new account via the sign-up form.',
    recipients: 'The new user',
    sender: 'supabase',
    source: 'src/app/auth/login/actions.ts → signUp()',
  },
  {
    id: 'magic-link',
    name: 'Magic link sign-in',
    description: 'Sent when a user chooses to sign in via magic link instead of a password. Contains a one-click link that logs them in automatically. Expires after 24 hours.',
    trigger: 'A user clicks "Sign in with magic link" and submits their email.',
    recipients: 'The user who requested the link',
    sender: 'supabase',
    source: 'src/app/auth/login/actions.ts → signInWithMagicLink()',
  },
  {
    id: 'password-reset',
    name: 'Password reset',
    description: 'Sent when a user requests to reset their password. Contains a link to the reset password page.',
    trigger: 'A user submits the "Forgot password" form.',
    recipients: 'The user who requested the reset',
    sender: 'supabase',
    source: 'src/app/auth/forgot-password/actions.ts',
  },
]
