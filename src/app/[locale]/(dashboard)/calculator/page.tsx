import { getExchangeRates } from "@/actions/rates";
import { CurrencyCalculator } from "@/components/landing/currency-calculator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function CalculatorDashboardPage() {
  const t = await getTranslations();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("Nav.calculator")}
        </h1>
        <p className="text-muted-foreground">{t("Rates.description")}</p>
      </div>

      <div className="max-w-2xl">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("Landing.calculator")}</CardTitle>
            <CardDescription>{t("Landing.rates.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyCalculator rates={calculatorRates} allRates={rates} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
