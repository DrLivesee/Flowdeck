# Flowdeck

Flowdeck is a portfolio React SPA for project and task management with Kanban boards, task details, filters, analytics, bilingual UI, and Supabase-backed auth/data.

![Flowdeck logo](src/shared/assets/flowdeck-logo.png)

## Features

- Kanban boards with draggable projects, boards, columns, and tasks
- Task details drawer with assignee, tags, checklist, comments, and activity
- Task filters, task list view, and analytics dashboard
- Supabase Auth, Postgres data, RLS policies, and RPC mutations
- Role-aware UI for `manager`, `worker`, and `guest`
- Russian and English interface
- Dark/light theme and board density settings
- Route-level lazy loading and type-aware linting

## Stack

- React 19, TypeScript 6, Vite 8, React Router
- Zustand for local preferences
- TanStack Query for server state
- Supabase Auth and Postgres
- React Hook Form, Zod
- Tailwind CSS v4
- Vitest, React Testing Library, ESLint

## Setup

Requires Node.js `>=22.13.0`.

```bash
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Run locally:

```bash
npm run dev
```

Default local URL:

```txt
http://127.0.0.1:5173/
```

## Scripts

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npm run preview
```

## Supabase

The repository includes Supabase migrations and the `delete-self` Edge Function.

Required frontend variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never expose a Supabase service role key in the frontend or Netlify public environment.

## Deployment

For Netlify:

```txt
Build command: npm run build
Publish directory: dist
```

Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in Netlify.
