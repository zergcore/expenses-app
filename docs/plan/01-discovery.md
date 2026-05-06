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
