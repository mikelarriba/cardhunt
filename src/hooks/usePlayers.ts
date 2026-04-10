import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerWithCards, SportType, Tag, CardType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

/** Lightweight player data without cards – loads instantly */
export interface PlayerSummary {
  id: string;
  user_id: string;
  name: string;
  sport: SportType;
  teams: string[];
  created_at: string;
  updated_at: string;
}

export function usePlayers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Phase 1: Fast query – players only (no joins)
  const playersLightQuery = useQuery({
    queryKey: ['players-light'],
    queryFn: async (): Promise<PlayerSummary[]> => {
      const { data, error } = await supabase
        .from('players')
        .select('id, user_id, name, sport, teams, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({ ...p, teams: p.teams || [] }));
    },
    staleTime: 1000 * 60 * 2,
  });

  // Phase 2: Full query with cards (deferred, loads in background)
  const playersFullQuery = useQuery({
    queryKey: ['players'],
    queryFn: async (): Promise<PlayerWithCards[]> => {
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
    staleTime: 1000 * 60 * 2,
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
      queryClient.invalidateQueries({ queryKey: ['players-light'] });
      toast({
        title: 'Player Added',
        description: 'The player has been added to your collection.',
        action: React.createElement(ToastAction, {
          altText: 'View player',
          onClick: () => { window.location.href = `/player/${data.id}`; },
        } as any, 'View Player') as any,
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
      queryClient.invalidateQueries({ queryKey: ['players-light'] });
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
      queryClient.invalidateQueries({ queryKey: ['players-light'] });
      toast({ title: 'Player Deleted', description: 'The player has been removed from your collection.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Merge: use full data if available, otherwise light data with empty cards
  const players: PlayerWithCards[] = React.useMemo(() => {
    if (playersFullQuery.data) return playersFullQuery.data;
    if (playersLightQuery.data) {
      return playersLightQuery.data.map(p => ({
        ...p,
        cards: [],
        tags: [],
        image_url: null,
      }));
    }
    return [];
  }, [playersLightQuery.data, playersFullQuery.data]);

  return {
    players,
    playersLight: playersLightQuery.data || [],
    isLoading: playersLightQuery.isLoading,
    isLoadingFull: playersFullQuery.isLoading,
    hasFullData: !!playersFullQuery.data,
    error: playersFullQuery.error || playersLightQuery.error,
    createPlayer,
    updatePlayer,
    deletePlayer,
  };
}
