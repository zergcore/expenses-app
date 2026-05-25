import { RateCard } from "@/components/rates/rate-card";
import { RatesHistoryChart } from "@/components/rates/rates-history-chart";
import { requireUser } from "@/lib/auth/server";
import { getExchangeRates, getMonthlyRateHistory } from "@/actions/rates";
import { RatesTitle } from "@/components/rates/rates-title";
import { ShareRatesButton } from "@/components/rates/share-rates-button";

export default async function RatesPage() {
  await requireUser();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [rates, initialRateHistory] = await Promise.all([
    getExchangeRates(),
    getMonthlyRateHistory(year, month),
  ]);

  return (
    <div className="space-y-6">
      <RatesTitle>
        <ShareRatesButton rates={rates} />
      </RatesTitle>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate, index) => (
          <RateCard key={index} {...rate} />
        ))}
      </div>

      <RatesHistoryChart
        initialData={initialRateHistory}
        initialGranularity="month"
        initialDate={dateStr}
      />
    </div>
  );
}
