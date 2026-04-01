export type UserRole = 'fan' | 'creator' | 'organisation' | 'admin'

export type DemandStatus =
  | 'building'
  | 'live'
  | 'notified'
  | 'responded'
  | 'further_questions'
  | 'resolved'
  | 'not_relevant'

export interface User {
  id: string
  email: string
  display_name: string
  role: UserRole
  created_at: string
}

export interface Organisation {
  id: string
  name: string
  slug: string
  type: string
  logo_url: string | null
  is_claimed: boolean
}

export interface Demand {
  id: string
  organisation_id: string
  creator_user_id: string
  headline: string
  summary: string
  status: DemandStatus
  support_count_cache: number
  created_at: string
  organisation?: Organisation
  creator?: User
}

export interface DemandQuestion {
  id: string
  demand_id: string
  author_user_id: string
  body: string
  is_followup: boolean
  created_at: string
}

export interface DemandUpdate {
  id: string
  demand_id: string
  author_user_id: string
  type: string
  body: string
  created_at: string
}

export interface DemandLink {
  id: string
  demand_id: string
  url: string
  title: string
}

export interface Support {
  id: string
  demand_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  demand_id: string
  user_id: string
  body: string
  created_at: string
  user?: User
}

export interface Notification {
  id: string
  demand_id: string
  sent_at: string
}
