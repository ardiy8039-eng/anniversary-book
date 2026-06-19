-- Create the quiz table used by the host quiz builder.
-- Run this SQL in Supabase SQL editor or migration system.

CREATE TABLE IF NOT EXISTS public.quiz (
  id bigint PRIMARY KEY,
  question text NOT NULL,
  answers text[] NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz TO anon;
