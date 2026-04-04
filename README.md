# Nibble

A recipe discovery and cooking companion app: swipe through meals, save a recipe box, cook step-by-step with **Gordon the Goose** (AI guide + voice), share posts, and track points and achievements.

## Stack

- **Next.js** (App Router) · **React** · **TypeScript** · **Tailwind CSS**
- **Supabase** — auth, Postgres (saved recipes, creations/posts, likes/comments), storage for post photos
- **Google Gemini** — cooking guide generation and in-flow Q&A (`/api/gordon/prepare`, `/api/gordon/ask`)
- **ElevenLabs** — text-to-speech for Gordon (`/api/gordon/speak`)
- **TheMealDB** (via app API routes) — recipe search, filters, details

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run production server
npm run lint    # ESLint
```

## Environment variables

Create `.env.local` in the project root (never commit real secrets):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `GEMINI_API_KEY` | Google AI Studio key for Gemini |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | *(optional)* Preferred voice ID |

## Database

SQL migrations live in `supabase/migrations/`. Apply them in the Supabase SQL editor (or CLI) in a sensible order, e.g. `001_saved_recipes.sql`, `002_creations.sql`, then `creations2.sql` for social features and any follow-ups (e.g. `is_public` on creations if you use private posts).

Configure a **public** storage bucket for creation photos (e.g. `creation-photos`) and matching RLS policies.

## App routes (high level)

| Path | Description |
|------|-------------|
| `/` | Discover — search, filters, swipe deck, explore categories |
| `/box` | Recipe box — saved recipes, cook-with-Gordon link |
| `/creations` | Posts — your private posts vs community feed |
| `/points` | Points & achievements (requires sign-in) |
| `/cook?id=…` | Full-screen cook mode — steps, timer, voice, ask Gordon |
| `/login`, `/account` | Auth |

## Project layout

- `src/app/` — routes, layouts, API route handlers
- `src/components/` — UI (discovery, companion, creations, nav, etc.)
- `src/lib/` — Supabase client, recipes, achievements, Gordon types
- `public/` — static assets (e.g. logo)

## Deploy

Deploy like any Next.js app (e.g. [Vercel](https://vercel.com)): set the same environment variables in the host dashboard and point Supabase auth redirect URLs at your production domain.
