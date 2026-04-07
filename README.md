# Nibble

Nibble is a social cooking companion built on Next.js. You can discover meals, save favorites, run guided cook sessions with Gordon the Goose, post your creations, and compete on points with friends.

## What it does

- Recipe discovery with search, ingredient/category filters, and swipe-style browsing
- Personal recipe box for saved meals
- Guided cook mode with step flow, timers, and Gordon assistant endpoints
- Social layer for posts, friends, requests, and leaderboard
- Points and achievement tracking

## Tech stack

- Next.js (App Router), React 19, TypeScript
- Tailwind CSS 4
- Supabase (Auth + Postgres + storage)
- Google Cloud Vertex AI (Gemini) for Gordon guidance
- ElevenLabs for Gordon voice output
- TheMealDB as the upstream recipe catalog

## Local development

```bash
npm install
npm run dev
```

App runs at http://localhost:3000.

Other scripts:

```bash
npm run lint
npm run build
npm run start
```

## Environment variables

Create `.env.local` in the project root:

| Variable                          | Required         | Notes                                                     |
| --------------------------------- | ---------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Yes              | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes              | Supabase anon/public key                                  |
| `GOOGLE_CLOUD_PROJECT`            | Yes (for Gordon) | Vertex AI project ID                                      |
| `GOOGLE_CLOUD_LOCATION`           | Optional         | Defaults to `us-central1`                                 |
| `GORDON_GEMINI_ASK_MODEL`         | Optional         | Primary model for `/api/gordon/ask`                       |
| `GORDON_GEMINI_ASK_FALLBACKS`     | Optional         | Comma-separated fallback models for `/api/gordon/ask`     |
| `GORDON_GEMINI_PREPARE_MODEL`     | Optional         | Primary model for `/api/gordon/prepare`                   |
| `GORDON_GEMINI_PREPARE_FALLBACKS` | Optional         | Comma-separated fallback models for `/api/gordon/prepare` |
| `GORDON_GEMINI_MODEL`             | Optional         | Global primary model if route-specific vars are unset     |
| `GORDON_GEMINI_FALLBACKS`         | Optional         | Global comma-separated fallback list                      |
| `ELEVENLABS_API_KEY`              | Yes (for voice)  | Used by `/api/gordon/speak`                               |
| `ELEVENLABS_VOICE_ID`             | Optional         | Override default Gordon voice                             |

Default model strategy (if no custom model env vars are set):

- Ask endpoint: `gemini-2.5-flash-lite` -> `gemini-2.5-flash` -> `gemini-2.0-flash-lite`
- Prepare endpoint: `gemini-2.5-flash` -> `gemini-2.5-flash-lite` -> `gemini-2.0-flash`

Notes:

- Gordon tries models in order and stops at first success.
- `/api/gordon/speak` normalizes text before sending to ElevenLabs (for example, `150F` becomes `150 degrees Fahrenheit`) so voice output can stay natural while screen text stays concise.

## Database and Supabase setup

Migrations are in `supabase/migrations/`.

Recommended order:

1. `001_saved_recipes.sql`
2. `002_creations.sql`
3. `003_friends.sql`
4. `creations2.sql`
5. `004_creations_visibility.sql`
6. `005_creations_recipe_links.sql`
7. `006_social_visibility_rls.sql`

The old root-level script `supabase_friends_migration.sql` is superseded by `supabase/migrations/003_friends.sql`.

Also set up a public storage bucket for creation photos (for example, `creation-photos`) and apply matching RLS policies.

## Main routes

| Route                | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `/`                  | Discover recipes                         |
| `/box`               | Saved recipe box                         |
| `/prep`              | Prep mini-games flow                     |
| `/cook?id=...`       | Guided cook session                      |
| `/creations`         | Posts and community feed                 |
| `/friends`           | Friend search, requests, and leaderboard |
| `/points`            | Points and achievements                  |
| `/login`, `/account` | Authentication and profile               |

## API surface (high level)

- `src/app/api/recipes/*`: search, details, categories, ingredients, filters
- `src/app/api/gordon/*`: prepare, ask, speak, simulate
- `src/app/api/friends/*`: requests, posts feed, leaderboard, search, remove

## Project structure

- `src/app/`: pages, layouts, and route handlers
- `src/components/`: UI components grouped by domain
- `src/hooks/`: reusable client hooks
- `src/lib/`: recipes, achievements, security helpers, Supabase clients, Gordon logic
- `public/`: static assets and animations

## Deployment

Deploy to any Next.js-compatible host (Vercel is the simplest path). Mirror `.env.local` values in your host environment and update Supabase auth redirect URLs for your production domain.
