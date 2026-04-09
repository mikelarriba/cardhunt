import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerWithCards, SportType, Tag, CardType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export function usePlayers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const playersQuery = useQuery({
    queryKey: ['players'],
    queryFn: async (): Promise<PlayerWithCards[]> => {
      // Single query with joined cards via foreign key
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select(`
          *,
          cards (*),
          player_tags (
            tag_id,
            tags:tag_id (id, user_id, name, created_at)
          )
        `)
        .order('created_at', { ascending: false });

      if (playersError) throw playersError;

      return (players || []).map((player: any) => ({
        ...player,
        sport: player.sport as SportType,
        teams: player.teams || [],
        cards: (player.cards || []).map((card: any) => ({
          ...card,
          card_types: (card.card_types || []) as CardType[],
        })),
        tags: (player.player_tags || [])
          .map((pt: any) => pt.tags)
          .filter(Boolean) as Tag[],
        player_tags: undefined,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: 'Player Added',
        description: 'The player has been added to your collection.',
        action: React.createElement(ToastAction, {
          altText: 'View player',
          onClick: () => { window.location.href = `/player/${data.id}`; },
        }, 'View Player'),
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async ({
      playerId,
      updates,
    }: {
      playerId: string;
      updates: Partial<{ name: string; sport: SportType; teams: string[] }>;
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
      toast({ title: 'Player Updated', description: 'The player has been updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePlayer = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({ title: 'Player Deleted', description: 'The player has been removed from your collection.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
