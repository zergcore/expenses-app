# Phase 3 — Support System (Batch 2)

> Item #12. Public form at `/support`. Cloudflare Turnstile. DB persistence + Resend email. Auth-aware prefill. Rate-limited at 3 submissions per IP per hour.

---

## 1. Surfaces

| Surface | Path | Audience |
|---|---|---|
| Support form page | `/[locale]/support` (public) | Anyone (logged in or not) |
| Public footer link | `src/components/public/footer.tsx` | Landing page visitors |
| Dashboard help (future) | `/[locale]/help` or sidebar | Logged-in users (deferred) |

For v1, the only surface is the public `/support` page. Logged-in users get the same form with their name and email pre-filled.

---

## 2. Page Layout

```
╭──────────────────────────────────────────────────────╮
│  ◀ Back to home                                       │
│                                                       │
│  Contact Support                                      │
│  Have a question or issue? We're here to help.       │
│                                                       │
│  ╭───────────────────────────────────────────────╮   │
│  │  Name *                                        │   │
│  │  [____________________________]                │   │
│  │                                                │   │
│  │  Email *                                       │   │
│  │  [____________________________]                │   │
│  │                                                │   │
│  │  Subject *                                     │   │
│  │  [____________________________]                │   │
│  │                                                │   │
│  │  Message *                                     │   │
│  │  ┌────────────────────────────┐                │   │
│  │  │                            │                │   │
│  │  │                            │                │   │
│  │  │                            │                │   │
│  │  └────────────────────────────┘                │   │
│  │                                                │   │
│  │  [Cloudflare Turnstile widget]                 │   │
│  │                                                │   │
│  │  We'll reply within 24 hours.    [Send]       │   │
│  ╰───────────────────────────────────────────────╯   │
╰──────────────────────────────────────────────────────╯
```

### Success state (replaces form)
```
╭───────────────────────────────────────╮
│  ✓ Message sent                        │
│                                       │
│  Your message has been received.      │
│  We'll reply within 24 hours.         │
│                                       │
│  [Send another message]               │
╰───────────────────────────────────────╯
```

---

## 3. Form Schema (Zod)

```typescript
// src/types/support.ts
import { z } from "zod";

export const supportTicketSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  subject: z.string().trim().min(1, "Subject is required").max(120),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  turnstileToken: z.string().min(1, "Please complete the security check"),
  // Honeypot — should always be empty; bots fill it
  website: z.string().max(0, "Spam detected").optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
```

### Honeypot field
Hidden via CSS (`display: none` and `tabindex={-1}`). Bots fill all visible-by-DOM fields; humans never see this one. Submission with non-empty `website` field → silent reject (don't tell the bot it was caught).

---

## 4. Server Action

### `src/actions/support.ts`

```typescript
"use server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/server";
import { supportTicketSchema } from "@/types/support";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendSupportEmails } from "@/lib/support-email";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

const RATE_LIMIT_PER_HOUR = 3;

type State =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "validation"; fieldErrors: Record<string, string> };

export async function submitSupportTicket(_prev: State, formData: FormData): Promise<State> {
  const parsed = supportTicketSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    turnstileToken: formData.get("cf-turnstile-response"),
    website: formData.get("website") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join(".")] = issue.message;
    }
    return { status: "validation", fieldErrors };
  }

  // Honeypot — silent success to confuse bots
  if (parsed.data.website && parsed.data.website.length > 0) {
    return { status: "success" };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const userAgent = h.get("user-agent") ?? null;

  // Verify Turnstile token
  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { status: "error", message: "Verification failed. Please try again." };
  }

  const supabase = createServiceClient();

  // Rate limit: count submissions from this IP in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return { status: "error", message: "Too many submissions. Please try again in an hour." };
  }

  // Insert ticket
  const user = await getCurrentUser();
  const locale = await getLocale();

  const { error } = await supabase.from("support_tickets").insert({
    user_id: user?.id ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    ip_address: ip,
    user_agent: userAgent,
    locale,
    status: "open",
  });

  if (error) {
    console.error("Support ticket insert failed:", error);
    return { status: "error", message: "Couldn't submit. Please try again." };
  }

  // Send emails (non-blocking)
  sendSupportEmails(parsed.data, locale).catch((e) => console.error("Support email send failed:", e));

  return { status: "success" };
}
```

---

## 5. Turnstile Verification

### `src/lib/turnstile.ts`

```typescript
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY missing — failing closed");
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.append("remoteip", remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verify failed:", e);
    return false;
  }
}
```

**Failure mode:** If `TURNSTILE_SECRET_KEY` is missing or the verification request fails, return `false` — fail closed. Better to block legitimate users temporarily than allow a flood of spam.

---

## 6. Email Pipeline

### `src/lib/support-email.ts`

```typescript
import { Resend } from "resend";
import type { SupportTicketInput } from "@/types/support";
import { renderEmailFrame } from "./email-template";

export async function sendSupportEmails(ticket: SupportTicketInput, locale: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const supportInbox = process.env.SUPPORT_EMAIL;
  if (!apiKey || !supportInbox) return;

  const resend = new Resend(apiKey);

  // 1. Admin notification
  await resend.emails.send({
    from: "Fin <fin@zergcore.dev>",
    to: supportInbox,
    replyTo: ticket.email,
    subject: `[Support] ${ticket.subject}`,
    html: renderEmailFrame({
      title: "New support ticket",
      body: `
        <p><strong>From:</strong> ${escape(ticket.name)} &lt;${escape(ticket.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escape(ticket.subject)}</p>
        <p><strong>Locale:</strong> ${locale}</p>
        <hr/>
        <pre style="white-space:pre-wrap;font-family:inherit;">${escape(ticket.message)}</pre>
      `,
    }),
  });

  // 2. Submitter confirmation
  await resend.emails.send({
    from: "Fin <fin@zergcore.dev>",
    to: ticket.email,
    subject: locale === "es" ? "Recibimos tu mensaje" : "We received your message",
    html: renderEmailFrame({
      title: locale === "es" ? "Mensaje recibido" : "Message received",
      body: locale === "es"
        ? `<p>Hola ${escape(ticket.name)},</p>
           <p>Recibimos tu mensaje sobre <strong>"${escape(ticket.subject)}"</strong>. Responderemos en menos de 24 horas.</p>
           <p>Gracias,<br/>El equipo de Fin</p>`
        : `<p>Hi ${escape(ticket.name)},</p>
           <p>We received your message about <strong>"${escape(ticket.subject)}"</strong>. We'll get back to you within 24 hours.</p>
           <p>Thanks,<br/>The Fin team</p>`,
    }),
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
```

**Why HTML escape:** Even though admin sees the email, a malicious user could submit HTML/JS in the message field. Escape on output to prevent any rendering hazards in email clients.

---

## 7. Form Component (sketch)

### `src/components/public/support-form.tsx`

```tsx
"use client";

import { useActionState, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { submitSupportTicket } from "@/actions/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

interface Props {
  defaultName?: string;
  defaultEmail?: string;
}

export function SupportForm({ defaultName = "", defaultEmail = "" }: Props) {
  const t = useTranslations("Support");
  const [state, action, isPending] = useActionState(submitSupportTicket, { status: "idle" } as const);
  const [resetKey, setResetKey] = useState(0);

  if (state.status === "success") {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">{t("success_title")}</h2>
        <p className="text-muted-foreground mb-6">{t("success_description")}</p>
        <Button variant="outline" onClick={() => setResetKey((k) => k + 1)}>{t("send_another")}</Button>
      </div>
    );
  }

  return (
    <form key={resetKey} action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={defaultName} required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required maxLength={254} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">{t("subject")}</Label>
        <Input id="subject" name="subject" required maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={6} />
      </div>

      {/* Honeypot — hidden from users + screen readers */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />

      <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} />

      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("footer_note") /* "We'll reply within 24 hours." */}</p>
        <Button type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
```

> Implementation note: shadcn/ui doesn't include `Textarea` by default — add via `pnpm dlx shadcn@latest add textarea` during implementation.

---

## 8. Page Component (auth-aware prefill)

### `src/app/[locale]/(public)/support/page.tsx`

```tsx
import { getCurrentUser } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import { SupportForm } from "@/components/public/support-form";

export default async function SupportPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Support");

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("description")}</p>
      <div className="rounded-lg border bg-card p-6">
        <SupportForm
          defaultName={user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? ""}
          defaultEmail={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
```

---

## 9. Status Flow (v1, server-only)

```
open  ─┬─►  in_progress  ──►  resolved
       └─►  spam
```

- `open` — initial state on insert.
- `in_progress` — admin manually updates via SQL or future admin tool.
- `resolved` — admin marks as done.
- `spam` — admin marks as spam (alternative to deletion).

No user-facing status visibility in v1.

---

## 10. Footer Link

`src/components/public/footer.tsx` adds:
```tsx
<Link href="/support" className="hover:text-foreground transition-colors">
  {t("Nav.support")}
</Link>
```

---

## 11. Acceptance Criteria

- [ ] `/[locale]/support` is reachable both logged in and logged out.
- [ ] Logged-in users see name and email pre-filled.
- [ ] Submitting valid data: ticket appears in `support_tickets` table; admin email arrives at `SUPPORT_EMAIL`; submitter receives confirmation.
- [ ] Invalid email / empty fields: inline validation errors.
- [ ] Failed Turnstile: form shows error; submission blocked.
- [ ] 4th submission within 1 hour from same IP: rate-limit error.
- [ ] Bot-filled honeypot: silent success (ticket NOT inserted).
- [ ] Footer link present on public pages.
- [ ] TypeScript, lint, build pass.

---

## 12. Effort & Risk

- **Effort:** ~16 hours (form, action, Turnstile setup, emails, migration, Cloudflare account setup).
- **Risk:** Low. Additive feature, no impact on auth or existing flows.
- **Rollback:** Delete the route, revert footer link. Drop the table.
