import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Team {
  id: string;
  user_id: string;
  name: string;
  sport: string | null;
  created_at: string;
}

export function useTeams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as Team[];
    },
    enabled: !!user,
  });

  const createTeam = useMutation({
    mutationFn: async ({ name, sport }: { name: string; sport?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .upsert(
          { user_id: user!.id, name, sport: sport || null },
          { onConflict: 'user_id,name', ignoreDuplicates: true }
        )
        .select()
        .single();
      // If upsert returns nothing due to ignore, fetch existing
      if (error) {
        // Might be a conflict, try to fetch
        const { data: existing } = await supabase
          .from('teams')
          .select('*')
          .ilike('name', name)
          .limit(1)
          .single();
        return existing as Team;
      }
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const ensureTeams = async (teamNames: string[], sport?: string) => {
    for (const name of teamNames) {
      await supabase
        .from('teams')
        .upsert(
          { user_id: user!.id, name, sport: sport || null },
          { onConflict: 'user_id,name', ignoreDuplicates: true }
        );
    }
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  };

  const searchTeams = (query: string): Team[] => {
    if (!teamsQuery.data || query.length < 3) return [];
    const lower = query.toLowerCase();
    return teamsQuery.data.filter((t) => t.name.toLowerCase().includes(lower));
  };

  return {
    teams: teamsQuery.data || [],
    isLoading: teamsQuery.isLoading,
    createTeam,
    ensureTeams,
    searchTeams,
  };
}
