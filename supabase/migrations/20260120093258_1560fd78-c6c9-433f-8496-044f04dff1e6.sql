-- Change team column from TEXT to TEXT[] for multi-team support
ALTER TABLE public.players 
  ALTER COLUMN team TYPE TEXT[] USING ARRAY[team];

-- Rename column for clarity
ALTER TABLE public.players 
  RENAME COLUMN team TO teams;