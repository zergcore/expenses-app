"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoids hydration mismatch and sync logic error
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Can be useful for debugging or specific UI states
        console.log("Password recovery mode active");
      }
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        // When password is updated, USER_UPDATED is fired.
        // SIGNED_IN might fire first upon landing.
        // We can check if we want to redirect only after user interaction?
        // Actually, for "update_password" view, it handles the update.
        // We really want to know when the update is *done*.
        // The component doesn't have an explicit callbacks prop exposed in this wrapper easily.
        // But USER_UPDATED usually signals a profile change (like password).
        // Let's rely on USER_UPDATED which typically fires after password change.
        if (event === "USER_UPDATED") {
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            view="update_password"
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
