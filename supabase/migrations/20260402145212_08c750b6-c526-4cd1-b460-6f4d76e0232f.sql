
-- Add filter_rules to tags for smart collections
ALTER TABLE public.tags ADD COLUMN filter_rules jsonb DEFAULT NULL;

-- Create card_tags junction table
CREATE TABLE public.card_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(card_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.card_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for card_tags
CREATE POLICY "Users can view their own card tags"
ON public.card_tags FOR SELECT
USING (EXISTS (
  SELECT 1 FROM cards WHERE cards.id = card_tags.card_id AND cards.user_id = auth.uid()
));

CREATE POLICY "Users can create their own card tags"
ON public.card_tags FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM cards WHERE cards.id = card_tags.card_id AND cards.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own card tags"
ON public.card_tags FOR DELETE
USING (EXISTS (
  SELECT 1 FROM cards WHERE cards.id = card_tags.card_id AND cards.user_id = auth.uid()
));
