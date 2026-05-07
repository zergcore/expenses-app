# Phase 3 — Component Changes

---

## Legend

- **M** = Modify existing file
- **C** = Create new file
- **SC** = Server Component (no `"use client"`)
- **CC** = Client Component (`"use client"` required)

---

## Change 1 — Logo → Home

### `src/components/public/header.tsx` [M · CC]

**What changes:** Replace `import Link from "next/link"` with the next-intl `Link` from `@/i18n/navigation`. The logo `<Link href="/">` stays `href="/"` — next-intl's Link auto-prepends the locale, producing `/{locale}` without a middleware redirect hop.

**Props:** Unchanged (`user: User | null | undefined`).

**Key behavior:** Logo click → direct navigation to `/{locale}` (no 307 redirect).

---

### `src/components/layout/sidebar.tsx` [M · CC]

**What changes:** Wrap the `<Isotipo>` in `<Link href="/dashboard">` from `@/i18n/navigation`. Add `flex items-center` to the wrapping element so the link occupies the full logo area. Add a hover style to signal clickability (`hover:opacity-80 transition-opacity`).

**Props:** Unchanged (`className?: string`).

**Key behavior:** Logo click → navigates to `/{locale}/dashboard`.

---

### `src/components/layout/header.tsx` [M · CC]

**What changes:** Wrap the `<Isotipo>` in the mobile-header `<span>` with `<Link href="/dashboard">` from `@/i18n/navigation`. Remove the `<span>` wrapper (replace with the Link directly).

**Props:** Unchanged (`user: User`).

**Key behavior:** Mobile dashboard header logo → navigates to `/{locale}/dashboard`.

---

## Change 2 — Inline Bidirectional Editing

### `src/components/landing/currency-calculator.tsx` [M · CC]

**What changes:** State refactor only. No prop changes, no new imports (except removing `useEffect` if the approach is handler-only).

**Props:** Unchanged (`rates: { usdToBs, usdtToBs, eurToBs }`).

**State before → after:**
```
Before: amount, currency, direction, result, copied
After:  fromAmount, toAmount, currency, direction, copied
```

**Key behavior:**
- `handleFromChange(val)` → sets `fromAmount(val)` + computes and sets `toAmount`.
- `handleToChange(val)` → sets `toAmount(val)` + computes and sets `fromAmount`.
- A single `useEffect([currency, direction])` recomputes `toAmount` from `fromAmount` on currency/direction change.
- Swap button retained; calls `setDirection(prev => ...)` which triggers the effect above.
- Both `<Input>` fields are editable (no `readOnly`).
- The "to" field uses `type="number"` (change from `type="text"`) to match the "from" field — or keep `type="text"` with a numeric-only `onChange` guard to preserve the formatted display.
- Copy button copies the current `toAmount` value.

**Server vs client:** Already `"use client"`. No change.

---

## Change 3 — EUR Line in History Chart

### `src/actions/rates.ts` [M · Server Action file]

**What changes:**
1. `RateHistoryPoint` interface: add `eur: number | null`.
2. `getMonthlyRateHistory()`:
   - Add `"EUR_VES"` to the `.in("pair", [...])` filter.
   - Initialize each `dayMap` entry with `eur: null`.
   - In the merge loop, add `if (row.pair === "EUR_VES") dayData.eur = rate;`.
3. `RateHistoryPoint` array push: include `eur: dayData.eur`.

**No change to `getExchangeRates`, `getCurrentRatesSnapshot`, or any other function.**

---

### `src/components/rates/rates-history-chart.tsx` [M · CC]

**What changes:**
1. Update `validRates` domain calculation to include `d.eur`.
2. Add a third `<Line>`:
   ```
   dataKey="eur"
   name={t("eur_bcv")}
   stroke="#f59e0b"   // amber-500 — distinct from blue (USD) and green (USDT)
   strokeWidth={2}
   dot={{ r: 3 }}
   activeDot={{ r: 5 }}
   connectNulls
   ```
3. Import `t("eur_bcv")` from the `"Rates"` namespace.

**Props:** `data: RateHistoryPoint[]` — type updated (now includes `eur`), no interface change needed at the component level.

---

## Change 4 — Public History Preview + Signup CTA

### `src/actions/rates.ts` [M · Server Action file]

**What changes:** Add new exported function `getLastNDaysRateHistory(days: number): Promise<RateHistoryPoint[]>`.

**Logic:**
- Computes `startDate = today − days` and `endDate = today` (UTC boundaries).
- Queries `exchange_rates` for `pair IN ("USD_VES", "USDT_VES", "EUR_VES")` within that range.
- Aggregates to one point per calendar day (last rate per day per pair) — same aggregation pattern as `getMonthlyRateHistory`.
- Returns `RateHistoryPoint[]` sorted by date ascending.

**Notes:** Uses `createClient()` which works for anon sessions (RLS allows anon SELECT).

---

### `src/app/[locale]/(public)/page.tsx` [M · SC]

**What changes:**
- Import `getLastNDaysRateHistory` and `HistoryPreviewSection`.
- Add `getLastNDaysRateHistory(30)` to the existing `Promise.all` (alongside `getExchangeRates()`).
- Render `<HistoryPreviewSection data={historyData} />` after `<RateCardsSection>` and before `<CTASection>`.

---

### `src/components/public/history-preview-section.tsx` [C · SC]

**Props:** `data: RateHistoryPoint[]`

**Renders:**
- Section heading (`Landing.history.title`).
- Subheading (`Landing.history.subtitle`).
- `<PublicRatesHistoryChart data={data} />` — in a `<Suspense>` boundary.
- If `data.length === 0`: renders `<p>{t("Landing.history.no_data")}</p>` instead of the chart.
- Overlay at the bottom of the chart area: a semi-transparent gradient card with:
  - `Landing.history.preview_cta` text.
  - A `<Link href="/login">` button: `Landing.history.sign_in`.

**Server vs client:** Server Component. Only passes data down to the client chart; the CTA is a plain `<Link>` (no interactivity needed).

---

### `src/components/public/public-rates-history-chart.tsx` [C · CC]

**Props:** `data: RateHistoryPoint[]`

**Renders:** A Recharts `ResponsiveContainer → LineChart` with:
- Three Lines: USD (blue), USDT (green), EUR (amber). All with `connectNulls`.
- `XAxis dataKey="date"` formatted as "Jan 15" (same formatter as `RatesHistoryChart`).
- `YAxis` with Bs. prefix, auto-domain.
- No controls (no month selector, no granularity toggle).
- No interactivity beyond Recharts tooltips.

**Key behavior:** Read-only preview. Styles should match the existing `RatesHistoryChart` for visual consistency but the component is intentionally simpler.

**Server vs client:** Must be `"use client"` (Recharts).

---

## Change 5 — Daily (Intraday) Granularity

### `src/actions/rates.ts` [M · Server Action file]

**What changes:** Add new exported type `DailyRatePoint` and function `getDailyRateHistory(date: string): Promise<DailyRatePoint[]>`.

**Logic:**
- Parses `date` (YYYY-MM-DD).
- Constructs UTC start (`date T00:00:00.000Z`) and end (`date T23:59:59.999Z`).
- Queries `exchange_rates` for `pair IN ("USDT_VES", "USD_VES", "EUR_VES")` within that range.
- Returns raw records sorted by `fetched_at ASC`, each mapped to `DailyRatePoint`.
- Time string formatted as "HH:mm" from `fetched_at` UTC (implementor note: format in the action to avoid timezone disagreement between server and client).

---

### `src/app/[locale]/(dashboard)/rates/page.tsx` [M · SC]

**What changes:**
- Read `granularity` (`"month"` | `"day"`) and `date` (`YYYY-MM-DD`) from `searchParams`.
- Conditionally call `getDailyRateHistory(date)` or `getMonthlyRateHistory(year, month)`.
- Pass the result and `granularity` as props to `RatesHistoryChart`.

**New props to `RatesHistoryChart`:**
```typescript
// Extended props (existing + new)
interface RatesHistoryChartProps {
  data: RateHistoryPoint[] | DailyRatePoint[]; // union
  granularity: "month" | "day";
}
```

---

### `src/components/rates/rates-history-chart.tsx` [M · CC]

**What changes (significant refactor of this component):**

1. **Granularity toggle:** A two-option segmented control (or two `<Button variant="outline">` in a group):
   - "Monthly" | "Daily" — updates URL via `router.replace`.

2. **Conditional date controls:**
   - Monthly mode: existing month `<Select>` (unchanged).
   - Daily mode: a date picker. Use `react-day-picker` `DayPicker` in a `<Popover>` (shadcn Popover + Calendar pattern — same as the expense date picker in `expense-form.tsx`). Default to today. Disabled dates: future dates.

3. **Conditional chart rendering:**
   - Monthly: renders `LineChart` with `dataKey="displayDate"` on X-axis (existing behavior + EUR line from Change 3).
   - Daily: renders `LineChart` with `dataKey="time"` on X-axis (HH:mm). X-axis `interval` calculated to show ~6–8 ticks regardless of data density.

4. **Chart card title:** Shows `t("monthly_trend")` or `t("daily_trend")` based on mode.

**Server vs client:** Already `"use client"`. No change.

---

## Change 6 — Shareable Rates Image

### `src/app/[locale]/(dashboard)/rates/page.tsx` [M · SC]

**What changes:** Pass `rates` data (already fetched) to the `ShareRatesButton` component. This requires making `ShareRatesButton` a client-side child that receives `rates: RateData[]` as a prop.

---

### `src/components/rates/rates-title.tsx` [M · CC or SC]

**What changes:** Add `<ShareRatesButton rates={rates} />` to the title row. This requires `rates-title.tsx` to accept a `rates` prop and become a `"use client"` component (or keep it as SC and accept `ShareRatesButton` as a `children` prop passed from the page).

**Preferred approach:** Keep `RatesTitle` as a SC; accept `children` from the page and render `ShareRatesButton` alongside the title. This avoids making `RatesTitle` a client component just to hold a button.

```typescript
// rates-title.tsx stays SC
interface RatesTitleProps { children?: React.ReactNode }
// rates/page.tsx passes: <RatesTitle><ShareRatesButton rates={rates} /></RatesTitle>
```

---

### `src/components/rates/share-rates-button.tsx` [C · CC]

**Props:** `rates: RateData[]`

**State:**
- `isOpen: boolean` — dialog open/close
- `selectedPairs: Set<SharePair>` — default: all three checked
- `platform: SharePlatform` — default: `"general"`
- `isGenerating: boolean` — loading state during image capture

**Key behavior:**
- Renders a `<Button>` with a Share icon (Lucide `Share2`) and label `t("Rates.share_rates")`.
- Clicking opens a `<Dialog>` (shadcn Dialog).
- Inside: two-section form (pairs checkboxes + platform cards).
- "Generate & Share" button:
  1. Sets `isGenerating = true`.
  2. `await import('html-to-image')` (lazy).
  3. Updates template dimensions via a ref or context.
  4. `toPng(templateRef.current, { width, height, pixelRatio: 2 })`.
  5. Converts PNG to a `File` object.
  6. Tries `navigator.share({ files: [file], title: "Fin Rates" })`.
  7. Falls back to `<a download>` trigger.
  8. Sets `isGenerating = false`.
  9. On error: `toast.error(t("Rates.share_error"))`.

**Refs:**
- `templateRef: React.RefObject<HTMLDivElement>` — passed to `ShareRatesImageTemplate`.

---

### `src/components/rates/share-rates-image-template.tsx` [C · CC]

**Props:**
```typescript
interface ShareRatesImageTemplateProps {
  rates: RateData[];
  selectedPairs: SharePair[];
  platform: SharePlatform;
  templateRef: React.RefObject<HTMLDivElement>;
}
```

**Renders:** A positioned-off-screen `<div>` (see architecture note on SVG logo strategy).

**Visual layout (square 1:1 base — scaled via dimensions):**
```
┌─────────────────────────────────┐
│  [Fin isologo]        [Date]   │  ← header row
│─────────────────────────────────│
│                                 │
│  USDT / VES     Bs. 51.40      │  ← rate rows (selected pairs only)
│  USD / VES      Bs. 49.80      │
│  EUR / VES      Bs. 55.20      │
│                                 │
│─────────────────────────────────│
│  fin.app                       │  ← footer
└─────────────────────────────────┘
```

**Styling:** Inline styles only (Tailwind classes may not render correctly in `html-to-image` because it clones the DOM and re-renders styles — inline styles are guaranteed to be captured).

**Logo:** Fetched at mount time via `useEffect → fetch('/isologo.svg') → URL.createObjectURL` or `data:` URI — avoids `html-to-image` cross-origin issues with `<img src>` pointing to SVG files.

**Server vs client:** Must be `"use client"` (uses refs and effects).

---

## Summary Table

| File | Action | Change | SC/CC |
|---|---|---|---|
| `src/components/public/header.tsx` | Modify | 1 | CC |
| `src/components/layout/sidebar.tsx` | Modify | 1 | CC |
| `src/components/layout/header.tsx` | Modify | 1 | CC |
| `src/components/landing/currency-calculator.tsx` | Modify | 2 | CC |
| `src/actions/rates.ts` | Modify | 3, 4, 5 | Server |
| `src/components/rates/rates-history-chart.tsx` | Modify | 3, 5 | CC |
| `src/app/[locale]/(public)/page.tsx` | Modify | 4 | SC |
| `src/components/public/history-preview-section.tsx` | **Create** | 4 | SC |
| `src/components/public/public-rates-history-chart.tsx` | **Create** | 4 | CC |
| `src/app/[locale]/(dashboard)/rates/page.tsx` | Modify | 5, 6 | SC |
| `src/components/rates/rates-title.tsx` | Modify | 6 | SC |
| `src/components/rates/share-rates-button.tsx` | **Create** | 6 | CC |
| `src/components/rates/share-rates-image-template.tsx` | **Create** | 6 | CC |
| `messages/en.json` | Modify | 3, 4, 5, 6 | — |
| `messages/es.json` | Modify | 3, 4, 5, 6 | — |
| `supabase/migrations/20260507000000_*.sql` | **Create** | 5 | — |

**Files created: 5. Files modified: 10. Files deleted: 0.**

---
---

# Phase 3 — Component Changes (Batch 2: 13-Item Fix Batch)

> **Legend:** M = Modify · C = Create · D = Delete · SC = Server Component · CC = Client Component · — = non-component file

---

## #1 — Email Branding

| Path | Op | Type | Notes |
|---|---|---|---|
| `supabase/templates/confirmation.html` | C | — | Branded HTML signup confirmation template (uses Supabase variables `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`) |
| `supabase/templates/recovery.html` | C | — | Branded password-reset template |
| `supabase/templates/email_change.html` | C | — | Branded email-change confirmation template |
| `supabase/config.toml` | M | — | Enable `[auth.email.smtp]` with Resend config; wire `[auth.email.template.*]` blocks |
| `src/lib/alert-email.ts` | M | — | Change `from` to `Fin <fin@zergcore.dev>`; update HTML to use shared brand layout |
| `src/lib/email-template.ts` | C | — | Shared HTML wrapper helper used by `alert-email.ts` and future security alert; emits the same brand frame as Supabase templates |
| `.env.example` | M | — | Add `RESEND_API_KEY`, `DEVELOPER_EMAIL`, `SUPPORT_EMAIL`, `CRON_SECRET` |

---

## #2 — Password-Reset Rate Limiting

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/app/[locale]/(auth)/forgot-password/page.tsx` | M | CC | Replace `<Auth view="forgotten_password">` with custom `<ForgotPasswordForm>` |
| `src/components/auth/forgot-password-form.tsx` | C | CC | New form. `useActionState(resetPassword)`. Tracks `cooldownSeconds` state, decrements via `useEffect` interval; disables submit and renders countdown when `> 0` |
| `src/actions/auth.ts` | M | — | `resetPassword`: keep current implementation (Supabase enforces 60s server-side); ensure error mapping returns a generic non-enumerating message |
| `supabase/config.toml` | M | — | `[auth.email] max_frequency = "60s"` |
| `messages/en.json`, `messages/es.json` | M | — | Add `Auth.resetSent`, `Auth.resendIn`, etc. |

---

## #3 — Duplicate "Forgot Password" Link

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/app/[locale]/(auth)/login/page.tsx` | M | CC | Add `showLinks={false}` to the `<Auth>` component. (Will be replaced wholesale by #4; this is a one-line interim fix.) |

---

## #4 — Suspicious-Activity Emails

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/components/auth/sign-in-form.tsx` | C | CC | Custom email/password form. `useActionState(signIn)`. RHF + Zod for validation. Replaces `<Auth>` on the login page entirely. |
| `src/app/[locale]/(auth)/login/page.tsx` | M | CC | Replace `<Auth>` with `<SignInForm>`. Keep custom forgot-password link. |
| `src/actions/auth-events.ts` | C | — | `signIn(prev, formData)`, `terminateAllSessions(token)`. Reads `headers()` for IP/country/UA. Calls `supabase.auth.signInWithPassword` server-side. |
| `src/lib/suspicious-activity.ts` | C | — | `detectSuspiciousActivity(context): Promise<SuspiciousActivityResult>`. Pure logic against `login_events`. |
| `src/lib/security-email.ts` | C | — | `sendSecurityAlert(email, country, terminateUrl, locale)`. Uses Resend + shared template helper. |
| `src/lib/secure-token.ts` | C | — | `generateSecureToken(userId)` and `verifySecureToken(token)` using HMAC-SHA256 over `userId.timestamp.secret`. 24h validity. |
| `src/app/auth/secure/route.ts` | C | — | GET handler. Validates token, calls `terminateAllSessions`, redirects to `/login` with toast. |
| `supabase/templates/security-alert.html` | C | — | Branded security alert template. Includes "This wasn't me — Secure my account" CTA button. |
| `supabase/migrations/<TS>_create_login_events.sql` | C | — | Migration from data-model doc |

---

## #5 — OWASP Compliance

| Path | Op | Type | Notes |
|---|---|---|---|
| `next.config.ts` | M | — | Add `headers()` returning CSP/HSTS/X-Frame-Options/etc.; add `images.remotePatterns` for Supabase storage host |
| `src/middleware.ts` | M | — | `NEXT_LOCALE` cookie: add `secure: true, sameSite: "lax"` |
| `supabase/config.toml` | M | — | `minimum_password_length = 8`, `password_requirements = "letters_digits"`, `secure_password_change = true` |
| `supabase/migrations/<TS>_close_rls_gaps.sql` | C | — | Missing DELETE policies + storage avatars DELETE |
| `.env.example` | M | — | (Already covered by #1 — Resend, Cron, Support, Developer envs) |

---

## #6 — Avatar Not Rendering in Header

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/components/layout/header.tsx` | M | CC | Import `AvatarImage` from `@/components/ui/avatar`; insert `<AvatarImage src={user.user_metadata?.avatar_url ?? ""} alt="" />` inside the `<Avatar>` |

---

## #7 — Budget Circle Clipped

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/components/expenses/kpi-header.tsx` | M | CC | Move `overflow-hidden` from the budget Card root to a child `div` that holds only the gradient accent. Donut chart container gains `overflow-visible`. |

---

## #8 — Expenses View Redesign

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/app/[locale]/(dashboard)/expenses/page.tsx` | M | SC | Two-column grid on `lg+`. Render `<ExpensesSidebar>` in the aside column. |
| `src/components/expenses/kpi-header.tsx` | M | CC | Visual hierarchy: budget summary card becomes the dominant card; others demoted to a slimmer secondary row |
| `src/components/expenses/expenses-empty-state.tsx` | C | CC | Icon + title + description + CTA. Renders inside `DataTable`'s empty-rows branch. |
| `src/components/expenses/data-table.tsx` | M | CC | Replace inline empty-state cell with `<ExpensesEmptyState>`. Footer: prioritize USD display, mute other currencies. |
| `src/components/expenses/expenses-sidebar.tsx` | M | CC | Minor — confirm it composes correctly inside the new layout (no functional changes expected) |
| `src/components/expenses/expense-chart/chart-card.tsx` | M | CC | Remove parent `overflow-hidden` if it's there; ensure donut renders fully |

---

## #9 — Money-Conversion Library

| Path | Op | Type | Notes |
|---|---|---|---|
| `package.json` | M | — | Add `@dinero.js/core` and `@dinero.js/currencies` |
| `src/lib/currency-calculator.ts` | M | — | Rewrite `calculateEquivalents`, `sumByEquivalent`, `buildRatesSnapshot` using Dinero. Public API signatures unchanged (still take/return JS `number`). |
| `src/lib/money.ts` | C | — | Helpers: `parseRate(rateString): Dinero`, `parseAmount(num, currency): Dinero`, `toUnit(d): number`, `toMinorUnit(d): bigint`. Centralizes Dinero ergonomics. |
| `src/actions/rates.ts` | M | — | Replace `parseFloat(row.rate)` with `parseRate(row.rate).toUnit()` at boundaries; internal arithmetic uses Dinero |
| `src/actions/expenses.ts` | M | — | Audit and replace any direct float arithmetic on amounts |

---

## #10 — Monthly Rates Async

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/app/[locale]/(dashboard)/rates/page.tsx` | M | SC | Pass initial history data as prop. Live rates remain server-fetched on first load only. |
| `src/components/rates/rates-history-chart.tsx` | M | CC | Add `useTransition`. On month/date change: call Server Action directly, set local state with result, `router.replace` URL with `{ scroll: false }`. Show pending state via `isPending`. |

---

## #11 — Onboarding AI Assistant

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/components/onboarding/onboarding-modal.tsx` | C | CC | Multi-step wizard. Tracks `currentStep` state. Renders one `<Step*>` component per step. |
| `src/components/onboarding/steps/currency-step.tsx` | C | CC | Step 1 |
| `src/components/onboarding/steps/income-step.tsx` | C | CC | Step 2 |
| `src/components/onboarding/steps/categories-step.tsx` | C | CC | Step 3 |
| `src/components/onboarding/steps/savings-step.tsx` | C | CC | Step 4 |
| `src/components/onboarding/steps/style-step.tsx` | C | CC | Step 5 |
| `src/components/onboarding/steps/review-step.tsx` | C | CC | Step 6 — calls `generateOnboardingSuggestions` on entry, displays editable budget cards |
| `src/actions/onboarding.ts` | C | — | `generateOnboardingSuggestions(answers)`, `applyOnboardingSuggestions(suggestions)`, `dismissOnboarding()` |
| `src/lib/onboarding/prompt.ts` | C | — | Builds the system prompt for Gemini from `OnboardingAnswers` |
| `src/types/onboarding.ts` | C | — | Schemas + types from data-model doc |
| `src/app/[locale]/(dashboard)/layout.tsx` | M | SC | Conditionally render `<OnboardingModal user={user} />` when `user.user_metadata.onboarding_complete !== true` |

---

## #12 — Contact/Support Section

| Path | Op | Type | Notes |
|---|---|---|---|
| `src/app/[locale]/(public)/support/page.tsx` | C | SC | Server Component. Calls `getCurrentUser()` for prefill. Renders `<SupportForm>`. |
| `src/components/public/support-form.tsx` | C | CC | RHF + Zod + Turnstile widget. `useActionState(submitSupportTicket)`. Success state replaces form. |
| `src/actions/support.ts` | C | — | `submitSupportTicket(prev, formData)`. Verifies Turnstile, rate-limit check, INSERT via service client, two Resend emails. |
| `src/lib/turnstile.ts` | C | — | `verifyTurnstileToken(token, ip): Promise<boolean>` — POSTs to siteverify endpoint |
| `src/components/public/footer.tsx` | M | SC | Add link to `/{locale}/support` |
| `package.json` | M | — | Add `@marsidev/react-turnstile` |
| `supabase/migrations/<TS>_create_support_tickets.sql` | C | — | Migration from data-model doc |
| `src/types/support.ts` | C | — | Schema + types from data-model doc |

---

## #13 — Git Convention

| Path | Op | Type | Notes |
|---|---|---|---|
| `CLAUDE.md` | M | — | Add `## Git Conventions` section (see CLAUDE.md update plan) |

---

## Aggregate Summary

| Category | Count |
|---|---|
| Files **created** | **31** |
| Files **modified** | **17** |
| Files **deleted** | 0 |
| Components added (CC) | 12 |
| Server Components touched (SC) | 3 |
| Server Actions added | 7 (`signIn`, `terminateAllSessions`, `generateOnboardingSuggestions`, `applyOnboardingSuggestions`, `dismissOnboarding`, `submitSupportTicket`, plus existing `resetPassword` modified) |
| New SQL migrations | 3 |
| New email templates | 4 (signup, recovery, email_change, security-alert) |
