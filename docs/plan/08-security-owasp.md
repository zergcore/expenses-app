# Phase 3 — Security & OWASP (Batch 2)

> Item #5 (with overlaps to #2, #4, #9, #12). Target: **OWASP ASVS Level 1 baseline + Level 2 controls for authentication and session management.**

---

## 1. OWASP Top 10 (2021) — Mapping to Fin

| Category | Current state | Required actions | Items |
|---|---|---|---|
| **A01 Broken Access Control** | RLS in place but several gaps (no DELETE on `financial_insights`, `notification_preferences`, storage avatars) | Close RLS gaps via migration | #5 |
| **A02 Cryptographic Failures** | TLS via Vercel/Supabase. Passwords hashed by Supabase (bcrypt). No app-layer crypto | Add HSTS header. Use HMAC for "secure my account" tokens | #5, #4 |
| **A03 Injection** | Supabase parameterized queries everywhere. No raw SQL in app code. AI prompts use structured output | Audit Server Actions for unparameterized queries (none expected). Sanitize user-controlled HTML in support emails | #5, #12 |
| **A04 Insecure Design** | Mostly OK; no MFA, no account lockout | Add suspicious-activity detection (#4) as compensating control. Document threat model | #4, #5 |
| **A05 Security Misconfiguration** | **Critical:** zero security headers. Default CSP missing. CAPTCHA off | Security headers in `next.config.ts`. Tighten password policy. Cookie flags | #5 |
| **A06 Vulnerable Components** | No `npm audit` history (pnpm in use); no Dependabot/Renovate | Enable Dependabot for `pnpm-lock.yaml`. Schedule monthly audit | #5 |
| **A07 Identification & Auth Failures** | Weak password policy (6 chars, no complexity). No rate limit on reset. No suspicious-activity detection | Raise to 8+ chars + letters+digits. `secure_password_change=true`. Rate limit (#2). Detection (#4) | #2, #4, #5 |
| **A08 Software & Data Integrity** | No SRI. Lockfile committed. Vercel deploy is signed | Continue committing lockfile. No SRI on inline scripts (CSP handles inline) | #5 |
| **A09 Logging & Monitoring** | `console.error/warn` only. No structured logger. Vercel logs available | `login_events` table covers auth events. Document what's logged. **Never log passwords or tokens** | #4, #5 |
| **A10 SSRF** | No user-controllable URLs fetched server-side except Supabase storage URLs (cleaned by Supabase) | Audit `fetch()` call sites — none take user input as URL | #5 |

---

## 2. Security Headers — `next.config.ts`

### Concrete config

```typescript
// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const SUPABASE_PROJECT_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "";

const csp = [
  "default-src 'self'",
  // Next.js + Recharts require inline & eval; tighten in a follow-up after measuring CSP report-only impact
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${SUPABASE_PROJECT_HOST}`,
  `connect-src 'self' https://${SUPABASE_PROJECT_HOST} wss://${SUPABASE_PROJECT_HOST} https://api.resend.com https://challenges.cloudflare.com`,
  "frame-src https://challenges.cloudflare.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: SUPABASE_PROJECT_HOST
      ? [{ protocol: "https", hostname: SUPABASE_PROJECT_HOST, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default withNextIntl(nextConfig);
```

### Why this CSP, not strict-dynamic

| Concern | Strict-dynamic with nonces | Permissive allowlist (chosen) |
|---|---|---|
| App.config rewrite | Requires nonce on every Next inline script (App Router middleware `nonce` injection) | None |
| Recharts SVG inline styles | Breaks unless nonce passed through | Works |
| `next-themes` flicker prevention | Inline script sets theme before paint — needs nonce or breaks | Works (`unsafe-inline`) |
| Effective protection vs XSS | High | Medium (relies on React's escaping for protection) |
| Time-to-ship | 2–3 days (refactor required) | Hours |

**Decision:** Ship the permissive allowlist. Plan a follow-up to migrate to strict-dynamic once `next-themes` and Recharts patterns are validated. The allowlist still blocks: untrusted script sources, untrusted iframes, untrusted `connect-src`, framing of the app on hostile sites — most of the value.

---

## 2a. CSP Hardening Follow-Up (Batch 3)

> **Why deferred:** `unsafe-inline` and `unsafe-eval` meaningfully weaken XSS protection. React's JSX escaping is the current guard, but removing these flags requires coordinated changes across the stack.

### What to remove and why each is dangerous

| Flag | Risk if XSS exists | Blocker today |
|---|---|---|
| `'unsafe-eval'` | Allows `eval()` / `new Function()` — attacker can run arbitrary JS from a string | Recharts uses `new Function()` for SVG path math |
| `'unsafe-inline'` | Allows `<script>` injection and inline event handlers | `next-themes` injects inline script before paint; Next.js App Router serializes server data into inline `<script>` tags |

### Path to removing `'unsafe-eval'`

1. Upgrade Recharts to latest (`pnpm add recharts@latest`) — v2.10+ removed the `new Function()` call.
2. Remove `'unsafe-eval'` from `script-src` in `next.config.ts`.
3. Load the expenses page and the rates history chart — check browser console for CSP violations.
4. If clean, the flag is gone.

**Estimated effort:** 1–2 hours. Can be done as a standalone chore after Item #9 (money-math) lands, since that's when we'll be touching the chart area anyway.

### Path to removing `'unsafe-inline'`

1. Generate a per-request nonce in `src/middleware.ts`:
   ```ts
   const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
   response.headers.set("x-nonce", nonce);
   ```
2. Read the nonce in `src/app/[locale]/layout.tsx` via `headers()` and pass it to Next.js's built-in `<Script nonce={nonce}>` and to `next-themes`'s `<ThemeProvider nonce={nonce}>` (supported since v0.3).
3. Update CSP in `next.config.ts` — the header value must be dynamic (read from the response header set in middleware) or use a middleware-level `headers()` approach:
   ```
   script-src 'strict-dynamic' 'nonce-<NONCE>'
   ```
   Note: `strict-dynamic` makes the nonce propagate to dynamically loaded scripts, so you can drop `'self'` from `script-src`.
4. Audit all remaining inline scripts (e.g., analytics snippets) — each needs the nonce attribute or must be moved to an external file.
5. Run full app walkthrough with CSP in report-only mode first (`Content-Security-Policy-Report-Only`) to catch any missed callsites before enforcing.

**Estimated effort:** 2–3 days. Treat as a dedicated batch item.

### Acceptance criteria for the follow-up

- [ ] `script-src` contains neither `'unsafe-inline'` nor `'unsafe-eval'`
- [ ] Mozilla Observatory grade A+ (currently blocked by these flags)
- [ ] No CSP violations in browser console during full happy-path walkthrough
- [ ] `next-themes` dark/light switch still works without flicker
- [ ] Recharts (rates chart, expenses donut, history chart) renders correctly
- [ ] Receipt scanner camera still activates

### Permissions-Policy specifics

- `camera=(self)` — receipt scanner needs camera access (`receipt-scanner.tsx` uses `navigator.mediaDevices.getUserMedia`). Restrict to same origin.
- `microphone=()` — disabled.
- `geolocation=()` — disabled (locale detection uses Vercel's IP geo header, not browser API).
- `interest-cohort=()` — opt out of FLoC.

### Camera permission verification

Confirm `src/components/receipts/scanner-camera.tsx` works with `camera=(self)` — it should, since the app is calling its own origin's APIs. If the scanner uses a third-party service, add that origin.

---

## 3. Password Policy

```toml
# supabase/config.toml
[auth.email]
secure_password_change = true     # require recent auth to change password

[auth]
minimum_password_length = 8       # was 6
password_requirements = "letters_digits"  # was ""
```

**Rationale:**
- 8 chars is the ASVS L1 minimum.
- `letters_digits` is the lowest available complexity tier; we deliberately don't require symbols (UX + accessibility per NIST 800-63B revised guidance — length matters more than character class).
- `secure_password_change = true` requires a recent login or current-password verification before changing — defense against session hijacking.

**Existing passwords are unaffected.** The policy applies to new passwords only.

---

## 4. RLS Gaps to Close

Migration `<TS>_close_rls_gaps.sql`:

```sql
CREATE POLICY "Users can delete own notification preferences"
  ON public.notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial insights"
  ON public.financial_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
```

### Post-migration audit (every table, every operation)

| Table | SELECT | INSERT | UPDATE | DELETE | Allowed roles |
|---|---|---|---|---|---|
| `users` | own | (trigger) | own | — | authenticated |
| `categories` | own | own | own | own | authenticated |
| `budgets` | own | own | own | own | authenticated |
| `expenses` | own | own | own | own | authenticated |
| `notifications` | own | (service) | own | — | authenticated for SELECT/UPDATE |
| `notification_preferences` | own | own | own | **own (NEW)** | authenticated |
| `exchange_rates` | all | (service) | — | — | anon, authenticated |
| `trading_insights` | all | (service) | — | — | authenticated |
| `financial_insights` | own | own | own | **own (NEW)** | authenticated |
| `login_events` (#4) | own | (service) | (service) | — | authenticated for SELECT |
| `support_tickets` (#12) | — | (service) | (service) | (service) | service only (no public access) |
| `storage.objects[avatars]` | public | authenticated | owner | **owner (NEW)** | mixed |

(service) = via service role client; bypasses RLS.

---

## 5. Cookie Flags

```typescript
// src/middleware.ts — NEXT_LOCALE cookie
response.cookies.set("NEXT_LOCALE", detectedLocale, {
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  // httpOnly intentionally false — needed by client-side LocaleSwitcher to detect current locale
});
```

**Supabase auth cookies** are set by `@supabase/ssr` and already use `secure=true, sameSite=lax, httpOnly=true` per the SDK defaults. Verify in browser DevTools after deploy.

---

## 6. Environment Variable Audit

Update `.env.example`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only, bypasses RLS

# Public app
NEXT_PUBLIC_BASE_URL=                # e.g. https://fin.app

# External APIs
DOLAR_VZLA_KEY=                      # Optional — BCV EUR rates
GOOGLE_GENERATIVE_AI_API_KEY=        # Required for AI advisor + onboarding (Item #11)

# Email (Resend)
RESEND_API_KEY=                      # Required in production
DEVELOPER_EMAIL=                     # Where dolarvzla failure alerts go
SUPPORT_EMAIL=                       # Where support tickets go (Item #12)

# Cron
CRON_SECRET=                         # Vercel Cron auth header

# Suspicious-activity (Item #4)
SECURITY_TOKEN_SECRET=               # HMAC secret for "secure my account" links

# Cloudflare Turnstile (Item #12)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=      # Public, used by client widget
TURNSTILE_SECRET_KEY=                # Server-only, used by siteverify
```

### `NEXT_PUBLIC_` audit

| Var | Public exposure | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Required public | OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Required public (RLS-gated) | OK |
| `NEXT_PUBLIC_BASE_URL` | ✅ Public | OK |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✅ Required public | OK |

No accidental `NEXT_PUBLIC_` on secrets.

---

## 7. CSRF Posture for Server Actions

Next.js Server Actions are CSRF-protected by default via:
1. **Same-origin enforcement**: actions only callable from the same origin as the rendering page.
2. **Action ID hashing**: the action's identity is hashed server-side with a deploy-specific secret; tampering produces invalid IDs.
3. **Form data over JSON**: Actions receive `FormData` (not parseable cross-origin without explicit CORS setup).

**No additional CSRF tokens needed.** The "open" support form (#12) accepts unauthenticated submissions but is still origin-checked.

### Cron route (`/api/cron/update-rates`)

Authenticated via `Authorization: Bearer ${CRON_SECRET}` header. Vercel injects this header on cron-triggered requests. Verify `CRON_SECRET` is rotated on suspected leak.

---

## 8. Threat Model — Suspicious-Activity Detection (#4)

### Signal taxonomy (v1)

| Signal | Definition | Threshold | Action |
|---|---|---|---|
| New country | Successful sign-in with `country_code` ≠ user's most recent prior `sign_in.country_code` | First occurrence | Email alert |
| Failed-attempt burst | `event_type='failed_attempt'` rows for same `ip_address` in last 15 min | ≥ 3 | Email alert (sent to user's email even though attempts may not match a real account; rate-limit to 1 email per email per 24h to avoid spam) |
| Password change spam | `event_type='password_change'` rows for same `user_id` in last 24h | ≥ 2 | Email alert |

### False-positive tolerance

- **New country**: high false-positive rate is acceptable (legitimate travel triggers it). The email is informational; user only acts if it wasn't them.
- **Failed-attempt burst**: low tolerance — sending an email to someone whose email is being typoed by a stranger is annoying. Mitigation: rate-limit alerts to one per email per 24h.
- **Password change spam**: legitimate password rotation can trigger this — rare but possible. Acceptable.

### "This wasn't me" flow security

- Token is HMAC-SHA256 over `userId.timestamp.SECURITY_TOKEN_SECRET`.
- 24-hour validity window enforced server-side by checking `timestamp` in the token vs `Date.now()`.
- Token is single-use: after `terminateAllSessions` runs, store the token's hash in a small `used_security_tokens` table (or use a Postgres `UNIQUE` constraint; alternatively, accept replay within 24h since the side-effect is idempotent — `signOut(scope='global')` is safe to call repeatedly).
- **Decision:** No used-tokens table for v1. Replay within 24h is harmless; second click signs out an already-signed-out account.

### Recovery flow guarantees

After "Secure my account":
1. All sessions terminated (`supabase.auth.admin.signOut(userId, { scope: 'global' })`).
2. User must sign in again. The pre-existing password still works (we don't force a reset; the user can do that separately).
3. **[ASSUMPTION]** v1 doesn't enforce a password change post-secure. Add a follow-up to make this opt-in via a "Reset my password too" toggle in the email.

### Data retention

- `login_events` rows retained indefinitely in v1.
- Periodic pruning (cron, ≥ 90 days for `failed_attempt`) is a follow-up.

### What we deliberately do NOT log

- Passwords (anywhere).
- Plain auth tokens / JWTs.
- Email contents (bodies, full PII).
- Stack traces with user data.

---

## 9. Dependency Hygiene

| Action | Status | When |
|---|---|---|
| Add `.github/dependabot.yml` for `pnpm` ecosystem | TODO | Before #5 closes |
| Run `pnpm audit` and address high/critical | TODO | During #5 |
| Lockfile committed | ✅ Already in repo | — |
| Renovate as alternative to Dependabot | Optional | If desired |

---

## 10. Verification (post-deploy)

```bash
# Headers check
curl -I https://[deployed-url] | grep -E "Content-Security|Strict-Transport|X-Frame|X-Content|Referrer|Permissions"

# CSP report-only mode (optional first-pass)
# Add Content-Security-Policy-Report-Only alongside CSP for 1 week to gather violations
```

### Tools to run before production

- **Mozilla Observatory** (https://observatory.mozilla.org/) — target: A or A+
- **securityheaders.com** — target: A
- **Hardenize / SSL Labs** — target: A on TLS

---

## 11. Acceptance Checklist

- [ ] All security headers present in production response
- [ ] Mozilla Observatory grade ≥ A
- [ ] Password < 8 chars rejected at signup
- [ ] Password without digits rejected at signup
- [ ] `secure_password_change = true` in `config.toml`
- [ ] All RLS gap policies applied via migration
- [ ] `.env.example` complete
- [ ] Camera-using receipt scanner still works under `Permissions-Policy: camera=(self)`
- [ ] Supabase auth cookies have `Secure`, `HttpOnly`, `SameSite=Lax`
- [ ] No console errors related to CSP violations during normal app use
