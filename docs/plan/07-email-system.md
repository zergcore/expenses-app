# Phase 3 — Email System (Batch 2)

> Items #1, #2, #4. Resend on `zergcore.dev` subdomain. Three Supabase auth templates + one security-alert template. All branded with the same Fin layout. Plain-text fallback derived automatically by Resend.

---

## 1. Email Provider Comparison

| Criterion | **Resend** ✅ | Postmark | SendGrid | AWS SES |
|---|---|---|---|---|
| Already installed | ✅ Yes (`resend` v6.12.3) | No | No | No |
| Free tier | 3k emails/mo, 100/day | 100/mo (test only) | 100/day forever | 62k/mo (from EC2 only) |
| DX (DKIM/SPF setup) | Excellent — generated UI walks you through DNS | Excellent | Good | Verbose, AWS console |
| Transactional deliverability | Strong (focused on transactional) | Best-in-class for transactional | Strong (general-purpose) | Variable (depends on warmup) |
| EU data residency | ✅ Available | ✅ Available | Limited | ✅ Frankfurt/Ireland regions |
| React email SDK | `react-email` (first-class) | None | None | None |
| Webhook events | ✅ Open, click, bounce, complaint | ✅ Same | ✅ Same | ✅ Same (via SNS) |
| API ergonomics | Single `Resend` client, typed | Good | Verbose | Verbose |
| Pricing past free tier | $20/mo for 50k | $15/mo for 10k | $20/mo for 50k | $0.10 per 1k |
| **Verdict** | **Keep — already in app, free tier covers our scale, best DX** | Best for high-volume transactional | Overkill | Cheapest at scale, worst DX |

**Decision:** Stay on Resend. The existing dependency is sufficient; switching costs would not be justified by any incremental benefit.

---

## 2. Sender Domain Strategy

**Domain:** `zergcore.dev` (user-owned).
**Subdomain:** `mail.zergcore.dev` (recommended) — a dedicated subdomain isolates sending reputation from any other use of the apex domain.
**From address:** `Fin <fin@zergcore.dev>` for all user-facing emails.
**Reply-to:** `support@zergcore.dev` (later, when support inbox is set up; for v1 the SUPPORT_EMAIL env var holds the destination).

### Required DNS records

```
TXT  mail.zergcore.dev          "v=spf1 include:amazonses.com ~all"  (or include:_spf.resend.com per Resend docs)
TXT  resend._domainkey.mail.zergcore.dev   <DKIM public key from Resend dashboard>
MX   mail.zergcore.dev          10 feedback-smtp.us-east-1.amazonses.com  (Resend bounce handling)
TXT  _dmarc.zergcore.dev        "v=DMARC1; p=quarantine; rua=mailto:dmarc@zergcore.dev; pct=100"
```

> Use the exact records Resend's dashboard generates — values above are illustrative. Resend walks you through this on domain verification.

**DMARC policy:** Start with `p=none` (monitor mode) for the first 1–2 weeks, then move to `p=quarantine`. Avoid `p=reject` until you're confident no legitimate mail is failing alignment.

---

## 3. Email Inventory

| Email | Trigger | Sender | Template | Notes |
|---|---|---|---|---|
| Signup confirmation | Supabase Auth (after signup) | `fin@zergcore.dev` | `supabase/templates/confirmation.html` | Subject: "Confirm your Fin account" |
| Password reset | Supabase Auth (after `resetPasswordForEmail`) | `fin@zergcore.dev` | `supabase/templates/recovery.html` | Subject: "Reset your Fin password" |
| Email change | Supabase Auth (after `updateUser({ email })`) | `fin@zergcore.dev` | `supabase/templates/email_change.html` | Subject: "Confirm your new email"; sent to BOTH old and new addresses (`double_confirm_changes = true`) |
| Security alert | App code (Server Action `signIn` → suspicious) | `fin@zergcore.dev` | `supabase/templates/security-alert.html` (rendered by Resend, NOT Supabase) | Subject: "New sign-in to your Fin account" |
| Support admin notification | App code (Server Action `submitSupportTicket`) | `fin@zergcore.dev` | Inline HTML in `src/actions/support.ts` | Subject: "[Support] {ticket.subject}" |
| Support submitter confirmation | App code | `fin@zergcore.dev` | Inline HTML | Subject: "We received your message" |
| Developer alert (dolarvzla failure) | Cron route | `fin@zergcore.dev` | Inline HTML in `src/lib/alert-email.ts` | Subject: existing |

---

## 4. Template Skeleton (shared brand frame)

All emails use the same outer HTML wrapper. The frame is duplicated in:
- `supabase/templates/*.html` (Supabase renders)
- `src/lib/email-template.ts` (app code renders for security alert + support emails)

### Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{{ subject }}</title>
<style>
  /* All-inline-style is preferred; this <style> is a fallback for clients that strip inline */
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
  .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .header { padding: 32px 32px 0; text-align: center; }
  .logo { width: 48px; height: 48px; }
  .body { padding: 24px 32px 32px; }
  h1 { font-size: 22px; line-height: 1.3; margin: 16px 0 12px; color: #1a1a1a; }
  p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #404040; }
  .cta { display: inline-block; background: #1a1a1a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .footer { padding: 16px 32px 24px; border-top: 1px solid #f0f0f0; font-size: 13px; color: #888; text-align: center; }
  .footer a { color: #888; text-decoration: underline; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ logoUrl }}" alt="Fin" class="logo" />
    </div>
    <div class="body">
      {{ content }}
    </div>
    <div class="footer">
      <p>© Fin · <a href="{{ siteUrl }}">{{ siteHost }}</a></p>
      <p style="margin-top:8px;">If you didn't expect this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
```

> The `{{ logoUrl }}` should point to a hosted PNG (the `.svg` won't render reliably across email clients). Host at `https://[fin-app-host]/og-logo.png` (already exists in `public/`).

### Per-email body content

#### `confirmation.html`
```html
<h1>Confirm your Fin account</h1>
<p>Welcome to Fin. Click the button below to confirm your email and start tracking your finances.</p>
<a href="{{ .ConfirmationURL }}" class="cta">Confirm Email</a>
<p style="font-size:13px; color:#888;">This link expires in 1 hour. If you didn't sign up, you can ignore this email.</p>
```

#### `recovery.html`
```html
<h1>Reset your Fin password</h1>
<p>We got a request to reset your password. Click the button below to choose a new one.</p>
<a href="{{ .ConfirmationURL }}" class="cta">Reset Password</a>
<p style="font-size:13px; color:#888;">This link expires in 1 hour. If you didn't request this, you can ignore the email — your password will stay the same.</p>
```

#### `email_change.html`
```html
<h1>Confirm your new email</h1>
<p>You requested to change the email on your Fin account. Click below to confirm.</p>
<a href="{{ .ConfirmationURL }}" class="cta">Confirm New Email</a>
<p style="font-size:13px; color:#888;">For your security, this confirmation must be done from both your old and new email addresses.</p>
```

#### `security-alert.html` (rendered server-side by Resend, not Supabase)
```html
<h1>New sign-in to your Fin account</h1>
<p>We noticed a sign-in to your Fin account with the following details:</p>
<table style="width:100%; border-collapse:collapse; margin: 16px 0; font-size:14px;">
  <tr><td style="padding:8px 0; color:#888;">When</td><td style="padding:8px 0;">{{ when }}</td></tr>
  <tr><td style="padding:8px 0; color:#888;">From</td><td style="padding:8px 0;">{{ country }} · {{ ipApprox }}</td></tr>
  <tr><td style="padding:8px 0; color:#888;">Device</td><td style="padding:8px 0;">{{ device }}</td></tr>
</table>
<p>If this was you, no action is needed.</p>
<p>If this wasn't you, click the button below to sign out of every device and reset your password.</p>
<a href="{{ secureUrl }}" class="cta">Secure my account</a>
<p style="font-size:13px; color:#888;">This link is valid for 24 hours.</p>
```

---

## 5. Cooldown UX (Item #2)

### Server-side (authoritative)
- `supabase/config.toml`: `[auth.email] max_frequency = "60s"`. Supabase rejects rapid resubmissions for the same email; the Server Action receives a Supabase error and returns it to the client.

### Client-side (UX mirror)
- After a successful `resetPassword` Server Action call, the client component sets `cooldownSeconds = 60`.
- A `useEffect` runs an interval that decrements `cooldownSeconds` by 1 every second; clears when reaches 0.
- Submit button disabled while `cooldownSeconds > 0`.
- Button label changes from `"Send reset link"` → `"Resend in {seconds}s"`.

### User-facing message
- Always show: `"If this email is registered, you'll receive a reset link shortly."` — never reveal whether the email exists.
- On Supabase rate-limit error: same message + cooldown UI activated. Don't show the underlying error message to the user.

### Snippet (skeleton — implementation is for the runbook)

```tsx
"use client";
const [state, formAction, isPending] = useActionState(resetPassword, { success: false });
const [cooldown, setCooldown] = useState(0);

useEffect(() => {
  if (state?.success && cooldown === 0) setCooldown(60);
}, [state?.success]);

useEffect(() => {
  if (cooldown <= 0) return;
  const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
  return () => clearInterval(id);
}, [cooldown]);

const disabled = isPending || cooldown > 0;
const label = cooldown > 0 ? t("Auth.resendIn", { seconds: cooldown }) : t("Auth.resetSubmit");
```

---

## 6. Plain-Text Fallback

Resend automatically generates plain-text alternates from HTML. No action required — verify alternates render reasonably in Gmail's "View original" once templates are deployed.

---

## 7. Local Development

Supabase local stack uses **Inbucket** (already configured at port `54324`). When `[auth.email.smtp]` is enabled in `config.toml`, Supabase will route through the SMTP provider — but in local dev, point Inbucket SMTP back into the loop instead by leaving SMTP **disabled in the local override**:

```toml
# supabase/config.local.toml (if used) — keep SMTP disabled locally so Inbucket captures emails
# [auth.email.smtp]
# enabled = false
```

**[ASSUMPTION]** Supabase config layering for local override is supported. If not, we'll set `RESEND_API_KEY` to a sandbox value locally, which Resend honors as a no-op send.

---

## 8. Rollback

| Failure mode | Rollback |
|---|---|
| Resend domain verification fails | Comment out `[auth.email.smtp]` block in `config.toml`. Supabase falls back to its built-in SMTP (default branding). |
| Template breaks rendering | Revert template HTML to the simple Supabase default text or delete `content_path` to use Supabase's built-in template. |
| Wrong sender address | Update `admin_email` and `sender_name` in `[auth.email.smtp]`; redeploy. |
| Excessive bounces (DMARC quarantine triggered) | Lower DMARC to `p=none`; investigate via DMARC reports; consider adding more aligned sources or relaxing alignment to `aspf=r;adkim=r`. |

---

## 9. Acceptance gate before #4 starts

- [ ] Resend dashboard shows `mail.zergcore.dev` (or chosen subdomain) with DKIM ✅, SPF ✅.
- [ ] Test email from Supabase SQL editor (`SELECT auth.email_test(...)` or trigger a real signup) lands in inbox from `fin@zergcore.dev`.
- [ ] Three branded templates render correctly when triggered (use Supabase Inbucket locally or send to a real address from staging).
- [ ] Shared `email-template.ts` helper is unit-callable and produces valid HTML for the security-alert variant.
