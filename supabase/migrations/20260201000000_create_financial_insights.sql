-- Migration: Create financial_insights table for AI-generated advice
-- This table stores cached AI insights with TTL-based invalidation

CREATE TABLE financial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Insight metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL, -- TTL: insights expire after this timestamp
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  locale VARCHAR(5) NOT NULL DEFAULT 'es',
  
  -- Aggregated metrics (anonymized - no PII)
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "spending_velocity_usd": 15.5,
  --   "spending_velocity_ves": 750.0,
  --   "unbudgeted_ratio": 0.12,
  --   "s_proj": 465.0,
  --   "rate_volatility": 2.5,
  --   "total_spent_usd": 320.0,
  --   "days_passed": 20,
  --   "days_remaining": 10
  -- }
  
  -- AI-generated content (3 tips)
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   { "title": "Alerta de Gasto", "body": "...", "type": "warning" },
  --   { "title": "Consejo", "body": "...", "type": "tip" },
  --   { "title": "Bien hecho", "body": "...", "type": "success" }
  -- ]
  
  summary TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one insight per user per month
  UNIQUE(user_id, month, year)
);

-- Create index for efficient lookups
CREATE INDEX idx_financial_insights_user_valid 
  ON financial_insights(user_id, valid_until DESC);

CREATE INDEX idx_financial_insights_user_month_year 
  ON financial_insights(user_id, month, year);

-- RLS: Users can only access their own insights
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON financial_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON financial_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON financial_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financial_insights_updated_at
  BEFORE UPDATE ON financial_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_insights_updated_at();
