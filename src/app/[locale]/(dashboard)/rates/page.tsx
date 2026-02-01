import { RateCard } from "@/components/rates/rate-card";
import { RatesHistoryChart } from "@/components/rates/rates-history-chart";
import { requireUser } from "@/lib/auth/server";
import { getExchangeRates, getMonthlyRateHistory } from "@/actions/rates";
import { RatesTitle } from "@/components/rates/rates-title";

export default async function RatesPage() {
  await requireUser();

  const [rates, rateHistory] = await Promise.all([
    getExchangeRates(),
    getMonthlyRateHistory(),
  ]);

  return (
    <div className="space-y-6">
      <RatesTitle />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate, index) => (
          <RateCard key={index} {...rate} />
        ))}
      </div>

      {/* Monthly Rate History Chart */}
      <RatesHistoryChart data={rateHistory} />
    </div>
  );
}
