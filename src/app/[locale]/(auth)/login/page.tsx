"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations();
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.refresh();
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Prevent hydration mismatch by waiting for mount if needed,
  // currently unnecessary as Card is client rendered but safe.

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("Auth.welcomeBack")}
        </CardTitle>
        <CardDescription>{t("Auth.signInOrSignUp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
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
              button: "bg-primary text-primary-foreground hover:bg-primary/90",
              input: "bg-background",
            },
          }}
          providers={[]}
          redirectTo={`${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/auth/callback`}
        />
        <div className="mt-4 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            {t("Auth.forgotPassword")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
