"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/actions/auth";

export function SignInForm() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const secured = searchParams.get("secured") === "true";
  const errorParam = searchParams.get("error");
  
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(signIn, {
    success: false,
    error: undefined,
  });

  const showError = state.error || (errorParam ? t(errorParam === "token_expired" ? "invalidToken" : "terminationFailed") : null);

  return (
    <form action={formAction} className="space-y-4">
      {secured && (
        <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          <div>{t("secured")}</div>
        </div>
      )}

      {showError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>{showError}</div>
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
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-4"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className="pl-10 pr-10"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isPending}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("resetSubmitting") || "Logging in..."}
          </>
        ) : (
          t("login")
        )}
      </Button>
    </form>
  );
}
