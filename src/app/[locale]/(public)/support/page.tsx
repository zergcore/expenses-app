import { getCurrentUser } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import { SupportForm } from "@/components/public/support-form";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default async function SupportPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Support");

  return (
    <div className="container max-w-2xl py-12 md:py-20 px-4 mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title") || "Contact Support"}</h1>
        <p className="text-muted-foreground">{t("description") || "Have a question or issue? We're here to help."}</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-md border-border">
        <SupportForm
          defaultName={user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? ""}
          defaultEmail={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
