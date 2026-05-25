"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [cooldown, setCooldown] = useState<number>(0);
  const [state, setState] = useState<{ success: boolean; error?: string }>({
    success: false,
    error: undefined,
  });
  const [isPending, setIsPending] = useState(false);

  const isRateLimit = state.error?.toLowerCase().includes("rate limit");
  const showSuccess = state.success || isRateLimit;
  const showError = state.error && !isRateLimit;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0 || isPending) return;

    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    try {
      const result = await resetPassword(state, formData);
      setState({
        success: result.success ?? false,
        error: result.error,
      });

      const rateLimited = result.error?.toLowerCase().includes("rate limit");
      if (result.success || rateLimited) {
        setCooldown(60);
      }
    } catch (err) {
      setState({ error: String(err), success: false });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {showSuccess && (
        <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          <div>{t("resetSent")}</div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            className="pl-10"
            disabled={isPending || cooldown > 0}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
        disabled={isPending || cooldown > 0}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("resetSubmitting")}
          </>
        ) : cooldown > 0 ? (
          t("resendIn", { seconds: cooldown })
        ) : (
          t("resetSubmit")
        )}
      </Button>
    </form>
  );
}
