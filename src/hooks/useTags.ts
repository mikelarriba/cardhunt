import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag, FilterRules, Card } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Evaluate whether a card matches smart collection filter rules
export function cardMatchesRules(card: Card, rules: FilterRules, playerSport?: string, playerTeams?: string[]): boolean {
  const results = rules.conditions.map((cond) => {
    switch (cond.field) {
      case 'card_team': {
        // Check card_team first, fall back to player teams
        const cardTeam = card.card_team?.toLowerCase();
        const pTeams = (playerTeams || []).map(t => t.toLowerCase());
        if (cond.operator === 'equals') {
          const val = String(cond.value).toLowerCase();
          return cardTeam === val || pTeams.some(t => t === val);
        }
        if (cond.operator === 'contains') {
          const val = String(cond.value).toLowerCase();
          return (cardTeam?.includes(val) ?? false) || pTeams.some(t => t.includes(val));
        }
        if (cond.operator === 'in') {
          return Array.isArray(cond.value) && cond.value.some(v => {
            const val = v.toLowerCase();
            return cardTeam === val || pTeams.some(t => t === val);
          });
        }
        return false;
      }
      case 'card_labels':
        if (cond.operator === 'contains') return card.card_labels?.some(l => l.toLowerCase() === String(cond.value).toLowerCase()) ?? false;
        if (cond.operator === 'in') return Array.isArray(cond.value) && cond.value.some(v => card.card_labels?.some(l => l.toLowerCase() === v.toLowerCase()));
        return false;
      case 'brand':
        if (cond.operator === 'equals') return card.brand?.toLowerCase() === String(cond.value).toLowerCase();
        if (cond.operator === 'contains') return card.brand?.toLowerCase().includes(String(cond.value).toLowerCase()) ?? false;
        return false;
      case 'series':
        if (cond.operator === 'equals') return card.series?.toLowerCase() === String(cond.value).toLowerCase();
        if (cond.operator === 'contains') return card.series?.toLowerCase().includes(String(cond.value).toLowerCase()) ?? false;
        return false;
      case 'status':
        if (cond.operator === 'equals') return card.status === String(cond.value);
        if (cond.operator === 'in') return Array.isArray(cond.value) && cond.value.includes(card.status);
        return false;
      case 'card_year':
        if (cond.operator === 'equals') return card.card_year === Number(cond.value);
        return false;
      case 'sport':
        if (cond.operator === 'equals') return playerSport === String(cond.value);
        return false;
      default:
        return false;
    }
  });

  return rules.logic === 'and' ? results.every(Boolean) : results.some(Boolean);
}

export function useTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        filter_rules: t.filter_rules as FilterRules | null,
      }));
    },
  });

  // Fetch card_tags for a specific card
  const useCardTags = (cardId: string) => {
    return useQuery({
      queryKey: ['card_tags', cardId],
      queryFn: async () => {
        const { data, error } = await (supabase as any)
          .from('card_tags')
          .select('*, tags:tag_id (id, user_id, name, created_at, filter_rules)')
          .eq('card_id', cardId);
        if (error) throw error;
        return (data || []).map((ct: any) => ct.tags).filter(Boolean) as Tag[];
      },
      enabled: !!cardId,
    });
  };

  // Fetch all card_tags for all user's cards (for dashboard filtering)
  const allCardTagsQuery = useQuery({
    queryKey: ['card_tags_all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('card_tags')
        .select('card_id, tag_id');
      if (error) throw error;
      return (data || []) as { card_id: string; tag_id: string }[];
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, filterRules }: { name: string; filterRules?: FilterRules | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .insert({ 
          name, 
          user_id: user.id,
          filter_rules: filterRules || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Collection Created',
        description: 'Your new collection has been created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message.includes('duplicate')
          ? 'A collection with this name already exists.'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ tagId, updates }: { tagId: string; updates: { name?: string; filter_rules?: FilterRules | null } }) => {
      const { data, error } = await supabase
        .from('tags')
        .update(updates as any)
        .eq('id', tagId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Collection Updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['card_tags_all'] });
      toast({
        title: 'Collection Deleted',
        description: 'The collection has been removed.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Card tag mutations
  const addCardTag = useMutation({
    mutationFn: async ({ cardId, tagId }: { cardId: string; tagId: string }) => {
      const { data, error } = await (supabase as any)
        .from('card_tags')
        .insert({ card_id: cardId, tag_id: tagId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['card_tags', vars.cardId] });
      queryClient.invalidateQueries({ queryKey: ['card_tags_all'] });
    },
    onError: (error: any) => {
      if (!error.message.includes('duplicate')) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  const removeCardTag = useMutation({
    mutationFn: async ({ cardId, tagId }: { cardId: string; tagId: string }) => {
      const { error } = await (supabase as any)
        .from('card_tags')
        .delete()
        .eq('card_id', cardId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['card_tags', vars.cardId] });
      queryClient.invalidateQueries({ queryKey: ['card_tags_all'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Legacy player tag mutations (kept for backward compat)
  const addPlayerTag = useMutation({
    mutationFn: async ({ playerId, tagId }: { playerId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('player_tags')
        .insert({ player_id: playerId, tag_id: tagId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (error: any) => {
      if (!error.message.includes('duplicate')) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },
  });

  const removePlayerTag = useMutation({
    mutationFn: async ({ playerId, tagId }: { playerId: string; tagId: string }) => {
      const { error } = await supabase
        .from('player_tags')
        .delete()
        .eq('player_id', playerId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    cardTagLinks: allCardTagsQuery.data || [],
    createTag,
    updateTag,
    deleteTag,
    addCardTag,
    removeCardTag,
    addPlayerTag,
    removePlayerTag,
    useCardTags,
  };
}
