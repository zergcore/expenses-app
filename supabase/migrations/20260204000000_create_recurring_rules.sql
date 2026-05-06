-- Recurring Rules table - stores recurring expense definitions
CREATE TABLE public.recurring_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD', -- 'USD', 'VES', 'USDT', 'EUR'
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly'
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Rule Executions table - idempotency tracking
-- Prevents double-processing if the automation script runs multiple times
CREATE TABLE public.recurring_rule_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE CASCADE NOT NULL,
    execution_date DATE NOT NULL, -- The date this execution covers
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL, -- Generated expense reference
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint prevents double-processing for same rule on same date
    CONSTRAINT unique_rule_execution_per_date UNIQUE (rule_id, execution_date)
);

-- Create indexes for common queries
CREATE INDEX idx_recurring_rules_user_id ON public.recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_next_due_date ON public.recurring_rules(next_due_date);
CREATE INDEX idx_recurring_rules_active ON public.recurring_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_rule_executions_rule_id ON public.recurring_rule_executions(rule_id);

-- Enable RLS
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rule_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_rules
CREATE POLICY "Users can view own recurring rules"
    ON public.recurring_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring rules"
    ON public.recurring_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring rules"
    ON public.recurring_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring rules"
    ON public.recurring_rules FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for recurring_rule_executions
-- Users can only view executions for their own rules
CREATE POLICY "Users can view own rule executions"
    ON public.recurring_rule_executions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recurring_rules
            WHERE recurring_rules.id = recurring_rule_executions.rule_id
            AND recurring_rules.user_id = auth.uid()
        )
    );

-- Service role policy for automation (Edge Functions use service role)
-- This allows the automation to insert executions regardless of user context
CREATE POLICY "Service role can insert executions"
    ON public.recurring_rule_executions FOR INSERT
    WITH CHECK (TRUE);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_recurring_rules_modtime
    BEFORE UPDATE ON public.recurring_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
