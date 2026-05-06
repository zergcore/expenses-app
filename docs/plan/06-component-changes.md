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
