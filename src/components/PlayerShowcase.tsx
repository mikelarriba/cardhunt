import { Card, SportType } from '@/types/database';
import { CardDetailModal } from './CardDetailModal';
import { StatusBadge } from './StatusBadge';
import { BrandBadge } from './BrandBadge';
import { LeagueLogo } from './LeagueLogo';
import { SerialNumberBadge } from './SerialNumberInput';
import { LEAGUE_LOGOS } from '@/types/database';
import { ImageIcon, Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const SHOWCASE_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

function cardMatchesSlot(card: Card, slot: string): boolean {
  const labels = card.card_labels || [];
  return labels.some(l => l.toLowerCase() === slot.toLowerCase());
}

interface PlayerShowcaseProps {
  cards: Card[];
  sport?: SportType;
}

export function PlayerShowcase({ cards, sport }: PlayerShowcaseProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const showcaseCards = SHOWCASE_SLOTS.map(slot => {
    // 1. Favorite for this slot
    const favorite = cards.find(c => c.is_favorite && cardMatchesSlot(c, slot));
    if (favorite) return { slot, card: favorite };
    // 2. Cheapest card matching the slot
    const matching = cards.filter(c => cardMatchesSlot(c, slot));
    if (matching.length > 0) {
      const withPrice = matching.filter(c => c.price != null).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return { slot, card: withPrice[0] || matching[0] };
    }
    // 3. No match at all
    return { slot, card: null };
  });

  // Cards NOT in showcase
  const showcaseCardIds = new Set(showcaseCards.filter(s => s.card).map(s => s.card!.id));

  return (
    <>
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Showcase
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {showcaseCards.map(({ slot, card }) => (
            <ShowcaseSlot
              key={slot}
              slot={slot}
              card={card}
              sport={sport}
              onClick={() => card && setSelectedCard(card)}
            />
          ))}
        </div>
      </div>

      {selectedCard && (
        <CardDetailModal
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
          card={selectedCard}
          sport={sport}
        />
      )}
    </>
  );
}

export function getShowcaseCardIds(cards: Card[]): Set<string> {
  const ids = new Set<string>();
  SHOWCASE_SLOTS.forEach(slot => {
    const fav = cards.find(c => c.is_favorite && cardMatchesSlot(c, slot));
    if (fav) ids.add(fav.id);
  });
  return ids;
}

function ShowcaseSlot({
  slot,
  card,
  sport,
  onClick,
}: {
  slot: string;
  card: Card | null;
  sport?: SportType;
  onClick: () => void;
}) {
  if (!card) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center aspect-[2/3] text-center p-4">
        <ImageIcon className="w-10 h-10 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground font-medium">
          No {slot} card selected for showcase.
        </p>
      </div>
    );
  }

  const cardImage = card.image_front || card.image_url;

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300',
        'ring-2 ring-primary/30 shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.25)]',
        'hover:ring-primary/60 hover:shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.35)]'
      )}
      onClick={onClick}
    >
      {/* Slot label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1">
        <Star className="w-3 h-3" />
        {slot}
      </div>

      {/* Brand Badge */}
      {card.brand && (
        <div className="absolute top-2 right-2 z-10">
          <BrandBadge brand={card.brand} />
        </div>
      )}

      {/* Serial Number */}
      {card.is_numbered && card.serial_num && card.serial_total && (
        <SerialNumberBadge
          serialNum={card.serial_num}
          serialTotal={card.serial_total}
          className="absolute bottom-12 left-2 z-10"
        />
      )}

      {/* Image */}
      <div className="aspect-[2/3] w-full bg-muted">
        {cardImage ? (
          <img src={cardImage} alt={`${slot} showcase`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
        <div className="flex items-center justify-between">
          <StatusBadge status={card.status} size="sm" />
          {card.series && (
            <span className="text-xs text-white/80 font-medium truncate ml-2">{card.series}</span>
          )}
        </div>
      </div>
    </div>
  );
}
