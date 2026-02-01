import { RateCard } from "@/components/rates/rate-card";
import { RatesHistoryChart } from "@/components/rates/rates-history-chart";
import { requireUser } from "@/lib/auth/server";
import { getExchangeRates, getMonthlyRateHistory } from "@/actions/rates";
import { RatesTitle } from "@/components/rates/rates-title";

interface RatesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RatesPage({ searchParams }: RatesPageProps) {
  await requireUser();

  const resolvedParams = await searchParams;

  // Parse month from search params (format: YYYY-MM)
  let year: number | undefined;
  let month: number | undefined;

  if (resolvedParams?.month && typeof resolvedParams.month === "string") {
    const [y, m] = resolvedParams.month.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  const [rates, rateHistory] = await Promise.all([
    getExchangeRates(),
    getMonthlyRateHistory(year, month),
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
