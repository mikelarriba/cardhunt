import { useState } from 'react';
import { ExternalLink, ShoppingCart, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/types/database';
import { useEbaySearch, EbayItem } from '@/hooks/useEbaySearch';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/utils';

// eBay Logo SVG as a simple component
function EbayLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="0" y="28" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold">
        <tspan fill="#E53238">e</tspan>
        <tspan fill="#0064D2">b</tspan>
        <tspan fill="#F5AF02">a</tspan>
        <tspan fill="#86B817">y</tspan>
      </text>
    </svg>
  );
}

interface LiveMarketSectionProps {
  playerName: string;
  playerTeams: string[];
  card?: Card;
  onPriceUpdate?: (price: number, sourceUrl: string) => void;
}

export function LiveMarketSection({
  playerName,
  playerTeams,
  card,
  onPriceUpdate,
}: LiveMarketSectionProps) {
  const { searchEbay, isLoading, error, results, clearResults } = useEbaySearch();
  const { updateCard } = useCards();
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  const handleSearch = async () => {
    await searchEbay({
      player: playerName,
      team: playerTeams[0],
      series: card?.series || undefined,
      year: (card as any)?.card_year || undefined,
    });
  };

  const handleUpdatePrice = async (item: EbayItem) => {
    if (!card) return;

    const price = parseFloat(item.price.value);
    if (isNaN(price)) return;

    setUpdatingCardId(item.itemId);

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        updates: {
          price,
          source_url: item.itemWebUrl,
        },
      });
      
      onPriceUpdate?.(price, item.itemWebUrl);
    } finally {
      setUpdatingCardId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Live Market</h3>
          <EbayLogo className="h-4 ml-1" />
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Fetch eBay Prices
            </>
          )}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {/* Fallback notice */}
          {results.fallbackUsed && (
            <p className="text-sm text-muted-foreground italic">
              No exact matches found. Showing broader search results.
            </p>
          )}

          {results.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No listings found on eBay</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.items.map((item) => (
                <EbayItemCard
                  key={item.itemId}
                  item={item}
                  onUpdatePrice={() => handleUpdatePrice(item)}
                  isUpdating={updatingCardId === item.itemId}
                  showUpdateButton={!!card}
                />
              ))}
            </div>
          )}

          {/* Total results indicator */}
          {results.total > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing 5 of {results.total} results
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && !error && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Click "Fetch eBay Prices" to search for live listings</p>
        </div>
      )}
    </div>
  );
}

function EbayItemCard({
  item,
  onUpdatePrice,
  isUpdating,
  showUpdateButton,
}: {
  item: EbayItem;
  onUpdatePrice: () => void;
  isUpdating: boolean;
  showUpdateButton: boolean;
}) {
  const price = parseFloat(item.price.value);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
        {item.image?.imageUrl ? (
          <img
            src={item.image.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-display font-bold text-primary">
            ${price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground uppercase">
            {item.price.currency}
          </span>
        </div>

        {item.seller && (
          <p className="text-xs text-muted-foreground mt-1">
            Seller: {item.seller.username} ({item.seller.feedbackPercentage}% positive)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1"
        >
          <a
            href={item.itemWebUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </a>
        </Button>

        {showUpdateButton && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onUpdatePrice}
            disabled={isUpdating}
            className="gap-1 text-xs"
          >
            {isUpdating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>Use Price</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
