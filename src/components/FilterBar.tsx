import { cn } from '@/lib/utils';
import { SportType, CardStatus, SPORTS, CARD_STATUSES, Tag } from '@/types/database';
import { useTags } from '@/hooks/useTags';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  selectedSport: SportType | 'all';
  selectedStatus: CardStatus | 'all';
  selectedTag: string | 'all';
  onSportChange: (sport: SportType | 'all') => void;
  onStatusChange: (status: CardStatus | 'all') => void;
  onTagChange: (tagId: string | 'all') => void;
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
  selectedTag,
  onSportChange,
  onStatusChange,
  onTagChange,
}: FilterBarProps) {
  const { tags, deleteTag } = useTags();

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Collections Filter */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Collections
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onTagChange('all')}
                className={cn(
                  'filter-toggle',
                  selectedTag === 'all'
                    ? 'filter-toggle-active'
                    : 'filter-toggle-inactive'
                )}
              >
                All Players
              </button>
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1">
                  <button
                    onClick={() => onTagChange(tag.id)}
                    className={cn(
                      'filter-toggle',
                      selectedTag === tag.id
                        ? 'filter-toggle-active'
                        : 'filter-toggle-inactive'
                    )}
                  >
                    📁 {tag.name}
                  </button>
                  {selectedTag === tag.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTag.mutate(tag.id);
                        onTagChange('all');
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
    </div>
  );
}
