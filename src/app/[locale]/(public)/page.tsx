import { getExchangeRates } from "@/actions/rates";
import { CurrencyCalculator } from "@/components/landing/currency-calculator";
import { RateComparisonChart } from "@/components/landing/rate-comparison-chart";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { CTASection } from "@/components/public/cta-section";
import { Footer } from "@/components/public/footer";
import { HeroSection } from "@/components/public/hero-section";
import { RateCardsSection } from "@/components/public/rate-cards-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function LandingPage() {
  const rates = await getExchangeRates();
  const t = await getTranslations();

  // Extract rates from the API response
  const usdtRate = rates.find((r) => r.pair === "USDT / USD")?.value || 0;
  const usdRate = rates.find((r) => r.pair === "USD / VED")?.value || 0;
  const eurRate = rates.find((r) => r.pair === "EUR / VED")?.value || 0;

  const calculatorRates = {
    usdToBs: usdRate,
    usdtToBs: usdtRate,
    eurToBs: eurRate,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Fin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeSwitcher />
            <Button asChild variant="ghost">
              <Link href="/login">{t("Auth.login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t("Auth.register")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Calculator & Chart Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <CurrencyCalculator rates={calculatorRates} />
          <RateComparisonChart usdRate={usdRate} usdtRate={usdtRate} />
        </div>
      </section>

      {/* Rate Cards Section */}
      <RateCardsSection rates={rates} />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
