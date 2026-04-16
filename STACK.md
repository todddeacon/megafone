# Megafone Platform Stack

## Vercel — vercel.com
Hosts and deploys the website. Every time code is pushed to GitHub, Vercel automatically rebuilds and redeploys the site. Also manages environment variables (API keys etc) and the custom domain connection.

## GitHub — github.com/todddeacon/megafone
Stores all the source code. Acts as the bridge between local development and Vercel — pushing code to GitHub triggers a new deployment.

## Supabase — supabase.com (project: fan-demands)
The database and authentication backend. Handles:
- All data storage (campaigns, comments, supporters, organisations, profiles)
- User sign-up and sign-in (email/password and Google OAuth)
- Auth emails (confirmation, password reset) via Resend SMTP

## Resend — resend.com
Email sending service. Sends all emails from notifications@megafone.app. Connected to Supabase for auth emails and used in the app for supporter notification emails when campaigns hit their threshold.

## Google Cloud Console — console.cloud.google.com
Provides Google OAuth so users can sign in with their Google account. The OAuth credentials (Client ID and Secret) are stored in Supabase.

## Squarespace — squarespace.com
Domain registrar for megafone.app. DNS records are managed here — currently pointing to Vercel (A record) and Resend (MX, TXT records for email).

## OpenAI — platform.openai.com
Content moderation API. Every campaign and comment is checked for harmful content before being published. Runs alongside the custom profanity filter built into the app.

## Local Development
The code lives at /Users/todddeacon/Desktop/fan-demands on your Mac. Changes are made here, tested locally at localhost:3000, then pushed to GitHub to deploy.
