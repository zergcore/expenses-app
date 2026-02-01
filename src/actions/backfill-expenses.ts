"use server";

import { createServiceClient } from "@/lib/supabase/server";
import type { RatesSnapshot } from "@/actions/rates";
import type { Currency, CurrencyEquivalents } from "@/lib/currency-types";

/**
 * Backfill existing expenses with equivalents and rates_at_creation.
 * This uses the closest available rate to the expense's date.
 *
 * @param forceAll - If true, recalculates ALL expenses regardless of existing equivalents
 */
export async function backfillExpenseRates(forceAll: boolean = false): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = createServiceClient();

  // Get expenses to process
  let query = supabase
    .from("expenses")
    .select("id, amount, currency, date")
    .order("date", { ascending: true });

  // If not forcing all, only get expenses without equivalents
  if (!forceAll) {
    query = query.is("equivalents", null);
  }

  const { data: expenses, error: fetchError } = await query;

  if (fetchError || !expenses) {
    console.error("Error fetching expenses:", fetchError);
    return { processed: 0, errors: 1 };
  }

  console.log(
    `Processing ${expenses.length} expenses (forceAll: ${forceAll})...`,
  );

  let processed = 0;
  let errors = 0;

  for (const expense of expenses) {
    try {
      // Get the closest rate to the expense date
      const rates = await getRatesForDate(expense.date);

      // Calculate equivalents
      const equivalents = calculateEquivalentsForBackfill(
        expense.amount,
        expense.currency as Currency,
        rates,
      );

      console.log(
        `${expense.date.slice(0, 10)} | ${expense.amount.toString().padStart(8)} ${expense.currency.padEnd(4)} -> ` +
          `USD: ${equivalents.usd.toFixed(2).padStart(10)}, USDT: ${equivalents.usdt.toFixed(2).padStart(10)}, EUR: ${equivalents.eur.toFixed(2).padStart(10)} | ` +
          `rates: usd=${rates.usd_ves.toFixed(2)}, usdt=${rates.usdt_ves.toFixed(2)}, eur=${rates.eur_ves.toFixed(2)}`,
      );

      // Update the expense
      const { error: updateError } = await supabase
        .from("expenses")
        .update({
          equivalents,
          rates_at_creation: rates,
        })
        .eq("id", expense.id);

      if (updateError) {
        console.error(`Error updating expense ${expense.id}:`, updateError);
        errors++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`Error processing expense ${expense.id}:`, err);
      errors++;
    }
  }

  console.log(`Backfill complete: ${processed} processed, ${errors} errors`);
  return { processed, errors };
}

/**
 * Get the closest rates to a given date from exchange_rates table.
 * For any missing rate, fetches the nearest available rate to that date.
 */
async function getRatesForDate(date: string): Promise<RatesSnapshot> {
  const supabase = createServiceClient();

  // Get rates closest to (and before) the expense date
  const { data } = await supabase
    .from("exchange_rates")
    .select("pair, rate")
    .in("pair", ["USD_VES", "USDT_VES", "EUR_VES"])
    .lte("fetched_at", date)
    .order("fetched_at", { ascending: false })
    .limit(10);

  const rates: RatesSnapshot = {
    usd_ves: 0,
    usdt_ves: 0,
    eur_ves: 0,
    usd_usdt: 0,
    eur_usdt: 0,
  };

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

  // For any missing rate, fetch the closest available rate to this date
  const missingPairs: string[] = [];
  if (rates.usd_ves === 0) missingPairs.push("USD_VES");
  if (rates.usdt_ves === 0) missingPairs.push("USDT_VES");
  if (rates.eur_ves === 0) missingPairs.push("EUR_VES");

  if (missingPairs.length > 0) {
    // Get the closest rate after the date for missing pairs
    const { data: futureData } = await supabase
      .from("exchange_rates")
      .select("pair, rate")
      .in("pair", missingPairs)
      .gt("fetched_at", date)
      .order("fetched_at", { ascending: true })
      .limit(10);

    futureData?.forEach((row) => {
      if (!seen.has(row.pair)) {
        seen.add(row.pair);
        const rate = parseFloat(row.rate);
        if (row.pair === "USD_VES") rates.usd_ves = rate;
        if (row.pair === "USDT_VES") rates.usdt_ves = rate;
        if (row.pair === "EUR_VES") rates.eur_ves = rate;
      }
    });
  }

  // Fallback: estimate EUR_VES from USD_VES if still not available
  // Using approximate EUR/USD rate of 1.08
  if (rates.eur_ves === 0 && rates.usd_ves > 0) {
    rates.eur_ves = rates.usd_ves * 1.08;
  }

  // Calculate derived rates
  rates.usd_usdt = rates.usdt_ves > 0 ? rates.usd_ves / rates.usdt_ves : 0;
  rates.eur_usdt = rates.usdt_ves > 0 ? rates.eur_ves / rates.usdt_ves : 0;

  return rates;
}

/**
 * Calculate equivalents for backfill (mirrors currency-calculator logic)
 */
function calculateEquivalentsForBackfill(
  amount: number,
  currency: Currency,
  rates: RatesSnapshot,
): CurrencyEquivalents {
  let vesAmount: number;

  switch (currency) {
    case "VES":
      vesAmount = amount;
      break;
    case "USD":
      vesAmount = amount * rates.usd_ves;
      break;
    case "USDT":
      vesAmount = amount * rates.usdt_ves;
      break;
    case "EUR":
      vesAmount = amount * rates.eur_ves;
      break;
    default:
      vesAmount = amount;
  }

  return {
    ves: vesAmount,
    usd: rates.usd_ves > 0 ? vesAmount / rates.usd_ves : 0,
    usdt: rates.usdt_ves > 0 ? vesAmount / rates.usdt_ves : 0,
    eur: rates.eur_ves > 0 ? vesAmount / rates.eur_ves : 0,
  };
}
