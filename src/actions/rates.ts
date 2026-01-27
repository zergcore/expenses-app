"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface RateData {
  pair: string;
  rate: string;
  trend: "up" | "down" | "flat";
  change: string;
  description: string;
  value: number;
  source: string;
  lastUpdated?: string;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

interface BinanceAd {
  adv: {
    price: string;
  };
}

interface BinanceResponse {
  data: BinanceAd[];
}

interface DolarApiResponse {
  promedio?: number;
  price?: number;
}

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
    usdt: number;
  };
  tether: {
    usd: number;
    usd_24h_change: number;
  };
}

// -----------------------------------------------------------------------------
// Fetchers
// -----------------------------------------------------------------------------

async function fetchBinanceRate(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fiat: "VES",
          page: 1,
          rows: 10,
          tradeType: "SELL",
          asset: "USDT",
          countries: [],
          proMerchantAds: false,
          shieldMerchantAds: false,
          publisherType: null,
          payTypes: [],
          classifies: ["mass", "profession"],
        }),
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as BinanceResponse;
    const ads = data.data;

    if (!ads || ads.length === 0) return null;

    // Calculate average of top 10 results
    const sum = ads.reduce((acc, ad) => acc + parseFloat(ad.adv.price), 0);
    return sum / ads.length;
  } catch (e) {
    console.error("Binance Fetch Error:", e);
    return null;
  }
}

// DolarVzla API response type
interface DolarVzlaResponse {
  current: {
    usd: number;
    eur: number;
    date: string;
  };
  previous: {
    usd: number;
    eur: number;
    date: string;
  };
  changePercentage: {
    usd: number;
    eur: number;
  };
}

async function fetchBCVRates(): Promise<{ usd: number; eur: number }> {
  const apiKey = process.env.DOLAR_VZLA_KEY;

  // Try dolarvzla.com API first (has both USD and EUR)
  if (apiKey) {
    try {
      const response = await fetch(
        "https://api.dolarvzla.com/public/exchange-rate",
        {
          headers: {
            "x-dolarvzla-key": apiKey,
          },
          next: { revalidate: 3600 },
        },
      );

      if (response.ok) {
        const data = (await response.json()) as DolarVzlaResponse;
        return {
          usd: data.current?.usd || 0,
          eur: data.current?.eur || 0,
        };
      }
    } catch (e) {
      console.error("DolarVzla Fetch Error:", e);
    }
  }

  // Fallback to dolarapi.com (USD only, no EUR endpoint)
  try {
    const usdRes = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 3600 },
    });

    let usdPrice = 0;

    if (usdRes.ok) {
      const data = (await usdRes.json()) as DolarApiResponse;
      usdPrice = data.promedio ?? data.price ?? 0;
    }

    return { usd: usdPrice, eur: 0 };
  } catch (e) {
    console.error("BCV Fetch Error:", e);
    return { usd: 0, eur: 0 };
  }
}

async function fetchCryptoRates(): Promise<CoinGeckoResponse | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd,usdt&include_24hr_change=true",
      { next: { revalidate: 600 } },
    );

    if (!response.ok) return null;
    return (await response.json()) as CoinGeckoResponse;
  } catch (e) {
    console.error("Crypto Fetch Error:", e);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Database Cache Operations
// -----------------------------------------------------------------------------

async function updateRateInDB(pair: string, source: string, rate: number) {
  if (rate <= 0) return;

  // Use service role client to bypass RLS for system-level writes
  // This is necessary because public users (anon) cannot insert rates
  try {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from("exchange_rates").insert({
      pair,
      source,
      rate,
      fetched_at: new Date().toISOString(),
    });

    if (error) {
      console.error("DB Write Error:", error);
    }
  } catch (e) {
    // Service role key might not be available in all environments
    console.warn(
      "Could not write rate to DB (service role may not be configured):",
      e,
    );
  }
}

// -----------------------------------------------------------------------------
// Main Action
// -----------------------------------------------------------------------------

export async function getExchangeRates(): Promise<RateData[]> {
  const supabase = await createClient();
  const now = new Date();

  // 1. Get Cached Rates from DB
  const { data: cachedData } = await supabase
    .from("exchange_rates")
    .select("*")
    .gt(
      "fetched_at",
      new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    )
    .order("fetched_at", { ascending: false });

  const findLatest = (pair: string, source: string) =>
    cachedData?.find((r) => r.pair === pair && r.source === source);

  // 2. Define Requirements
  const pairs = [
    { pair: "USDT_VES", source: "Binance", staleMin: 30 },
    { pair: "USD_VES", source: "BCV", staleMin: 1440 }, // 24h
    { pair: "EUR_VES", source: "BCV", staleMin: 1440 },
    { pair: "BTC_USD", source: "CoinGecko", staleMin: 10 },
    { pair: "BTC_USDT", source: "CoinGecko", staleMin: 10 },
  ];

  const results: RateData[] = [];

  // 3. Check what needs fetching
  const needsFetch = {
    binance: false,
    bcv: false,
    crypto: false,
  };

  pairs.forEach((p) => {
    const cached = findLatest(p.pair, p.source);
    if (!cached) {
      if (p.source === "Binance") needsFetch.binance = true;
      if (p.source === "BCV") needsFetch.bcv = true;
      if (p.source === "CoinGecko") needsFetch.crypto = true;
    } else {
      const ageMin =
        (now.getTime() - new Date(cached.fetched_at).getTime()) / 60000;
      if (ageMin > p.staleMin) {
        if (p.source === "Binance") needsFetch.binance = true;
        if (p.source === "BCV") needsFetch.bcv = true;
        if (p.source === "CoinGecko") needsFetch.crypto = true;
      }
    }
  });

  // 4. Perform Fetches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promises: Promise<any>[] = [];

  if (needsFetch.binance) promises.push(fetchBinanceRate());
  else promises.push(Promise.resolve(null));

  if (needsFetch.bcv) promises.push(fetchBCVRates());
  else promises.push(Promise.resolve({ usd: 0, eur: 0 }));

  if (needsFetch.crypto) promises.push(fetchCryptoRates());
  else promises.push(Promise.resolve(null));

  const [binanceData, bcvData, cryptoData] = await Promise.all(promises);

  // 5. Update DB and Build Results
  const getVal = async (
    targetPair: string,
    targetSource: string,
    newData: number | undefined,
  ): Promise<number> => {
    if (newData && newData > 0) {
      await updateRateInDB(targetPair, targetSource, newData);
      return newData;
    }
    const cached = findLatest(targetPair, targetSource);
    return cached ? parseFloat(cached.rate) : 0;
  };

  // USDT / VES (Binance)
  const usdtVes = await getVal("USDT_VES", "Binance", binanceData);
  if (usdtVes > 0) {
    results.push({
      pair: "USDT / USD",
      rate: `Bs. ${usdtVes.toFixed(2)}`,
      trend: "flat",
      change: "0.0%",
      description: "Binance P2P Avg",
      value: usdtVes,
      source: "Binance",
    });
  }

  // USD / VES (BCV)
  const usdVes = await getVal("USD_VES", "BCV", bcvData?.usd);
  if (usdVes > 0) {
    results.push({
      pair: "USD / VED",
      rate: `Bs. ${usdVes.toFixed(2)}`,
      trend: "flat",
      change: "0.0%",
      description: "BCV Official",
      value: usdVes,
      source: "BCV",
    });
  }

  // EUR / VES (BCV)
  const eurVes = await getVal("EUR_VES", "BCV", bcvData?.eur);
  if (eurVes > 0) {
    results.push({
      pair: "EUR / VED",
      rate: `Bs. ${eurVes.toFixed(2)}`,
      trend: "flat",
      change: "0.0%",
      description: "BCV Official",
      value: eurVes,
      source: "BCV",
    });
  }

  // BTC / USD
  const btcUsdData = cryptoData?.bitcoin;
  const btcUsd = await getVal("BTC_USD", "CoinGecko", btcUsdData?.usd);
  if (btcUsd > 0) {
    const btcUsdChange = btcUsdData?.usd_24h_change || 0;
    results.push({
      pair: "BTC / USD",
      rate: `$${btcUsd.toLocaleString()}`,
      trend: btcUsdChange > 0 ? "up" : "down",
      change: `${btcUsdChange.toFixed(2)}%`,
      description: "CoinGecko",
      value: btcUsd,
      source: "CoinGecko",
    });
  }

  // BTC / USDT
  const btcUsdt = await getVal("BTC_USDT", "CoinGecko", btcUsdData?.usdt);
  if (btcUsdt > 0) {
    results.push({
      pair: "BTC / USDT",
      rate: `${btcUsdt.toLocaleString()} USDT`,
      trend: "flat",
      change: "0.0%",
      description: "CoinGecko",
      value: btcUsdt,
      source: "CoinGecko",
    });
  }

  return results;
}
