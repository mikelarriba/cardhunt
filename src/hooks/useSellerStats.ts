import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Seller } from '@/types/database';

export interface SellerWithStats extends Seller {
  buy_option_count: number;
  total_value: number;
  total_price: number;
  total_shipping: number;
  avg_price: number;
  avg_shipping: number;
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
      const statsMap = new Map<string, { count: number; total: number; price: number; shipping: number }>();
      for (const bo of buyOptions || []) {
        if (!bo.seller_id) continue;
        const existing = statsMap.get(bo.seller_id) || { count: 0, total: 0, price: 0, shipping: 0 };
        const price = bo.price || 0;
        const shipping = bo.shipping_cost || 0;
        existing.count += 1;
        existing.price += price;
        existing.shipping += shipping;
        existing.total += price + shipping;
        statsMap.set(bo.seller_id, existing);
      }

      return (sellers || []).map((seller) => {
        const stats = statsMap.get(seller.id) || { count: 0, total: 0, price: 0, shipping: 0 };
        return {
          ...seller,
          buy_option_count: stats.count,
          total_value: stats.total,
          total_price: stats.price,
          total_shipping: stats.shipping,
          avg_price: stats.count > 0 ? stats.price / stats.count : 0,
          avg_shipping: stats.count > 0 ? stats.shipping / stats.count : 0,
        } as SellerWithStats;
      });
    },
    enabled: !!user,
  });
}
