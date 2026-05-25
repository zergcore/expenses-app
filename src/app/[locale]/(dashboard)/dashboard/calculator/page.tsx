import { getExchangeRates } from "@/actions/rates";
import { CurrencyCalculator } from "@/components/landing/currency-calculator";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

function CalculatorSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Title skeleton */}
        <div className="h-6 w-1/3 mx-auto bg-muted animate-pulse rounded" />
        
        {/* Conversion container skeleton */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-4">
          {/* Currency selector row skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-muted/70 animate-pulse rounded" />
            <div className="h-8 w-28 bg-muted/70 animate-pulse rounded" />
          </div>
          
          {/* From input skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-12 bg-muted/70 animate-pulse rounded" />
            <div className="h-10 w-full bg-muted/70 animate-pulse rounded" />
          </div>
          
          {/* Swap button skeleton */}
          <div className="h-8 w-8 mx-auto bg-muted/70 animate-pulse rounded-full" />
          
          {/* To input skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-12 bg-muted/70 animate-pulse rounded" />
            <div className="h-10 w-full bg-muted/70 animate-pulse rounded" />
          </div>
        </div>
        
        {/* Rate info skeleton */}
        <div className="h-4 w-1/2 mx-auto bg-muted/70 animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

async function CalculatorContainer() {
  const rates = await getExchangeRates();

  // Extract rates from the API response
  const usdtRate = rates.find((r) => r.pair === "USDT / VED")?.value || 0;
  const usdRate = rates.find((r) => r.pair === "USD / VED")?.value || 0;
  const eurRate = rates.find((r) => r.pair === "EUR / VED")?.value || 0;

  const calculatorRates = {
    usdToBs: usdRate,
    usdtToBs: usdtRate,
    eurToBs: eurRate,
  };

  return <CurrencyCalculator rates={calculatorRates} allRates={rates} />;
}

export default async function CalculatorDashboardPage() {
  const tNav = await getTranslations("Nav");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {tNav("calculator")}
        </h1>
        <p className="text-muted-foreground text-sm">
          Convert between USD, USDT, EUR, and VES using real-time rates.
        </p>
      </div>

      <div className="pt-2 sm:pt-4">
        <Suspense fallback={<CalculatorSkeleton />}>
          <CalculatorContainer />
        </Suspense>
      </div>
    </div>
  );
}
