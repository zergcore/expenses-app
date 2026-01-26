"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    // Avoids hydration mismatch and sync logic error
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

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
          <Auth
            supabaseClient={supabase}
            view="forgotten_password"
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "var(--primary)",
                    brandAccent: "var(--primary)",
                    inputBackground: "transparent",
                    inputText: "var(--foreground)",
                    inputBorder: "var(--border)",
                    inputLabelText: "var(--foreground)",
                  },
                  radii: {
                    borderRadiusButton: "var(--radius)",
                    inputBorderRadius: "var(--radius)",
                  },
                },
              },
              className: {
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90 w-full",
                input: "bg-background",
                label: "text-foreground",
              },
            }}
            providers={[]}
            showLinks={false}
            redirectTo={`${
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
            }/auth/callback?next=/update-password`}
          />
        </CardContent>
        <CardFooter>
          <ButtonLink
            href="/login"
            label={t("Auth.backToLogin")}
            icon={<ArrowLeft className="h-4 w-4" />}
          />
        </CardFooter>
      </Card>
    </div>
  );
}

function ButtonLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
    >
      {icon}
      {label}
    </Link>
  );
}
