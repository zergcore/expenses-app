import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border border-border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t("Auth.forgotPassword")}
          </CardTitle>
          <CardDescription>
            {t("Auth.forgotPasswordDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ForgotPasswordForm />
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
