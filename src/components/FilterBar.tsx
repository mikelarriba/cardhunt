import { cn } from '@/lib/utils';
import { SportType, CardStatus, SPORTS, CARD_STATUSES } from '@/types/database';

interface FilterBarProps {
  selectedSport: SportType | 'all';
  selectedStatus: CardStatus | 'all';
  onSportChange: (sport: SportType | 'all') => void;
  onStatusChange: (status: CardStatus | 'all') => void;
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

export function FilterBar({
  selectedSport,
  selectedStatus,
  onSportChange,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sport Filter */}
        <div className="flex-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Filter by Sport
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSportChange('all')}
              className={cn(
                'filter-toggle',
                selectedSport === 'all'
                  ? 'filter-toggle-active'
                  : 'filter-toggle-inactive'
              )}
            >
              All
            </button>
            {SPORTS.slice(0, 5).map((sport) => (
              <button
                key={sport.value}
                onClick={() => onSportChange(sport.value)}
                className={cn(
                  'filter-toggle',
                  selectedSport === sport.value
                    ? 'filter-toggle-active'
                    : 'filter-toggle-inactive'
                )}
              >
                <span className="mr-1">{sportEmoji[sport.value]}</span>
                {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="lg:w-auto">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Filter by Status
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange('all')}
              className={cn(
                'filter-toggle',
                selectedStatus === 'all'
                  ? 'filter-toggle-active'
                  : 'filter-toggle-inactive'
              )}
            >
              All
            </button>
            {CARD_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={cn(
                  'filter-toggle',
                  selectedStatus === status.value
                    ? 'filter-toggle-active'
                    : 'filter-toggle-inactive'
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
