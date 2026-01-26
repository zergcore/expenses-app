import { getExchangeRates } from "@/actions/rates";
import { CurrencyCalculator } from "@/components/landing/currency-calculator";
import { RateComparisonChart } from "@/components/landing/rate-comparison-chart";
import { CTASection } from "@/components/public/cta-section";
import { Footer } from "@/components/public/footer";
import { HeroSection } from "@/components/public/hero-section";
import { RateCardsSection } from "@/components/public/rate-cards-section";
import { Header } from "@/components/public/header";

export default async function LandingPage() {
  const rates = await getExchangeRates();

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
      <Header user={undefined} />

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
