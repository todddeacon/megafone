// Single source of truth for feature flags.
// Read on both server and client (NEXT_PUBLIC_* prefix exposes to the bundle).
//
// To enable reviews in production: set NEXT_PUBLIC_REVIEWS_ENABLED=true
// in Vercel project env vars (all environments) and redeploy.
// Unset / any other value = reviews are hidden.
export const REVIEWS_ENABLED = process.env.NEXT_PUBLIC_REVIEWS_ENABLED === 'true'
