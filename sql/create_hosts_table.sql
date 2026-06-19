-- Automatically generated migration to create the hosts table.
-- Run this SQL in Supabase SQL editor or migration system.

CREATE TABLE IF NOT EXISTS public.hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Grant appropriate access for anon/public usage if needed.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosts TO anon;
