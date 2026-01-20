-- Create enum for sports
CREATE TYPE public.sport_type AS ENUM ('football', 'basketball', 'baseball', 'hockey', 'soccer', 'golf', 'tennis', 'boxing', 'mma', 'other');

-- Create enum for card types
CREATE TYPE public.card_type AS ENUM ('rookie', 'regular', 'signed', 'rated');

-- Create enum for card status
CREATE TYPE public.card_status AS ENUM ('owned', 'located', 'missing');

-- Create players table
CREATE TABLE public.players (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sport sport_type NOT NULL,
    team TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cards table
CREATE TABLE public.cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_type card_type NOT NULL,
    status card_status NOT NULL DEFAULT 'missing',
    price DECIMAL(10,2),
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players
CREATE POLICY "Users can view their own players" 
ON public.players FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own players" 
ON public.players FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" 
ON public.players FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" 
ON public.players FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for cards
CREATE POLICY "Users can view their own cards" 
ON public.cards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cards" 
ON public.cards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" 
ON public.cards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" 
ON public.cards FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON public.cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();