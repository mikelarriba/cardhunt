-- Add year, team, and seller columns to cards table
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS card_year INTEGER;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS card_team TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS seller TEXT;