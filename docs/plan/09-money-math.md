# Phase 3 — Money Math (Batch 2)

> Item #9. Replace pure float arithmetic on currency values with `dinero.js` v2. No DB column changes; no historical-data correction.

---

## 1. Library Comparison

| Criterion | **dinero.js v2** ✅ | currency.js | Custom BigInt utility |
|---|---|---|---|
| Bundle size (gzip) | ~5 KB core + ~2 KB currencies tree-shaken (≈ 7 KB realistic) | 1.6 KB | 0 KB |
| Decimal safety | ✅ Integer-based with explicit scale | ✅ Integer-based | ✅ |
| Multi-currency support | ✅ Native — typed `USD`, `VES`, `EUR`, `USDT` (we'll define USDT) | ❌ Single currency context | Manual |
| Currency conversion | ✅ `convert(d, "VES", { rates: { VES: { amount, scale } } })` | Manual multiplication | Manual |
| Allocation (split totals) | ✅ Built-in | ❌ | Manual |
| Rounding modes | ✅ `up`, `down`, `halfUp`, `halfEven` (banker's), etc. | Limited | Manual |
| Type safety | Excellent — branded `Dinero<Currency>` | Loose | Depends |
| Maintenance | ✅ Active (v2 is the current major) | ✅ Active but slower | N/A |
| Functional vs object API | Functional (`add(d1, d2)` not `d1.add(d2)`) — easier tree-shaking | Object/method | N/A |
| Custom currencies (USDT) | ✅ `{ code: "USDT", base: 10, exponent: 2 }` | Manual | Manual |
| Verdict | **Best fit** for multi-currency Fin | Good only for single-currency apps | High maintenance burden |

**Decision: `dinero.js` v2**, specifically `@dinero.js/core` and `@dinero.js/currencies`.

### Why not currency.js
The 1.6 KB savings does not offset the work of manually implementing typed currency conversions for a 4-currency app where conversion correctness is the entire point.

### Why not custom BigInt
Reinventing rounding modes, allocation, and currency tagging is not worth a few KB. Dinero's "functional API + integer storage" approach is the same idea — but already shipped, tested, and maintained.

---

## 2. Architectural Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                      Storage (Postgres)                         │
│  amount: DECIMAL(12,2)        rate: DECIMAL(12,4)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │   read as TEXT/string from supabase-js
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                Parse boundary (src/lib/money.ts)                │
│  parseAmount(str, currency) → Dinero<Currency>                  │
│  parseRate(str)             → { amount: bigint, scale: 4 }      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│      Internal arithmetic (currency-calculator.ts)               │
│  add, multiply, convert — Dinero objects only                   │
│  Never `*`, `/`, `+`, `-` on raw numbers                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Display boundary (toUnit, formatCurrency)          │
│  toUnit(d) → number (with rounding mode applied)                │
│  formatCurrency(num, currency) → string (Intl.NumberFormat)     │
└─────────────────────────────────────────────────────────────────┘
```

The only places where `number` arithmetic happens on amounts: never. The only place where amounts cross from Dinero to `number`: at the display boundary (formatting, rendering).

---

## 3. New `src/lib/money.ts` API

```typescript
import { dinero, add, multiply, convert, toUnit, type Currency, type Dinero } from "@dinero.js/core";
import { USD, EUR, VES } from "@dinero.js/currencies";

// USDT is not a fiat ISO 4217 currency; define it manually
export const USDT: Currency<number> = { code: "USDT", base: 10, exponent: 2 };

const CURRENCIES: Record<string, Currency<number>> = {
  USD,
  EUR,
  VES,
  USDT,
};

/**
 * Parse a string amount (e.g. "12.34") to a Dinero object.
 * Used at the DB read boundary.
 */
export function parseAmount(amount: string | number, code: keyof typeof CURRENCIES): Dinero<number> {
  const currency = CURRENCIES[code];
  const value = typeof amount === "string" ? amount : String(amount);
  const [whole, fraction = ""] = value.split(".");
  const paddedFraction = fraction.padEnd(currency.exponent, "0").slice(0, currency.exponent);
  const integerCents = parseInt(`${whole}${paddedFraction}`, 10);
  return dinero({ amount: integerCents, currency });
}

/**
 * Parse a rate string (e.g. "51.2345" with scale 4) to a Dinero-style fraction
 * suitable for the `convert` function's `rates` map.
 */
export function parseRate(rate: string | number, scale = 4): { amount: number; scale: number } {
  const value = typeof rate === "string" ? rate : String(rate);
  const [whole, fraction = ""] = value.split(".");
  const padded = fraction.padEnd(scale, "0").slice(0, scale);
  const integer = parseInt(`${whole}${padded}`, 10);
  return { amount: integer, scale };
}

/**
 * Convert Dinero to plain number for display.
 * Uses banker's rounding by default.
 */
export function toNumber(d: Dinero<number>): number {
  return toUnit(d, { digits: 2 });
}

/** Re-export commonly used Dinero helpers */
export { dinero, add, multiply, convert };
```

---

## 4. Refactored `currency-calculator.ts`

### Public API: unchanged
```typescript
calculateEquivalents(amount: number, currency: Currency, rates: RatesSnapshot): CurrencyEquivalents
sumByEquivalent(expenses: ExpenseWithEquivalents[]): MultiCurrencyTotals
buildRatesSnapshot(usdVes: number, usdtVes: number, eurVes: number): RatesSnapshot
```

### Internal: rewritten
```typescript
import { parseAmount, parseRate, convert, toNumber, USDT, dinero } from "./money";
import { USD, EUR, VES } from "@dinero.js/currencies";

const CURRENCY_MAP = { USD, EUR, VES, USDT };

export function calculateEquivalents(
  amount: number,
  currency: Currency,
  rates: RatesSnapshot,
): CurrencyEquivalents {
  // Convert input to Dinero
  const sourceCurrency = CURRENCY_MAP[currency];
  const sourceDinero = parseAmount(amount, currency);

  // Build a rates map: VES is the pivot
  // To convert FROM source TO target, we need source→VES then VES→target
  const ratesToVes = {
    USD: parseRate(rates.usd_ves, 4),
    USDT: parseRate(rates.usdt_ves, 4),
    EUR: parseRate(rates.eur_ves, 4),
    VES: { amount: 1, scale: 0 },
  };

  // Convert source → VES
  const inVes = currency === "VES"
    ? sourceDinero
    : convert(sourceDinero, VES, { [sourceCurrency.code]: ratesToVes[currency] });

  // Convert VES → each target
  const usd = convert(inVes, USD, { VES: { amount: ratesToVes.USD.amount, scale: ratesToVes.USD.scale } });
  // ... similar for usdt, eur

  return {
    ves: toNumber(inVes),
    usd: toNumber(usd),
    usdt: toNumber(/* ... */),
    eur: toNumber(/* ... */),
  };
}
```

> Sketch above — final implementation follows the pattern verbatim with proper helper extraction.

### Removed
- The hardcoded `/ 1.08` EUR fallback magic number — dead code now that ECB Frankfurter API provides the real fallback.

---

## 5. Test Cases

### Unit tests (informal — Vitest if added later, or manual REPL for v1)

```typescript
// 1. Float drift elimination
expect(toNumber(add(parseAmount(0.1, "USD"), parseAmount(0.2, "USD")))).toBe(0.3);
// vs raw JS: 0.1 + 0.2 === 0.30000000000000004

// 2. Conversion
const rates = buildRatesSnapshot(51.2345, 50.0, 56.78);
const eq = calculateEquivalents(10, "USD", rates);
expect(eq.ves).toBeCloseTo(512.35, 2); // 10 USD × 51.2345 VES/USD

// 3. Sum stability
const expenses = [
  { equivalents: { usd: 10.10, ves: 0, usdt: 0, eur: 0 }, amount: 10.10, currency: "USD" },
  { equivalents: { usd: 20.20, ves: 0, usdt: 0, eur: 0 }, amount: 20.20, currency: "USD" },
  // ... ×100
];
expect(sumByEquivalent(expenses).usd).toBe(3030.00); // exact, not 3030.0000000004

// 4. Banker's rounding (round half to even)
// 12.345 with halfEven → 12.34 (not 12.35)
expect(toNumber(parseAmount(12.345, "USD"), { roundingMode: "halfEven" })).toBe(12.34);
```

### Manual QA scenarios

1. Add an expense for `12.345` USD — verify it stores as `12.34` or `12.35` consistently.
2. Sum a month of expenses with mixed currencies — verify totals match Excel by-hand sum.
3. Open an old (pre-migration) expense — verify its `equivalents` JSONB still displays correctly (we don't recompute historical values).

---

## 6. Migration Plan (steps)

```
1. Install deps:        pnpm add @dinero.js/core @dinero.js/currencies
2. Create src/lib/money.ts with helpers
3. Refactor src/lib/currency-calculator.ts:
   a. Rewrite calculateEquivalents
   b. Rewrite sumByEquivalent
   c. Remove hardcoded /1.08 fallback
4. Update src/actions/rates.ts:
   - parseFloat(row.rate) → parseRate(row.rate).amount / 10**scale (only at display boundary)
   - Internal calculations use Dinero
5. Audit src/actions/expenses.ts for float arithmetic
6. Run TypeScript compile, lint, build
7. Manual QA scenarios above
```

---

## 7. Backward Compatibility

- **DB schema:** unchanged (`DECIMAL(12,2)` and `DECIMAL(12,4)` stay).
- **Stored `equivalents` JSONB:** unchanged. Per user decision: existing values came from real API rates at creation time; recomputing them now would introduce drift, not fix it.
- **API response shape (Server Actions):** unchanged — `RateData[]`, `Expense[]`, `MultiCurrencyTotals` all keep their `number` types.

---

## 8. Effort & Risk

- **Effort:** ~8 hours.
- **Risk:** Medium. Touches the core calculation layer. Tests catch regressions; manual QA on a real month of expenses validates correctness end-to-end.
- **Rollback:** Revert `currency-calculator.ts` and `money.ts`. Remove deps. No DB or schema impact.
