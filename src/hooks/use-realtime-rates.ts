"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RateData } from "@/actions/rates";
import type { Database } from "@/types/supabase"; // Auto-generated types
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

// Infer the exact Row type directly from your database schema
type ExchangeRateRow = Database["public"]["Tables"]["exchange_rates"]["Row"];

// 1. Mapping Dictionary: Much cleaner than massive if/else blocks
const PAIR_MAPPING: Record<string, string> = {
  USDT_VES_Binance: "USDT / VED",
  USD_VES_BCV: "USD / VED",
  EUR_VES_BCV: "EUR / VED",
  BTC_USD_CoinGecko: "BTC / USD",
  BTC_USDT_CoinGecko: "BTC / USDT",
};

export function useRealtimeRates(initialRates: RateData[]) {
  const [rates, setRates] = useState<RateData[]>(initialRates);

  // 2. State Sync: If Next.js pushes fresh data from the server, update the UI
  // without killing the WebSocket connection below.
  useEffect(() => {
    setRates(initialRates);
  }, [initialRates]);

  // 3. Realtime Connection: Empty dependency array ensures we only connect ONCE.
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
              // Generate the composite key (e.g., "USDT_VES_Binance")
              const mappingKey = `${newRate.pair}_${newRate.source}`;
              const expectedUiPair = PAIR_MAPPING[mappingKey];

              // If this realtime insert belongs to this specific UI card
              if (expectedUiPair === rate.pair) {
                const oldValue = rate.value;

                // Note: Depending on your Supabase generation, numeric DB columns
                // might be typed as strings or numbers. We wrap in Number() to be safe.
                const newValue = Number(newRate.rate);

                const trend =
                  newValue > oldValue
                    ? "up"
                    : newValue < oldValue
                      ? "down"
                      : "flat";

                // Safely extract the old change percentage using regex
                const oldChangePct =
                  parseFloat(rate.change.replace(/[%+]/g, "")) / 100 || 0;

                // Reconstruct the 24h baseline (Fallback to newValue to prevent div by 0)
                const baseline24h = oldValue / (1 + oldChangePct) || newValue;

                const newChangePct =
                  baseline24h > 0
                    ? ((newValue - baseline24h) / baseline24h) * 100
                    : 0;

                // Format display string
                let displayRate = "";
                if (rate.pair.includes("BTC")) {
                  displayRate = rate.pair.includes("USDT")
                    ? `${newValue.toLocaleString()} USDT`
                    : `$${newValue.toLocaleString()}`;
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
  }, []); // <-- Empty array: Mount once, listen forever

  return rates;
}
