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
import { useTranslations } from "next-intl";

export default function RegisterPage() {
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

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("Auth.createAccount")}
        </CardTitle>
        <CardDescription>{t("Auth.getStarted")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          view="sign_up"
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
      </CardContent>
    </Card>
  );
}
