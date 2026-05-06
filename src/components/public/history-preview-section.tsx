import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PublicRatesHistoryChart } from "./public-rates-history-chart";
import type { RateHistoryPoint } from "@/actions/rates";

interface HistoryPreviewSectionProps {
  data: RateHistoryPoint[];
}

export async function HistoryPreviewSection({ data }: HistoryPreviewSectionProps) {
  const t = await getTranslations("Landing.history");

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <PublicRatesHistoryChart data={data} />
          </div>

          {/* CTA overlay at bottom of chart */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/90 to-transparent pt-12 pb-6 px-4 sm:px-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("preview_cta")}
            </p>
            <Button asChild>
              <Link href="/login">{t("sign_in")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
