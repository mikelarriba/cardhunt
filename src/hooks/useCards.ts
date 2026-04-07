import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CardType, CardStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

/** If the card has a team, ensure it's in the player's teams array and in the teams table */
async function autoAssignTeamToPlayer(playerId: string, cardTeam: string | null | undefined) {
  if (!cardTeam) return;
  const { data: player } = await supabase
    .from('players')
    .select('teams, sport, user_id')
    .eq('id', playerId)
    .single();
  if (!player) return;

  const currentTeams: string[] = player.teams || [];
  if (!currentTeams.includes(cardTeam)) {
    await supabase
      .from('players')
      .update({ teams: [...currentTeams, cardTeam] })
      .eq('id', playerId);
  }

  // Ensure team exists in teams table
  await supabase
    .from('teams')
    .upsert(
      { user_id: player.user_id, name: cardTeam, sport: player.sport || null },
      { onConflict: 'user_id,name', ignoreDuplicates: true }
    );
}

export function useCards() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCard = useMutation({
    mutationFn: async (card: {
      player_id: string;
      card_type: CardType;
      card_types?: CardType[];
      status: CardStatus;
      price?: number | null;
      source_url?: string | null;
      notes?: string | null;
      brand?: string | null;
      series?: string | null;
      is_numbered?: boolean;
      serial_num?: number | null;
      serial_total?: number | null;
      card_labels?: string[];
      image_front?: string | null;
      image_back?: string | null;
      card_year?: number | null;
      card_team?: string | null;
      seller?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cards')
        .insert({
          ...card,
          card_types: card.card_types || [card.card_type],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-assign card team to player
      await autoAssignTeamToPlayer(card.player_id, card.card_team);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: 'Card Added',
        description: 'The card has been added to your collection.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({
      cardId,
      updates,
    }: {
      cardId: string;
      updates: Partial<{
        status: CardStatus;
        card_types: CardType[];
        price: number | null;
        source_url: string | null;
        notes: string | null;
        brand: string | null;
        series: string | null;
        is_numbered: boolean;
        serial_num: number | null;
        serial_total: number | null;
        card_labels: string[];
        image_front: string | null;
        image_back: string | null;
        card_year: number | null;
        card_team: string | null;
        seller: string | null;
        is_favorite: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      // Auto-assign card team to player
      if (updates.card_team && data.player_id) {
        await autoAssignTeamToPlayer(data.player_id, updates.card_team);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast({
        title: 'Card Updated',
        description: 'The card has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast({
        title: 'Card Deleted',
        description: 'The card has been removed from your collection.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createCard,
    updateCard,
    deleteCard,
  };
}
