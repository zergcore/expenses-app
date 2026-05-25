"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cache } from "react";
import { z } from "zod";
import type { Database } from "../types/supabase";

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
// Strict Zod Schemas for API Responses
// -----------------------------------------------------------------------------

const BinanceResponseSchema = z.object({
  data: z
    .array(z.object({ adv: z.object({ price: z.string() }) }))
    .nullable()
    .optional(),
});

const DolarVzlaSchema = z.object({
  current: z
    .object({ usd: z.number().optional(), eur: z.number().optional() })
    .optional(),
  changePercentage: z
    .object({ usd: z.number().optional(), eur: z.number().optional() })
    .optional(),
});

const DolarApiSchema = z.object({
  promedio: z.number().optional(),
  price: z.number().optional(),
});

const FrankfurterSchema = z.object({
  rates: z.object({ USD: z.number() }),
});

const CoinGeckoSchema = z.object({
  bitcoin: z.object({
    usd: z.number(),
    usd_24h_change: z.number(),
    usdt: z.number(),
  }),
  tether: z.object({ usd: z.number(), usd_24h_change: z.number() }).optional(),
});

export interface BCVRatesResult {
  usd?: number;
  eur?: number;
  usdChange?: number;
  eurChange?: number;
  dolarvzlaFailed?: boolean;
}

// -----------------------------------------------------------------------------
// Fetchers (Runtime Safe)
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

      const parsed = BinanceResponseSchema.safeParse(await response.json());
      if (!parsed.success || !parsed.data.data || parsed.data.data.length === 0)
        return null;

      const ads = parsed.data.data;
      const sum = ads.reduce((acc, ad) => acc + parseFloat(ad.adv.price), 0);
      return sum / ads.length;
    };

    const [sellRate, buyRate] = await Promise.all([
      fetchP2PRate("SELL"),
      fetchP2PRate("BUY"),
    ]);
    if (sellRate && buyRate) return (sellRate + buyRate) / 2;
    return sellRate || buyRate || null;
  } catch (e) {
    console.error("Binance Fetch Error:", e);
    return null;
  }
}

async function fetchEurUsdRate(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?from=EUR&to=USD",
      {
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;

    const parsed = FrankfurterSchema.safeParse(await res.json());
    return parsed.success ? parsed.data.rates.USD : null;
  } catch {
    return null;
  }
}

async function fetchBCVRates(): Promise<BCVRatesResult | null> {
  const apiKey = process.env.DOLAR_VZLA_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        "https://api.dolarvzla.com/public/exchange-rate",
        {
          headers: { "x-dolarvzla-key": apiKey },
          next: { revalidate: 3600 },
        },
      );

      if (response.ok) {
        const parsed = DolarVzlaSchema.safeParse(await response.json());
        if (parsed.success) {
          return {
            usd: parsed.data.current?.usd || 0,
            eur: parsed.data.current?.eur || 0,
            usdChange: parsed.data.changePercentage?.usd,
            eurChange: parsed.data.changePercentage?.eur,
          };
        }
      }
    } catch (e) {
      console.error("DolarVzla Fetch Error:", e);
    }
  }

  try {
    const [usdRes, eurUsdRate] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
        next: { revalidate: 3600 },
      }),
      fetchEurUsdRate(),
    ]);

    let usdPrice = 0;
    if (usdRes.ok) {
      const parsed = DolarApiSchema.safeParse(await usdRes.json());
      if (parsed.success) {
        usdPrice = parsed.data.promedio ?? parsed.data.price ?? 0;
      }
    }

    const eurPrice =
      eurUsdRate && usdPrice > 0 ? eurUsdRate * usdPrice : undefined;
    return { usd: usdPrice, eur: eurPrice, dolarvzlaFailed: true };
  } catch (e) {
    console.error("BCV Fetch Error:", e);
    return null;
  }
}

async function fetchCryptoRates(): Promise<z.infer<
  typeof CoinGeckoSchema
> | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd,usdt&include_24hr_change=true",
      { next: { revalidate: 600 } },
    );

    if (!response.ok) return null;
    const parsed = CoinGeckoSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
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

  try {
    const serviceClient = createServiceClient<Database>();
    const { error } = await serviceClient.from("exchange_rates").insert({
      pair,
      source,
      rate,
      fetched_at: new Date().toISOString(),
    });

    if (error) console.error("DB Write Error:", error);
  } catch (e) {
    console.warn("Could not write rate to DB:", e);
  }
}

// -----------------------------------------------------------------------------
// Main Action
// -----------------------------------------------------------------------------

export const getExchangeRates = cache(async (): Promise<RateData[]> => {
  const supabase = await createClient<Database>();
  const now = new Date();

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

  const get24hAgoRate = async (pair: string, source: string) => {
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("pair", pair)
      .eq("source", source)
      .lt(
        "fetched_at",
        new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      )
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();
    return data?.rate ?? null;
  };

  const calculateTrend = (changeVal: number) => {
    if (Math.abs(changeVal) < 0.01) return "flat";
    return changeVal > 0 ? "up" : "down";
  };

  const formatChange = (changeVal: number) =>
    `${changeVal > 0 ? "+" : ""}${changeVal.toFixed(2)}%`;

  const pairs = [
    { pair: "USDT_VES", source: "Binance", staleMin: 5 },
    { pair: "USD_VES", source: "BCV", staleMin: 60 },
    { pair: "EUR_VES", source: "BCV", staleMin: 60 },
    { pair: "BTC_USD", source: "CoinGecko", staleMin: 5 },
    { pair: "BTC_USDT", source: "CoinGecko", staleMin: 5 },
  ];

  const needsFetch = { binance: false, bcv: false, crypto: false };

  pairs.forEach((p) => {
    const cached = findLatest(p.pair, p.source);
    if (
      !cached ||
      !cached.fetched_at ||
      (now.getTime() - new Date(cached.fetched_at).getTime()) / 60000 >
        p.staleMin
    ) {
      if (p.source === "Binance") needsFetch.binance = true;
      if (p.source === "BCV") needsFetch.bcv = true;
      if (p.source === "CoinGecko") needsFetch.crypto = true;
    }
  });

  const [binanceData, bcvData, cryptoData] = await Promise.all([
    needsFetch.binance ? fetchBinanceRate() : Promise.resolve(null),
    needsFetch.bcv ? fetchBCVRates() : Promise.resolve(null),
    needsFetch.crypto ? fetchCryptoRates() : Promise.resolve(null),
  ]);

  const results: RateData[] = [];

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
    return cached ? cached.rate : 0;
  };

  const [usdtVes, usdVes, eurVes, btcUsd, btcUsdt] = await Promise.all([
    getVal("USDT_VES", "Binance", binanceData ?? undefined),
    getVal("USD_VES", "BCV", bcvData?.usd),
    getVal("EUR_VES", "BCV", bcvData?.eur),
    getVal("BTC_USD", "CoinGecko", cryptoData?.bitcoin?.usd),
    getVal("BTC_USDT", "CoinGecko", cryptoData?.bitcoin?.usdt),
  ]);

  if (usdtVes > 0) {
    const prevUsdt = await get24hAgoRate("USDT_VES", "Binance");
    const changeVal =
      prevUsdt && prevUsdt > 0 ? ((usdtVes - prevUsdt) / prevUsdt) * 100 : 0;
    results.push({
      pair: "USDT / VED",
      rate: `Bs. ${usdtVes.toFixed(2)}`,
      trend: calculateTrend(changeVal),
      change: formatChange(changeVal),
      description: "Binance P2P Avg",
      value: usdtVes,
      source: "Binance",
    });
  }

  if (usdVes > 0) {
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

  if (btcUsd > 0) {
    const btcUsdChange = cryptoData?.bitcoin?.usd_24h_change || 0;
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
});

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
export interface BCVRatesResult {
  usd?: number;
  eur?: number;
  usdChange?: number;
  eurChange?: number;
  dolarvzlaFailed?: boolean; // true when primary API was unavailable
}

// -----------------------------------------------------------------------------
// Database Cache Operations
// -----------------------------------------------------------------------------

/**
 * Runs getExchangeRates and returns whether dolarvzla.com was unavailable.
 * Used by the cron route to decide whether to send an alert email.
 */
export async function getExchangeRatesWithStatus(): Promise<{
  rates: RateData[];
  dolarvzlaFailed: boolean;
}> {
  // We re-implement the BCV check here so we can read the flag without
  // changing getExchangeRates' public signature (it is called by many pages).
  const apiKey = process.env.DOLAR_VZLA_KEY;
  let dolarvzlaFailed = false;

  if (apiKey) {
    try {
      const res = await fetch(
        "https://api.dolarvzla.com/public/exchange-rate",
        {
          headers: { "x-dolarvzla-key": apiKey },
          next: { revalidate: 0 }, // bypass cache for a fresh check
        },
      );
      if (!res.ok) dolarvzlaFailed = true;
    } catch {
      dolarvzlaFailed = true;
    }
  } else {
    dolarvzlaFailed = true;
  }

  const rates = await getExchangeRates();
  return { rates, dolarvzlaFailed };
}

// -----------------------------------------------------------------------------
// Monthly Rate History (for charts)
// -----------------------------------------------------------------------------

export interface RateHistoryPoint {
  date: string;
  usd: number | null;
  usdt: number | null;
  eur: number | null;
}

/**
 * Fetches historical rates for the specified month/year (defaults to current).
 * Returns data points grouped by day for charting.
 */
export async function getMonthlyRateHistory(
  year?: number,
  month?: number, // 1-12
): Promise<RateHistoryPoint[]> {
  const supabase = await createClient<Database>();
  const now = new Date();

  const targetYear = year || now.getFullYear();
  const targetMonth = month ? month - 1 : now.getMonth(); // 0-11 for Date constructor

  // Get first and last day of target month
  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // Initialize map with all days in the month to ensure continuous chart
  const dayMap = new Map<
    string,
    { usd: number | null; usdt: number | null; eur: number | null }
  >();
  const daysInMonth = endOfMonth.getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(targetYear, targetMonth, i);
    // Use local date string YYYY-MM-DD
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(dateKey, { usd: null, usdt: null, eur: null });
  }

  // Fetch all rates for the month
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("pair, rate, fetched_at, source")
    .in("pair", ["USD_VES", "USDT_VES", "EUR_VES"])
    .gte("fetched_at", startOfMonth.toISOString())
    .lte("fetched_at", endOfMonth.toISOString())
    .order("fetched_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch rate history:", error);
    return [];
  }

  // Merge DB data into dayMap
  data?.forEach((row) => {
    if (!row.fetched_at) return;
    const fetchedDate = new Date(row.fetched_at);
    // Use same formatting logic as initialization
    const dateKey = `${fetchedDate.getFullYear()}-${String(fetchedDate.getMonth() + 1).padStart(2, "0")}-${String(fetchedDate.getDate()).padStart(2, "0")}`;
    const rate = row.rate;

    if (dayMap.has(dateKey)) {
      const dayData = dayMap.get(dateKey)!;
      if (row.pair === "USD_VES") {
        dayData.usd = rate;
      } else if (row.pair === "USDT_VES" || row.pair === "USDT / VED") {
        dayData.usdt = rate;
      } else if (row.pair === "EUR_VES") {
        dayData.eur = rate;
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
      eur: dayData.eur,
    });
  });

  return result;
}

// -----------------------------------------------------------------------------
// Daily (Intraday) Rate History
// -----------------------------------------------------------------------------

export interface DailyRatePoint {
  time: string; // "HH:mm" formatted from fetched_at in local time
  fetched_at: string; // ISO 8601 — retained for sorting
  usdt: number | null;
  usd: number | null;
  eur: number | null;
}

/**
 * Returns all raw exchange_rate records for a single calendar day.
 * Sorted ascending by fetched_at. Uses UTC day boundary.
 */
export async function getDailyRateHistory(
  date: string, // YYYY-MM-DD
): Promise<DailyRatePoint[]> {
  const supabase = await createClient<Database>();

  const startOfDay = new Date(date + "T00:00:00.000Z");
  const endOfDay = new Date(date + "T23:59:59.999Z");

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("pair, rate, fetched_at")
    .in("pair", ["USDT_VES", "USD_VES", "EUR_VES"])
    .gte("fetched_at", startOfDay.toISOString())
    .lte("fetched_at", endOfDay.toISOString())
    .order("fetched_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch daily rate history:", error);
    return [];
  }

  // Group by fetched_at timestamp — merge pairs that share the same second
  const pointMap = new Map<string, DailyRatePoint>();

  data?.forEach((row) => {
    const ts = row.fetched_at;
    if (!ts) return;
    if (!pointMap.has(ts)) {
      const d = new Date(ts);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      pointMap.set(ts, {
        time: `${hh}:${mm}`,
        fetched_at: ts,
        usdt: null,
        usd: null,
        eur: null,
      });
    }
    const point = pointMap.get(ts)!;
    const rate = typeof row.rate === 'string' ? parseFloat(row.rate) : row.rate;
    if (row.pair === "USDT_VES" || row.pair === "USDT / VED") point.usdt = rate;
    else if (row.pair === "USD_VES") point.usd = rate;
    else if (row.pair === "EUR_VES") point.eur = rate;
  });

  return Array.from(pointMap.values()).sort((a, b) =>
    a.fetched_at.localeCompare(b.fetched_at),
  );
}

// -----------------------------------------------------------------------------
// Last N Days Rate History (public / anon-accessible)
// -----------------------------------------------------------------------------

/**
 * Fetches rate history for the last `days` calendar days.
 * Uses anon-accessible RLS (exchange_rates allows anon SELECT).
 * Returns one point per calendar day (last rate of the day per pair).
 */
export async function getLastNDaysRateHistory(
  days: number,
): Promise<RateHistoryPoint[]> {
  const supabase = await createClient<Database>();
  const now = new Date();
  const endDate = now;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("pair, rate, fetched_at")
    .in("pair", ["USD_VES", "USDT_VES", "EUR_VES"])
    .gte("fetched_at", startDate.toISOString())
    .lte("fetched_at", endDate.toISOString())
    .order("fetched_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch last N days rate history:", error);
    return [];
  }

  // Build a dayMap keyed by YYYY-MM-DD, taking the last rate per day per pair
  const dayMap = new Map<
    string,
    { usd: number | null; usdt: number | null; eur: number | null }
  >();

  data?.forEach((row) => {
    if (!row.fetched_at) return;
    const d = new Date(row.fetched_at);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { usd: null, usdt: null, eur: null });
    }
    const dayData = dayMap.get(dateKey)!;
    const rate = row.rate;
    if (row.pair === "USD_VES") dayData.usd = rate;
    else if (row.pair === "USDT_VES" || row.pair === "USDT / VED")
      dayData.usdt = rate;
    else if (row.pair === "EUR_VES") dayData.eur = rate;
  });

  const result: RateHistoryPoint[] = [];
  Array.from(dayMap.keys())
    .sort()
    .forEach((date) => {
      const dayData = dayMap.get(date)!;
      result.push({
        date,
        usd: dayData.usd,
        usdt: dayData.usdt,
        eur: dayData.eur,
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
  const supabase = await createClient<Database>();

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
      const rate = row.rate;
      if (row.pair === "USD_VES") rates.usd_ves = rate;
      if (row.pair === "USDT_VES" || row.pair === "USDT / VED")
        rates.usdt_ves = rate;
      if (row.pair === "EUR_VES") rates.eur_ves = rate;
    }
  });

  // Calculate derived rates
  rates.usd_usdt = rates.usdt_ves > 0 ? rates.usd_ves / rates.usdt_ves : 0;
  rates.eur_usdt = rates.usdt_ves > 0 ? rates.eur_ves / rates.usdt_ves : 0;

  return rates;
}
