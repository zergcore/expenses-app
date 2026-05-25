-- Migration: create_login_events table and indexes

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
