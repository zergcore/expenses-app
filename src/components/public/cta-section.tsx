import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const CTASection = () => {
  const t = useTranslations();
  return (
    <section className="container mx-auto px-4 py-10 sm:py-16 text-center">
      <div className="max-w-2xl mx-auto rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-8 border">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          {t("Landing.cta.title")}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">
          {t("Landing.cta.description")}
        </p>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/register">{t("Landing.cta.button")}</Link>
        </Button>
      </div>
    </section>
  );
};
