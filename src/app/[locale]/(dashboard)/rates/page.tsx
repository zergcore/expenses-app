import { RateCard } from "@/components/rates/rate-card";
import { RatesHistoryChart } from "@/components/rates/rates-history-chart";
import { requireUser } from "@/lib/auth/server";
import {
  getExchangeRates,
  getMonthlyRateHistory,
  getDailyRateHistory,
} from "@/actions/rates";
import { RatesTitle } from "@/components/rates/rates-title";

interface RatesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RatesPage({ searchParams }: RatesPageProps) {
  await requireUser();

  const resolvedParams = await searchParams;
  const granularity =
    resolvedParams?.granularity === "day" ? "day" : "month";

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let year: number | undefined;
  let month: number | undefined;
  let dateStr: string = todayStr;

  if (granularity === "month") {
    if (resolvedParams?.month && typeof resolvedParams.month === "string") {
      const [y, m] = resolvedParams.month.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        year = y;
        month = m;
      }
    }
  } else {
    if (resolvedParams?.date && typeof resolvedParams.date === "string") {
      const parsed = resolvedParams.date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
        dateStr = parsed;
      }
    }
  }

  const [rates, rateHistory] = await Promise.all([
    getExchangeRates(),
    granularity === "day"
      ? getDailyRateHistory(dateStr)
      : getMonthlyRateHistory(year, month),
  ]);

  return (
    <div className="space-y-6">
      <RatesTitle />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate, index) => (
          <RateCard key={index} {...rate} />
        ))}
      </div>

      <RatesHistoryChart
        data={rateHistory}
        granularity={granularity}
        selectedDate={dateStr}
      />
    </div>
  );
}
