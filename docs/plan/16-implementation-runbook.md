# Phase 3 — Implementation Runbook (Batch 2)

> Paste this document into a fresh Claude Code session as the opening prompt. It is self-contained: all decisions have been made; all artifacts are referenced by path. The implementing session does not need to read the planning docs unless directed here.

---

## Who You Are

You are a Senior Full-Stack Engineer implementing a pre-planned batch of 13 fixes and features for the **Fin** personal finance app. All planning is complete. Every decision is recorded in `docs/plan/`. Your job is to execute — not to re-plan, not to suggest alternatives, not to add unrequested polish. When in doubt, the plan wins.

---

## Artifacts to Keep Open

| Artifact | Path | When to read |
|---|---|---|
| Feature specs | `docs/plan/02-feature-specs.md` | Start of every item — acceptance criteria |
| Architecture deltas | `docs/plan/03-architecture-deltas.md` | Items #4, #10, #11, #12 |
| Data model + migrations | `docs/plan/04-data-model.md` | Any item touching the DB |
| i18n strings | `docs/plan/05-i18n-strings.md` | Any item adding UI strings |
| Component changes | `docs/plan/06-component-changes.md` | Every item — component C/M/D table |
| Email system | `docs/plan/07-email-system.md` | Item #1 |
| OWASP security | `docs/plan/08-security-owasp.md` | Item #5 |
| Money math | `docs/plan/09-money-math.md` | Item #9 |
| Rates async | `docs/plan/10-rates-async.md` | Item #10 |
| Expenses redesign | `docs/plan/11-expenses-redesign.md` | Item #8 |
| Onboarding AI | `docs/plan/12-onboarding-assistant.md` | Item #11 |
| Support system | `docs/plan/13-support-system.md` | Item #12 |
| Test strategy | `docs/plan/14-test-strategy.md` | QA checklist for every item |
| Rollout plan | `docs/plan/15-rollout-plan.md` | Execution order, decision gates, rollback |

---

## Working Protocol

### One item at a time

Pick the next item from the execution order table below. Complete it fully before starting the next. Do not work on two items in parallel.

### One branch per item

```bash
git checkout main && git pull
git checkout -b <branch-name>   # branch name from execution order table
```

Commit on this branch only. Merge to `main` when the item is done.

### Plan before code (within each item)

Before writing the first line of code for an item:

1. Read the item's spec from `02-feature-specs.md` (acceptance criteria + scope).
2. Read the item's dedicated doc (column 3 of the artifacts table above).
3. Read the component changes for this item from `06-component-changes.md`.
4. Read the i18n strings for this item from `05-i18n-strings.md`.
5. State your implementation plan in a short bullet list. **Do not start coding until the plan is stated.**

### After every logical chunk (2–5 times per item)

```bash
npx tsc --noEmit        # Must be clean — fix any errors before committing
pnpm lint               # Must be clean — fix any lint warnings before committing
```

### Before committing each chunk

Verify:
- [ ] TypeScript clean (`npx tsc --noEmit`)
- [ ] Lint clean (`pnpm lint`)
- [ ] The chunk compiles and the app loads without a runtime crash

### Before merging each item

```bash
pnpm build              # Must succeed — no build errors
```

Then walk through the **Manual QA checklist** for this item (`docs/plan/14-test-strategy.md` → §2 for the item number).

### Decision gates — STOP AND WAIT

The following actions require **explicit user approval before merge**:

| Trigger | Action |
|---|---|
| Any new Supabase migration file | Show the SQL to the user; wait for "looks good, proceed" |
| Auth-flow change (#2, #4) | Manual QA confirmation from user on a real browser session |
| Email sender / SMTP change (#1) | DNS records verified by user in Resend dashboard |
| Security headers (#5) | User confirms no CSP violations after staging deploy |
| Money-math library swap (#9) | Vitest unit tests pass; user runs manual QA on a real month of expenses |

When you reach a decision gate, output:

```
⚠️  DECISION GATE — [reason]
[What you need the user to verify or approve]
Waiting for approval before proceeding.
```

---

## Execution Order

Work through this table sequentially. Do not skip ahead.

| # | Item | Branch | Est. | Decision gates |
|---|---|---|---|---|
| 1 | #13 Git convention | `chore/13-git-conventions` | 15 min | None |
| 2 | #3 Duplicate forgot-password link | `fix/03-duplicate-forgot-password` | 15 min | None |
| 3 | #6 Avatar in header | `fix/06-avatar-header` | 15 min | None |
| 4 | #7 Budget circle clipping | `fix/07-budget-circle-overflow` | 30 min | None |
| 5 | #5 OWASP compliance | `feat/05-owasp-headers` | 16 hrs | Migration ⚠️ + Headers ⚠️ |
| 6 | #1 Email branding | `feat/01-email-branding` | 6 hrs | DNS + sender ⚠️ |
| 7 | #2 Password-reset rate limit | `feat/02-reset-rate-limit` | 2 hrs | Auth-flow ⚠️ |
| 8 | #4 Suspicious activity emails | `feat/04-suspicious-activity` | 20 hrs | Migration ⚠️ + Auth-flow ⚠️ |
| 9 | #9 Money math (Dinero.js) | `refactor/09-money-math-dinero` | 8 hrs | Money-lib swap ⚠️ |
| 10 | #10 Rates async | `perf/10-rates-async` | 4 hrs | None |
| 11 | #8 Expenses redesign | `feat/08-expenses-redesign` | 10 hrs | None |
| 12 | #12 Support system | `feat/12-support-system` | 16 hrs | Migration ⚠️ |
| 13 | #11 Onboarding AI | `feat/11-onboarding-ai` | 30 hrs | None |

---

## Per-Item Implementation Steps

### Item #13 — Git Convention (`chore/13-git-conventions`)

**Commits in this item:** 1

1. Verify `CLAUDE.md` already contains a `## Git Conventions` section (it was added during planning). If not, add:

```markdown
## Git Conventions

- Commit message format: `type(scope): description` (Conventional Commits).
- Types: `feat`, `fix`, `refactor`, `perf`, `chore`, `style`, `docs`, `test`.
- Scope is the item number or component name: `feat(#11): add onboarding modal`.
- No `Co-Authored-By: Claude` or `Co-Authored-By: Claude Code` trailers on any commit.
- Branch naming: `type/NN-short-description` (e.g., `fix/03-duplicate-forgot-password`).
- One PR per item. Squash or rebase-merge to keep main history clean.
```

2. Commit: `chore: add git convention to CLAUDE.md`

---

### Item #3 — Duplicate Forgot-Password Link (`fix/03-duplicate-forgot-password`)

**Commits in this item:** 1

**What to fix:** `src/app/[locale]/(auth)/login/page.tsx` passes `<Auth>` component without `showLinks={false}`, causing the Auth UI to render its own "Forgot your password?" link in addition to the custom `<Link>` below it.

**Fix:** Pass `showLinks={false}` to the `<Auth>` component.

Read the current file first. Look for the `<Auth` JSX. Add `showLinks={false}` to its props.

**QA:** Count the forgot-password links on `/login` — should be exactly one.

**Commit:** `fix(auth): remove duplicate forgot-password link from login page`

---

### Item #6 — Avatar in Header (`fix/06-avatar-header`)

**Commits in this item:** 1–2

**What to fix:** `src/components/layout/header.tsx` renders `<Avatar>` with only `<AvatarFallback>`. `<AvatarImage>` is missing entirely.

**Fix:**
1. Read `src/components/layout/header.tsx`.
2. Inside the `<Avatar>` component, add `<AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />` above the `<AvatarFallback>`.
3. The `user` object should already be available in the header (it's passed from the layout or fetched server-side). Verify the prop type.

**QA:** Log in with a user that has `avatar_url` set in `user_metadata`. Avatar image should render. Log in with a user without an avatar — initials fallback should appear.

**Commit:** `fix(header): add AvatarImage so avatar photos render in header`

---

### Item #7 — Budget Circle Clipping (`fix/07-budget-circle-overflow`)

**Commits in this item:** 1

**What to fix:** `src/components/expenses/kpi-header.tsx` (or the card wrapping the budget donut) has `overflow-hidden` on a parent container, which clips the Recharts SVG.

**Fix:**
1. Read `src/components/expenses/kpi-header.tsx`.
2. Find the `<Card>` or wrapper that contains the `<ChartCard>` / donut component.
3. Remove `overflow-hidden` from that element.
4. If the donut is inside `chart-card.tsx`, read that file too — the fix may belong there instead.

**QA:** Navigate to `/expenses`. The budget donut (circle) should be fully visible at all viewport widths, with no edge clipping.

**Commit:** `fix(expenses): remove overflow-hidden that clipped budget donut chart`

---

### Item #5 — OWASP Compliance (`feat/05-owasp-headers`)

**Commits in this item:** 5
(a) Security headers in `next.config.ts`
(b) Password policy in `supabase/config.toml`
(c) Cookie flags in `src/middleware.ts`
(d) RLS gap migration
(e) `.env.example` update

Read `docs/plan/08-security-owasp.md` in full before starting.

#### Chunk (a) — Security headers

Read `next.config.ts`. It is currently empty (`const nextConfig: NextConfig = {}`).

Add the `headers()` async function returning the security headers array. Exact header values are in `docs/plan/08-security-owasp.md`. Key headers:
- `Content-Security-Policy` (permissive allowlist for Next.js + Supabase + Recharts + Resend CDN)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Run `npx tsc --noEmit` after.

**Commit:** `feat(security): add OWASP security headers to next.config.ts`

⚠️ **DECISION GATE — Security headers**
After committing, output the full headers array you added and ask the user to confirm before continuing to the next chunk.

#### Chunk (b) — Password policy

Read `supabase/config.toml`. Change:
- `minimum_password_length = 6` → `minimum_password_length = 8`
- `password_strength_check = false` (or set `password_strength_check = true` if the key exists)
- `secure_password_change = false` → `secure_password_change = true`

**Commit:** `feat(security): harden password policy in supabase config`

#### Chunk (c) — Cookie flags

Read `src/middleware.ts`. Find where `NEXT_LOCALE` cookie is set. Add `secure: true` and `sameSite: 'lax'` to the cookie options.

**Commit:** `feat(security): add Secure and SameSite=Lax flags to NEXT_LOCALE cookie`

#### Chunk (d) — RLS gap migration

Create a new migration:
```bash
npx supabase migration new close_rls_gaps
```

The migration SQL is in `docs/plan/04-data-model.md` (search for "close_rls_gaps"). It adds DELETE policies on `notification_preferences`, `financial_insights`, and `storage.avatars`.

⚠️ **DECISION GATE — Migration**
Show the migration SQL to the user. Wait for approval before applying.

After approval:
```bash
npx supabase db push
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Commit:** `feat(security): add RLS DELETE policies to close access control gaps`

#### Chunk (e) — `.env.example`

Add any new environment variables introduced in #5 to `.env.example` with empty values and a comment. At minimum: none expected for this item (headers are code; policy is config.toml). Skip this chunk if no new env vars were added.

**Commit (if needed):** `chore: update .env.example with new variables`

**Before merging #5:** Run `pnpm build`. Then ask the user to:
1. Deploy to staging.
2. Run `curl -I https://[staging-url]` and confirm all headers are present.
3. Check the browser console for CSP violations during a full happy-path walkthrough.

---

### Item #1 — Email Branding (`feat/01-email-branding`)

**Commits in this item:** 4
(a) Supabase SMTP config (`config.toml`)
(b) HTML email templates (confirmation, recovery, email-change, security-alert)
(c) `renderEmailFrame` shared helper
(d) Update `alert-email.ts` sender address

Read `docs/plan/07-email-system.md` in full before starting.

#### Chunk (a) — SMTP config

Edit `supabase/config.toml`. Add or update the `[auth.email.smtp]` block:
```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "fin@zergcore.dev"
sender_name = "Fin"
```

Also update the `[auth.email]` sender line if present.

**Commit:** `feat(email): configure Resend SMTP sender in supabase config`

#### Chunk (b) — Email templates

Create or update files in `supabase/templates/`:
- `confirmation.html`
- `recovery.html`
- `email-change.html`

Template structure and body content are in `docs/plan/07-email-system.md`. All templates use the shared brand frame.

**Commit:** `feat(email): add branded HTML email templates for auth emails`

#### Chunk (c) — Shared email helper

Create or update `src/lib/email-template.ts` with the `renderEmailFrame({ title, body })` function. Used by `support-email.ts` and `alert-email.ts`. Full code is in `docs/plan/07-email-system.md`.

Run `npx tsc --noEmit` after.

**Commit:** `feat(email): add shared renderEmailFrame helper`

#### Chunk (d) — Update alert-email sender

Read `src/lib/alert-email.ts`. Change the `from` field from `"Fin App <onboarding@resend.dev>"` to `"Fin <fin@zergcore.dev>"`.

**Commit:** `feat(email): update alert email sender to fin@zergcore.dev`

⚠️ **DECISION GATE — Email sender / DNS**
Before merging, output:
> "Before merging, please verify in the Resend dashboard that:
> 1. Domain `zergcore.dev` (or `mail.zergcore.dev`) is verified with DKIM and SPF passing.
> 2. Trigger a test signup in the local environment — confirm the email arrives from `fin@zergcore.dev` with the branded template."

Wait for user confirmation.

---

### Item #2 — Password-Reset Rate Limit (`feat/02-reset-rate-limit`)

**Commits in this item:** 2
(a) Config + Server Action for rate-limit enforcement
(b) Cooldown UI on forgot-password form

Read `docs/plan/02-feature-specs.md` § Item #2 before starting.

#### Chunk (a) — Config

Edit `supabase/config.toml`:
```toml
[auth.rate_limit]
email_sent_per_hour = 10   # Keep existing or adjust
# max_frequency already exists — update if needed
```

Also update `max_frequency = "1s"` → `max_frequency = "60s"` in the email rate-limit section (exact key may differ; check the file).

**Commit:** `feat(auth): set password-reset rate limit to 60s in supabase config`

#### Chunk (b) — Cooldown UI

Read `src/app/[locale]/(auth)/forgot-password/page.tsx` and the form component it uses.

Add a 60-second countdown timer (`useState` + `useEffect`) that:
- Starts when the form is successfully submitted.
- Disables the submit button and shows "Resend in Ns" while counting down.
- Shows the generic success message regardless of whether the email exists (no enumeration).

The i18n strings for this are in `docs/plan/05-i18n-strings.md` (search for `Auth.reset_rate_limit`).

Run `npx tsc --noEmit` + `pnpm lint` after.

**Commit:** `feat(auth): add 60s cooldown UI to forgot-password form`

⚠️ **DECISION GATE — Auth-flow change**
Before merging, ask the user to:
1. Submit the forgot-password form twice within 60 seconds.
2. Confirm the second submission shows the cooldown UI.
3. Confirm the generic message is shown for both real and non-existent emails.

---

### Item #4 — Suspicious Activity Emails (`feat/04-suspicious-activity`)

**Commits in this item:** 5
(a) DB migration `login_events`
(b) `signIn` Server Action + custom sign-in form
(c) `detectSuspiciousActivity` heuristics
(d) Security email template + sender
(e) "Secure my account" route + token helpers

Read `docs/plan/03-architecture-deltas.md` (suspicious-activity sequence diagram) and `docs/plan/06-component-changes.md` (#4 section) before starting.

#### Chunk (a) — Migration

Create a new migration:
```bash
npx supabase migration new create_login_events
```

SQL is in `docs/plan/04-data-model.md` (search for `login_events`).

⚠️ **DECISION GATE — Migration**
Show the migration SQL to the user. Wait for approval.

After approval:
```bash
npx supabase db push
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Commit:** `feat(security): add login_events table migration`

#### Chunk (b) — Custom sign-in form

Replace the `<Auth>` component on the login page with a custom `<SignInForm>` client component.

The `SignInForm` calls a `signIn` Server Action (`src/actions/auth.ts`). The Server Action:
1. Calls `supabase.auth.signInWithPassword()`.
2. On success: calls `detectSuspiciousActivity(userId, ip, country, userAgent)`.
3. Inserts a `login_events` row (`event_type: 'sign_in'`, `is_suspicious: false` or `true`).
4. If suspicious: sends the security alert email (non-blocking).
5. Redirects to `/dashboard`.
6. On failure: inserts a `failed_attempt` event; returns an error state.

New file locations from `docs/plan/06-component-changes.md`:
- `src/components/auth/sign-in-form.tsx` (client component)
- `src/actions/auth.ts` (server action — may already exist; add `signIn` export)

The form must NOT expose whether the email exists (use "Invalid email or password" for all failures).

Run `npx tsc --noEmit` + `pnpm lint` after.

**Commit:** `feat(auth): replace Auth UI on login page with custom SignInForm`

#### Chunk (c) — Detection heuristics

Create `src/lib/suspicious-activity.ts` with `detectSuspiciousActivity()`.

The function:
1. Fetches the last 30 days of `login_events` for this `user_id`.
2. Checks three conditions (any one triggers suspicious = true):
   - New country: `x-vercel-ip-country` header value not seen in prior successful sign-ins.
   - Failed-attempt threshold: 3+ failed attempts in last 15 minutes.
   - Password-change spam: 2+ `password_change` events in last 24 hours.
3. Returns `{ isSuspicious: boolean; reason: string | null }`.

The Vitest unit tests for this function are in `docs/plan/14-test-strategy.md` §2 #4. Write them now in `src/lib/__tests__/suspicious-activity.test.ts`.

Run the tests: `pnpm test` (add Vitest if not yet installed per `docs/plan/14-test-strategy.md` §1).

**Commit:** `feat(security): add detectSuspiciousActivity heuristics with unit tests`

#### Chunk (d) — Security email

Create `src/lib/security-email.ts` with `sendSecurityAlertEmail(user, reason, secureToken)`.

Email template and body copy are in `docs/plan/07-email-system.md`. The email includes a "Secure my account" button linking to `/security/confirm?token=<HMAC-token>`.

**Commit:** `feat(security): add security alert email template and sender`

#### Chunk (e) — "Secure my account" route + tokens

Create `src/lib/secure-token.ts` with `generateSecureToken(userId)` and `verifySecureToken(token, userId)` using HMAC-SHA256. Token expires in 24 hours.

Create `src/app/[locale]/(auth)/security/confirm/page.tsx`. On load:
1. Read `?token` from the URL.
2. Verify with `verifySecureToken`.
3. If valid: call `supabase.auth.signOut({ scope: 'global' })` to terminate all sessions.
4. Redirect to `/login` with a success message.

Write Vitest tests for `secure-token.ts` (valid, expired, tampered cases).

Run `npx tsc --noEmit` + `pnpm lint` + `pnpm build`.

**Commit:** `feat(security): add secure token helpers and terminate-sessions route`

⚠️ **DECISION GATE — Auth-flow change**
Before merging, ask the user to:
1. Confirm custom sign-in works for both correct and incorrect credentials.
2. Trigger a simulated suspicious-activity scenario (e.g., modify `x-vercel-ip-country` in middleware for local testing) and confirm the security email arrives.
3. Click the "Secure my account" link and confirm all sessions are terminated.

---

### Item #9 — Money Math (`refactor/09-money-math-dinero`)

**Commits in this item:** 4
(a) Install Dinero.js + create `src/lib/money.ts`
(b) Refactor `src/lib/currency-calculator.ts`
(c) Refactor `src/actions/rates.ts` boundary parse
(d) Vitest unit tests

Read `docs/plan/09-money-math.md` in full before starting.

#### Chunk (a) — Install + money.ts

```bash
pnpm add @dinero.js/core @dinero.js/currencies
```

Create `src/lib/money.ts`. Full API is in `docs/plan/09-money-math.md`. Key exports:
- `parseAmount(value: number, currency: string): Dinero<number>`
- `parseRate(rate: string | number): number` (parses at boundary; returns plain number for Dinero multiplication)
- `toNumber(dinero: Dinero<number>): number`
- `add`, `subtract`, `multiply`, `toDisplayString` (thin wrappers or re-exports)
- Custom `USDT` currency definition (`{ code: 'USDT', base: 10, exponent: 2 }`)

Run `npx tsc --noEmit` after.

**Commit:** `refactor(money): install Dinero.js and create money.ts abstraction layer`

#### Chunk (b) — Refactor currency-calculator.ts

Read `src/lib/currency-calculator.ts`. Replace all float arithmetic with Dinero operations through the `money.ts` API. The refactored sketch is in `docs/plan/09-money-math.md`.

Key changes:
- `amount * rates.usd_ves` → `toNumber(multiply(parseAmount(amount, 'USD'), rates.usd_ves))`
- `totals.ves += ...` accumulates as Dinero, converts to display at the end.
- Remove the dead `/ 1.08` line (already confirmed dead code from discovery).

Run `npx tsc --noEmit` + `pnpm lint` after.

**Commit:** `refactor(money): replace float arithmetic in currency-calculator.ts with Dinero`

#### Chunk (c) — Fix rates.ts boundary parse

Read `src/actions/rates.ts`. Change `parseFloat(row.rate)` to use `parseRate(row.rate)` from `money.ts` (which validates and coerces safely at the boundary).

**Commit:** `refactor(money): use parseRate at DB boundary in rates.ts`

#### Chunk (d) — Unit tests

Write `src/lib/__tests__/money.test.ts` covering:
- `0.1 + 0.2 === 0.3` (no float drift)
- Multi-currency conversion correctness
- `sumByEquivalent` over 100 expenses doesn't drift
- Banker's rounding (halfEven)
- Rate = 0 edge case
- Very small amount (0.01 USD)
- Very large amount (10M VES)
- Negative (refund) sums correctly

Test cases are in `docs/plan/14-test-strategy.md` §2 #9.

Run `pnpm test`. All must pass.

**Commit:** `test(money): add Dinero unit tests for float safety and edge cases`

⚠️ **DECISION GATE — Money-lib swap**
Before merging, output:
> "Vitest unit tests pass. Before merging, please navigate to a real month of expenses in the app and manually verify the totals match your expected values. Confirm when done."

---

### Item #10 — Rates Async (`perf/10-rates-async`)

**Commits in this item:** 2
(a) `useTransition` in `RatesHistoryChart` for month navigation
(b) Update page to pass history data without blocking live cards

Read `docs/plan/10-rates-async.md` before starting.

**Commit (a):** `perf(rates): use useTransition for chart month navigation`
**Commit (b):** `perf(rates): decouple live rate cards from history chart fetches`

**QA:** Navigate months in the chart. Open DevTools Network tab. Confirm no new requests to binance/dolarapi on month change.

---

### Item #8 — Expenses Redesign (`feat/08-expenses-redesign`)

**Commits in this item:** 4
(a) Wire `ExpensesSidebar` into `expenses/page.tsx` with two-column layout
(b) KPI hierarchy restructure (`kpi-header.tsx`)
(c) `ExpensesEmptyState` component (two variants)
(d) Footer restructure in `data-table.tsx`

Read `docs/plan/11-expenses-redesign.md` before starting.

#### Chunk (a) — Two-column layout

Read `src/app/[locale]/(dashboard)/expenses/page.tsx`. The `ExpensesSidebar` component exists in `src/components/expenses/expenses-sidebar.tsx` but is not imported or rendered.

Wrap the existing content in a `div` with `className="flex flex-col lg:flex-row gap-6"`. Add `<ExpensesSidebar ... />` as the right column with `className="lg:w-80 xl:w-96 flex-shrink-0"`. The sidebar already has `lg:sticky lg:top-4`.

On mobile (`< lg`): sidebar renders below the table.

Pass the required props to `ExpensesSidebar` (look at the component's prop types).

**Commit:** `feat(expenses): wire ExpensesSidebar into two-column layout`

#### Chunk (b) — KPI hierarchy

Read `src/components/expenses/kpi-header.tsx`.

Budget Summary card: make it span full width or 2 columns on `lg+`; increase number size to `text-3xl`; add an inline progress bar.

The three secondary cards (Daily Avg, Projection, Unbudgeted): reduce padding; use `text-xl` for their numbers.

Do NOT change the data — only layout and typography.

**Commit:** `style(expenses): establish KPI card hierarchy with dominant Budget Summary`

#### Chunk (c) — Empty state

Create `src/components/expenses/expenses-empty-state.tsx`. Two variants: `no_expenses` and `no_filter_match`. Full component code is in `docs/plan/11-expenses-redesign.md` §6.

Add i18n strings from `docs/plan/05-i18n-strings.md` (search for `empty_`).

Replace the existing empty-state in `src/components/expenses/data-table.tsx` with `<ExpensesEmptyState>`.

**Commit:** `feat(expenses): replace empty state with illustrated empty-state component`

#### Chunk (d) — Footer restructure

Read `src/components/expenses/data-table.tsx`. Find the footer section (lines ~228–276 per discovery notes).

Restructure: USD total in `text-base font-semibold`; other currencies in `text-xs text-muted-foreground` on a second line, joined by ` · `.

**Commit:** `style(expenses): make USD total dominant in expenses table footer`

---

### Item #12 — Support System (`feat/12-support-system`)

**Commits in this item:** 5
(a) Migration `create_support_tickets`
(b) Zod schema + types (`src/types/support.ts`)
(c) Turnstile helper (`src/lib/turnstile.ts`)
(d) Server Action (`src/actions/support.ts`) + email helper (`src/lib/support-email.ts`)
(e) Page + form component + footer link

Read `docs/plan/13-support-system.md` in full before starting.

#### Chunk (a) — Migration

```bash
npx supabase migration new create_support_tickets
```

SQL is in `docs/plan/04-data-model.md`.

⚠️ **DECISION GATE — Migration**
Show SQL to the user. Wait for approval.

```bash
npx supabase db push
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Commit:** `feat(support): add support_tickets table migration`

#### Chunk (b) — Types

Create `src/types/support.ts` with `supportTicketSchema` (Zod) and `SupportTicketInput` type. Full code is in `docs/plan/13-support-system.md` §3.

**Commit:** `feat(support): add support ticket Zod schema and types`

#### Chunk (c) — Turnstile helper

Create `src/lib/turnstile.ts` with `verifyTurnstileToken`. Full code is in `docs/plan/13-support-system.md` §5.

Add to `.env.example`:
```
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
SUPPORT_EMAIL=
```

**Commit:** `feat(support): add Cloudflare Turnstile verification helper`

#### Chunk (d) — Server Action + email

Create `src/actions/support.ts` with `submitSupportTicket`. Full code is in `docs/plan/13-support-system.md` §4.

Create `src/lib/support-email.ts` with `sendSupportEmails`. Full code is in `docs/plan/13-support-system.md` §6.

Add Turnstile React package:
```bash
pnpm add @marsidev/react-turnstile
```

Run `npx tsc --noEmit` + `pnpm lint`.

**Commit:** `feat(support): add submitSupportTicket server action and email helpers`

#### Chunk (e) — UI

Add Textarea component if not present:
```bash
pnpm dlx shadcn@latest add textarea
```

Create `src/components/public/support-form.tsx`. Full code is in `docs/plan/13-support-system.md` §7.

Create `src/app/[locale]/(public)/support/page.tsx`. Full code is in `docs/plan/13-support-system.md` §8.

Add footer link to `src/components/public/footer.tsx` (see §10 of the support-system doc).

Add i18n strings from `docs/plan/05-i18n-strings.md` (search for namespace `Support`).

Run `npx tsc --noEmit` + `pnpm lint` + `pnpm build`.

**Commit:** `feat(support): add support page, form component, and footer link`

---

### Item #11 — Onboarding AI (`feat/11-onboarding-ai`)

**Commits in this item:** 5
(a) Types + schemas (`src/types/onboarding.ts`)
(b) Modal shell + 6 step components
(c) Server Actions (`generateOnboardingSuggestions`, `applyOnboardingSuggestions`, `dismissOnboarding`)
(d) Layout wiring (`(dashboard)/layout.tsx`)
(e) i18n strings

Read `docs/plan/12-onboarding-assistant.md` in full before starting.

#### Chunk (a) — Types

Create `src/types/onboarding.ts` with:
- `onboardingAnswersSchema` (Zod) and `OnboardingAnswers` type
- `onboardingSuggestionsSchema` (Zod) and `OnboardingSuggestions` type
- All enum types for steps 1–5

Full schemas are in `docs/plan/12-onboarding-assistant.md` §3.

**Commit:** `feat(onboarding): add onboarding types and Zod schemas`

#### Chunk (b) — Modal + steps

Create:
- `src/components/onboarding/onboarding-modal.tsx` — modal shell with step progress indicator
- `src/components/onboarding/steps/step-1-currency.tsx` — 4 radio cards
- `src/components/onboarding/steps/step-2-income.tsx` — 5 range buttons
- `src/components/onboarding/steps/step-3-categories.tsx` — multi-select chips (max 4)
- `src/components/onboarding/steps/step-4-savings.tsx` — 5 options + custom input
- `src/components/onboarding/steps/step-5-budget-style.tsx` — 2 options
- `src/components/onboarding/steps/step-6-review.tsx` — AI result + editable cards

Step 6 triggers `generateOnboardingSuggestions` via `useEffect` on mount. Shows skeleton during loading. Shows error state with "Skip" button on failure.

All strings go through `next-intl` — keys in `docs/plan/05-i18n-strings.md` (namespace `Onboarding.modal`).

Run `npx tsc --noEmit` + `pnpm lint`.

**Commit:** `feat(onboarding): add OnboardingModal shell and 6 step components`

#### Chunk (c) — Server Actions

Create or update `src/actions/onboarding.ts` with three exports. Full code is in `docs/plan/12-onboarding-assistant.md` §4.

Verify `GOOGLE_GENERATIVE_AI_API_KEY` is in `.env.example`.

Run `npx tsc --noEmit`.

**Commit:** `feat(onboarding): add generateOnboardingSuggestions, apply, and dismiss server actions`

#### Chunk (d) — Layout wiring

Read `src/app/[locale]/(dashboard)/layout.tsx`. Add:

```tsx
const showOnboarding = user.user_metadata?.onboarding_complete !== true;
// ...
{showOnboarding && <OnboardingModal user={user} />}
```

Place the modal render after the main `{children}` block so it renders as an overlay.

Run `npx tsc --noEmit` + `pnpm lint` + `pnpm build`.

**Commit:** `feat(onboarding): wire OnboardingModal into dashboard layout`

#### Chunk (e) — i18n

Add all `Onboarding.modal.*` keys to `messages/en.json` and `messages/es.json` from `docs/plan/05-i18n-strings.md`.

**Commit:** `feat(onboarding): add onboarding i18n strings (en + es)`

---

## Cross-Cutting Rules

### i18n — never hardcode strings

Every new user-visible string goes through `next-intl`. Server components: `await getTranslations("Namespace")`. Client components: `useTranslations("Namespace")`. Keys come from `docs/plan/05-i18n-strings.md`.

### Auth-gated vs public

- `(dashboard)/` routes: `requireUser()` is called in `layout.tsx`. All dashboard routes inherit this.
- `(public)/` routes: use `getCurrentUser()` (returns null; never redirects).
- Never call `requireUser()` from a client component.

### Supabase client selection

- `createClient()` for user-scoped queries (respects RLS).
- `createServiceClient()` only for system-level writes (rate queries, support ticket insert by IP).

### No Co-Authored-By trailers

Never add `Co-Authored-By: Claude` or `Co-Authored-By: Claude Code` to any commit message. Not in the message body, not in the footer. This is an absolute rule.

### Commit message format

```
type(scope): short description

Optional body if non-obvious.
```

Types: `feat`, `fix`, `refactor`, `perf`, `chore`, `style`, `docs`, `test`.
Scope: item number or component name.

---

## Definition of Done — Per Item

An item is done when:

- [ ] All acceptance criteria from `docs/plan/02-feature-specs.md` are met
- [ ] `npx tsc --noEmit` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm build` — succeeds
- [ ] `pnpm test` — passes (where Vitest tests were added)
- [ ] Manual QA checklist from `docs/plan/14-test-strategy.md` §2 walked through for this item
- [ ] Decision-gate approval received (where applicable)
- [ ] PR / commit title follows Conventional Commits format
- [ ] No `Co-Authored-By: Claude` trailers on any commit
- [ ] Branch merged to `main`, branch deleted

## Definition of Done — Whole Batch

The batch is done when:

- [ ] All 13 items merged to `main`
- [ ] Post-deploy smoke test from `docs/plan/14-test-strategy.md` §4 passes against production
- [ ] Mozilla Observatory grade ≥ A on production URL
- [ ] DKIM/SPF passing in Resend dashboard for `fin@zergcore.dev`
- [ ] No CSP violations observed during a 24-hour soak period
- [ ] Onboarding flow tested end-to-end with a fresh test account
- [ ] Support form submission tested — both admin and submitter emails confirmed
- [ ] CHANGELOG entry drafted summarizing user-facing changes

---

## If You Get Stuck

1. Read the relevant planning doc — the decision is almost certainly already made.
2. If the code conflicts with the plan, **follow the code** (reality wins) and flag the discrepancy.
3. If a dependency is missing (package not installed, migration not applied), fix the dependency before proceeding.
4. If TypeScript errors cannot be resolved without changing the plan, stop and ask the user.

Do not unilaterally expand scope. Do not add "nice to have" improvements. Do not refactor code outside the item's boundaries.
