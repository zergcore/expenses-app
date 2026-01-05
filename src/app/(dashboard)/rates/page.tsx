import { RateCard } from "@/components/rates/rate-card";
import { requireUser } from "@/lib/auth/server";
import { getExchangeRates } from "@/actions/rates";

export default async function RatesPage() {
  await requireUser();

  const rates = await getExchangeRates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Exchange Rates
        </h1>
        <p className="text-muted-foreground">
          Current market rates for supported currencies.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate, index) => (
          <RateCard key={index} {...rate} />
        ))}
      </div>
    </div>
  );
}
