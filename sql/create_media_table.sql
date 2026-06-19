-- Create the media table for file metadata.
-- Run this SQL in Supabase SQL editor or migration system.

CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  path text NOT NULL,
  type text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO anon;
