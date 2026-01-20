import { SportType } from '@/types/database';
import { cn } from '@/lib/utils';

interface SportBadgeProps {
  sport: SportType;
}

const sportEmoji: Record<SportType, string> = {
  football: '🏈',
  basketball: '🏀',
  baseball: '⚾',
  hockey: '🏒',
  soccer: '⚽',
  golf: '⛳',
  tennis: '🎾',
  boxing: '🥊',
  mma: '🥋',
  other: '🏆',
};

const sportLabel: Record<SportType, string> = {
  football: 'Football',
  basketball: 'Basketball',
  baseball: 'Baseball',
  hockey: 'Hockey',
  soccer: 'Soccer',
  golf: 'Golf',
  tennis: 'Tennis',
  boxing: 'Boxing',
  mma: 'MMA',
  other: 'Other',
};

export function SportBadge({ sport }: SportBadgeProps) {
  return (
    <span className="sport-badge">
      <span>{sportEmoji[sport]}</span>
      <span>{sportLabel[sport]}</span>
    </span>
  );
}
