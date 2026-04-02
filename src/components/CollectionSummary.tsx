import { useMemo } from 'react';
import { Card, FilterRules } from '@/types/database';
import { Sparkles, FolderOpen } from 'lucide-react';

interface CollectionSummaryProps {
  collectionName: string;
  cards: Card[];
  isSmart?: boolean;
}

export function CollectionSummary({ collectionName, cards, isSmart }: CollectionSummaryProps) {
  const stats = useMemo(() => {
    const ownedCards = cards.filter(c => c.status === 'owned').length;
    const locatedCards = cards.filter(c => c.status === 'located').length;
    const missingCards = cards.filter(c => c.status === 'missing').length;
    const totalCards = cards.length;
    
    const ownedPercent = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;
    
    return { totalCards, ownedCards, locatedCards, missingCards, ownedPercent };
  }, [cards]);

  return (
    <div className="glass-card p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          {isSmart ? (
            <Sparkles className="w-4 h-4 text-primary" />
          ) : (
            <FolderOpen className="w-4 h-4 text-primary" />
          )}
          {collectionName}
          {isSmart && (
            <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Smart
            </span>
          )}
        </h2>
        <span className="text-sm text-muted-foreground">
          {stats.totalCards} card{stats.totalCards !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-status-owned">
              <span className="font-medium">{stats.ownedCards}</span> Owned
            </span>
            <span className="text-status-located">
              <span className="font-medium">{stats.locatedCards}</span> Located
            </span>
            <span className="text-status-missing">
              <span className="font-medium">{stats.missingCards}</span> Missing
            </span>
          </div>
          <span className="text-muted-foreground">
            {stats.ownedPercent.toFixed(0)}% complete
          </span>
        </div>
        
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-status-owned transition-all duration-500"
            style={{ width: `${(stats.ownedCards / Math.max(stats.totalCards, 1)) * 100}%` }}
          />
          <div 
            className="absolute top-0 h-full bg-status-located transition-all duration-500"
            style={{ 
              left: `${(stats.ownedCards / Math.max(stats.totalCards, 1)) * 100}%`,
              width: `${(stats.locatedCards / Math.max(stats.totalCards, 1)) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
