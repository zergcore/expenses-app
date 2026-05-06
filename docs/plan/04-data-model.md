# Phase 3 — Data Model

No new Supabase tables are created by any of the 6 changes. The only DB change is an additive index in Change 5. All other changes are TypeScript-only type extensions.

---

## Updated TypeScript Types

### `RateHistoryPoint` (Change 3 — EUR addition)

**File:** `src/actions/rates.ts`

```typescript
// Before
export interface RateHistoryPoint {
  date: string;        // YYYY-MM-DD
  usd: number | null;
  usdt: number | null;
}

// After
export interface RateHistoryPoint {
  date: string;        // YYYY-MM-DD
  usd: number | null;
  usdt: number | null;
  eur: number | null;  // EUR/VES — null on days without BCV EUR data
}
```

**Downstream impact:** Every consumer of `RateHistoryPoint` must be reviewed:
- `RatesHistoryChart` — will use `eur` for the new line (Change 3)
- `PublicRatesHistoryChart` — new component, designed with `eur` from the start (Change 4)
- Any future chart additions — the type is now complete for all VES pairs

---

### `DailyRatePoint` (Change 5 — new type)

**File:** `src/actions/rates.ts`

```typescript
export interface DailyRatePoint {
  time: string;         // "HH:mm" in the user's local timezone (derived from fetched_at)
  fetched_at: string;   // ISO 8601 — retained for sorting and tooltip display
  usdt: number | null;  // USDT/VES at this moment (Binance P2P avg)
  usd: number | null;   // USD/VES at this moment (BCV — updated ~hourly, sparse)
  eur: number | null;   // EUR/VES at this moment (BCV — updated ~hourly, sparse)
}
```

**Notes:**
- `time` is formatted client-side from `fetched_at` using `date-fns/format(new Date(fetched_at), "HH:mm")`.
- `usd` and `eur` will be sparse (only 1 record per hour at most) — rendered with `connectNulls`.
- `usdt` will be dense (up to 1 record per 5 minutes from Binance) — this is the primary "daily granularity" line.

---

### `SharePlatform` and `SharePair` (Change 6 — new types)

**File:** `src/components/rates/share-rates-button.tsx` (component-local types, not exported from actions)

```typescript
export type SharePlatform = "general" | "twitter" | "story";
// "general" → 800×800 (1:1 square, WhatsApp, generic)
// "twitter" → 1200×675 (16:9 landscape)
// "story"   → 1080×1920 (9:16 portrait, Instagram Story, WhatsApp Status)

export type SharePair = "USDT_VES" | "USD_VES" | "EUR_VES";

export interface ShareConfig {
  platform: SharePlatform;
  pairs: SharePair[];
}

export const PLATFORM_DIMENSIONS: Record<SharePlatform, { width: number; height: number }> = {
  general: { width: 800, height: 800 },
  twitter:  { width: 1200, height: 675 },
  story:    { width: 1080, height: 1920 },
};
```

---

## Zod Schemas Affected

No Zod schemas need updating. The rates actions return typed data directly — they are not form handlers and do not use Zod for input validation. The `DailyRatePoint` and updated `RateHistoryPoint` are TypeScript interfaces only.

The only place Zod is used adjacent to rates is the expense form (`src/components/expenses/expense-form.tsx`), which uses `rates_at_creation` and `equivalents` JSONB fields. These are unaffected by any of the 6 changes.

---

## Supabase Migration

**One migration file for Change 5.**

**File to create:** `supabase/migrations/20260507000000_add_exchange_rates_index.sql`

```sql
-- Improves performance of intraday rate queries introduced in the daily granularity feature.
-- getDailyRateHistory() queries by pair + fetched_at range for a single calendar day.
-- Without this index, the query performs a sequential scan over the full exchange_rates table.
-- The index is additive — it does not change any existing data, constraints, or RLS policies.

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair_fetched
  ON public.exchange_rates (pair, fetched_at DESC);
```

**Rollback:** `DROP INDEX IF EXISTS idx_exchange_rates_pair_fetched;` — safe at any time, no data loss.

**When to apply:** Apply this migration **before** deploying Change 5's `getDailyRateHistory` action. The index is safe to apply at any time in production (non-blocking on Supabase Postgres 15+ for small tables; for large tables, monitor with `pg_stat_activity`).

---

## Existing Schema Reference (unchanged)

```sql
-- public.exchange_rates (no changes)
CREATE TABLE public.exchange_rates (
    id         UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    source     TEXT NOT NULL,            -- 'BCV' | 'Binance' | 'CoinGecko'
    pair       TEXT NOT NULL,            -- 'USD_VES' | 'USDT_VES' | 'EUR_VES' | 'BTC_USD' | 'BTC_USDT'
    rate       DECIMAL(12,4) NOT NULL,
    fetched_at TIMESTAMPTZ  DEFAULT NOW()
);
-- RLS: anon + authenticated can SELECT. INSERT via service role only.
-- Realtime: enabled (supabase_realtime publication).
-- New index: idx_exchange_rates_pair_fetched ON (pair, fetched_at DESC)
```

**Currency values stored — reference:**

| Pair | Source | Update frequency |
|---|---|---|
| `USD_VES` | BCV (`dolarvzla.com` / fallback `dolarapi.com`) | ~1 hour |
| `USDT_VES` | Binance P2P | ~5 minutes |
| `EUR_VES` | BCV (`dolarvzla.com` only — no fallback) | ~1 hour |
| `BTC_USD` | CoinGecko | ~10 minutes |
| `BTC_USDT` | CoinGecko | ~10 minutes |
