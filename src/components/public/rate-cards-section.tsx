"use client";

import { RateData } from "@/actions/rates";
import { useTranslations } from "next-intl";
import { useRealtimeRates } from "@/hooks/use-realtime-rates";

export const RateCardsSection = ({
  rates: initialRates,
}: {
  rates: RateData[];
}) => {
  const t = useTranslations();
  const rates = useRealtimeRates(initialRates);

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
        {t("Landing.rates.title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
        {rates
          .filter((r) =>
            ["USDT / USD", "USD / VED", "EUR / VED"].includes(r.pair),
          )
          .map((rate, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-4 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                {rate.pair}
              </p>
              <p className="text-2xl sm:text-3xl font-bold">{rate.rate}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                {rate.source}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
};
