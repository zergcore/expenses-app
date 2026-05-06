# Phase 4 — Implementation Runbook

This document is the prompt to paste into a fresh Claude Code session to execute all 6 changes. Paste it verbatim. The implementing session has no context from the planning conversation — everything it needs is here or in the referenced artifact files.

---

## Context

You are implementing 6 planned features for the **Fin** app — a Next.js 16 / Supabase / next-intl personal finance app. The full plan is in `docs/plan/`. Read those files before writing any code.

**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase (`@supabase/ssr`), next-intl, Recharts, React Hook Form + Zod, Lucide icons, Sonner for toasts.

**Key rule:** Server Components by default. Add `"use client"` only when interactivity requires it. All data fetching goes through Server Actions in `src/actions/`. i18n strings go in `messages/en.json` and `messages/es.json`. Navigation links use `@/i18n/navigation` Link (not `next/link`) for automatic locale prefixing.

---

## Working Protocol

For **each change**:
1. Create a feature branch: `git checkout -b feat/<branch-name>` (branch names in the execution order table below).
2. Read the relevant spec in `docs/plan/02-feature-specs.md` and the component details in `docs/plan/06-component-changes.md` before writing a single line of code.
3. Implement in the smallest logical commits (2–5 per change — commit messages in `docs/plan/09-rollout-plan.md`).
4. After each commit, run: `npx tsc --noEmit && npm run lint`.
5. After all commits on a branch, run: `npm run build`. Fix any build error before moving to the next change.
6. **Stop and ask** at every decision point marked **[STOP]** below.
7. Mark the change done only when all acceptance criteria in `docs/plan/02-feature-specs.md` are met.

Use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`.

---

## Execution Order

| # | Branch | Change | Key files | Est. effort |
|---|---|---|---|---|
| 1 | `feat/logo-home-link` | Logo → Home | `public/header.tsx`, `layout/sidebar.tsx`, `layout/header.tsx` | 30 min |
| 2 | `feat/eur-rate-history` | EUR line in history | `actions/rates.ts`, `rates/rates-history-chart.tsx` | 2 hrs |
| 3 | `feat/bidirectional-calculator` | Inline editing | `landing/currency-calculator.tsx` | 3 hrs |
| 4 | `feat/public-history-preview` | Public history CTA | `actions/rates.ts`, new public components, `(public)/page.tsx` | 6 hrs |
| 5 | `feat/daily-rate-granularity` | Daily granularity | `actions/rates.ts`, `rates/rates-history-chart.tsx`, migration | 12 hrs |
| 6 | `feat/shareable-rates-image` | Shareable image | New rate components, i18n | 20 hrs |

**Do not skip ahead.** Changes 3, 4, and 5 all modify `src/actions/rates.ts` — each branch must be rebased on the previously merged branch before starting.

---

## Change 1 — Logo → Home

**Branch:** `feat/logo-home-link`

**Spec:** `docs/plan/02-feature-specs.md` → "Change 1"

### Implementation steps

1. In `src/components/public/header.tsx`:
   - Replace `import Link from "next/link"` with `import { Link } from "@/i18n/navigation"`.
   - The `<Link href="/">` on the logo `<Isotipo>` stays as `href="/"` — next-intl's Link auto-prefixes the locale.

2. In `src/components/layout/sidebar.tsx`:
   - Add `import { Link } from "@/i18n/navigation"`.
   - Wrap the `<Isotipo>` element (currently inside a `<div>`) with `<Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">`.

3. In `src/components/layout/header.tsx`:
   - Add `import { Link } from "@/i18n/navigation"`.
   - Wrap the `<Isotipo>` in the mobile header section with `<Link href="/dashboard">`.

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

**No new i18n strings needed.**

---

## Change 2 — EUR Line in Rate History Chart

**Branch:** `feat/eur-rate-history`  
**Rebase on:** `main` (after Change 1 merged)

**Spec:** `docs/plan/02-feature-specs.md` → "Change 3"  
**Data model:** `docs/plan/04-data-model.md` → "RateHistoryPoint"  
**i18n:** `docs/plan/05-i18n-strings.md` → "Change 3"

### Implementation steps

1. In `src/actions/rates.ts`, update `getMonthlyRateHistory`:
   - Add `eur: number | null` to the `RateHistoryPoint` interface.
   - Add `"EUR_VES"` to the `.in("pair", [...])` query array.
   - Add `eur: null` to each `dayMap` entry initializer.
   - In the data merge loop, add: `if (row.pair === "EUR_VES") dayData.eur = rate;`
   - In the final array push, add `eur: dayData.eur`.

2. In `messages/en.json` and `messages/es.json`, add `"eur_bcv"` key inside the `"Rates"` object (see `docs/plan/05-i18n-strings.md`).

3. In `src/components/rates/rates-history-chart.tsx`:
   - Update `validRates` to include `d.eur` in the domain calculation.
   - Add a third `<Line dataKey="eur" name={t("eur_bcv")} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />`.

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

**[STOP] After merging:** Verify the live `/rates` page shows three lines before starting Change 3 (Change 3 also modifies `actions/rates.ts` and must rebase on this).

---

## Change 3 — Inline Bidirectional Editing

**Branch:** `feat/bidirectional-calculator`  
**Rebase on:** `main` (after Change 2 merged)  
**Note:** This branch does NOT touch `actions/rates.ts` — it can be worked independently, but merge after Change 2 to avoid branch conflicts.

**Spec:** `docs/plan/02-feature-specs.md` → "Change 2"  
**Architecture:** `docs/plan/03-architecture-deltas.md` → "Change 2"

### Implementation steps

In `src/components/landing/currency-calculator.tsx`:

1. Replace the `amount` and `result` states with:
   ```
   const [fromAmount, setFromAmount] = useState<string>("1");
   const [toAmount, setToAmount] = useState<string>("");
   ```

2. Add a computation helper (can be a local function, not a `useEffect`):
   ```
   function computeTo(from: string, rate: number, dir: "toBs" | "fromBs"): string {
     const n = parseFloat(from) || 0;
     if (dir === "toBs") return (n * rate).toFixed(2);
     return rate > 0 ? (n / rate).toFixed(2) : "0.00";
   }
   function computeFrom(to: string, rate: number, dir: "toBs" | "fromBs"): string {
     const n = parseFloat(to) || 0;
     if (dir === "toBs") return rate > 0 ? (n / rate).toFixed(2) : "0.00";
     return (n * rate).toFixed(2);
   }
   ```

3. Add handlers:
   ```
   const handleFromChange = (val: string) => {
     setFromAmount(val);
     setToAmount(computeTo(val, getRateForCurrency(currency), direction));
   };
   const handleToChange = (val: string) => {
     setToAmount(val);
     setFromAmount(computeFrom(val, getRateForCurrency(currency), direction));
   };
   ```

4. Add a `useEffect([currency, direction])` that recomputes `toAmount` from `fromAmount` whenever the currency or direction changes (handles swap button and currency selector changes):
   ```
   useEffect(() => {
     setToAmount(computeTo(fromAmount, getRateForCurrency(currency), direction));
   }, [currency, direction]);
   ```

5. In the JSX:
   - From field: `value={fromAmount}` + `onChange={(e) => handleFromChange(e.target.value)}`
   - To field: `value={toAmount}` + `onChange={(e) => handleToChange(e.target.value)}` — remove `readOnly`
   - Swap button: unchanged (still calls `toggleDirection`)
   - Copy button: copies `toAmount`
   - Rate info line: uses `getRateForCurrency(currency)` directly (unchanged)

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

---

## Change 4 — Public History Preview + Signup CTA

**Branch:** `feat/public-history-preview`  
**Rebase on:** `main` (after Changes 1, 2, and 3 merged — specifically needs Change 2's updated `RateHistoryPoint` type)

**Spec:** `docs/plan/02-feature-specs.md` → "Change 4"  
**Architecture:** `docs/plan/03-architecture-deltas.md` → "Change 4"  
**Components:** `docs/plan/06-component-changes.md` → "Change 4"  
**i18n:** `docs/plan/05-i18n-strings.md` → "Change 4"

### Implementation steps

1. In `src/actions/rates.ts`, add the new `getLastNDaysRateHistory` function:
   - Compute `endDate = new Date()` and `startDate = new Date(now - days * 24 * 60 * 60 * 1000)`.
   - Query `exchange_rates` for `pair IN ("USD_VES", "USDT_VES", "EUR_VES")` between those dates.
   - Aggregate to one point per calendar day (take the last rate per day per pair).
   - Return `RateHistoryPoint[]` sorted ascending by date.
   - Use `createClient()` — no auth check (anon users can read exchange_rates via RLS).

2. Add `Landing.history.*` strings to both message files (see `docs/plan/05-i18n-strings.md`).

3. Create `src/components/public/public-rates-history-chart.tsx`:
   - `"use client"` Recharts `LineChart` — three lines (USD blue, USDT green, EUR amber), `connectNulls` on all.
   - No controls. Props: `data: RateHistoryPoint[]`.
   - If `data.length === 0` or all values are null: render a `<p>` with `t("Landing.history.no_data")`.
   - Match the visual style of `RatesHistoryChart` (same card, same axis formatting).

4. Create `src/components/public/history-preview-section.tsx`:
   - Server Component. Props: `data: RateHistoryPoint[]`.
   - Renders: section heading, subheading, `<PublicRatesHistoryChart data={data} />`, and below/overlaid: a CTA card with `Landing.history.sign_in` button linking to `/login` (use `@/i18n/navigation` Link).

5. In `src/app/[locale]/(public)/page.tsx`:
   - Add `getLastNDaysRateHistory(30)` to the `Promise.all` call alongside `getExchangeRates()`.
   - Render `<HistoryPreviewSection data={historyData} />` between `<RateCardsSection>` and `<CTASection>`.

**[STOP] Before merging:** Manually test on the landing page while logged out. Open DevTools → Network and confirm no 401/403 errors on any Supabase request. Confirm the chart is server-rendered (visible in page source).

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

---

## Change 5 — Daily (Intraday) Granularity

**Branch:** `feat/daily-rate-granularity`  
**Rebase on:** `main` (after Change 4 merged)

**Spec:** `docs/plan/02-feature-specs.md` → "Change 5"  
**Architecture:** `docs/plan/03-architecture-deltas.md` → "Change 5"  
**Data model:** `docs/plan/04-data-model.md` → "DailyRatePoint" and migration SQL  
**i18n:** `docs/plan/05-i18n-strings.md` → "Change 5"

### Implementation steps

**[STOP — DB migration first]**
> Before writing any code, create and apply the migration. Paste the SQL from `docs/plan/04-data-model.md` into a new file: `supabase/migrations/20260507000000_add_exchange_rates_index.sql`. Then run `npx supabase db push` on your local stack to verify it applies cleanly. Do NOT apply to production yet — that happens as a separate step before deploying this branch.

1. In `src/actions/rates.ts`, add:
   - `DailyRatePoint` interface (see `docs/plan/04-data-model.md`).
   - `getDailyRateHistory(date: string): Promise<DailyRatePoint[]>` function:
     - Parse `date` (YYYY-MM-DD).
     - Construct UTC range: `startOfDay = new Date(date + "T00:00:00.000Z")`, `endOfDay = new Date(date + "T23:59:59.999Z")`.
     - Query `exchange_rates` for `pair IN ("USDT_VES", "USD_VES", "EUR_VES")` in that range, order by `fetched_at ASC`.
     - Map each row to `DailyRatePoint`: `time = format(new Date(row.fetched_at), "HH:mm")` using `date-fns/format`.
     - Return the mapped array. Do NOT aggregate — return raw records.

2. Add `Rates.*` daily strings to both message files (see `docs/plan/05-i18n-strings.md`).

3. In `src/app/[locale]/(dashboard)/rates/page.tsx`:
   - Read `granularity = searchParams.granularity ?? "month"` and `date = searchParams.date ?? today`.
   - If `granularity === "day"`: call `getDailyRateHistory(date)` instead of `getMonthlyRateHistory`.
   - Pass both `granularity` and `data` to `RatesHistoryChart`.

4. In `src/components/rates/rates-history-chart.tsx`:
   - Add props: `granularity: "month" | "day"` and update `data` type to `RateHistoryPoint[] | DailyRatePoint[]`.
   - Add the granularity toggle UI (two buttons or a segmented control) in the card header.
   - Conditionally render:
     - Monthly mode: existing month Select (unchanged) + existing LineChart with `displayDate` X-axis.
     - Daily mode: `react-day-picker` date picker (in a Popover — follow the same pattern as `src/components/expenses/expense-form.tsx` for the calendar) + a LineChart with `time` X-axis.
   - For the daily chart X-axis, set `interval="preserveStartEnd"` and `tickFormatter={(t) => t}` (already HH:mm strings).
   - Card title: `granularity === "day" ? t("daily_trend") : t("monthly_trend")`.
   - Empty state for daily: if `data.length === 0`, render `<p>{t("no_data_for_date")}</p>` inside the chart area.

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

**[STOP] Before production deploy:** Apply the DB migration to the production Supabase instance via the SQL Editor dashboard. Then deploy.

---

## Change 6 — Shareable Rates Image

**Branch:** `feat/shareable-rates-image`  
**Rebase on:** `main` (after Change 5 merged)

**Spec:** `docs/plan/02-feature-specs.md` → "Change 6"  
**Architecture:** `docs/plan/03-architecture-deltas.md` → "Change 6"  
**Image generation details:** `docs/plan/07-rates-and-image-generation.md` → "Part B"  
**Components:** `docs/plan/06-component-changes.md` → "Change 6"  
**i18n:** `docs/plan/05-i18n-strings.md` → "Change 6"

### Implementation steps

**[STOP — install dependency first]**
> Run `npm install html-to-image`. Confirm it installs without high-severity vulnerabilities (`npm audit`). If there are blockers, consult the developer before proceeding.

1. Add all `Rates.share_*` and `Rates.share_image_tagline` strings to both message files.

2. Create `src/components/rates/share-rates-image-template.tsx`:
   - `"use client"` component.
   - Props: `rates: RateData[]`, `selectedPairs: SharePair[]`, `platform: SharePlatform`, `templateRef: React.RefObject<HTMLDivElement>`.
   - At component mount (`useEffect`), fetch `/isologo.svg` and convert to a base64 data URI:
     ```
     fetch('/isologo.svg')
       .then(r => r.text())
       .then(svg => {
         const b64 = btoa(unescape(encodeURIComponent(svg)));
         setLogoDataUrl(`data:image/svg+xml;base64,${b64}`);
       });
     ```
   - Render a `<div ref={templateRef}>` with `style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: dimensions.width, height: dimensions.height }}`.
   - Inside: render the image template using **inline styles only** (see visual layout in `docs/plan/07-rates-and-image-generation.md`). No Tailwind classes.
   - Import `PLATFORM_DIMENSIONS` from the same file or a co-located constants file.
   - For each selected pair, find the matching rate from `rates` (`rates.find(r => r.pair === ...)`) and render the pair name, formatted rate value, and source.
   - Include today's date formatted as "May 6, 2026" using `date-fns/format`.

3. Create `src/components/rates/share-rates-button.tsx`:
   - `"use client"` component. Props: `rates: RateData[]`.
   - State: `isOpen`, `selectedPairs: Set<SharePair>` (default all), `platform: SharePlatform` (default `"general"`), `isGenerating`.
   - `templateRef = useRef<HTMLDivElement>(null)`.
   - Render:
     - A `<Button>` with `Share2` Lucide icon + `t("share_rates")`.
     - A `<Dialog>` (shadcn) containing:
       - Three `<Checkbox>` items for pair selection.
       - Three platform option cards (visual cards with radio-button behavior — use `onClick` to set `platform` state, highlight selected card with `ring-2 ring-primary`).
       - "Generate & Share" `<Button>` (disabled when `selectedPairs.size === 0`).
     - `<ShareRatesImageTemplate>` rendered outside the Dialog (must always be in DOM), passing `templateRef`.
   - `handleGenerate` async function:
     1. `setIsGenerating(true)`.
     2. `const dims = PLATFORM_DIMENSIONS[platform]`.
     3. `await new Promise(r => setTimeout(r, 50))` — allow DOM to settle after dimension change.
     4. `const { toPng } = await import('html-to-image')`.
     5. `const dataUrl = await toPng(templateRef.current!, { width: dims.width, height: dims.height, pixelRatio: 2, cacheBust: true })`.
     6. Convert to Blob: `const blob = await (await fetch(dataUrl)).blob()`.
     7. `const file = new File([blob], \`rates-${format(new Date(), 'yyyy-MM-dd')}.png\`, { type: 'image/png' })`.
     8. `if (navigator.canShare?.({ files: [file] })) { await navigator.share(...) } else { /* <a download> fallback */ }`.
     9. `setIsGenerating(false)`.
     10. On any error: `toast.error(t("Rates.share_error"))` + `setIsGenerating(false)`.

4. In `src/components/rates/rates-title.tsx`:
   - Accept `children?: React.ReactNode` prop.
   - Render children alongside the title (e.g., in a flex row with `justify-between`).

5. In `src/app/[locale]/(dashboard)/rates/page.tsx`:
   - Import `ShareRatesButton`.
   - Pass `rates` to `<RatesTitle><ShareRatesButton rates={rates} /></RatesTitle>`.

**[STOP — design review]**
> After the template component is functional but before opening the PR, generate a test image (all three pairs, square format) and share it with the developer for visual approval. The background color, font sizes, and logo placement should match the design intent from `docs/plan/07-rates-and-image-generation.md` before shipping.

**Gate:** `npx tsc --noEmit && npm run lint && npm run build`

---

## Final Gate — Full Batch

Before declaring the batch complete:

```bash
npm run build          # Must pass with zero errors
npx tsc --noEmit       # Must pass with zero type errors
npm run lint           # Must pass with zero errors
```

Work through all manual QA checklists in `docs/plan/08-test-strategy.md`.

Confirm:
- [ ] All 6 changes merged to `main`.
- [ ] DB migration applied to production (`idx_exchange_rates_pair_fetched`).
- [ ] All 27 new i18n keys present in both `messages/en.json` and `messages/es.json`.
- [ ] `html-to-image` is in `package.json` dependencies.
- [ ] No console errors on landing page (logged out) or `/rates` page (logged in).
