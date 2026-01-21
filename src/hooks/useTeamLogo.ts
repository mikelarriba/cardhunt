import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SportType } from '@/types/database';

interface TeamLogoResult {
  logoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useTeamLogo(teamName: string, sport: SportType): TeamLogoResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teamLogo', teamName, sport],
    queryFn: async () => {
      // First check local cache
      const { data: cached } = await supabase
        .from('team_logos')
        .select('logo_url')
        .eq('team_name', teamName)
        .eq('sport', sport)
        .single();

      if (cached) {
        return cached.logo_url;
      }

      // Fetch from edge function
      const { data: result, error } = await supabase.functions.invoke('get-team-logo', {
        body: { teamName, sport },
      });

      if (error) {
        console.error('Error fetching team logo:', error);
        return null;
      }

      return result?.logoUrl || null;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in garbage collection for 7 days
    retry: 1,
  });

  return {
    logoUrl: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
