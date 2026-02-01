/**
 * Multi-currency type definitions for expense tracking.
 * Supports USD, VES, USDT, and EUR with bidirectional conversion.
 */

export type Currency = "USD" | "VES" | "USDT" | "EUR";

export type CurrencyFilter = Currency | "ALL";

/**
 * Pre-calculated equivalents in all supported currencies.
 * Stored on each expense at creation time based on that day's rates.
 */
export interface CurrencyEquivalents {
  usd: number;
  ves: number;
  usdt: number;
  eur: number;
}

/**
 * Snapshot of exchange rates at the time of expense creation.
 * All rates are relative pairs for accurate historical conversion.
 */
export interface RatesSnapshot {
  usd_ves: number; // 1 USD = X VES
  usdt_ves: number; // 1 USDT = X VES
  eur_ves: number; // 1 EUR = X VES
  usd_usdt: number; // 1 USD = X USDT (typically ~1.0 but varies)
  eur_usdt: number; // 1 EUR = X USDT
}

/**
 * Aggregated totals across all currencies.
 * Used for table footer display.
 */
export interface MultiCurrencyTotals {
  ves: number;
  usd: number;
  usdt: number;
  eur: number;
}

/**
 * Currency display metadata
 */
export const CURRENCY_CONFIG: Record<
  Currency,
  { symbol: string; label: string; icon: string }
> = {
  USD: { symbol: "$", label: "US Dollar", icon: "🇺🇸" },
  VES: { symbol: "Bs.", label: "Bolívar", icon: "🇻🇪" },
  USDT: { symbol: "₮", label: "Tether", icon: "💵" },
  EUR: { symbol: "€", label: "Euro", icon: "🇪🇺" },
};

/**
 * Format amount in the given currency
 */
export function formatCurrencyAmount(
  amount: number,
  currency: Currency,
): string {
  const config = CURRENCY_CONFIG[currency];

  if (currency === "USDT") {
    return `${config.symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (currency === "VES") {
    return `${config.symbol} ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
