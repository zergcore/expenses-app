# Phase 3 — Test Strategy (Batch 2)

> What to test, at which layer, with which tool. v1 ships without a formal Vitest/Playwright suite — the project does not currently include them. Tests below are split between **manual QA** (always required for v1) and **automated** (recommended; effort to add the test runner is itemized).

---

## 1. Tooling Status

| Tool | Currently in repo | Decision for batch 2 |
|---|---|---|
| Vitest | ❌ Not installed | **Add** for `currency-calculator` and `suspicious-activity` modules (high-value pure logic) |
| Playwright | ❌ Not installed | Defer. Manual QA covers v1; Playwright is a follow-up. |
| TypeScript (`tsc --noEmit`) | ✅ Available | Required pass per chunk |
| ESLint | ✅ Available | Required pass per chunk |
| `next build` | ✅ Available | Required pass before merging each item |

### Adding Vitest (estimated ~30 min)

```bash
pnpm add -D vitest @vitest/ui jsdom
# add scripts to package.json:
#   "test": "vitest run",
#   "test:watch": "vitest"
```

Place tests next to source as `*.test.ts` or in `__tests__/` folders. Vitest auto-discovers.

---

## 2. Per-Item Test Plan

### #1 — Email Branding

| Test | Type | How |
|---|---|---|
| Resend domain DKIM/SPF passing | Manual | Resend dashboard verification status |
| Signup email arrives from `fin@zergcore.dev` | Manual QA | Trigger signup with a real address; confirm sender |
| Recovery email renders branded template | Manual QA | Trigger reset; check rendered HTML in Gmail web + iOS Mail |
| Email change emails sent to BOTH old and new | Manual QA | Update email in Settings; confirm two emails received |
| Plain-text fallback exists | Manual QA | Gmail "Show original" — `text/plain` part has reasonable content |
| Inbucket (local) still captures dev emails | Manual QA | `npx supabase start`, trigger signup, view `http://127.0.0.1:54324` |

### #2 — Password-Reset Rate Limiting

| Test | Type | How |
|---|---|---|
| `max_frequency = "60s"` enforced server-side | Manual QA | Submit reset for same email twice within 60s; second submission errors |
| Cooldown UI shows countdown after success | Manual QA | Submit; verify "Resend in Ns" decrements |
| Submit disabled during cooldown | Manual QA | Confirm button `disabled` for full 60 s |
| Generic message shown regardless of email existence | Manual QA | Submit for `nobody@example.com`; same success message as for a real account |

### #3 — Duplicate Forgot Password Link

| Test | Type | How |
|---|---|---|
| Exactly one forgot-password link on `/login` | Manual QA | Visual count |
| Custom link still navigates to `/forgot-password` | Manual QA | Click and verify route |

### #4 — Suspicious-Activity Emails

| Test | Type | How |
|---|---|---|
| `detectSuspiciousActivity` — new country | **Vitest unit** | Mock supabase client returning prior `sign_in` with different country; assert `isSuspicious=true, reason='new_country'` |
| `detectSuspiciousActivity` — failed-attempt threshold | **Vitest unit** | Mock 3 failed attempts in last 15 min; assert `reason='failed_attempt_threshold'` |
| `detectSuspiciousActivity` — password-change spam | **Vitest unit** | Mock 2 password changes in last 24h; assert `reason='password_change_spam'` |
| `verifySecureToken` valid within 24h | **Vitest unit** | Generate token, verify; assert valid |
| `verifySecureToken` rejects expired token | **Vitest unit** | Mock Date.now ahead by 25h; assert invalid |
| `verifySecureToken` rejects tampered token | **Vitest unit** | Mutate token; assert invalid |
| Custom sign-in form rejects bad credentials | Manual QA | Wrong password; confirm "Invalid email or password" + no enumeration |
| Suspicious sign-in inserts `login_events` row | Manual QA | SQL: `SELECT * FROM login_events WHERE user_id = ?` after triggered scenario |
| Security email arrives | Manual QA | Use a different VPN region or simulate `x-vercel-ip-country` header in dev (override via middleware) |
| "Secure my account" link terminates all sessions | Manual QA | Open two browser sessions; click the link; confirm both signed out |

### #5 — OWASP Compliance

| Test | Type | How |
|---|---|---|
| All security headers present in production response | Automated/Manual | `curl -I https://[host]` — check CSP, HSTS, X-Frame-Options, etc. |
| Mozilla Observatory grade ≥ A | Manual | https://observatory.mozilla.org/ |
| Password < 8 chars rejected | Manual QA | Sign up with `1234567`; expect rejection |
| Password without digits rejected | Manual QA | Sign up with `abcdefgh`; expect rejection |
| `secure_password_change` enforced | Manual QA | Try changing password without recent re-auth; expect rejection |
| RLS DELETE works on `notification_preferences` | **Vitest integration** (with local Supabase) or Manual SQL | DELETE as user; succeeds. DELETE as another user; fails. |
| RLS DELETE works on `financial_insights` | Same | Same |
| RLS DELETE works on `storage.avatars` | Manual QA | Delete avatar from Profile; confirm gone |
| Camera API still works under Permissions-Policy | Manual QA | Open receipt scanner; permission prompt + capture works |
| `next/image` renders avatar from Supabase storage | Manual QA | Upload avatar; verify `<img>` from Next.js's image proxy loads |
| `NEXT_LOCALE` cookie has `Secure` and `SameSite=Lax` | Manual QA | DevTools → Application → Cookies |

### #6 — Avatar in Header

| Test | Type | How |
|---|---|---|
| Avatar image renders for users with `avatar_url` | Manual QA | Login with user that has avatar; verify image visible |
| Initials fallback for users without `avatar_url` | Manual QA | Login with new user; verify initials |
| Broken `avatar_url` falls back to initials | Manual QA | Manually set bad URL in `user_metadata`; verify fallback |

### #7 — Budget Circle Clipping

| Test | Type | How |
|---|---|---|
| Donut chart fully visible (no edge clip) | Manual QA | Visual check at all viewport widths (mobile, tablet, desktop) |
| Gradient accent still displays | Manual QA | Visual check |

### #8 — Expenses Redesign

| Test | Type | How |
|---|---|---|
| Two-column layout on desktop | Manual QA | Resize to ≥ 1024px; confirm side-by-side |
| Single column on mobile | Manual QA | Resize to ≤ 768px; sidebar moves below table |
| Empty state CTA opens add-expense flow | Manual QA | Empty month; click CTA |
| "No filter match" empty state | Manual QA | Apply filter that excludes all rows; confirm distinct empty state |
| Footer USD prominence | Manual QA | Visual hierarchy review |
| Lighthouse layout shift < 0.1 | Automated | Run Lighthouse before/after merging #8 |

### #9 — Money Math (Dinero.js)

| Test | Type | How |
|---|---|---|
| `0.1 + 0.2 = 0.3` (no float drift) | **Vitest unit** | `expect(toNumber(add(parseAmount(0.1, "USD"), parseAmount(0.2, "USD")))).toBe(0.3)` |
| Multi-currency conversion correctness | **Vitest unit** | Hand-computed expected vs `calculateEquivalents` output for known rates |
| `sumByEquivalent` over 100 expenses doesn't drift | **Vitest unit** | Sum 100 × 0.10 USD; expect 10.00 exactly |
| Banker's rounding (halfEven) | **Vitest unit** | 12.345 → 12.34 (rounds to even); 12.355 → 12.36 |
| Conversion when rate is 0 (missing data) | **Vitest unit** | Returns 0 for that currency, doesn't NaN |
| Edge: very small amount (0.01 USD) | **Vitest unit** | Conversion preserves ≥ 1 cent |
| Edge: very large amount (10M VES) | **Vitest unit** | No overflow |
| Edge: negative (refund) | **Vitest unit** | Sums correctly |
| End-to-end: real month of mixed expenses | Manual QA | Manually compute expected total; compare to UI total |

### #10 — Rates Async

| Test | Type | How |
|---|---|---|
| Live rate cards do NOT re-fetch on month change | Manual QA | DevTools Network → filter for binance/dolarapi; navigate months; confirm no new requests |
| Chart updates on month change | Manual QA | Visual check; chart data changes |
| URL updates with month change | Manual QA | DevTools URL bar |
| Direct deep-link to `/rates?granularity=day&date=2026-05-06` works | Manual QA | Navigate; chart loads correct day |
| Back button restores previous chart state | Manual QA | Navigate forward then back; chart updates |
| `isPending` loading state visible | Manual QA | Throttle network; chart shows opacity-50 transition |

### #11 — Onboarding AI

| Test | Type | How |
|---|---|---|
| Modal appears on first dashboard visit | Manual QA | Register new user; confirm modal opens |
| Modal does not appear after `onboarding_complete=true` | Manual QA | Complete or skip; reload; confirm not shown |
| All 6 steps reachable | Manual QA | Walk through each step |
| Step 6 calls AI; shows skeleton | Manual QA | Visual + Network |
| AI returns valid schema (Zod-validated) | Manual QA | Inspect Network response; confirm structure matches schema |
| "Apply" creates budgets in DB | Manual QA | SQL `SELECT * FROM budgets WHERE user_id=?` after applying |
| "Skip" sets onboarding flag without creating budgets | Manual QA | SQL after skip; confirm 0 budgets, flag set |
| AI failure → recoverable error state | Manual QA | Disable network during Step 6; verify error UI + Skip available |
| No PII (exact income) in prompt | Manual QA / **Vitest unit** | Test `buildOnboardingPrompt` output; assert no exact income leakage |

### #12 — Support System

| Test | Type | How |
|---|---|---|
| Form submission succeeds end-to-end | Manual QA | Fill, pass Turnstile, submit; receive both emails |
| Logged-in user sees prefilled name + email | Manual QA | Login first, navigate to `/support` |
| Logged-out user sees empty form | Manual QA | Visit anonymously |
| Validation errors inline | Manual QA | Submit with empty fields |
| Failed Turnstile blocks submission | Manual QA | Manually clear/break the Turnstile token |
| Honeypot detection: silent success | **Vitest unit** | Mock formData with `website` set; assert no DB insert, status `success` returned |
| Rate limit: 4th submission in same hour blocked | Manual QA | Submit 4 times; expect rate-limit error on 4th |
| Admin email arrives at `SUPPORT_EMAIL` | Manual QA | Resend dashboard / inbox |
| Submitter confirmation arrives | Manual QA | Inbox |
| HTML escape of user content in emails | **Vitest unit** | Test `escape()` helper with `<script>` payload |

### #13 — Git Convention

| Test | Type | How |
|---|---|---|
| `CLAUDE.md` includes Git Conventions section | Manual | Read file |
| Implementation session honors no-trailer rule | Process | Code review of generated commits |

---

## 3. Cross-cutting Tests (every chunk)

Per the implementation runbook, every chunk must pass:

```bash
npx tsc --noEmit             # No TS errors
pnpm lint                    # ESLint clean
pnpm build                   # Production build succeeds
pnpm test                    # If/once Vitest is added
```

---

## 4. Manual QA Smoke (post-deploy gate)

Before declaring the batch shipped, walk through this 10-minute smoke test:

1. Sign up new account → confirmation email arrives + branded
2. Sign in → dashboard loads → onboarding modal appears
3. Complete onboarding → 4 budgets created, modal closes
4. Add an expense → appears in expenses table + sidebar updates
5. Visit /rates → live cards + history chart load
6. Navigate months in chart → live cards don't refetch (Network tab)
7. Click avatar in header → see your photo (after upload)
8. Visit /support while logged out → submit form → receive confirmation email
9. Log out → on /login: ONE forgot-password link
10. Click forgot password → submit twice → second submission cooled down
11. `curl -I` against deployed URL → all headers present

---

## 5. Test-First Priorities

If only 5 tests can be written before merging this batch, write these:

1. **Money math**: `0.1 + 0.2 = 0.3` and conversion correctness (Vitest unit)
2. **Suspicious activity**: new-country detection (Vitest unit)
3. **Suspicious activity**: failed-attempt threshold (Vitest unit)
4. **Secure token**: HMAC verify accepts valid, rejects expired/tampered (Vitest unit)
5. **OWASP headers**: post-deploy `curl -I` script + Mozilla Observatory check

These cover the highest-stakes correctness/security surfaces.
