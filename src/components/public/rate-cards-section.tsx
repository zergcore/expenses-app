import { ExchangeRate } from "@/types";
import { useTranslations } from "next-intl";

export const RateCardsSection = ({ rates }: { rates: ExchangeRate[] }) => {
  const t = useTranslations();
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-center mb-8">
        {t("Landing.rates.title")}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {rates
          .filter((r) =>
            ["USDT / USD", "USD / VED", "EUR / VED"].includes(r.pair),
          )
          .map((rate, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {rate.pair}
              </p>
              <p className="text-3xl font-bold">{rate.rate}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {rate.source}
              </p>
            </div>
          ))}
      </div>
    </section>
  );
};
