import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  condition?: string;
  seller?: {
    username: string;
    feedbackPercentage: string;
  };
}

export interface EbaySearchResult {
  items: EbayItem[];
  total: number;
  fallbackUsed: boolean;
}

export function useEbaySearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EbaySearchResult | null>(null);

  const searchEbay = async (params: {
    player: string;
    team?: string;
    series?: string;
    year?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-ebay', {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to search eBay');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search eBay';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    searchEbay,
    clearResults,
    isLoading,
    error,
    results,
  };
}
