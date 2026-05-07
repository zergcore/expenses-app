# Phase 1 — Discovery Report

## 1. Repo Map

### Routing Structure

```
src/app/
├── page.tsx                          → Redirects to /[defaultLocale] (en)
├── layout.tsx                        → Bare root layout (no providers)
├── auth/
│   ├── callback/route.ts             → Supabase OAuth callback
│   └── auth-code-error/page.tsx
└── [locale]/
    ├── layout.tsx                    → Locale provider + ThemeProvider + Toaster
    ├── (auth)/                       → Unauthenticated routes (no sidebar)
    │   ├── layout.tsx
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── forgot-password/page.tsx
    │   └── update-password/page.tsx
    ├── (public)/                     → Public landing page
    │   ├── layout.tsx                → Passthrough, no shell
    │   └── page.tsx                  → Landing page (Server Component)
    └── (dashboard)/                  → Authenticated app shell
        ├── layout.tsx                → requireUser() + Sidebar + Header
        ├── dashboard/page.tsx
        ├── expenses/page.tsx
        ├── budgets/page.tsx
        ├── categories/page.tsx
        ├── rates/page.tsx
        ├── settings/page.tsx
        ├── profile/page.tsx
        └── notifications/page.tsx
```

**Locale config:** `src/i18n/config.ts` — `locales = ["en", "es"]`, `defaultLocale = "en"`.

**Middleware:** Detects locale from Vercel geo-IP or `NEXT_LOCALE` cookie, redirects to `/[locale]/...`. Runs `updateSession` (Supabase session refresh) on every request.

---

### Logo Locations & Current Links

| Location | Component | Current `href` | Wraps link? |
|---|---|---|---|
| Public landing header (desktop) | `src/components/public/header.tsx:20` | `"/"` (non-localized) | Yes — `<Link href="/">` |
| Dashboard sidebar (desktop) | `src/components/layout/sidebar.tsx:44` | None — bare `<span>`, no link | No |
| Dashboard header (mobile) | `src/components/layout/header.tsx:58` | None — bare `<span>`, no link | No |
| Public header (mobile sheet) | `src/components/public/header.tsx:58` | No link on logo in sheet | No |

**Key finding:** The public header logo links to `"/"` (without locale prefix), which triggers a middleware redirect — it works but the redirect cycle is unnecessary. The dashboard logo has no link at all. The sidebar logo is not clickable.

---

### Conversion UI — Currency Calculator

**File:** `src/components/landing/currency-calculator.tsx`

**Current architecture:**
- One **editable** `<Input>` field (`amount` state) — the "from" field.
- One **read-only** `<Input>` showing the computed result (`getFormattedResult()`).
- A `direction` state (`"toBs" | "fromBs"`) toggled by a swap `<Button>` (ArrowUpDown icon).
- When direction is `"toBs"`: from-field = selected currency, to-field = Bs.
- When direction is `"fromBs"`: from-field = Bs, to-field = selected currency.
- Only the from-field is editable; the to-field is always `readOnly`.
- EUR is already in the currency selector (`CurrencyPair = "USD" | "USDT" | "EUR"`).

**What the user wants:** Be able to type into *either* field and have the other update live (bidirectional inline editing — no swap button needed).

---

### EUR Token — Current State

EUR is already partially implemented:

| Layer | Status |
|---|---|
| DB pair `EUR_VES` / source `BCV` | ✅ Exists in `exchange_rates` table |
| `getExchangeRates()` action | ✅ Returns `EUR / VED` rate card |
| `getMonthlyRateHistory()` action | ❌ Only fetches `USD_VES` and `USDT_VES` — EUR excluded |
| `RatesHistoryChart` | ❌ Only plots `usd` and `usdt` lines — no EUR line |
| `RateHistoryPoint` type | ❌ Only has `usd: number | null` and `usdt: number | null` |
| `CurrencyCalculator` | ✅ EUR is in the selector, `eurToBs` prop passed correctly |
| `RateCardsSection` (landing) | ✅ Filters for `EUR / VED` — shown on landing page |
| `useRealtimeRates` hook | ✅ Maps `EUR_VES` → `EUR / VED` for realtime updates |
| `getCurrentRatesSnapshot()` | ✅ Fetches `EUR_VES` and exposes `eur_ves`, `eur_usdt` |
| `expenses` schema | ✅ `equivalents.eur` field exists (JSONB) |
| Rate source | `dolarvzla.com` API (primary, has EUR); `dolarapi.com` fallback (USD only, no EUR) |

**The EUR token issue:** The calculator correctly shows EUR→Bs conversions. The bug is that the history chart never shows the EUR rate trend — users can't see how EUR/VES has evolved over time.

---

### History View — Current Granularity

**File:** `src/app/[locale]/(dashboard)/rates/page.tsx`

- Server Action: `getMonthlyRateHistory(year?, month?)` — returns one data point per calendar day for the selected month.
- Chart reads `?month=YYYY-MM` from URL search params.
- `RatesHistoryChart` (client component) renders a month selector (last 12 months) and a Recharts `LineChart`.
- Granularity is fixed at **daily-within-month** — user picks which month, sees all days in it.
- **What's missing:** A way to select a specific *day* and see intraday rate changes (multiple fetches per day). Currently, `getMonthlyRateHistory` takes the last recorded rate per calendar day — not all records within a day.

---

### Auth Flow

- `requireUser()` in `src/lib/auth/server.ts` — throws/redirects if no session.
- `(dashboard)/layout.tsx` calls `requireUser()` — all dashboard routes are auth-gated at layout level.
- Register page: `src/app/[locale]/(auth)/register/page.tsx` — uses `@supabase/auth-ui-react` `<Auth view="sign_up">`. On `SIGNED_IN` event, redirects to `/dashboard`.
- Signup URL: `/[locale]/register`.
- No existing public history page — the history chart only lives inside the authenticated `/rates` page.

---

### Supabase Schema (relevant tables)

```sql
-- exchange_rates (public, shared)
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,   -- 'BCV', 'Binance', 'CoinGecko'
    pair  TEXT NOT NULL,    -- 'USD_VES', 'USDT_VES', 'EUR_VES', 'BTC_USD', 'BTC_USDT'
    rate  DECIMAL(12,4) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: anyone (anon + authenticated) can SELECT. INSERT via service role only.
-- Realtime publication: enabled on exchange_rates.
```

No index on `(pair, fetched_at)` — queries over large date ranges will do sequential scans. A composite index would be needed if daily granularity queries become frequent.

---

## 2. Per-Change Gap Analysis

### Change 1 — Logo → Home

| Already exists | Missing |
|---|---|
| Logo components (`Isotipo`, `Isologo`) | Link on sidebar logo |
| Public header has a link (`href="/"`) | Localized `href` (should be `useRouter` or `Link href="/"` via next-intl navigation) |
| `src/i18n/navigation.ts` (next-intl Link wrapper) | Link on dashboard mobile header logo |
| | Possibly: scroll-to-top behavior if already on home |

---

### Change 2 — Inline Amount Editing (bidirectional)

| Already exists | Missing |
|---|---|
| `CurrencyCalculator` component with one editable field | Second field made editable |
| `direction` state + `amount` state | Two independent amount states (`amountFrom`, `amountTo`) or a "last edited" flag |
| `getRateForCurrency()` helper | Two-way sync logic: editing field A recomputes B, and vice versa |
| EUR already in calculator | Swap button removal (or keep but redesign) |
| Copy button | Guard against infinite re-render loops in sync logic |

---

### Change 3 — Euro Token in History

| Already exists | Missing |
|---|---|
| `EUR_VES` stored in DB | `eur` field in `RateHistoryPoint` type |
| EUR rate fetched via `dolarvzla.com` API | EUR included in `getMonthlyRateHistory()` DB query |
| EUR realtime mapping in `useRealtimeRates` | EUR `Line` in `RatesHistoryChart` |
| EUR card on landing + in calculator | i18n label `Rates.eur_bcv` or similar |

---

### Change 4 — Historic CTA + Signup

| Already exists | Missing |
|---|---|
| `CTASection` component (register CTA) | A "View Rate History" CTA button on the landing page |
| `/rates` page (auth-gated) | A public-facing rate history preview *or* a redirect-to-signup gate |
| `/register` page | The decision: gated teaser vs. pure redirect |
| `Header` already shows auth state | Logic that appends `?redirect=/rates` to the register URL so post-signup lands on `/rates` |

---

### Change 5 — Daily Granularity in History

| Already exists | Missing |
|---|---|
| `getMonthlyRateHistory()` returns per-day data for a month | A new action `getDailyRateHistory(date)` returning per-record data for a single day |
| URL-based month selector | Day picker (calendar or date input) in `RatesHistoryChart` |
| `RatesHistoryChart` uses URL search params | Granularity toggle UI (`month` ↔ `day` mode) |
| Recharts `LineChart` | Time-formatted X-axis for intraday view (HH:mm instead of "Jan 15") |
| | Composite DB index on `(pair, fetched_at)` for efficient day-range queries |

---

### Change 6 — Shareable Rates Image

| Already exists | Missing |
|---|---|
| `public/isologo.svg` and `public/isotipo.svg` (branding assets) | Image generation mechanism (client or server) |
| `public/og-image.png`, `public/og-logo.png` | Share button component |
| All rate data available in `RateCardsSection` | Canvas or Satori template for the image |
| Recharts charts (for potential embedding) | Share sheet / download logic |
| `browser-image-compression` (for compression) | `html-to-image` or `satori` package (not yet installed) |
| EUR rate already available | i18n strings for the button |

---

## 3. Dependencies & Risks Between Changes

### Blocking relationships

```
Change 3 (EUR in history) ──blocks──► Change 6 (shareable image)
    [image should show EUR rate correctly before publishing it]

Change 4 (historic CTA) ──soft-deps──► Change 5 (daily granularity)
    [ideally the CTA points to a full-featured history page]

Change 2 (inline editing) ──independent
Change 1 (logo link) ──independent
```

### Risk register

| Risk | Change | Severity | Notes |
|---|---|---|---|
| `dolarvzla.com` API returns `eur: 0` on fallback | 3 | Medium | `dolarapi.com` fallback has no EUR endpoint — EUR_VES would be 0 and silently skipped |
| Infinite re-render loop in bidirectional field sync | 2 | Medium | Classic React state loop if both fields update each other simultaneously |
| Redirect loop with localized logo href | 1 | Low | `href="/"` → middleware redirects → `href="/[locale]"` — works but adds one redirect |
| Intraday data volume | 5 | Low | Exchange rates currently update every 5 min (Binance) to 1h (BCV) — not many data points per day |
| `html-to-image` bundle size | 6 | Medium | ~100KB gzip; must be lazy-loaded. Alternative: server-side `next/og` with `satori`. |
| Auth redirect after signup loses deep link | 4 | Low | Register page hard-codes `/dashboard` redirect; need to thread `?redirect=/rates` |

---

## 4. Clarifying Questions

### Change 1 — Logo → Home

**Q1.1** — "Home" for authenticated users: should the logo in the dashboard (sidebar + mobile header) link to `/dashboard`, or to the public landing page (`/[locale]`)?

**Q1.2** — Should clicking the logo scroll to the top of the page if the user is already on the landing page, or just navigate (which Next.js does by default if the route is the same)?

**Q1.3** — The public header currently links to `"/"` (non-localized). Should it link to `/[locale]` explicitly (requires using next-intl's `Link` or `useRouter`), or is the middleware redirect acceptable?

---

### Change 2 — Inline Amount Editing

**Q2.1** — Should both fields be editable at the same time (live bidirectional: typing in Bs updates the USD field, and vice versa), or only the *last-focused* field drives the other (one active input at a time)?

**Q2.2** — Should the swap button be removed entirely, or should it remain as a convenience shortcut to flip the "base" currency (even with both fields editable)?

**Q2.3** — Should the result field still show a formatted display (e.g., locale-formatted "Bs. 51,234.00") while the user is editing the other, or should it switch to a raw number for easier editing when focused?

---

### Change 3 — Euro Token in History

**Q3.1** — EUR is already fetched and stored. The gap is only in the history chart. Should EUR appear as a **third line** in the existing `RatesHistoryChart` alongside USD and USDT, or as a separate chart/toggle?

**Q3.2** — The `dolarvzla.com` API provides EUR. On days when that API is unavailable and the fallback (`dolarapi.com`) is used, there will be `null` EUR values in the chart. Is that acceptable (show gaps), or should we back-fill from the last known EUR rate?

**Q3.3** — The chart card title currently says "Monthly Rate Trend." With EUR added, should it be renamed (e.g., "BCV Rate Trend") or stay as-is?

---

### Change 4 — Historic CTA + Signup

**Q4.1** — Does "historic" mean the **public landing page should get a CTA** pointing to the in-app `/rates` history (which requires login), or should there be a **public preview** of the history chart that anyone can see, with a CTA to sign up for full access?

**Q4.2** — If it's a gated redirect: should unauthenticated users who click "View Rate History" land directly on the `/register` page, or on the `/login` page (in case they already have an account)?

**Q4.3** — Should the post-signup redirect drop the user on the `/rates` page, or on `/dashboard`? (Currently register always goes to `/dashboard`.)

**Q4.4** — Should the "View History" CTA appear **inside** the existing `CTASection` component alongside the "Create Free Account" button, or as a **separate section** (e.g., directly below the rate cards)?

---

### Change 5 — Daily Granularity in History

**Q5.1** — Is the daily view a **toggle** between "Monthly view" and "Daily view" within the same chart card, or is it an additional control that lets users pick a specific date and see intraday data?

**Q5.2** — For daily view: what is the default date (today? last day with data)? And what is the date range shown (just the selected day, or a rolling last-7-days)?

**Q5.3** — Exchange rates are currently logged every 5 min (Binance) to 1h (BCV). For daily view, the X-axis would show time of day (HH:mm). Is that the intended UX, or did you mean something different by "day" — e.g., being able to navigate to a specific calendar day in the monthly chart (the monthly chart already does this — it shows all days of the selected month)?

> **[ASSUMPTION]** I'm assuming "daily granularity" means: currently the user picks a *month* and sees one point per day; the new feature would let them pick a *day* and see multiple points within that day (intraday). If it simply means "navigate to a specific day within the month view," this is already partially done (the month chart shows individual days).

---

### Change 6 — Shareable Rates Image

**Q6.1** — What **aspect ratio** should the generated image use? This depends on the target channel:
  - Square (1:1) → Instagram, WhatsApp
  - Portrait (9:16) → Instagram Stories, WhatsApp Status
  - Landscape (16:9 or 1200×630) → Twitter/X, general sharing
  - Or do you want multiple formats?

**Q6.2** — Should the image be **generated client-side** (download button → canvas → PNG file, no server round-trip, works offline) or **server-side** (API route using `@vercel/og` / `satori`, better font rendering, but requires a network call)?

**Q6.3** — What should the image contain?
  - Fin logo + website URL?
  - All rates (USDT, USD, EUR, BTC)? Or just VES-related (USDT, USD, EUR)?
  - Today's date and/or time?
  - Trend arrows?

**Q6.4** — Should this button appear on the **public landing page** (anyone can share), on the **authenticated `/rates` page** (logged-in users only), or **both**?

**Q6.5** — Should clicking the button (a) download the image directly, (b) open a native share sheet (`navigator.share()`), or (c) both (share if available, download as fallback)?

---

---

# Phase 1 — Discovery Report (Batch 2: 13-Item Fix Batch)

> Ground truth from reading the actual repo on 2026-05-06.
> This section is additive — all prior findings above remain valid.

---

## Triage Table

| # | Title | Severity | Size | Affected Files |
|---|---|---|---|---|
| 1 | Email branding | High | M | `src/lib/alert-email.ts`, `supabase/config.toml`, new template files |
| 2 | Password-reset rate limiting | High | S | `src/actions/auth.ts`, `supabase/config.toml` |
| 3 | Duplicate "forgot password" link | Low | XS | `src/app/[locale]/(auth)/login/page.tsx` |
| 4 | Suspicious-activity emails | High | L | New: auth hook/trigger, `src/lib/suspicious-activity.ts`, new action |
| 5 | OWASP compliance | Critical | L | `next.config.ts`, `src/middleware.ts`, `supabase/config.toml`, `.env.example`, migrations |
| 6 | Avatar not rendering in header | Medium | XS | `src/components/layout/header.tsx` |
| 7 | Budget circle clipped | Medium | XS | `src/components/expenses/kpi-header.tsx` |
| 8 | Expenses view "AI-generated" | Medium | M | `src/components/expenses/*`, `src/app/[locale]/(dashboard)/expenses/page.tsx` |
| 9 | Money-conversion library | High | M | `src/lib/currency-calculator.ts`, `src/actions/rates.ts`, `src/actions/expenses.ts` |
| 10 | Monthly rates URL-driven | Low | S | `src/app/[locale]/(dashboard)/rates/page.tsx`, `src/actions/rates.ts` |
| 11 | Onboarding AI assistant | Medium | XL | `src/components/dashboard/onboarding-card.tsx`, new route/modal, new actions |
| 12 | Contact/support section | Medium | L | New: `src/app/[locale]/(public)/support/*`, new action, new DB migration |
| 13 | Git: no Claude co-author trailers | Low | XS | `CLAUDE.md` |

---

## Per-Item Findings

### #1 — Email Branding

**What exists today:**
- `resend` v6.12.3 is installed and already in use (`package.json`).
- One email is sent from app code: `src/lib/alert-email.ts` — a developer alert when the `dolarvzla.com` API fails. Sender is `"Fin App <onboarding@resend.dev>"` (Resend's sandbox domain, not a verified custom domain). HTML is minimal, unbranded.
- All auth emails (signup confirmation, password reset, email change) flow through Supabase's built-in email system. Custom SMTP is commented out in `supabase/config.toml`.
- No `supabase/templates/` directory exists. Custom template blocks in `config.toml` are also commented out.
- The auth emails use stock Supabase branding (Supabase logo, generic copy). Zero Fin brand.
- `RESEND_API_KEY` and `DEVELOPER_EMAIL` are absent from `.env.example` — documentation gap.

**What's broken / missing:**
- No custom auth email templates. No visual consistency between the app and transactional emails.
- Alert email uses Resend sandbox address — will fail deliverability in production without a verified sending domain.

---

### #2 — Password-Reset Rate Limiting

**What exists today:**
- `supabase/config.toml` under `[auth.email]`: `max_frequency = "1s"` — effectively no cooldown (1 second between resets).
- Global Supabase limit: `email_sent = 2` per hour. This is a coarse outer bound, not a per-action cooldown.
- `src/actions/auth.ts::resetPassword` — Server Action calling `supabase.auth.resetPasswordForEmail`. No debounce, no cooldown, no user-facing feedback during a cooldown.
- The forgot-password page (`src/app/[locale]/(auth)/forgot-password/page.tsx`) delegates entirely to `@supabase/auth-ui-react`'s `Auth` component with `view="forgotten_password"`. Cooldown UX is black-boxed inside the library.
- No IP-level middleware rate limiting on any route.

**What's broken / missing:**
- A determined user can spam the reset endpoint (bounded only by the 2/hour limit, which can be bypassed with IP rotation).
- No user-facing countdown/cooldown message.
- `max_frequency` must be raised (recommend `"60s"` minimum, ideally `"300s"`).

---

### #3 — Duplicate "Forgot Password" Link

**What exists today:**
- `src/app/[locale]/(auth)/login/page.tsx` renders `<Auth>` from `@supabase/auth-ui-react`. The component, with no `showLinks={false}` prop, renders its own internal "Forgot your password?" link.
- Below the `Auth` component (lines 77–84) there is also a hand-written `<Link href="/forgot-password">` — a second, custom-styled forgot-password link.
- Result: **two** forgot-password links are visible on the login screen.
- Note: `forgot-password/page.tsx` correctly passes `showLinks={false}` — the omission was only on the login page.

**Fix:** Pass `showLinks={false}` to `<Auth>` on the login page to suppress the library-internal link, keeping the custom-styled one.

---

### #4 — Suspicious-Activity Emails

**What exists today:**
- Zero sign-in event tracking anywhere in the codebase.
- Authentication uses `@supabase/auth-ui-react` client-side — there is no Server Action wrapping `signInWithPassword`, so there is no server-side hook point today.
- `supabase/config.toml`: All `[auth.hook.*]` blocks are commented out.
- `src/lib/alert-email.ts` shows Resend works; it is the only email-sending code in the project.
- Supabase's `auth.audit_log_entries` table exists in Cloud but is not accessible via public-schema RLS queries on the free tier.

**What's missing:**
- This feature does not exist at all. Building it requires: (a) a hook point for sign-in events, (b) signal definition for "suspicious", (c) an email template via Resend, (d) a user-recovery flow.
- The hook point decision (Supabase Auth Hook vs. custom Server Action wrapping sign-in vs. client-side `onAuthStateChange`) is the key architectural question — answered in the clarifying questions.

---

### #5 — OWASP Compliance

**Current security posture:**

| Area | Current State |
|---|---|
| HTTP Security Headers | **None.** `next.config.ts` is `const nextConfig: NextConfig = {}`. No CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. |
| Middleware headers | Not set. Middleware handles i18n + session refresh only. |
| CSRF | Server Actions rely on Next.js built-in same-origin protection. No additional hardening. Cron route protected by `CRON_SECRET` bearer token. |
| Auth rate limiting | Supabase: `email_sent = 2/hour`, `sign_in_sign_ups = 30/5min`. No middleware-level limiting. |
| Password strength | `minimum_password_length = 6` (weak). `password_requirements = ""` (no complexity). `secure_password_change = false` (no re-auth required to change password). |
| CAPTCHA | Commented out in `supabase/config.toml`. |
| Env var hygiene | `RESEND_API_KEY`, `CRON_SECRET`, `DEVELOPER_EMAIL` absent from `.env.example`. |
| `NEXT_PUBLIC_` audit | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL` — all appropriate for public. |
| `next/image` domain allowlist | Empty — avatar images from Supabase storage would fail `next/image` (not in `remotePatterns`). Currently `<img>` is used directly in profile, which bypasses this but loses optimization. |
| Auth redirect allowlist | `supabase/config.toml`: `additional_redirect_urls = ["https://127.0.0.1:3000"]` only. Production callback URL not listed — this must be added in Supabase Cloud dashboard separately, but the local config is also under-documented. |
| Cookie flags | `NEXT_LOCALE` cookie set in middleware without `secure`, `httpOnly`, or `sameSite` flags. |

**RLS Coverage Audit:**

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `users` | ✅ own | ⚠️ none (SECURITY DEFINER trigger) | ✅ own | ❌ none | Trigger handles insert correctly |
| `categories` | ✅ own | ✅ own | ✅ own | ✅ own | Complete |
| `budgets` | ✅ own | ✅ ALL | ✅ ALL | ✅ ALL | Complete |
| `expenses` | ✅ own | ✅ ALL | ✅ ALL | ✅ ALL | Complete |
| `notifications` | ✅ own | ❌ none | ✅ own | ❌ none | Missing INSERT (service role?) |
| `notification_preferences` | ✅ own | ✅ own | ✅ own | ❌ none | Missing DELETE |
| `exchange_rates` | ✅ anon+auth | ❌ none (service role) | ❌ none | ❌ none | INSERT via service role is correct |
| `trading_insights` | ✅ authenticated | ❌ none | ❌ none | ❌ none | Read-only public-ish data |
| `financial_insights` | ✅ own | ✅ own | ✅ own | ❌ none | Missing DELETE; upsert pattern used |
| `avatars` (storage) | ✅ public | ✅ authenticated | ✅ owner | ❌ none | Missing DELETE policy on storage objects |

**Most critical gaps:** absence of all security headers, weak password policy, missing `secure_password_change`, missing env vars in `.env.example`.

---

### #6 — Avatar Not Rendering in Header

**What exists today:**
- `src/components/layout/header.tsx` (lines 75–80): Only `<AvatarFallback>` is used inside `<Avatar>`. `AvatarImage` is **not imported, not rendered**.
  ```tsx
  <Avatar className="h-9 w-9">
    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
      {initials}
    </AvatarFallback>
  </Avatar>
  ```
- `user.user_metadata.avatar_url` is set correctly when a user uploads a photo (via `src/actions/profile.ts` → `supabase.auth.updateUser`).
- The `avatars` Supabase Storage bucket is public — URLs are accessible without auth.
- `src/components/profile/profile-form.tsx` correctly uses both `<AvatarImage>` and `<AvatarFallback>` — the profile page works fine.
- The `Header` component receives a `user: User` prop with full `user_metadata`.

**What's broken:** The header always shows email initials. Fix is one line: add `<AvatarImage src={user.user_metadata?.avatar_url ?? ""} />` inside the `Avatar` in `header.tsx`.

---

### #7 — Budget Circle Clipped

**What exists today:**
- `src/components/expenses/kpi-header.tsx`: The budget summary card has `className="relative overflow-hidden ..."` on the `Card`. Inside, the Recharts donut is in a `relative w-16 h-16 flex-shrink-0` container with `<ResponsiveContainer width="100%" height="100%">`.
- Recharts renders an `<svg>` that can bleed slightly outside its bounding box (strokeWidth, antialiasing). The `overflow-hidden` on the Card clips this bleed, creating the "cut-out-by-square" visual artifact.
- `src/components/expenses/expense-chart/chart-card.tsx` (inside `ExpensesSidebar`): `<Pie strokeWidth={4}>` adds 4px outside `outerRadius={70}` — this also bleeds. Parent Card has `overflow-hidden` too.
- **Note:** `ExpensesSidebar` (containing `ChartCard`) is not currently rendered in `expenses/page.tsx` — it exists as a component but is unused. The visible clipping is in `kpi-header.tsx`.

**Fix:** Remove `overflow-hidden` from the specific card containing the donut, or add `overflow-visible` to the SVG container. The gradient decoration can be achieved without `overflow-hidden` (use `rounded-lg` + `clip-path` or position the accent differently).

---

### #8 — Expenses View "Looks AI-Generated"

**What exists today:**

The expenses page renders:
1. Title + `ExpenseActions` (add expense, scan receipt)
2. `MonthSelector` + `ExportExpensesButton`
3. `KPIHeader` (4 uniform cards — only when `totalBudget > 0`)
4. `ExpensesClient` → `DataTable` (TanStack Table)

**AI-generated tells identified:**

- **Uniform KPI cards:** All 4 cards are the exact same size, same padding, same structure. No information hierarchy — the budget total doesn't outweigh "unbudgeted".
- **When no budget:** The page shows only the table — no hero number, no empty-state chart, no guidance.
- **Table-only primary view:** No summary, no timeline, no sparkline. Adequate but lifeless.
- **Table footer:** 8 numbers (4 currencies × 2 rows) stacked in the same font size — hard to parse.
- **Empty state:** `h-24 text-center` with a plain string — no illustration, no CTA.
- **`ExpensesSidebar` is fully built but never rendered in `expenses/page.tsx`** — all the rich analytical content (budget donut, daily spending insight, projected spending, unbudgeted info) exists as components but is unused. Surfacing these would immediately improve the view.
- No hero number that "owns" the screen.

---

### #9 — Money-Conversion Library

**What exists today:**
- `src/lib/currency-calculator.ts`: Pure JavaScript floating-point arithmetic throughout.
  - `vesAmount = amount * rates.usd_ves` — float multiplication.
  - `totals.ves += expense.equivalents.ves` — float accumulation.
  - Hardcoded fallback: `expense.equivalents.usd / 1.08` (approximate EUR/USD magic number).
- `src/actions/rates.ts`: `parseFloat(data.rate)` converts `DECIMAL` from DB to JS float immediately.
- DB schema: `DECIMAL(12, 2)` for amounts, `DECIMAL(12, 4)` for rates — correct precision at storage level, lost on read.
- No `dinero.js`, `currency.js`, `decimal.js`, `big.js`, or any decimal-safe library installed.

**What's broken / missing:**
- Classic floating-point accumulation errors occur at scale (summing hundreds of VES amounts, rounding on display).
- The `1.08` magic number is dead code (real fallback now uses ECB Frankfurter API) but still present and risky.
- Zod schemas for amounts not fully audited for precision validation.

---

### #10 — Monthly Rates URL-Driven

**What exists today:**
- `src/app/[locale]/(dashboard)/rates/page.tsx` reads `searchParams.granularity`, `searchParams.month`, `searchParams.year`, `searchParams.date` from the URL and passes them to `getMonthlyRateHistory(year, month)` or `getDailyRateHistory(dateStr)`.
- `getExchangeRates()` (live rates) is called on the same server render — it re-runs on every URL change, even when only the history window changed.
- The history chart navigation (month selector, granularity toggle) causes full page re-renders, which unnecessarily re-fetches live rates and all external APIs (Binance, BCV, CoinGecko) — even though the rate cards at the top haven't changed.
- The fetch has `next: { revalidate: 300 }` at the fetch level, so Next.js may cache it, but the render is still triggered.

**What's broken / missing:**
- Live rates and history chart are coupled in a single server render. Navigating the history chart re-fetches live rates (wasteful, potentially rate-limit-triggering on external APIs).
- Target architecture: live rate cards fetched once (stable cache / ISR), history chart fetched client-side when the window changes (avoids full page rerender).

---

### #11 — Onboarding AI Assistant

**What exists today:**
- `src/components/dashboard/onboarding-card.tsx`: A client-side checklist (4 steps: set currency, create budget, add expense, complete profile). Uses `localStorage` for persistence. Shows `canvas-confetti` on completion. This is a **static checklist**, not an AI assistant.
- `src/actions/advisor.ts`: AI financial advisor using Gemini 2.5 Flash (`@ai-sdk/google` v3.0.18) that generates 3 financial tips based on current-month expenses. This is a **retrospective advisor** for existing users, not an onboarding tool.
- No `/onboarding` route exists. No AI-driven setup flow.
- AI SDK infrastructure is fully in place: `ai` v6.0.64, `@ai-sdk/google`, `GOOGLE_GENERATIVE_AI_API_KEY`.

**What's missing:**
- An AI-driven flow to bootstrap a new user's setup (ask questions → generate suggested categories, budgets, initial configuration).
- No structured output for AI → prefill categories/budgets action.
- No dedicated onboarding route or modal.

---

### #12 — Contact/Support Section

**What exists today:**
- No `/support`, `/contact`, or `/help` route anywhere.
- No `support_tickets` table in any migration.
- `src/lib/alert-email.ts` proves Resend integration works — the sending infrastructure exists.
- `src/components/public/footer.tsx` exists but was not fully read.

**What's missing:** Everything — no form, no routing, no data model, no email notification.

---

### #13 — Git: No Claude Co-Author Trailers

**What exists today:**
- `CLAUDE.md` has no section on git conventions or commit message format.
- Recent git log commits do not appear to carry Claude co-author trailers, but there is no documented convention preventing them in future implementation sessions.

**What's needed:** A `## Git Conventions` section in `CLAUDE.md` explicitly prohibiting `Co-Authored-By: Claude` trailers, plus the conventional commit format to use.

---

## Clarifying Questions (Batch 2)

### #1 — Email Branding
- **Q1a:** Do you have a verified sending domain (e.g., `fin.app`) set up with Resend, or are we still on the sandbox `onboarding@resend.dev`? Is setting up a custom domain in scope for this batch?
- **Q1b:** What `from` address for auth emails? Options: `no-reply@fin.app`, `hello@fin.app`, `auth@fin.app`.
- **Q1c:** Which auth emails get custom Fin templates? (Recommended: signup confirmation, password reset, email change — all three.)

### #2 — Password-Reset Rate Limiting
- **Q2a:** Desired cooldown window? (Recommendation: 60 s per email address; 5 min after 3 consecutive attempts.)
- **Q2b:** User-facing message during cooldown — countdown timer ("Try again in 47 s") or static message ("Check your inbox, we've already sent you a link")?
- **Q2c:** Cooldown enforced server-side only (Supabase `max_frequency`), or also mirrored client-side (button disabled with countdown)?

### #4 — Suspicious-Activity Emails
- **Q4a:** v1 definition of "suspicious" — proposal: sign-in from a country that differs from the user's last-known country (detectable via Vercel's `x-vercel-ip-country` header). Acceptable?
- **Q4b:** Should the email include a "This wasn't me — secure my account" link that terminates all active sessions?
- **Q4c:** Should suspicious sign-ins be persisted in a DB table, or just emailed?
- **Q4d:** Hook point preference: (a) Replace `Auth` UI with a custom sign-in Server Action (full control, more work); (b) Supabase Auth Hook (requires Supabase Pro); (c) client-side `onAuthStateChange` + a server ping (less reliable). Recommendation: (a) — gives us full IP/country access server-side.

### #5 — OWASP Compliance
- **Q5a:** Target level — OWASP ASVS Level 1 (baseline) or Level 2 (higher assurance)? Recommendation: Level 1 plus specific Level 2 controls for auth.
- **Q5b:** CSP strategy — `strict-dynamic` with nonces (most secure, more complex) or a permissive allowlist (faster, weaker)? The app uses shadcn inline styles, Recharts SVGs, and `next-themes` — these complicate a strict CSP.

### #8 — Expenses View Redesign
- **Q8a:** Reference app with an expenses view you like? (e.g., Monarch Money, Copilot, YNAB, Lunch Money, Actual Budget.)
- **Q8b:** Density preference: information-dense (compact rows, lots of data) or calm/spacious (one hero number, breathing room)?
- **Q8c:** Should `ExpensesSidebar` (budget donut, daily spending insight, projected spending) be surfaced in the redesign? It's fully built but currently not rendered in the expenses page.

### #9 — Money-Conversion Library
- **Q9a:** Preferred approach: `dinero.js` v2 (full-featured, opinionated, 18 KB gzipped), `currency.js` (minimal, 1.6 KB), or a custom `BigInt`-based utility (zero deps)? Full comparison in Phase 2.
- **Q9b:** Should we correct existing stored `equivalents` JSONB values in the DB for float drift, or fix only the code path going forward?

### #10 — Monthly Rates URL-Driven
- **Q10a:** Confirm intent: should month/date navigation in the history chart switch to a client-side fetch (React state + Server Action) so live rate cards don't re-render? Or is the concern different from what was diagnosed above?

### #11 — Onboarding AI Assistant
- **Q11a:** Where should it live? (a) Replace the existing `OnboardingCard` checklist; (b) a modal on first login; (c) a dedicated `/onboarding` route. Recommendation: (b) modal — least disruptive, easiest to skip.
- **Q11b:** Output: (a) guidance text only; (b) prefill suggested categories + budgets the user can accept; (c) both. Recommendation: (b).
- **Q11c:** UX style: conversational chat or a structured step-wizard?

### #12 — Contact/Support
- **Q12a:** Ticket destination: (a) email to support inbox only; (b) DB table + email notification; (c) DB + email + minimal admin view. Recommendation: (b) for v1.
- **Q12b:** What email address receives support tickets?
- **Q12c:** Login required to submit, or open to unauthenticated visitors?
- **Q12d:** Spam protection: Cloudflare Turnstile (free, privacy-friendly), hCaptcha, or just a honeypot for v1?

### #13 — Git Co-Author Trailers
- **Q13a:** Rewrite existing commit history to remove any trailers, or configure the convention in `CLAUDE.md` going forward only?
