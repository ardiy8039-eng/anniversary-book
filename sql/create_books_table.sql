-- Create the guest books table for guest PIN records.
-- Run this SQL in Supabase SQL editor or migration system.

CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text,
  pin text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO anon;
