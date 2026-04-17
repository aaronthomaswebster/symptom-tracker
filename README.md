# Symptom Tracker

A health symptom tracker for logging occurrences of symptoms like fatigue, dizziness, nausea, and more. Built with Vue 3, Vuetify, and Supabase.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Supabase](https://supabase.com/) project

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. In the **SQL Editor**, run the contents of `supabase-schema.sql` to create the tables, RLS policies, triggers, and functions
3. Under **Authentication → Settings**, you may want to disable "Confirm email" for development convenience

### 2. Configure Environment Variables

Copy `.env.example` to `frontend/.env`:

```bash
cp .env.example frontend/.env
```

Fill in your Supabase project URL and anon key (found in **Settings → API**):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

## Production Build

```bash
cd frontend
npm run build
```

The built files in `frontend/dist/` can be deployed to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

## Architecture

```
symptom-tracker/
├── supabase-schema.sql   # Database schema, RLS policies, triggers, functions
├── .env.example          # Environment variable template
└── frontend/             # Vue 3 + Vuetify SPA
    └── src/
        ├── lib/          # Supabase client
        ├── composables/  # Auth composable
        └── components/   # UI components
```

## Database Schema

- **default_symptoms** — Seed data copied to each new user on signup
- **symptoms** — User symptom types (name, emoji, display order, archived state)
- **symptom_logs** — Individual symptom occurrences with severity, activity, and notes

Row Level Security (RLS) ensures each user can only access their own data. Report data is computed via PostgreSQL functions called through Supabase RPC.
