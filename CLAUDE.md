# Gym Tracker — Project Context

## What is this

A **mobile-first PWA** for tracking gym workouts. Built for personal use. Features offline support, Supabase cloud sync, and a pre-defined exercise library.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Backend / DB | Supabase (Auth + PostgreSQL) |
| Charts | Recharts |
| i18n | next-intl (EN + RU) |
| Offline | IndexedDB + Service Worker (PWA) |
| Language | TypeScript 5 |

## Project Structure

```
src/
  app/                  # Next.js pages (App Router)
    page.tsx            # Root — redirects to HomeClient
    login/              # Auth pages
    auth/callback/      # OAuth callback
    exercise/[id]/      # Exercise detail + progress chart
  components/           # UI components
    HomeClient.tsx      # Main dashboard (search, exercise list, modals)
    ExerciseCard.tsx    # Exercise card
    AddSetModal.tsx     # Log set (weight, reps)
    StopwatchModal.tsx  # Rest timer
    ProgressChart.tsx   # Recharts weight/reps chart
    MuscleMap.tsx       # SVG muscle group map
    OfflineBanner.tsx   # Offline indicator
    PWAProvider.tsx     # SW registration
  lib/
    exercises.ts        # 60+ exercises with muscle mapping
    sets.ts             # CRUD for workout sets
    db.ts               # IndexedDB wrapper
    sync.ts             # Offline sync queue
    supabase/           # client.ts + server.ts
  types/index.ts        # Shared types: Exercise, WorkoutSet, MuscleGroup, etc.
messages/               # i18n: en.json, ru.json
public/
  sw.js                 # Service Worker
  manifest.json         # PWA manifest
```

## Key Domain Concepts

- **Exercise** — predefined entry with icon, category, primary/secondary muscle groups. Not user-editable.
- **WorkoutSet** — one logged set: `exercise_id`, `weight` (kg), `reps`, `created_at`, `user_id`.
- **MuscleGroup** — 16 groups mapped to exercises (chest, back, legs, shoulders, arms, core sub-groups).
- **Sync Queue** — offline writes go to IndexedDB, sync to Supabase when online.

## Database (Supabase)

Table: `sets`
- `id`, `user_id`, `exercise_id`, `weight` (float), `reps` (int), `created_at` (timestamp)
- Indexed by `user_id` and `exercise_id`

Auth: Google OAuth via Supabase SSR.

## Dev Commands

```bash
npm run dev    # local dev server
npm run build  # production build
npm run start  # start production server
npm run knip   # check unused exports, files, dependencies
```

> **After making code changes** always run `npm run knip` to ensure no unused exports or dependencies were introduced.

## Design Notes

- Mobile-only layout (max-width 480px)
- Dark theme: bg `#0A0A0A`, accent `#FF5722`
- UI language auto-detected (EN/RU)
- No linter config present — TypeScript strict mode is the main quality gate
