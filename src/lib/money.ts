import {
  dinero,
  add,
  multiply,
  convert,
  toDecimal,
  type DineroCurrency,
  type Dinero,
} from "dinero.js";
import { USD, EUR, VES } from "dinero.js/currencies";

// USDT is not a fiat ISO 4217 currency; define it manually
export const USDT: DineroCurrency<number> = { code: "USDT", base: 10, exponent: 2 };

const CURRENCIES: Record<string, DineroCurrency<number>> = {
  USD,
  EUR,
  VES,
  USDT,
};

/**
 * Parse a string or number amount (e.g. "12.34") to a Dinero object.
 * Used at the DB read boundary.
 */
export function parseAmount(
  amount: string | number,
  code: string,
): Dinero<number> {
  const currency = CURRENCIES[code] || USD;
  const value = typeof amount === "string" ? amount : String(amount);
  const [whole, fraction = ""] = value.split(".");
  const paddedFraction = fraction
    .padEnd(currency.exponent, "0")
    .slice(0, currency.exponent);
  const integerCents = parseInt(`${whole}${paddedFraction}`, 10) || 0;
  return dinero({ amount: integerCents, currency });
}

/**
 * Parse a rate string or number (e.g. "51.2345" with scale 4) to a Dinero-style fraction
 * suitable for the `convert` function's `rates` map.
 */
export function parseRate(
  rate: string | number,
  scale = 4,
): { amount: number; scale: number } {
  const value = typeof rate === "string" ? rate : String(rate);
  const [whole, fraction = ""] = value.split(".");
  const padded = fraction.padEnd(scale, "0").slice(0, scale);
  const integer = parseInt(`${whole}${padded}`, 10) || 0;
  return { amount: integer, scale };
}

/**
 * Convert Dinero to plain number for display.
 * Uses banker's rounding by default.
 */
export function toNumber(d: Dinero<number>): number {
  return parseFloat(toDecimal(d));
}

/** Re-export commonly used Dinero helpers */
export { dinero, add, multiply, convert };
export type { Dinero };
