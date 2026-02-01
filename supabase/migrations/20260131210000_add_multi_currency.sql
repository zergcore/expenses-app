-- Add JSONB columns for multi-currency support
-- equivalents: stores amount in all currencies (usd, ves, usdt, eur)
-- rates_at_creation: stores the exchange rates at time of expense creation

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS equivalents JSONB;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS rates_at_creation JSONB;

-- Create index for faster JSONB queries if filtering by currency
CREATE INDEX IF NOT EXISTS idx_expenses_equivalents ON public.expenses USING GIN (equivalents);

COMMENT ON COLUMN public.expenses.equivalents IS 'Pre-calculated equivalents in all currencies at creation time: {"usd": 9.80, "ves": 500.00, "usdt": 10.00, "eur": 8.90}';
COMMENT ON COLUMN public.expenses.rates_at_creation IS 'Snapshot of exchange rates at creation: {"usd_ves": 51.00, "usdt_ves": 50.00, "eur_ves": 56.20, "usd_usdt": 0.98, "eur_usdt": 0.89}';
