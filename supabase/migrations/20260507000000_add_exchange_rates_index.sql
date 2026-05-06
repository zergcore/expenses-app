-- Improves performance of intraday rate queries introduced in the daily granularity feature.
-- getDailyRateHistory() queries by pair + fetched_at range for a single calendar day.
-- Without this index, the query performs a sequential scan over the full exchange_rates table.
-- The index is additive — it does not change any existing data, constraints, or RLS policies.

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair_fetched
  ON public.exchange_rates (pair, fetched_at DESC);
