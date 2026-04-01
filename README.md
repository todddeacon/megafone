# Fan Demands

A public accountability platform where fans create structured demands directed at sports organisations.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Auth + Database)
- [Vercel](https://vercel.com) (Hosting)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/todddeacon/fan-demands.git
cd fan-demands
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and keys from [supabase.com](https://supabase.com).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    demands/            # Demand pages
    organisations/      # Organisation profiles
    admin/              # Admin tools
  components/
    ui/                 # Generic UI components
    demand/             # Demand-specific components
    layout/             # Layout components (nav, footer)
  lib/
    supabase/           # Supabase client (browser + server)
    utils/              # Shared utilities
  types/                # TypeScript types
```

## Build Phases

- [x] Phase 1 — Scaffold, Tailwind, Supabase setup
- [ ] Phase 2 — Demand creation + demand page
- [ ] Phase 3 — Support system + comments
- [ ] Phase 4 — Questions, follow-ups, timeline
- [ ] Phase 5 — Organisation responses + claim system
- [ ] Phase 6 — Notifications + admin tools

## Spec

See [BUILD_SPEC.md](./BUILD_SPEC.md) for the full product specification.
