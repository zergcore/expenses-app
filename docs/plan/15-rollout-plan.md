# Phase 3 — Rollout Plan (Batch 2)

> Branching, ordering, definition of done, and rollback per item. Designed for sequential single-developer execution with infrequent merge windows.

---

## 1. Branching Strategy

### Pattern

```
main
 ├── chore/13-git-conventions
 ├── fix/03-duplicate-forgot-password
 ├── fix/06-avatar-header
 ├── fix/07-budget-circle-overflow
 ├── feat/05-owasp-headers
 ├── feat/01-email-branding
 ├── feat/02-reset-rate-limit
 ├── feat/04-suspicious-activity
 ├── refactor/09-money-math-dinero
 ├── perf/10-rates-async
 ├── feat/08-expenses-redesign
 ├── feat/12-support-system
 └── feat/11-onboarding-ai
```

### One branch per item
Each item gets its own branch. Each branch lands as **one PR** with **2–5 commits** following Conventional Commits. Merge style: squash or rebase-merge — preserves clean main history.

### Multi-commit decomposition (within a branch)
Per the runbook, each item splits into 2–5 commits along natural seams. Examples:

- **#5 OWASP**: (a) headers in `next.config.ts`, (b) password policy in `config.toml`, (c) cookie flags in middleware, (d) RLS gap migration, (e) `.env.example` update.
- **#4 Suspicious activity**: (a) DB migration `login_events`, (b) `signIn` Server Action + sign-in form, (c) `detectSuspiciousActivity` heuristics, (d) email template + sender, (e) "secure my account" route + token helpers.
- **#11 Onboarding**: (a) types + schemas, (b) modal shell + step components, (c) Server Actions, (d) layout wiring, (e) i18n strings.

---

## 2. Recommended Execution Order

(Mirrors `02-feature-specs.md` — replicated here for handoff convenience.)

| Order | Item | Branch | Estimated effort | Decision gates |
|---|---|---|---|---|
| 1 | #13 Git convention | `chore/13-git-conventions` | 15 min | None |
| 2 | #3 Duplicate link | `fix/03-duplicate-forgot-password` | 15 min | None |
| 3 | #6 Avatar | `fix/06-avatar-header` | 15 min | None |
| 4 | #7 Budget circle | `fix/07-budget-circle-overflow` | 30 min | None |
| 5 | #5 OWASP | `feat/05-owasp-headers` | 16 hrs | **Migration** ⚠️ + **Header changes** ⚠️ |
| 6 | #1 Email branding | `feat/01-email-branding` | 6 hrs + DNS | **Sender/domain change** ⚠️ |
| 7 | #2 Reset rate limit | `feat/02-reset-rate-limit` | 2 hrs | **Auth-flow change** ⚠️ |
| 8 | #4 Suspicious activity | `feat/04-suspicious-activity` | 20 hrs | **Migration** ⚠️ + **Auth-flow change** ⚠️ |
| 9 | #9 Money math | `refactor/09-money-math-dinero` | 8 hrs | **Money-lib swap** ⚠️ |
| 10 | #10 Rates async | `perf/10-rates-async` | 4 hrs | None |
| 11 | #8 Expenses redesign | `feat/08-expenses-redesign` | 10 hrs | None |
| 12 | #12 Support system | `feat/12-support-system` | 16 hrs | **Migration** ⚠️ |
| 13 | #11 Onboarding AI | `feat/11-onboarding-ai` | 30 hrs | None |

⚠️ = Decision gate requires user approval before merge (see §3).

---

## 3. Decision Gates (require approval before merging)

These items modify shared/external state — pause for explicit user sign-off before merge:

| Trigger | Why | What to verify |
|---|---|---|
| Any Supabase migration | DB schema change, hard to undo | Migration file reviewed; tested on local Supabase via `npx supabase db reset`; rollback SQL drafted |
| Auth-flow change (#2, #4) | Affects sign-in/sign-out paths; can lock users out | Manual QA from a fresh browser; verify both happy and error paths |
| Email sender change (#1) | Reputation + deliverability risk | DNS records verified in Resend dashboard; staging signup test successful |
| Security-headers change (#5) | Strict CSP can break the app | Deploy to staging first; check console for CSP violations during a full happy-path walkthrough |
| Money-lib swap (#9) | Touches calculation core | Vitest unit tests pass; manual QA on a real month of expenses verifies totals |

Each decision gate corresponds to a hold point in the implementation runbook (`16-implementation-runbook.md`) where the implementing session must pause.

---

## 4. Definition of Done — per item

For an item to be considered "Done":

- [ ] All acceptance criteria from `02-feature-specs.md` (Batch 2 section) are met
- [ ] `npx tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm build` succeeds
- [ ] Vitest tests (where applicable) pass
- [ ] Manual QA checklist from `14-test-strategy.md` walked through
- [ ] Decision-gate approval received (where applicable)
- [ ] PR title follows Conventional Commits format
- [ ] No `Co-Authored-By: Claude` trailers on any commits in the PR
- [ ] Branch merged to `main`, branch deleted

## 5. Definition of Done — for the whole batch

- [ ] All 13 items merged to `main`
- [ ] Post-deploy smoke test (§4 in `14-test-strategy.md`) passes against production
- [ ] Mozilla Observatory grade ≥ A on production URL
- [ ] DKIM/SPF passing in Resend dashboard for `mail.zergcore.dev` (or chosen subdomain)
- [ ] No CSP violations observed during a 24-hour soak period (CSP can be deployed in report-only mode first if uncertainty remains)
- [ ] Onboarding flow tested end-to-end with a fresh test account
- [ ] Support form submission tested with all email recipients confirmed
- [ ] CHANGELOG entry (or release notes) drafted summarizing user-facing changes

---

## 6. Rollback Per Item

| Item | Rollback action | Recovery time |
|---|---|---|
| #1 Email branding | Comment out `[auth.email.smtp]` in `config.toml` → Supabase falls back to built-in SMTP | < 5 min |
| #2 Reset rate limit | Revert `max_frequency = "1s"` in `config.toml`; restore `<Auth>` form on forgot-password page | < 10 min |
| #3 Duplicate link | Remove `showLinks={false}` (1 line revert) | < 1 min |
| #4 Suspicious activity | Restore `<Auth>` on login page (revert `login/page.tsx`); leave `login_events` migration in place (table is additive) | < 10 min |
| #5 OWASP — headers | Comment out `headers()` in `next.config.ts` and redeploy | < 5 min |
| #5 OWASP — password policy | Revert `config.toml` values; existing users unaffected (only signups blocked) | < 5 min |
| #5 OWASP — RLS gap migration | Drop the policies via reverse migration: `DROP POLICY ... ON ...;` | < 5 min |
| #6 Avatar | Remove `<AvatarImage>` line | < 1 min |
| #7 Budget circle | Re-add `overflow-hidden` to the card | < 1 min |
| #8 Expenses redesign | Revert page.tsx + components | < 10 min |
| #9 Money math | Revert `currency-calculator.ts`, `money.ts`, `rates.ts`, `expenses.ts`; remove deps from `package.json` | < 15 min |
| #10 Rates async | Revert `rates-history-chart.tsx` + `page.tsx` to URL-driven version | < 5 min |
| #11 Onboarding AI | Remove `<OnboardingModal>` from layout (1-line gate); modal stops appearing instantly. Existing budgets created during onboarding remain — they're real budgets, no orphan cleanup needed | < 5 min |
| #12 Support system | Delete the route file and the footer link; the `support_tickets` table is additive (leave or drop) | < 5 min |
| #13 Git convention | Revert CLAUDE.md change | < 1 min |

### Migration rollback templates

```sql
-- Rollback for create_login_events
DROP TABLE IF EXISTS public.login_events;

-- Rollback for create_support_tickets
DROP TABLE IF EXISTS public.support_tickets;

-- Rollback for close_rls_gaps
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete own financial insights" ON public.financial_insights;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
```

---

## 7. Deployment Phases

### Phase A: Quick wins (low risk)
Items #13, #3, #6, #7. Total ~1 hour. Deploy together as one push (or 4 small PRs merged in sequence).

### Phase B: Security baseline
Items #5, #1, #2. Total ~24 hours work. **Deploy each item separately** — each has decision gates and independent rollback paths. CSP changes deserve a 24-hour soak in production with the report-only header before flipping to enforcing.

### Phase C: Authentication hardening
Item #4 (suspicious activity). **Deploy alone**, monitor `login_events` for first 48 hours, verify suspicious-detection email rate is reasonable (no flood).

### Phase D: Tech-debt + perf
Items #9, #10. Independent. #9 lands first to stabilize calc layer; #10 lands afterwards.

### Phase E: UX
Item #8 (expenses redesign). Independent.

### Phase F: New features
Items #12, #11. #12 first because #11 is largest and benefits from email infra (#1) being settled.

---

## 8. Production Verification Steps

After each phase:

1. **Smoke test** the affected user flow.
2. **Network check** (DevTools) — no unexpected requests, no failed CSP fetches.
3. **Sentry / Vercel logs** — no spike in errors.
4. **Supabase dashboard** — Auth logs healthy, no anomalous query patterns.
5. **Resend dashboard** (after Phase B/C/F) — bounces ≤ 1%, complaints = 0.

---

## 9. Communication

- Each merged item: 1 line in CHANGELOG.
- Phase B and C completion: notify the user (email/Slack/etc.) — these touch sign-in.
- Suspicious-activity (#4) deployment: include a short user note in product update channels: "We've added new sign-in security features. You may receive an email if we notice unusual activity."

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Resend domain DNS propagation slow | Medium | Email delivery delay | Setup 24+ hrs before #1 deploy |
| CSP breaks Recharts or theme flicker | Medium | Charts/UI broken | Report-only mode first, fix violations, then enforce |
| Suspicious-activity false-positive flood | Medium | User confusion / unsubscribes | Rate-limit alerts to 1/email/24h; monitor first 48 hrs |
| Custom sign-in form regression | Low | Users locked out | Manual QA on multiple browsers; rollback path is one revert |
| Dinero migration calculation regression | Low | Wrong totals shown | Vitest tests + manual QA on real month |
| Onboarding AI generates absurd amounts | Low | User confused | Zod schema enforces `.positive()`; manual review by user during Step 6 |
| Turnstile widget incompatibility | Low | Form unsubmittable | `@marsidev/react-turnstile` is well-maintained; test in dev before prod |

---

## 11. Soft Pause Points

After Phase B (Security baseline) and Phase C (Authentication) — **stop and verify** for 48 hours before continuing. Both touch the most critical surface (auth + headers); regressions surface within hours of real traffic.

After Phase E (Expenses redesign) — verify users adapt without a flood of "where did X go?" feedback.

---

## 12. Effort + Duration Estimate

- **Effort (engineer hours):** ~113 hrs
- **Calendar duration (1 dev, with reviews + decision gates):** ~3 weeks (~25 working days at 4–5 effective hrs/day)
- **Critical path:** #5 → #1 → #4 (sequential due to decision gates and dependency on email infra)
