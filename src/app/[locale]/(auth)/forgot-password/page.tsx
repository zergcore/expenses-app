"use client";

import { useEffect, useState, useTransition } from "react";
import { resetPassword } from "@/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await resetPassword({}, formData);
        setState(result);
      } catch {
        setState({ error: "Unable to connect. Please check your connection and try again." });
      } finally {
        setCooldown(COOLDOWN_SECONDS);
      }
    });
  };

  // Decrement cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(
      () => setCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [cooldown]);

  const isDisabled = isPending || cooldown > 0;
  const buttonLabel = isPending
    ? t("Auth.resetSubmitting")
    : t("Auth.sendResetLink");

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t("Auth.forgotPassword")}
          </CardTitle>
          <CardDescription>
            {t("Auth.forgotPasswordDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("Auth.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isDisabled}
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            {/* Always show generic message after first submission — never reveal if email exists */}
            {state?.success && (
              <p className="text-sm text-muted-foreground">
                {t("Auth.resetSent")}
              </p>
            )}

            {cooldown > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                {t("Auth.resendIn", { seconds: cooldown })}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isDisabled}>
              {buttonLabel}
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Auth.backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
