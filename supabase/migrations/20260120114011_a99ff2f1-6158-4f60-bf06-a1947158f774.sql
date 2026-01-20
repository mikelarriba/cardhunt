-- Step 1: Rename 'signed' to 'autographed' in the card_type enum
ALTER TYPE card_type RENAME VALUE 'signed' TO 'autographed';

-- Step 2: Add brand column to cards
ALTER TABLE public.cards
ADD COLUMN brand TEXT;

-- Step 3: Add card_types array column (to support multi-select)
ALTER TABLE public.cards
ADD COLUMN card_types TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 4: Migrate existing card_type values to the new card_types array
UPDATE public.cards
SET card_types = ARRAY[card_type::TEXT]
WHERE card_types = ARRAY[]::TEXT[] OR card_types IS NULL;