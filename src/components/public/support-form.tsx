"use client";

import { useActionState, useState } from "react";
import { submitSupportTicket } from "@/actions/support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { ShieldCheck, Loader2 } from "lucide-react";

interface Props {
  defaultName?: string;
  defaultEmail?: string;
}

export function SupportForm({ defaultName = "", defaultEmail = "" }: Props) {
  const t = useTranslations("Support");
  const [state, action, isPending] = useActionState(submitSupportTicket, { status: "idle" } as const);
  const [resetKey, setResetKey] = useState(0);
  const [verified, setVerified] = useState(false);

  if (state.status === "success") {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
        <div className="h-12 w-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("success_title") || "Message Sent"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("success_description") || "Your message has been received. We'll reply within 24 hours."}
          </p>
        </div>
        <Button variant="outline" className="cursor-pointer" onClick={() => { setVerified(false); setResetKey((k) => k + 1); }}>
          {t("send_another") || "Send another message"}
        </Button>
      </div>
    );
  }

  return (
    <form key={resetKey} action={action} className="space-y-4">
      {state.status === "validation" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <ul>
            {Object.entries(state.fieldErrors).map(([field, err]) => (
              <li key={field}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{t("name") || "Name"}</Label>
        <Input id="name" name="name" defaultValue={defaultName} required maxLength={80} placeholder="John Doe" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">{t("email") || "Email"}</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultEmail} required maxLength={254} placeholder="john@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subject">{t("subject") || "Subject"}</Label>
        <Input id="subject" name="subject" required maxLength={120} placeholder="Question about exchange rates..." />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">{t("message") || "Message"}</Label>
        <Textarea id="message" name="message" required minLength={10} maxLength={2000} rows={5} placeholder="Describe your issue or feedback..." />
      </div>

      {/* Honeypot — hidden from users + screen readers */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px" }}
        aria-hidden="true"
      />

      {/* Cloudflare Turnstile simulation card */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40 max-w-[320px]">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="turnstile-check"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="h-4.5 w-4.5 rounded border-muted text-primary focus:ring-primary cursor-pointer"
          />
          <Label htmlFor="turnstile-check" className="text-xs cursor-pointer font-medium text-foreground select-none">
            I am not a robot
          </Label>
        </div>
        <div className="flex flex-col items-end text-[9px] text-muted-foreground leading-none">
          <ShieldCheck className="h-4 w-4 text-primary mb-1" />
          <span>Turnstile</span>
          <span className="opacity-60 mt-0.5">Privacy • Terms</span>
        </div>
      </div>
      
      {/* Hidden input to pass turnstile token */}
      <input type="hidden" name="cf-turnstile-response" value={verified ? "dummy_valid_token" : ""} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          {t("footer_note") || "We'll reply within 24 hours."}
        </p>
        <Button type="submit" disabled={isPending || !verified} className="shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 cursor-pointer">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("submitting") || "Sending..."}
            </>
          ) : (
            t("submit") || "Send message"
          )}
        </Button>
      </div>
    </form>
  );
}
