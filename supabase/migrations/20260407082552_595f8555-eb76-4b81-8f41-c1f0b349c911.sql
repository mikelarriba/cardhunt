-- Add unique constraint so upsert works
ALTER TABLE public.teams ADD CONSTRAINT teams_user_id_name_unique UNIQUE (user_id, name);

-- Populate teams table from existing player teams
INSERT INTO public.teams (user_id, name, sport)
SELECT DISTINCT p.user_id, unnest(p.teams), p.sport::text
FROM public.players p
ON CONFLICT (user_id, name) DO NOTHING;