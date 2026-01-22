import { corsHeaders } from '../_shared/cors.ts';

interface EbaySearchRequest {
  player: string;
  team?: string;
  series?: string;
  year?: number;
  fallbackSearch?: boolean;
}

interface EbayItem {
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

interface EbaySearchResponse {
  items: EbayItem[];
  total: number;
  fallbackUsed: boolean;
}

// Cache for OAuth tokens
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getEbayAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get('EBAY_CLIENT_ID');
  const clientSecret = Deno.env.get('EBAY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('eBay credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('eBay OAuth error:', errorText);
    throw new Error(`Failed to authenticate with eBay: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token (expires_in is in seconds, subtract 60 for safety margin)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

async function searchEbay(query: string, accessToken: string): Promise<{ items: EbayItem[]; total: number }> {
  const searchUrl = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('limit', '10');
  searchUrl.searchParams.set('category_ids', '212'); // Sports Trading Cards category
  searchUrl.searchParams.set('sort', 'price');

  console.log('Searching eBay with query:', query);

  const response = await fetch(searchUrl.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('eBay search error:', errorText);
    throw new Error(`eBay search failed: ${response.status}`);
  }

  const data = await response.json();
  
  const items: EbayItem[] = (data.itemSummaries || []).map((item: any) => ({
    itemId: item.itemId,
    title: item.title,
    price: {
      value: item.price?.value || '0',
      currency: item.price?.currency || 'USD',
    },
    image: item.image ? { imageUrl: item.image.imageUrl } : undefined,
    itemWebUrl: item.itemWebUrl,
    condition: item.condition,
    seller: item.seller ? {
      username: item.seller.username,
      feedbackPercentage: item.seller.feedbackPercentage,
    } : undefined,
  }));

  return {
    items,
    total: data.total || 0,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { player, team, series, year, fallbackSearch }: EbaySearchRequest = await req.json();

    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Player name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getEbayAccessToken();

    // Build initial query with all parameters
    const queryParts: string[] = [player];
    if (team && !fallbackSearch) queryParts.push(team);
    if (series) queryParts.push(series);
    if (year) queryParts.push(year.toString());
    queryParts.push('card');

    const initialQuery = queryParts.join(' ');
    let result = await searchEbay(initialQuery, accessToken);
    let fallbackUsed = false;

    // If no results found, try a broader search with just player name and series
    if (result.total === 0 && !fallbackSearch && (team || year)) {
      console.log('No results found, trying fallback search...');
      const fallbackParts: string[] = [player];
      if (series) fallbackParts.push(series);
      fallbackParts.push('card');
      
      const fallbackQuery = fallbackParts.join(' ');
      result = await searchEbay(fallbackQuery, accessToken);
      fallbackUsed = true;
    }

    const response: EbaySearchResponse = {
      items: result.items.slice(0, 5), // Return top 5 results
      total: result.total,
      fallbackUsed,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-ebay function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
