-- Create tags table for user collections
CREATE TABLE public.tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Create junction table for player-tag relationships
CREATE TABLE public.player_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(player_id, tag_id)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users can view their own tags"
ON public.tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
ON public.tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.tags FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on player_tags
ALTER TABLE public.player_tags ENABLE ROW LEVEL SECURITY;

-- Player tags policies (check via player ownership)
CREATE POLICY "Users can view their own player tags"
ON public.player_tags FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.players
        WHERE players.id = player_tags.player_id
        AND players.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own player tags"
ON public.player_tags FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.players
        WHERE players.id = player_tags.player_id
        AND players.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own player tags"
ON public.player_tags FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.players
        WHERE players.id = player_tags.player_id
        AND players.user_id = auth.uid()
    )
);