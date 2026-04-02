
-- Create teams table for normalized team names
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sport TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one team name per user
CREATE UNIQUE INDEX idx_teams_user_name ON public.teams (user_id, LOWER(name));

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own teams" ON public.teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own teams" ON public.teams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own teams" ON public.teams FOR DELETE USING (auth.uid() = user_id);
