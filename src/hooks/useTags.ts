import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

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
      return data || [];
    },
  });

  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .insert({ name, user_id: user.id })
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
      toast({
        title: 'Collection Deleted',
        description: 'The collection has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

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
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
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
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoading: tagsQuery.isLoading,
    createTag,
    deleteTag,
    addPlayerTag,
    removePlayerTag,
  };
}
