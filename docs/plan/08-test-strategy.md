# Phase 3 — Test Strategy

## Philosophy

This project has no existing automated test suite (no Vitest config, no Playwright setup). The test strategy is therefore pragmatic: identify the logic that is genuinely worth unit testing (pure functions with non-obvious edge cases), define clear manual QA steps for everything else, and explicitly call out what is not worth testing.

---

## What to Test — and Where

### Unit Tests (Vitest — to be set up if not present)

These are the only pieces of logic where automated testing pays for itself: pure functions with edge cases that are hard to catch manually.

#### Change 2 — Bidirectional calculator sync

Extract the conversion math into a standalone pure function (e.g., `computeConversion(fromAmount, rate, direction)`) so it can be unit tested without a React renderer.

| Test case | Input | Expected output |
|---|---|---|
| From → To, toBs direction | `amount=2, rate=50, direction="toBs"` | `to = 100.00` |
| To → From, toBs direction | `amount=100, rate=50, direction="toBs"` | `from = 2.00` |
| From → To, fromBs direction | `amount=100, rate=50, direction="fromBs"` | `to = 2.00` |
| Empty string input | `amount="", rate=50` | Result = `"0.00"`, no NaN |
| Rate = 0 (EUR missing) | `amount=10, rate=0` | Result = `"0.00"`, no crash |
| Swap direction | After swap, fromAmount preserved; toAmount recomputed | Correct inverse |

#### Change 5 — Daily rate history date range

The `getDailyRateHistory(date)` action constructs a UTC date range from a local date string. This is a subtle timezone operation worth testing:

| Test case | Input | Expected query range |
|---|---|---|
| Standard date | `"2026-05-06"` | `2026-05-06T00:00:00.000Z` → `2026-05-06T23:59:59.999Z` |
| Month boundary | `"2026-01-31"` | No spillover into February |
| Leap day | `"2024-02-29"` | Valid range (2024 is a leap year) |

---

### TypeScript Compilation (mandatory gate)

Run `npx tsc --noEmit` after each change. This is the highest-value "test" for this codebase because:
- `RateHistoryPoint` update (Change 3) affects every consumer of that type.
- `DailyRatePoint` addition (Change 5) must be used correctly in the chart.
- Any missed `eur` field on a `RateHistoryPoint` literal will fail compilation.

**Include in CI / pre-commit:** `npm run build` already runs the TypeScript compiler. Use it as the gate.

---

### ESLint (mandatory gate)

Run `npm run lint` after each change. The project uses `eslint-config-next` which catches common React/Next.js anti-patterns including:
- Missing `key` props on lists.
- Incorrect hook dependency arrays.
- `useEffect` with missing dependencies (would catch circular sync bugs).

---

### Manual QA — Per Change

#### Change 1 — Logo → Home

1. [ ] Open `/{locale}` (not logged in). Click the header logo. Confirm URL remains `/{locale}` (no redirect cycle).
2. [ ] Open DevTools Network. Click logo. Confirm the response is `200`, not `307`.
3. [ ] Log in. Open `/{locale}/expenses`. Click the sidebar logo. Confirm redirect to `/{locale}/dashboard`.
4. [ ] Resize to mobile (< 768px). Use the dashboard header logo. Confirm redirect to `/{locale}/dashboard`.
5. [ ] Tab to the logo links. Confirm focus ring is visible (accessibility).
6. [ ] Switch locale (EN → ES). Confirm logo links still work in both locales.

#### Change 2 — Inline Bidirectional Editing

1. [ ] Open landing page. Type `50` in the from field. Confirm to field updates instantly.
2. [ ] Click into the to field. Clear it. Type `2500`. Confirm from field updates to `~50` (at USD rate).
3. [ ] Change currency selector to EUR. Confirm both fields recompute.
4. [ ] Click the swap button. Confirm labels flip; confirm values stay mathematically consistent.
5. [ ] Clear the from field. Confirm to field shows `0.00` (no NaN, no crash).
6. [ ] Enter a very large number (e.g., `999999`). Confirm no layout overflow.
7. [ ] Copy button still works and copies the to-field value.

#### Change 3 — EUR Line in History Chart

1. [ ] Log in. Navigate to `/rates`. Confirm three lines visible in the monthly chart.
2. [ ] Confirm legend shows: "USD (BCV Official)", "USDT (Binance P2P)", "EUR (BCV Official)".
3. [ ] Hover a data point. Confirm tooltip shows all three values.
4. [ ] Switch to a prior month. Confirm EUR line is present (may have gaps if data is sparse — line should bridge them).
5. [ ] Run `npx tsc --noEmit`. Confirm zero type errors.

#### Change 4 — Public History Preview

1. [ ] Open landing page while logged out. Scroll down. Confirm the history chart section appears below the rate cards.
2. [ ] Confirm chart shows three lines (USD, USDT, EUR) covering approximately 30 days.
3. [ ] Confirm "Sign In" CTA is visible on or near the chart.
4. [ ] Click "Sign In". Confirm redirect to `/{locale}/login`.
5. [ ] After login, confirm redirect to `/dashboard` (not `/rates`) — existing behavior unchanged.
6. [ ] Open browser DevTools → Network. Confirm no auth errors (401/403) on the landing page for the new history query.
7. [ ] View landing page source (SSR). Confirm chart data is server-rendered (visible in `<script>` hydration payload), not a loading spinner.

#### Change 5 — Daily Granularity

1. [ ] Log in. Navigate to `/rates`. Confirm "Monthly | Daily" toggle visible in chart header.
2. [ ] Click "Daily". Confirm month selector hides; date picker appears defaulting to today.
3. [ ] Confirm URL updates to `?granularity=day&date=YYYY-MM-DD`.
4. [ ] Select a recent date. Confirm chart shows data with HH:mm X-axis.
5. [ ] Confirm USDT line has more data points than USD/EUR lines (Binance updates more frequently).
6. [ ] Select a future date. Confirm "No rate data for this date" message.
7. [ ] Select a date before the app launched (e.g., 2025-01-01). Confirm empty state.
8. [ ] Click "Monthly". Confirm month selector reappears; daily controls hide; URL reverts.
9. [ ] Apply the DB migration on a local Supabase instance. Confirm `\d exchange_rates` shows the new index.

#### Change 6 — Shareable Rates Image

1. [ ] Log in. Navigate to `/rates`. Confirm "Share Rates" button is visible in the page header.
2. [ ] Click "Share Rates". Confirm dialog opens with three rate checkboxes and three platform options.
3. [ ] Uncheck all pairs. Confirm "Generate & Share" is disabled.
4. [ ] Check USDT only, select "WhatsApp / General". Click "Generate & Share".
5. [ ] On desktop (no native share): confirm PNG file downloads as `rates-YYYY-MM-DD.png`.
6. [ ] Open the downloaded PNG. Verify:
   - [ ] Fin isologo is visible.
   - [ ] Only USDT/VES appears (others unchecked).
   - [ ] Today's date is correct.
   - [ ] Image dimensions are ~1600×1600px (800×800 @2x).
7. [ ] Repeat with "Twitter / X" → confirm downloaded PNG is ~2400×1350px.
8. [ ] Repeat with "Instagram Story" → confirm downloaded PNG is ~2160×3840px.
9. [ ] On mobile (real device): confirm native share sheet opens.
10. [ ] Open DevTools → Network tab. Click "Generate & Share". Confirm `html-to-image` chunk loads only at this point (lazy load working).
11. [ ] Check that the share button is NOT visible on the public landing page or in the `/expenses` page.

---

## What NOT to Test

| Skipped test | Reason |
|---|---|
| Logo navigation via unit test | Trivial `<Link href>` — manual verification is faster and sufficient. |
| Recharts rendering (EUR line) | Recharts is a third-party library, not our code. Visual correctness is verified manually. |
| `getExchangeRates()` end-to-end | Calls external APIs (Binance, BCV, CoinGecko) — mocking would test our mock, not the integration. Manual test with real data is more valuable. |
| i18n string completeness | `next-intl` throws at runtime if a key is missing — the dev server catches this immediately. |
| Supabase RLS in isolation | The anon-read-exchange-rates policy was verified when it was added; it's not being changed here. |
| Image visual pixel-perfect accuracy | Subjective. Manual QA step 6 above catches functional correctness. |
| `navigator.share` API in JSDOM | JSDOM does not implement the Web Share API. Test the fallback path manually on a real device. |
