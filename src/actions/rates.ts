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
    const fetchP2PRate = async (
      tradeType: "BUY" | "SELL",
    ): Promise<number | null> => {
      const response = await fetch(
        "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fiat: "VES",
            page: 1,
            rows: 10,
            tradeType,
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
    };

    // Fetch both BUY and SELL rates
    const [sellRate, buyRate] = await Promise.all([
      fetchP2PRate("SELL"),
      fetchP2PRate("BUY"),
    ]);

    // Return average of both rates, or whichever is available
    if (sellRate && buyRate) {
      return (sellRate + buyRate) / 2;
    }
    return sellRate || buyRate || null;
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

async function fetchBCVRates(): Promise<{
  usd?: number;
  eur?: number;
  usdChange?: number;
  eurChange?: number;
} | null> {
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
          usdChange: data.changePercentage?.usd,
          eurChange: data.changePercentage?.eur,
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

    return { usd: usdPrice };
  } catch (e) {
    console.error("BCV Fetch Error:", e);
    return null;
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

  // 1. Get Cached Rates from DB (Recent)
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

  // Helper to fetch rate from ~24h ago
  const get24hAgoRate = async (pair: string, source: string) => {
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("pair", pair)
      .eq("source", source)
      .lt(
        "fetched_at",
        new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      ) // Older than 20h
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();
    return data?.rate ? parseFloat(data.rate) : null;
  };

  const calculateTrend = (changeVal: number) => {
    if (Math.abs(changeVal) < 0.01) return "flat";
    return changeVal > 0 ? "up" : "down";
  };

  const formatChange = (changeVal: number) => {
    return `${changeVal > 0 ? "+" : ""}${changeVal.toFixed(2)}%`;
  };

  // 2. Define Requirements
  const pairs = [
    { pair: "USDT_VES", source: "Binance", staleMin: 5 },
    { pair: "USD_VES", source: "BCV", staleMin: 60 }, // 1h (was 24h)
    { pair: "EUR_VES", source: "BCV", staleMin: 60 }, // 1h (was 24h)
    { pair: "BTC_USD", source: "CoinGecko", staleMin: 5 },
    { pair: "BTC_USDT", source: "CoinGecko", staleMin: 5 },
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
  else promises.push(Promise.resolve(null));

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
    const prevUsdt = await get24hAgoRate("USDT_VES", "Binance");
    const changeVal =
      prevUsdt && prevUsdt > 0 ? ((usdtVes - prevUsdt) / prevUsdt) * 100 : 0;

    results.push({
      pair: "USDT / USD",
      rate: `Bs. ${usdtVes.toFixed(2)}`,
      trend: calculateTrend(changeVal),
      change: formatChange(changeVal),
      description: "Binance P2P Avg",
      value: usdtVes,
      source: "Binance",
    });
  }

  // USD / VES (BCV)
  const usdVes = await getVal("USD_VES", "BCV", bcvData?.usd);
  if (usdVes > 0) {
    // Prefer API provided change, fallback to calculation if needed
    let changeVal = bcvData?.usdChange;
    if (changeVal === undefined) {
      const prevUsd = await get24hAgoRate("USD_VES", "BCV");
      changeVal =
        prevUsd && prevUsd > 0 ? ((usdVes - prevUsd) / prevUsd) * 100 : 0;
    }

    results.push({
      pair: "USD / VED",
      rate: `Bs. ${usdVes.toFixed(2)}`,
      trend: calculateTrend(changeVal),
      change: formatChange(changeVal),
      description: "BCV Official",
      value: usdVes,
      source: "BCV",
    });
  }

  // EUR / VES (BCV)
  const eurVes = await getVal("EUR_VES", "BCV", bcvData?.eur);
  if (eurVes > 0) {
    let changeVal = bcvData?.eurChange;
    if (changeVal === undefined) {
      const prevEur = await get24hAgoRate("EUR_VES", "BCV");
      changeVal =
        prevEur && prevEur > 0 ? ((eurVes - prevEur) / prevEur) * 100 : 0;
    }

    results.push({
      pair: "EUR / VED",
      rate: `Bs. ${eurVes.toFixed(2)}`,
      trend: calculateTrend(changeVal),
      change: formatChange(changeVal),
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
    // CoinGecko API typically returns USD change, assuming USDT tracks USD closely...
    // Or we could calculate it using DB manually if desired, but 0.0% is probably safer default here if no explicit API data
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

// -----------------------------------------------------------------------------
// Monthly Rate History (for charts)
// -----------------------------------------------------------------------------

export interface RateHistoryPoint {
  date: string;
  usd: number | null;
  usdt: number | null;
}

/**
 * Fetches historical rates for the specified month/year (defaults to current).
 * Returns data points grouped by day for charting.
 */
export async function getMonthlyRateHistory(
  year?: number,
  month?: number, // 1-12
): Promise<RateHistoryPoint[]> {
  const supabase = await createClient();
  const now = new Date();

  const targetYear = year || now.getFullYear();
  const targetMonth = month ? month - 1 : now.getMonth(); // 0-11 for Date constructor

  // Get first and last day of target month
  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // Initialize map with all days in the month to ensure continuous chart
  const dayMap = new Map<string, { usd: number | null; usdt: number | null }>();
  const daysInMonth = endOfMonth.getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(targetYear, targetMonth, i);
    // Use local date string YYYY-MM-DD
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(dateKey, { usd: null, usdt: null });
  }

  // Fetch all rates for the month
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("pair, rate, fetched_at, source")
    .in("pair", ["USD_VES", "USDT_VES"])
    .gte("fetched_at", startOfMonth.toISOString())
    .lte("fetched_at", endOfMonth.toISOString())
    .order("fetched_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch rate history:", error);
    return [];
  }

  // Merge DB data into dayMap
  data?.forEach((row) => {
    const fetchedDate = new Date(row.fetched_at);
    // Use same formatting logic as initialization
    const dateKey = `${fetchedDate.getFullYear()}-${String(fetchedDate.getMonth() + 1).padStart(2, "0")}-${String(fetchedDate.getDate()).padStart(2, "0")}`;
    const rate = parseFloat(row.rate);

    if (dayMap.has(dateKey)) {
      const dayData = dayMap.get(dateKey)!;
      if (row.pair === "USD_VES") {
        dayData.usd = rate;
      } else if (row.pair === "USDT_VES") {
        dayData.usdt = rate;
      }
    }
  });

  // Convert to array sorted by date
  const result: RateHistoryPoint[] = [];
  const sortedDates = Array.from(dayMap.keys()).sort();

  sortedDates.forEach((date) => {
    const dayData = dayMap.get(date)!;
    result.push({
      date,
      usd: dayData.usd,
      usdt: dayData.usdt,
    });
  });

  return result;
}

// -----------------------------------------------------------------------------
// Get Current Rates Snapshot for Expense Creation
// -----------------------------------------------------------------------------

export interface RatesSnapshot {
  usd_ves: number;
  usdt_ves: number;
  eur_ves: number;
  usd_usdt: number;
  eur_usdt: number;
}

/**
 * Get the most recent rates from the database for expense creation.
 * Returns a snapshot of all rate pairs needed for equivalents calculation.
 */
export async function getCurrentRatesSnapshot(): Promise<RatesSnapshot> {
  const supabase = await createClient();

  // Fetch the most recent rate for each pair
  const { data } = await supabase
    .from("exchange_rates")
    .select("pair, rate")
    .in("pair", ["USD_VES", "USDT_VES", "EUR_VES"])
    .order("fetched_at", { ascending: false });

  const rates: RatesSnapshot = {
    usd_ves: 0,
    usdt_ves: 0,
    eur_ves: 0,
    usd_usdt: 0,
    eur_usdt: 0,
  };

  // Get the latest rate for each pair
  const seen = new Set<string>();
  data?.forEach((row) => {
    if (!seen.has(row.pair)) {
      seen.add(row.pair);
      const rate = parseFloat(row.rate);
      if (row.pair === "USD_VES") rates.usd_ves = rate;
      if (row.pair === "USDT_VES") rates.usdt_ves = rate;
      if (row.pair === "EUR_VES") rates.eur_ves = rate;
    }
  });

  // Calculate derived rates
  rates.usd_usdt = rates.usdt_ves > 0 ? rates.usd_ves / rates.usdt_ves : 0;
  rates.eur_usdt = rates.usdt_ves > 0 ? rates.eur_ves / rates.usdt_ves : 0;

  return rates;
}
