-- Add new fields to cards table for Card Hunt overhaul
-- Serial numbering fields
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS is_numbered boolean DEFAULT false;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS serial_num integer;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS serial_total integer;

-- Series field (e.g., Prizm, Mosaic, Donruss)
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS series text;

-- Card labels (replacing fixed card types with flexible labels)
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS card_labels text[] DEFAULT ARRAY[]::text[];

-- Dual images: front and back
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS image_front text;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS image_back text;

-- Migrate existing image_url to image_front
UPDATE public.cards SET image_front = image_url WHERE image_url IS NOT NULL AND image_front IS NULL;

-- Add check constraint for serial numbering consistency
ALTER TABLE public.cards ADD CONSTRAINT check_serial_numbering 
  CHECK (
    (is_numbered = false) OR 
    (is_numbered = true AND serial_num IS NOT NULL AND serial_total IS NOT NULL AND serial_num <= serial_total)
  );

-- Create index for series field for faster filtering
CREATE INDEX IF NOT EXISTS idx_cards_series ON public.cards(series);

-- Create index for labels using GIN for array searches
CREATE INDEX IF NOT EXISTS idx_cards_labels ON public.cards USING GIN(card_labels);