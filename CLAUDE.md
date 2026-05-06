# CLAUDE.md — Fin App

Project conventions, commands, and key directories for Claude Code sessions.

---

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build + TypeScript compilation
npm run lint         # ESLint (eslint-config-next)

# TypeScript check (no output = success)
npx tsc --noEmit

# Supabase (local)
npx supabase start          # Start local Supabase stack
npx supabase db push        # Apply pending migrations to local DB
npx supabase db reset       # Reset local DB and re-apply all migrations
npx supabase migration new <name>   # Create a new migration file
npx supabase gen types typescript --local > src/types/supabase.ts  # Regenerate DB types
```

---

## Key Directories

```
src/
├── actions/          # Server Actions ("use server") — all data mutations and fetches
├── app/
│   ├── [locale]/
│   │   ├── (auth)/   # Unauthenticated routes: login, register, forgot-password
│   │   ├── (dashboard)/ # Auth-gated app shell (requireUser in layout)
│   │   └── (public)/    # Public landing page
│   └── api/          # API routes (cron, backfill)
├── components/
│   ├── landing/      # Components used only on the public landing page
│   ├── layout/       # Dashboard shell: Header, Sidebar
│   ├── logo/         # Isotipo (icon only) and Isologo (icon + wordmark)
│   ├── public/       # Components used on the public (unauthenticated) pages
│   ├── rates/        # Rate cards, history chart, share button
│   └── ui/           # shadcn/ui primitives (do not modify directly)
├── hooks/            # Client-side hooks (useRealtimeRates, useNotifications)
├── i18n/             # next-intl config, navigation helpers, request setup
├── lib/
│   ├── auth/server.ts     # requireUser(), getCurrentUser()
│   └── supabase/          # createClient() (server), createClient() (client), createServiceClient()
└── types/            # Shared TypeScript types (if generated from Supabase)

messages/
├── en.json           # English i18n strings
└── es.json           # Spanish i18n strings

supabase/
└── migrations/       # SQL migration files — filename: YYYYMMDDHHMMSS_description.sql
```

---

## Coding Standards

### Server-first by default

Every page and component starts as a Server Component. Add `"use client"` only when the component uses:
- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Browser APIs (`navigator`, `window`, `document`)
- Event handlers that require interactivity
- Third-party libraries that require a browser context (Recharts, Supabase realtime)

### When to use `"use client"`

- Charts (Recharts requires client rendering)
- Forms with React Hook Form
- Dialogs, sheets, dropdowns that need local open/close state
- Realtime subscriptions (`useRealtimeRates`, `useNotifications`)
- Any component using `useRouter`, `usePathname`, `useSearchParams`, `useTranslations`

### Server Actions

- All data fetching and mutations go in `src/actions/*.ts`.
- Mark the file with `"use server"` at the top.
- Never call external APIs directly from a page component — use a Server Action.
- Use `createClient()` for user-scoped queries (respects RLS and the authenticated session).
- Use `createServiceClient()` only for system-level writes (e.g., inserting exchange rates from cron).

### i18n

- All user-visible strings go through `next-intl`.
- In Server Components: `import { getTranslations } from "next-intl/server"; const t = await getTranslations("Namespace");`
- In Client Components: `import { useTranslations } from "next-intl"; const t = useTranslations("Namespace");`
- Navigation links: use `import { Link } from "@/i18n/navigation"` (NOT `next/link` directly) to get automatic locale prefixing.
- Never hardcode Spanish or English strings in JSX — always use a translation key.

### Zod-first validation

- All form inputs are validated with Zod schemas before submission.
- Schema lives in the same file as the form component or in a co-located `schema.ts`.
- Server Actions validate their inputs independently (don't trust client-side validation alone).

### Component conventions

- shadcn/ui primitives are in `src/components/ui/` — do not edit them directly.
- Custom components that wrap primitives go in the appropriate subdirectory (`rates/`, `landing/`, etc.).
- Prefer composition over prop drilling: pass children, not deeply nested props.
- No default exports for components (except pages) — use named exports.

### Auth

- Auth-gated pages: `requireUser()` is called in `(dashboard)/layout.tsx`. All dashboard routes inherit this gate automatically.
- Public pages: use `getCurrentUser()` (returns `null` if not authenticated, never redirects).
- Never call `requireUser()` from a client component — it's a server-only function.

### Supabase RLS

- Every new table must have RLS enabled and appropriate policies.
- `exchange_rates` is readable by `anon` and `authenticated` (public data).
- User-owned data (expenses, budgets, categories) must use `auth.uid() = user_id` in policies.
- System writes (exchange rates from cron) use `createServiceClient()` which bypasses RLS via the service role key.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server only) | Bypasses RLS for system writes |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Full app URL (e.g., `https://fin.app`) |
| `DOLAR_VZLA_KEY` | Optional | `dolarvzla.com` API key for BCV EUR rates |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Gemini API for receipt scanning and financial advisor |

---

## Active Feature Plan

See `docs/plan/` for the full planning artifacts for the current batch of 6 features:

- `01-discovery.md` — Repo map and gap analysis
- `02-feature-specs.md` — User stories, acceptance criteria, effort estimates
- `03-architecture-deltas.md` — Architectural diagrams per change
- `04-data-model.md` — Type changes and DB migration SQL
- `05-i18n-strings.md` — All new translation strings
- `06-component-changes.md` — Component create/modify table
- `07-rates-and-image-generation.md` — EUR sourcing and `html-to-image` integration details
- `08-test-strategy.md` — What to test and how
- `09-rollout-plan.md` — Branch strategy, execution order, rollback plans
- `10-implementation-runbook.md` — Step-by-step prompt for the implementation session
