/**
 * Currency calculation utilities for multi-currency expense tracking.
 * Handles conversions and aggregate totals using historical rates.
 */

import type {
  Currency,
  CurrencyEquivalents,
  RatesSnapshot,
  MultiCurrencyTotals,
} from "./currency-types";

/**
 * Calculate equivalents in all currencies from a given amount and currency.
 * Uses the provided rate snapshot for accurate historical conversion.
 */
export function calculateEquivalents(
  amount: number,
  currency: Currency,
  rates: RatesSnapshot,
): CurrencyEquivalents {
  // Base VES amount - convert everything to VES first
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

  // Now convert VES to all other currencies
  return {
    ves: vesAmount,
    usd: rates.usd_ves > 0 ? vesAmount / rates.usd_ves : 0,
    usdt: rates.usdt_ves > 0 ? vesAmount / rates.usdt_ves : 0,
    eur: rates.eur_ves > 0 ? vesAmount / rates.eur_ves : 0,
  };
}

/**
 * Expense with equivalents for aggregation
 */
interface ExpenseWithEquivalents {
  equivalents: CurrencyEquivalents | null;
  amount: number;
  currency: string;
}

/**
 * Sum all expenses by their pre-calculated equivalents.
 * Falls back to original amount if equivalents not available.
 */
export function sumByEquivalent(
  expenses: ExpenseWithEquivalents[],
): MultiCurrencyTotals {
  const totals: MultiCurrencyTotals = {
    ves: 0,
    usd: 0,
    usdt: 0,
    eur: 0,
  };

  for (const expense of expenses) {
    if (expense.equivalents) {
      totals.ves += expense.equivalents.ves;
      totals.usd += expense.equivalents.usd;
      totals.usdt += expense.equivalents.usdt;

      // Fallback: estimate EUR from USD if EUR is 0 (missing EUR rate at creation time)
      // Using approximate EUR/USD rate of 1.08 (1 EUR ≈ 1.08 USD)
      if (expense.equivalents.eur > 0) {
        totals.eur += expense.equivalents.eur;
      } else if (expense.equivalents.usd > 0) {
        totals.eur += expense.equivalents.usd / 1.08;
      }
    } else {
      // Fallback: add to matching currency only
      const curr = expense.currency.toLowerCase() as keyof MultiCurrencyTotals;
      if (curr in totals) {
        totals[curr] += expense.amount;
      }
    }
  }

  return totals;
}

/**
 * Build a RatesSnapshot from individual rate values.
 * Calculates derived rates (usd_usdt, eur_usdt) from VES-based rates.
 */
export function buildRatesSnapshot(
  usdVes: number,
  usdtVes: number,
  eurVes: number,
): RatesSnapshot {
  return {
    usd_ves: usdVes,
    usdt_ves: usdtVes,
    eur_ves: eurVes,
    usd_usdt: usdtVes > 0 ? usdVes / usdtVes : 0,
    eur_usdt: usdtVes > 0 ? eurVes / usdtVes : 0,
  };
}
