-- Fix RLS policies for exchange_rates to support public landing page
-- Problem: Public users (anon) cannot read or insert rates
-- Solution: 
--   1. Allow anon users to READ rates (public data)
--   2. Keep INSERT restricted to service role only (handled in code)

-- First, drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Public read exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Allow system insert exchange rates" ON public.exchange_rates;

-- Allow ANYONE (including anon) to read exchange rates
-- This is public data that should be visible on the landing page
CREATE POLICY "Anyone can read exchange rates" 
ON public.exchange_rates 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Note: INSERT will be handled by a service role client in the code
-- This is more secure than allowing authenticated users to insert directly
-- The service role bypasses RLS, so no INSERT policy is needed
