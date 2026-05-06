-- Schedule the recurring expenses processor to run daily at 00:01 UTC
-- Note: This requires pg_cron and pg_net extensions to be enabled

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create the cron job using pg_cron to invoke the Edge Function
-- The actual URL and service key should be configured in Supabase Dashboard
-- This is a template showing the pattern - you'll need to update with actual values

-- Option 1: Using Supabase's built-in cron (PostgreSQL-based)
-- This creates a scheduled job that calls an internal PostgreSQL function
-- which in turn invokes the Edge Function via pg_net

-- Create a function to invoke the Edge Function
CREATE OR REPLACE FUNCTION public.invoke_process_recurring_expenses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get config from vault or use environment-based approach
  -- In production, these should come from Supabase Vault or env vars
  -- For now, we'll use current_setting with a fallback
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, log and exit gracefully
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE NOTICE 'Supabase URL or service role key not configured. Skipping recurring expense processing.';
    RETURN;
  END IF;
  
  -- Make HTTP POST request to the Edge Function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-recurring-expenses',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the job to run at 00:01 UTC every day
-- Cron expression: minute hour day month weekday
-- '1 0 * * *' = At 00:01 every day
SELECT cron.schedule(
  'process-recurring-expenses-daily',  -- job name (unique identifier)
  '1 0 * * *',                         -- cron expression: 00:01 UTC daily
  'SELECT public.invoke_process_recurring_expenses();'
);

-- Grant execute permission to the cron job
GRANT EXECUTE ON FUNCTION public.invoke_process_recurring_expenses() TO postgres;

-- Add a comment explaining the job
COMMENT ON FUNCTION public.invoke_process_recurring_expenses() IS 
  'Invokes the process-recurring-expenses Edge Function via pg_net. Scheduled to run daily at 00:01 UTC.';
