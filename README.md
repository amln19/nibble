# Nibble

Recipe discovery and a cooking companion: swipe and save meals, practice in a mini-game **prep** flow, cook with **Gordon** (steps + voice), share **creations**, and hang out with **friends** and **points**.

**Live:** [nibble-gold.vercel.app](https://nibble-gold.vercel.app/)

## Prerequisites

- **Node.js** 20 or later (matches the toolchain used in this repo)
- **npm** (or any compatible client that respects `package.json` scripts)

## Stack

Next.js, React, TypeScript, Tailwind · Supabase (auth + DB) · Vertex AI (Gemini) + ElevenLabs (Gordon) · [TheMealDB](https://www.themealdb.com/) for recipe data

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Also: `npm run lint`, `npm run build`, `npm run start`.

## Environment

Copy `.env.example` → `.env.local` and fill in values.

For **Gordon’s Vertex AI** calls from your machine: enable the **Vertex AI API** on `GOOGLE_CLOUD_PROJECT` and use Application Default Credentials (for example `gcloud auth application-default login` with a user that can use that project). Without a project or credentials, Gordon answers and prep guides fall back to built-in text paths; voice still needs `ELEVENLABS_API_KEY` when you want TTS.

| Needs | Variables |
| ----- | --------- |
| **App + auth** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Gordon (guide + Q&A)** | `GOOGLE_CLOUD_PROJECT` (+ optional `GOOGLE_CLOUD_LOCATION`, `GORDON_GEMINI_*` model overrides in `.env.example`) |
| **Gordon voice** | `ELEVENLABS_API_KEY` (optional `ELEVENLABS_VOICE_ID`) |

Model fallbacks and TTS behavior: see comments in `.env.example` and `src/app/api/gordon/*`.

## Database

SQL is in `supabase/migrations/`. Rough application order: `001_saved_recipes` → `002_creations` → `003_friends` → `creations2` → `004_creations_visibility` → `005_creations_recipe_links` → `006_social_visibility_rls` (adjust if your Supabase already has partial history). Add a public bucket for creation photos (e.g. `creation-photos`) and RLS to match.

## Useful routes

| Path | What |
| ---- | ---- |
| `/` | Discover |
| `/box` | Saved recipes |
| `/prep?id=…` | Practice / simulation |
| `/cook?id=…` | Live cook + Gordon |
| `/creations`, `/friends`, `/points` | Social + gamification |
| `/login`, `/account` | Auth |

## Deploy

Hosted on **Vercel**. Set the same env vars in the project settings, and add your production URL (and preview if needed) to Supabase **Auth → URL configuration** redirects.
