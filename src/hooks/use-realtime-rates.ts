"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RateData } from "@/actions/rates";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

interface ExchangeRateRow {
  id: string;
  pair: string;
  source: string;
  rate: number;
  fetched_at: string;
}

export function useRealtimeRates(initialRates: RateData[]) {
  const [rates, setRates] = useState<RateData[]>(initialRates);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-rates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "exchange_rates",
        },
        (payload: RealtimePostgresInsertPayload<ExchangeRateRow>) => {
          const newRate = payload.new;
          console.log("Realtime rate update:", newRate);

          setRates((currentRates) => {
            return currentRates.map((rate) => {
              // Match logic: check if the incoming rate matches the pair/source of the UI item
              // We need to map DB keys (e.g. USDT_VES) to UI pairs (e.g. USDT / USD)
              // This relies on the fact that existing rates have valid derived data.

              // Mapping logic based on rates.ts
              let isMatch = false;

              if (
                newRate.pair === "USDT_VES" &&
                newRate.source === "Binance" &&
                rate.pair === "USDT / USD"
              ) {
                isMatch = true;
              } else if (
                newRate.pair === "USD_VES" &&
                newRate.source === "BCV" &&
                rate.pair === "USD / VED"
              ) {
                isMatch = true;
              } else if (
                newRate.pair === "EUR_VES" &&
                newRate.source === "BCV" &&
                rate.pair === "EUR / VED"
              ) {
                isMatch = true;
              } else if (
                newRate.pair === "BTC_USD" &&
                newRate.source === "CoinGecko" &&
                rate.pair === "BTC / USD"
              ) {
                isMatch = true;
              } else if (
                newRate.pair === "BTC_USDT" &&
                newRate.source === "CoinGecko" &&
                rate.pair === "BTC / USDT"
              ) {
                isMatch = true;
              }

              if (isMatch) {
                // Calculate new trend based on old value vs new value
                const oldValue = rate.value;
                const newValue = newRate.rate;
                const trend =
                  newValue > oldValue
                    ? "up"
                    : newValue < oldValue
                      ? "down"
                      : "flat";

                // For change percentage, we ideally keep the original 24h old reference.
                // Since we don't have it explicitly, we can back-calculate it from the initial rate state
                // or just keep the old % change if we assume 24h baseline hasn't shifted much in this session.
                // However, a live price update usually implies we should re-calc the % change vs the OPEN.
                // Let's rely on the fact that `rate.change` is a string like "+1.20%".
                // If we want to be precise, we need the 24h-ago value.
                // Let's approximate: `24h_old = oldValue / (1 + oldChange%)`.
                // Parse old change:
                const oldChangeStr = rate.change
                  .replace("%", "")
                  .replace("+", "");
                const oldChangePct = parseFloat(oldChangeStr) / 100;
                const baseline24h = oldValue / (1 + oldChangePct);

                let newChangePct = 0;
                if (baseline24h > 0) {
                  newChangePct = ((newValue - baseline24h) / baseline24h) * 100;
                }

                // Format display string
                // Determine format based on pair (BTC uses $ or USDT suffix, Fiat uses Bs. prefix)
                let displayRate = "";
                if (rate.pair.includes("BTC")) {
                  if (rate.pair.includes("USDT")) {
                    displayRate = `${newValue.toLocaleString()} USDT`;
                  } else {
                    displayRate = `$${newValue.toLocaleString()}`;
                  }
                } else {
                  displayRate = `Bs. ${newValue.toFixed(2)}`;
                }

                return {
                  ...rate,
                  value: newValue,
                  rate: displayRate,
                  trend: trend,
                  change: `${newChangePct > 0 ? "+" : ""}${newChangePct.toFixed(2)}%`,
                  lastUpdated: new Date().toISOString(),
                };
              }
              return rate;
            });
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialRates]);

  return rates;
}
