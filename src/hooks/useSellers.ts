import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Seller } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useSellers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sellersQuery = useQuery({
    queryKey: ['sellers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Seller[];
    },
    enabled: !!user,
  });

  const createSeller = useMutation({
    mutationFn: async (data: { name: string; url?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: seller, error } = await supabase
        .from('sellers')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          url: data.url?.trim() || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return seller as Seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller created');
    },
    onError: (error) => {
      toast.error('Failed to create seller');
      console.error(error);
    },
  });

  const updateSeller = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; url?: string }) => {
      const { data: seller, error } = await supabase
        .from('sellers')
        .update({
          name: data.name?.trim(),
          url: data.url?.trim() || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return seller as Seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller updated');
    },
    onError: (error) => {
      toast.error('Failed to update seller');
      console.error(error);
    },
  });

  const deleteSeller = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sellers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success('Seller deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete seller');
      console.error(error);
    },
  });

  return {
    sellers: sellersQuery.data || [],
    isLoading: sellersQuery.isLoading,
    createSeller,
    updateSeller,
    deleteSeller,
  };
}
