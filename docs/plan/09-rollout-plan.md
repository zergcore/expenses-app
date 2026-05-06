# Phase 3 — Rollout Plan

---

## Branch Strategy

One feature branch per change. Each branch is rebased on `main` before opening a PR. PRs are reviewed and merged in execution order.

| Branch | Change | Est. effort | Merges into |
|---|---|---|---|
| `feat/logo-home-link` | 1 | 30 min | `main` |
| `feat/eur-rate-history` | 3 | 2 hrs | `main` |
| `feat/bidirectional-calculator` | 2 | 3 hrs | `main` |
| `feat/public-history-preview` | 4 | 6 hrs | `main` |
| `feat/daily-rate-granularity` | 5 | 12 hrs | `main` (after DB migration applied) |
| `feat/shareable-rates-image` | 6 | 20 hrs | `main` |

**Why one branch per change:**
- Each PR is reviewable in isolation (no change touches the same file as a hard dependency on another, with one exception: `src/actions/rates.ts` is touched by Changes 3, 4, and 5 — these must merge in order).
- Rollback is per-change: revert one PR without affecting others.
- Changes 3, 4, and 5 all modify `src/actions/rates.ts`. The implementor must rebase `feat/public-history-preview` on top of the merged `feat/eur-rate-history`, and rebase `feat/daily-rate-granularity` on top of the merged `feat/public-history-preview`.

---

## Execution Order with Rationale

### Step 1: `feat/logo-home-link` (Change 1)

**Merge first.** Zero risk, zero dependencies, immediately improves UX. Sets the pattern for using `@/i18n/navigation` Link across the codebase.

**Decision point before merging:** None. Implementor can proceed autonomously.

**Commits (2):**
1. `fix: use localized Link for public header logo`
2. `fix: add dashboard link to sidebar and mobile header logos`

---

### Step 2: `feat/eur-rate-history` (Change 3)

**Merge second.** Unblocks Changes 4 and 6. Low risk — additive only.

**Decision point before merging:** None. TypeScript compilation + manual QA step 3 in `08-test-strategy.md` is sufficient.

**Commits (2):**
1. `feat: add eur field to RateHistoryPoint and getMonthlyRateHistory`
2. `feat: render EUR line in RatesHistoryChart`

**After merge:** Verify the live `/rates` page shows three lines in production (or staging) before proceeding to Change 4.

---

### Step 3: `feat/bidirectional-calculator` (Change 2)

**Merge third.** Independent of Changes 3/4/5/6. Can be worked on in parallel with Step 2 by a second developer but must not be merged before Step 2 if the same developer is handling `rates.ts`.

**Decision point before merging:** None. Pure client-side change.

**Commits (2):**
1. `refactor: replace unidirectional calculator state with bidirectional fromAmount/toAmount`
2. `fix: preserve swap button behavior with new state model`

---

### Step 4: `feat/public-history-preview` (Change 4)

**Merge fourth.** Depends on Change 3 being merged first (so `RateHistoryPoint` includes `eur` and `getMonthlyRateHistory` returns EUR data).

**Decision point: involve developer before DB access pattern.**
> The new `getLastNDaysRateHistory(30)` action runs on the landing page for anon users. Before merging, confirm on the staging environment that the anon Supabase client can successfully read from `exchange_rates` without a 401/403. If the RLS policy ever gets accidentally overwritten, this is where it would surface.

**Commits (3):**
1. `feat: add getLastNDaysRateHistory server action`
2. `feat: add PublicRatesHistoryChart and HistoryPreviewSection components`
3. `feat: integrate public history preview into landing page`

---

### Step 5: `feat/daily-rate-granularity` (Change 5)

**Merge fifth.** Contains a Supabase migration — the most operationally significant step.

**STOP — involve developer before applying migration:**
> Apply `20260507000000_add_exchange_rates_index.sql` to the production Supabase instance before deploying this branch. The index is non-blocking on Postgres 15 (`CREATE INDEX IF NOT EXISTS` uses a concurrent build on Supabase by default), but verify this on the Supabase dashboard before proceeding.

**Migration procedure:**
1. Connect to the Supabase dashboard → SQL Editor.
2. Run the migration SQL.
3. Confirm the index appears in `\d exchange_rates`.
4. Then deploy the `feat/daily-rate-granularity` branch.

**Rollback plan:** `DROP INDEX IF EXISTS idx_exchange_rates_pair_fetched;` — safe, non-destructive. The `getDailyRateHistory` action will still work without the index (just slower).

**Commits (3):**
1. `feat: add DailyRatePoint type and getDailyRateHistory server action`
2. `feat: add granularity toggle and date picker to RatesHistoryChart`
3. `feat: add exchange_rates pair+fetched_at index migration`

---

### Step 6: `feat/shareable-rates-image` (Change 6)

**Merge last.** Depends on Change 3 (EUR rate must be in `RateData[]`). Largest change.

**Decision point: involve developer before adding dependency.**
> Before implementing, confirm `html-to-image` installs cleanly: `npm install html-to-image`. Check the current npm audit report. If there are high-severity advisories, reassess (the Canvas API fallback is available at no dependency cost).

**STOP — involve developer for image template review.**
> After the template component is built but before the PR is opened, share a screenshot of the generated image for design approval. The template's visual design (colors, font sizes, logo placement) should be reviewed before shipping.

**Commits (5):**
1. `feat: add html-to-image dependency`
2. `feat: add ShareRatesImageTemplate component with inline styles`
3. `feat: add ShareRatesButton with platform selector and generation logic`
4. `feat: wire ShareRatesButton into rates page title area`
5. `feat: add i18n strings for share rates dialog`

---

## Definition of Done — Per Change

| Change | Done when… |
|---|---|
| 1 — Logo | All logo instances navigate correctly; `tsc --noEmit` passes; no redirect cycle in Network tab. |
| 2 — Calculator | Both fields editable; swap works; no NaN on edge inputs; lint passes. |
| 3 — EUR history | Three lines visible in monthly chart; EUR bridges gaps; `tsc --noEmit` passes. |
| 4 — Public preview | History section visible on landing page while logged out; Sign In CTA navigates to `/login`; no 401 errors. |
| 5 — Daily granularity | Toggle works; intraday chart shows HH:mm axis; empty state handles no-data dates; DB index applied. |
| 6 — Shareable image | PNG downloads correctly on desktop; native share sheet on mobile; image contains correct rates and logo; html-to-image is lazy-loaded. |

## Definition of Done — Full Batch

- All 6 changes merged to `main`.
- `npm run build` passes with zero errors and zero TypeScript errors.
- `npm run lint` passes with zero errors.
- All manual QA checklists in `08-test-strategy.md` completed and checked off.
- DB migration applied to production.
- All 27 new i18n strings present in both `en.json` and `es.json`.

---

## Rollback Plans

| Change | Rollback method | Data at risk? |
|---|---|---|
| 1 — Logo | Revert PR. | None. |
| 2 — Calculator | Revert PR. | None. |
| 3 — EUR history | Revert PR. | None (DB rows for EUR_VES are not removed; the query just stops reading them). |
| 4 — Public preview | Revert PR. | None. |
| 5 — Daily granularity | Revert PR. Then run `DROP INDEX IF EXISTS idx_exchange_rates_pair_fetched;` if desired (safe). | None. Index drop is non-destructive. |
| 6 — Shareable image | Revert PR. Run `npm uninstall html-to-image` if desired. | None. |
