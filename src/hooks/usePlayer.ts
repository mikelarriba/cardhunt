import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerWithCards, Card, SportType, CardType } from '@/types/database';

export function usePlayer(playerId: string) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: async (): Promise<PlayerWithCards> => {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (playerError) throw playerError;
      if (!player) throw new Error('Player not found');

      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      return {
        ...player,
        sport: player.sport as SportType,
        teams: player.teams || [],
        cards: (cards || []).map((card) => ({
          ...card,
          card_types: (card.card_types || []) as CardType[],
        })) as Card[],
      };
    },
    enabled: !!playerId,
  });
}
