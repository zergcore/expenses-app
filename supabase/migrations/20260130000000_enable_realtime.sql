-- Enable publication for Realtime
begin;
  -- Remove tables if they are already in the publication to avoid errors or duplication (optional safety)
  -- drop publication if exists supabase_realtime; 
  -- We assume 'supabase_realtime' publication exists by default in Supabase.
  
  -- Add specific tables to the publication
  alter publication supabase_realtime add table expenses;
  alter publication supabase_realtime add table exchange_rates;
commit;
