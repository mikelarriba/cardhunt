import { CardType, Card } from '@/types/database';
import { cn } from '@/lib/utils';

interface ProgressDotsProps {
  cards: Card[];
}

const cardTypes: CardType[] = ['rookie', 'regular', 'signed', 'rated'];

export function ProgressDots({ cards }: ProgressDotsProps) {
  const getCardStatus = (type: CardType) => {
    const card = cards.find((c) => c.card_type === type);
    return card?.status;
  };

  const getStatusColor = (type: CardType) => {
    const status = getCardStatus(type);
    if (!status) return 'bg-muted/30';
    switch (status) {
      case 'owned':
        return 'bg-status-owned';
      case 'located':
        return 'bg-status-located';
      case 'missing':
        return 'bg-status-missing';
    }
  };

  const ownedCount = cards.filter((c) => c.status === 'owned').length;
  const total = 4;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {cardTypes.map((type) => (
          <div
            key={type}
            className={cn('progress-dot transition-colors', getStatusColor(type))}
            title={type.charAt(0).toUpperCase() + type.slice(1)}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {ownedCount}/{total}
      </span>
    </div>
  );
}
