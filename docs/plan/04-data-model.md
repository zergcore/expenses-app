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

---
---

# Phase 3 — Data Model (Batch 2: 13-Item Fix Batch)

> Two new tables, several missing-RLS additions, no money-math column changes.

---

## New Tables

### `login_events` (Item #4)

```sql
-- supabase/migrations/<TS>_create_login_events.sql
CREATE TABLE public.login_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'sign_in',
        'failed_attempt',
        'password_change',
        'security_action'
    )),
    ip_address TEXT,
    country_code TEXT,            -- ISO 3166-1 alpha-2
    user_agent TEXT,
    is_suspicious BOOLEAN DEFAULT FALSE,
    reason TEXT,                  -- e.g., 'new_country', 'failed_attempt_threshold'
    metadata JSONB,               -- additional context (e.g., previous_country)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_login_events_user_created
    ON public.login_events(user_id, created_at DESC);

CREATE INDEX idx_login_events_ip_created
    ON public.login_events(ip_address, created_at DESC)
    WHERE event_type = 'failed_attempt';

CREATE INDEX idx_login_events_user_event
    ON public.login_events(user_id, event_type, created_at DESC);

-- RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login events"
    ON public.login_events FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT, UPDATE, DELETE: service role only (no policy = no access for authenticated/anon)
```

**Cardinality estimate:** ~5–20 rows per active user per month. Old failed-attempt rows could be pruned via a periodic cron after 90 days — out of scope for v1, but the indexes are designed to handle growth.

### `support_tickets` (Item #12)

```sql
-- supabase/migrations/<TS>_create_support_tickets.sql
CREATE TABLE public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open',
        'in_progress',
        'resolved',
        'spam'
    )),
    locale VARCHAR(5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_support_tickets_status_created
    ON public.support_tickets(status, created_at DESC);

CREATE INDEX idx_support_tickets_ip_created
    ON public.support_tickets(ip_address, created_at DESC);

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for users — they don't view their own tickets in v1.
-- INSERT/UPDATE/DELETE via service client only (Server Action uses createServiceClient).
-- Future admin view will need its own policy keyed off a service role check.

-- updated_at trigger
CREATE TRIGGER update_support_tickets_modtime
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Length constraints:** None at SQL level (TEXT). Zod schema enforces: name 1–80, email valid, subject 1–120, message 1–2000.

---

## Missing RLS Policies (Item #5)

```sql
-- supabase/migrations/<TS>_close_rls_gaps.sql

-- notification_preferences DELETE
CREATE POLICY "Users can delete own notification preferences"
    ON public.notification_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- financial_insights DELETE
CREATE POLICY "Users can delete own financial insights"
    ON public.financial_insights FOR DELETE
    USING (auth.uid() = user_id);

-- notifications: tighten — system inserts via service role; user-facing INSERT not needed
-- (no policy added; existing service-client write path is correct)

-- Storage avatars DELETE policy
CREATE POLICY "Users can delete own avatars"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid() = owner
    );
```

---

## TypeScript Types

### `LoginEvent`

**File:** `src/types/login-events.ts` (new)

```typescript
export type LoginEventType =
  | "sign_in"
  | "failed_attempt"
  | "password_change"
  | "security_action";

export interface LoginEvent {
  id: string;
  user_id: string;
  event_type: LoginEventType;
  ip_address: string | null;
  country_code: string | null;
  user_agent: string | null;
  is_suspicious: boolean;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SuspiciousActivityContext {
  userId: string;
  email: string;
  currentEvent: Pick<LoginEvent, "event_type" | "ip_address" | "country_code" | "user_agent">;
}

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  reason: "new_country" | "failed_attempt_threshold" | "password_change_spam" | null;
  context: Record<string, unknown>;
}
```

### `SupportTicket`

**File:** `src/types/support.ts` (new)

```typescript
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "spam";

export interface SupportTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip_address: string | null;
  user_agent: string | null;
  status: SupportTicketStatus;
  locale: string | null;
  created_at: string;
  updated_at: string;
}

export const supportTicketSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  subject: z.string().min(1).max(120),
  message: z.string().min(1).max(2000),
  turnstileToken: z.string().min(1),
});
```

### `OnboardingSuggestions` (Item #11)

**File:** `src/types/onboarding.ts` (new)

```typescript
import { z } from "zod";

export const onboardingAnswersSchema = z.object({
  primaryCurrency: z.enum(["USD", "USDT", "VES", "EUR"]),
  incomeRange: z.enum([
    "under_500",
    "500_1000",
    "1000_3000",
    "3000_5000",
    "over_5000",
  ]),
  topCategories: z.array(z.string()).min(1).max(4),
  savingsGoal: z.enum(["none", "5", "10", "20", "custom"]),
  customSavingsPercent: z.number().int().min(1).max(50).optional(),
  budgetStyle: z.enum(["strict", "flexible"]),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const onboardingSuggestionsSchema = z.object({
  budgets: z.array(z.object({
    category_name: z.string().max(60),
    amount: z.number().positive(),
    currency: z.enum(["USD", "USDT", "VES", "EUR"]),
    reasoning: z.string().max(120),
  })).min(1).max(8),
  global_budget: z.object({
    amount: z.number().positive(),
    currency: z.enum(["USD", "USDT", "VES", "EUR"]),
  }).optional(),
  summary: z.string().max(280).optional(),
});

export type OnboardingSuggestions = z.infer<typeof onboardingSuggestionsSchema>;
```

---

## Auth Metadata Extensions (Item #11)

No DB migration. Stored in Supabase Auth `user_metadata`:

```typescript
// User metadata shape after onboarding
{
  full_name?: string;
  avatar_url?: string;
  currency?: Currency;
  onboarding_complete?: boolean;     // NEW (Item #11)
  onboarding_completed_at?: string;  // NEW (Item #11) — ISO timestamp
}
```

Set via:

```typescript
await supabase.auth.updateUser({
  data: { onboarding_complete: true, onboarding_completed_at: new Date().toISOString() }
});
```

---

## Money-Math Schema Decisions (Item #9)

**No DB column changes.** Existing `DECIMAL(12, 2)` (amounts) and `DECIMAL(12, 4)` (rates) provide sufficient precision and are already correct at the storage layer. The fix is purely in the JS reading layer (parse to Dinero integer + scale instead of `parseFloat` to JS float).

**Existing stored `equivalents` JSONB values are not corrected.** Per user decision: those values came from real API rates at creation time; recomputing them now (with current rates) would actually *introduce* drift, not fix it. The historical record is correct as-is.

---

## Migration Filenames (suggested)

```
supabase/migrations/
├── 20260507120000_close_rls_gaps.sql
├── 20260508120000_create_login_events.sql
└── 20260509120000_create_support_tickets.sql
```

(Use sequential timestamps when actually creating these — `npx supabase migration new <name>` will generate the timestamp.)

---

## DB Migration Application Order

1. **`close_rls_gaps`** — additive policies; safe to apply at any time.
2. **`create_login_events`** — required before Item #4 implementation.
3. **`create_support_tickets`** — required before Item #12 implementation.

All three are additive. None modify existing data or columns. Rollback = `DROP TABLE` / `DROP POLICY` per migration.
