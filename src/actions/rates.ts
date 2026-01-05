"use server";

export async function getExchangeRates() {
  // Mock data - eventually fetch from external API
  // Examples: CoinGecko for crypto, OpenExchangeRates/BCV crawler for fiat
  // For now, we return static values to sync Dashboard and Rates page.

  return [
    {
      pair: "USD / VED",
      rate: "Bs. 60.50",
      trend: "up" as const,
      change: "+0.5%",
      description: "BCV Rate",
      value: 60.5, // numeric value for calculations if needed
    },
    {
      pair: "USDT / USD",
      rate: "$1.00",
      trend: "flat" as const,
      change: "0.0%",
      description: "Stablecoin Peg",
      value: 1.0,
    },
    {
      pair: "EUR / USD",
      rate: "$1.05",
      trend: "down" as const,
      change: "-0.2%",
      description: "Forex Market",
      value: 1.05,
    },
    {
      pair: "BTC / USD",
      rate: "$95,432.10",
      trend: "up" as const,
      change: "+2.5%",
      description: "Bitcoin",
      value: 95432.1,
    },
  ];
}
