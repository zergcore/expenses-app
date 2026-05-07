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

## Git Conventions

These rules are non-negotiable for every commit and PR — implementation sessions inherit them automatically.

### Commit messages

- **No Claude co-author trailers.** Never include `Co-Authored-By: Claude <noreply@anthropic.com>` or any similar Claude attribution. Author the commit normally as the developer.
- **Conventional Commits format:** `<type>(<scope>)?: <subject>`
  - `feat:` — user-visible feature
  - `fix:` — user-visible bug fix
  - `refactor:` — internal restructure, no behavior change
  - `perf:` — performance change
  - `style:` — formatting, whitespace, semicolons (no logic change)
  - `chore:` — tooling, dependencies, configuration
  - `docs:` — documentation only
  - `test:` — tests only
- Subject ≤ 72 characters, imperative mood, lowercase, no trailing period.
- Body (when needed) explains *why*, not *what* — the diff explains the what.

### Examples

```
feat(auth): add suspicious-activity email alerts
fix(expenses): donut chart no longer clipped by card overflow
refactor(money): replace float math with dinero.js
chore(deps): add @dinero.js/core for decimal-safe currency math
```

### Branch naming

`<type>/<item-number-or-issue>-<short-kebab-description>`

```
fix/03-duplicate-forgot-password
feat/04-suspicious-activity
refactor/09-money-math-dinero
```

### PRs

- One item per PR, 2–5 commits per item.
- PR title also follows Conventional Commits format.
- PR description: link to the spec doc (`docs/plan/02-feature-specs.md#item-N`), summary, test plan checklist.

---

## Active Feature Plan

See `docs/plan/` for the full planning artifacts.

### Batch 1 — Landing + Rates UX (6 features, completed/in-flight)

- `01-discovery.md` — Repo map and gap analysis (Batch 1 sections at top of file)
- `02-feature-specs.md` — Batch 1 user stories, acceptance criteria, effort
- `03-architecture-deltas.md` — Batch 1 diagrams
- `04-data-model.md` — Batch 1 type changes
- `05-i18n-strings.md` — Batch 1 strings
- `06-component-changes.md` — Batch 1 component table
- `07-rates-and-image-generation.md` — EUR sourcing + `html-to-image`
- `08-test-strategy.md` — Batch 1 tests
- `09-rollout-plan.md` — Batch 1 rollout
- `10-implementation-runbook.md` — Batch 1 runbook

### Batch 2 — Auth + Security + Polish (13 items, in planning)

- `01-discovery.md`, `02-feature-specs.md`, `03-architecture-deltas.md`, `04-data-model.md`, `05-i18n-strings.md`, `06-component-changes.md` — Batch 2 sections appended at the bottom of each file
- `07-email-system.md` — Resend domain, email templates, cooldown UX
- `08-security-owasp.md` — OWASP mapping, headers, RLS audit, threat model
- `09-money-math.md` — `dinero.js` migration plan
- `10-rates-async.md` — Decoupling history chart from page rerender
- `11-expenses-redesign.md` — Layout, hierarchy, empty states
- `12-onboarding-assistant.md` — AI wizard UX + technical plan
- `13-support-system.md` — Public form, Turnstile, DB + email pipeline
- `14-test-strategy.md` — Batch 2 test matrix
- `15-rollout-plan.md` — Batch 2 branching, decision gates, rollback
- `16-implementation-runbook.md` — Batch 2 runbook (created in Phase 4)

---

## Money-Math Rules (post-Batch 2 #9)

- Never apply `+`, `-`, `*`, `/` to amounts or rates as JS `number` directly.
- Read DB amounts/rates through `parseAmount` / `parseRate` in `src/lib/money.ts`.
- Internal arithmetic uses Dinero objects.
- Convert to JS `number` only at the display boundary (`toNumber`, `formatCurrency`).
- DB columns stay `DECIMAL(12, 2)` (amounts) and `DECIMAL(12, 4)` (rates) — do not change without a migration plan.
