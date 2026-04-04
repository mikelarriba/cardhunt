import { Card } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  cards: Card[];
}

// The 3 card type slots every player should have
const CARD_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;
type CardSlot = typeof CARD_SLOTS[number];

function cardHasSlot(card: Card, slot: CardSlot): boolean {
  return card.card_labels?.some(l => l.toLowerCase() === slot.toLowerCase()) ?? false;
}

export function ProgressDots({ cards }: ProgressDotsProps) {
  const getSlotStatus = (slot: CardSlot) => {
    // Find the best status card for this slot (owned > located > missing)
    const matchingCards = cards.filter(c => cardHasSlot(c, slot));
    if (matchingCards.length === 0) return undefined;
    if (matchingCards.some(c => c.status === 'owned')) return 'owned';
    if (matchingCards.some(c => c.status === 'located')) return 'located';
    return 'missing';
  };

  const getStatusColor = (slot: CardSlot) => {
    const status = getSlotStatus(slot);
    if (!status) return 'bg-muted/30';
    switch (status) {
      case 'owned': return 'bg-status-owned';
      case 'located': return 'bg-status-located';
      case 'missing': return 'bg-status-missing';
    }
  };

  const ownedSlots = CARD_SLOTS.filter(s => getSlotStatus(s) === 'owned').length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {CARD_SLOTS.map((slot) => (
          <div
            key={slot}
            className={cn('progress-dot transition-colors', getStatusColor(slot))}
            title={slot}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {ownedSlots}/{CARD_SLOTS.length}
      </span>
    </div>
  );
}
