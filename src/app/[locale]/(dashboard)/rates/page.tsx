import { RateCard } from "@/components/rates/rate-card";
import { requireUser } from "@/lib/auth/server";
import { getExchangeRates } from "@/actions/rates";
import { RatesTitle } from "@/components/rates/rates-title";

export default async function RatesPage() {
  await requireUser();

  const rates = await getExchangeRates();

  return (
    <div className="space-y-6">
      <RatesTitle />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate, index) => (
          <RateCard key={index} {...rate} />
        ))}
      </div>
    </div>
  );
}
