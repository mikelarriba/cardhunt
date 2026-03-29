import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Seller } from '@/types/database';

export interface SellerWithStats extends Seller {
  buy_option_count: number;
  total_value: number;
}

export function useSellerStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['seller_stats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch sellers
      const { data: sellers, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .order('name');

      if (sellersError) throw sellersError;

      // Fetch buy options with seller info
      const { data: buyOptions, error: boError } = await supabase
        .from('buy_options')
        .select('seller_id, price, shipping_cost');

      if (boError) throw boError;

      // Aggregate stats per seller
      const statsMap = new Map<string, { count: number; total: number }>();
      for (const bo of buyOptions || []) {
        if (!bo.seller_id) continue;
        const existing = statsMap.get(bo.seller_id) || { count: 0, total: 0 };
        existing.count += 1;
        existing.total += (bo.price || 0) + (bo.shipping_cost || 0);
        statsMap.set(bo.seller_id, existing);
      }

      return (sellers || []).map((seller) => {
        const stats = statsMap.get(seller.id) || { count: 0, total: 0 };
        return {
          ...seller,
          buy_option_count: stats.count,
          total_value: stats.total,
        } as SellerWithStats;
      });
    },
    enabled: !!user,
  });
}
