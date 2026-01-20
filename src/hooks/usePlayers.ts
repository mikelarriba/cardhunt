import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerWithCards, SportType, Tag, CardType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function usePlayers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const playersQuery = useQuery({
    queryKey: ['players'],
    queryFn: async (): Promise<PlayerWithCards[]> => {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (playersError) throw playersError;

      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*');

      if (cardsError) throw cardsError;

      // Fetch player tags with tag details
      const { data: playerTags, error: playerTagsError } = await supabase
        .from('player_tags')
        .select('player_id, tag_id, tags:tag_id(id, user_id, name, created_at)');

      if (playerTagsError) throw playerTagsError;

      // Group tags by player
      const tagsByPlayer: Record<string, Tag[]> = {};
      (playerTags || []).forEach((pt: any) => {
        if (pt.tags) {
          if (!tagsByPlayer[pt.player_id]) {
            tagsByPlayer[pt.player_id] = [];
          }
          tagsByPlayer[pt.player_id].push(pt.tags as Tag);
        }
      });

      return (players || []).map((player) => ({
        ...player,
        sport: player.sport as SportType,
        teams: player.teams || [],
        cards: (cards || [])
          .filter((card) => card.player_id === player.id)
          .map((card) => ({
            ...card,
            card_types: (card.card_types || []) as CardType[],
          })),
        tags: tagsByPlayer[player.id] || [],
      }));
    },
  });

  const createPlayer = useMutation({
    mutationFn: async (player: { name: string; sport: SportType; teams: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('players')
        .insert({
          name: player.name,
          sport: player.sport,
          teams: player.teams,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: 'Player Added',
        description: 'The player has been added to your collection.',
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

  const updatePlayer = useMutation({
    mutationFn: async ({
      playerId,
      updates,
    }: {
      playerId: string;
      updates: Partial<{
        name: string;
        sport: SportType;
        teams: string[];
      }>;
    }) => {
      const { data, error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast({
        title: 'Player Updated',
        description: 'The player has been updated.',
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

  const deletePlayer = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: 'Player Deleted',
        description: 'The player has been removed from your collection.',
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
    players: playersQuery.data || [],
    isLoading: playersQuery.isLoading,
    error: playersQuery.error,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}
