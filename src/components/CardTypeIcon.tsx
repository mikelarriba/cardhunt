import { Star, Square, PenTool, Award } from 'lucide-react';
import { CardType, CardStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface CardTypeIconProps {
  type: CardType;
  status?: CardStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const iconMap = {
  rookie: Star,
  regular: Square,
  autographed: PenTool,
  rated: Award,
};

const labelMap = {
  rookie: 'Rookie',
  regular: 'Regular',
  autographed: 'Autographed',
  rated: 'Rated',
};

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const containerSizeMap = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

export function CardTypeIcon({
  type,
  status,
  size = 'md',
  showLabel = false,
  selected = false,
  onClick,
}: CardTypeIconProps) {
  const Icon = iconMap[type];

  const getStatusColor = () => {
    if (!status) return 'bg-secondary text-muted-foreground';
    switch (status) {
      case 'owned':
        return 'bg-status-owned/20 text-status-owned';
      case 'located':
        return 'bg-status-located/20 text-status-located';
      case 'missing':
        return 'bg-status-missing/20 text-status-missing';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'card-type-icon rounded-lg flex items-center justify-center transition-all duration-200',
          containerSizeMap[size],
          getStatusColor(),
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          onClick && 'hover:scale-110'
        )}
      >
        <Icon className={sizeMap[size]} />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{labelMap[type]}</span>
      )}
    </div>
  );
}
