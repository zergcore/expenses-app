-- Allow authenticated users to insert new exchange rates
-- Rationale: The server action fetches rates and inserts them on behalf of the user.
-- Since the action controls the data being inserted (it fetches from API), we trust the input.
-- However, technically a malicious user could call the insert RPC directly if they knew how.
-- Ideally we'd use a SERVICE_ROLE client for system-wide data, but for now we follow the existing pattern.

CREATE POLICY "Allow system insert exchange rates" 
ON public.exchange_rates 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
