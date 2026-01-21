-- Create table to cache team logos from TheSportsDB
CREATE TABLE public.team_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  sport sport_type NOT NULL,
  logo_url TEXT,
  thesportsdb_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_name, sport)
);

-- Enable RLS (public read, no write from client)
ALTER TABLE public.team_logos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached logos (no auth required for reading)
CREATE POLICY "Anyone can read team logos"
ON public.team_logos
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_team_logos_updated_at
BEFORE UPDATE ON public.team_logos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();