-- Create sellers table
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sellers
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Sellers RLS policies
CREATE POLICY "Users can view their own sellers"
ON public.sellers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sellers"
ON public.sellers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sellers"
ON public.sellers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sellers"
ON public.sellers FOR DELETE
USING (auth.uid() = user_id);

-- Create buy_options table
CREATE TABLE public.buy_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  source_url TEXT,
  price NUMERIC,
  shipping_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on buy_options
ALTER TABLE public.buy_options ENABLE ROW LEVEL SECURITY;

-- Buy options RLS policies (through card ownership)
CREATE POLICY "Users can view buy options for their cards"
ON public.buy_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cards
  WHERE cards.id = buy_options.card_id
  AND cards.user_id = auth.uid()
));

CREATE POLICY "Users can create buy options for their cards"
ON public.buy_options FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.cards
  WHERE cards.id = buy_options.card_id
  AND cards.user_id = auth.uid()
));

CREATE POLICY "Users can update buy options for their cards"
ON public.buy_options FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.cards
  WHERE cards.id = buy_options.card_id
  AND cards.user_id = auth.uid()
));

CREATE POLICY "Users can delete buy options for their cards"
ON public.buy_options FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.cards
  WHERE cards.id = buy_options.card_id
  AND cards.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buy_options_updated_at
BEFORE UPDATE ON public.buy_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();