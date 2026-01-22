import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BuyOption } from '@/types/database';
import { toast } from 'sonner';

export function useBuyOptions(cardId: string) {
  const queryClient = useQueryClient();

  const buyOptionsQuery = useQuery({
    queryKey: ['buy_options', cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buy_options')
        .select(`
          *,
          seller:sellers(*)
        `)
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BuyOption[];
    },
    enabled: !!cardId,
  });

  const createBuyOption = useMutation({
    mutationFn: async (data: {
      seller_id?: string;
      source_url?: string;
      price?: number;
      shipping_cost?: number;
      notes?: string;
    }) => {
      const { data: buyOption, error } = await supabase
        .from('buy_options')
        .insert({
          card_id: cardId,
          seller_id: data.seller_id || null,
          source_url: data.source_url?.trim() || null,
          price: data.price ?? null,
          shipping_cost: data.shipping_cost ?? 0,
          notes: data.notes?.trim() || null,
        })
        .select(`
          *,
          seller:sellers(*)
        `)
        .single();
      
      if (error) throw error;
      return buyOption as BuyOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buy_options', cardId] });
      toast.success('Buy option added');
    },
    onError: (error) => {
      toast.error('Failed to add buy option');
      console.error(error);
    },
  });

  const updateBuyOption = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      seller_id?: string;
      source_url?: string;
      price?: number;
      shipping_cost?: number;
      notes?: string;
    }) => {
      const { data: buyOption, error } = await supabase
        .from('buy_options')
        .update({
          seller_id: data.seller_id || null,
          source_url: data.source_url?.trim() || null,
          price: data.price ?? null,
          shipping_cost: data.shipping_cost ?? 0,
          notes: data.notes?.trim() || null,
        })
        .eq('id', id)
        .select(`
          *,
          seller:sellers(*)
        `)
        .single();
      
      if (error) throw error;
      return buyOption as BuyOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buy_options', cardId] });
      toast.success('Buy option updated');
    },
    onError: (error) => {
      toast.error('Failed to update buy option');
      console.error(error);
    },
  });

  const deleteBuyOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('buy_options').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buy_options', cardId] });
      toast.success('Buy option removed');
    },
    onError: (error) => {
      toast.error('Failed to remove buy option');
      console.error(error);
    },
  });

  return {
    buyOptions: buyOptionsQuery.data || [],
    isLoading: buyOptionsQuery.isLoading,
    createBuyOption,
    updateBuyOption,
    deleteBuyOption,
  };
}
