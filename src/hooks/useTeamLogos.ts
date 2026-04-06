import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batch-loads ALL team logos in a single query.
 * Returns a map of "teamName::sport" → logoUrl.
 */
export function useTeamLogos() {
  const { data: logoMap = new Map<string, string | null>(), isLoading } = useQuery({
    queryKey: ['teamLogos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_logos')
        .select('team_name, sport, logo_url');

      if (error) throw error;

      const map = new Map<string, string | null>();
      for (const row of data || []) {
        map.set(`${row.team_name}::${row.sport}`, row.logo_url);
      }
      return map;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24,
  });

  return { logoMap, isLoading };
}
