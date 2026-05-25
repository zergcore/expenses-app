"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginPage() {
  const t = useTranslations();

  return (
    <Card className="w-full border-border bg-card shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("Auth.welcomeBack")}
        </CardTitle>
        <CardDescription>{t("Auth.signInOrSignUp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  );
}
